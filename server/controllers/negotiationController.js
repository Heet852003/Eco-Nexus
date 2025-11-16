/**
 * Negotiation Controller
 * Handles negotiation threads and agent-based chat
 */

import { NegotiationThread } from '../models/NegotiationThread.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { BuyerRequest } from '../models/BuyerRequest.js'
import { SellerQuote } from '../models/SellerQuote.js'
import { User } from '../models/User.js'
import { getNegotiationHints as aiGetNegotiationHints, callLLM } from '../services/aiService.js'
import { analyzeNegotiationPosition, generateJustification, checkSettlement, extractPriceFromMessage } from '../services/negotiationEngine.js'

/**
 * Create a negotiation thread
 */
export async function createThread(req, res) {
  try {
    const { requestId, quoteId } = req.body
    const userId = req.user.id

    if (!requestId || !quoteId) {
      return res.status(400).json({ error: 'Request ID and quote ID are required' })
    }

    const request = await BuyerRequest.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const quote = await SellerQuote.findById(quoteId)
    if (!quote || quote.requestId !== requestId) {
      return res.status(404).json({ error: 'Quote not found' })
    }

    // Only original buyer can start negotiation
    if (request.buyerId !== userId) {
      return res.status(403).json({ error: 'Only the original buyer can start negotiations' })
    }

    // CRITICAL: Prevent self-negotiation
    if (request.buyerId === quote.sellerId) {
      return res.status(400).json({ error: 'Cannot negotiate with yourself. Buyer and seller must be different users.' })
    }

    // Check if thread already exists
    const existingThread = await NegotiationThread.findByQuoteId(quoteId)
    if (existingThread) {
      return res.json(existingThread)
    }

    // Create negotiation thread
    const thread = await NegotiationThread.create({
      requestId,
      quoteId,
      buyerId: request.buyerId,
      sellerId: quote.sellerId
    })

    // Update request status
    await BuyerRequest.updateStatus(requestId, 'NEGOTIATING')
    await SellerQuote.updateStatus(quoteId, 'NEGOTIATING')

    res.status(201).json(thread)
  } catch (error) {
    console.error('Create thread error:', error)
    res.status(500).json({ error: 'Failed to create negotiation thread' })
  }
}

/**
 * Get negotiation thread
 */
export async function getThread(req, res) {
  try {
    const { threadId } = req.params
    
    console.log('📋 getThread called with threadId:', threadId)
    
    if (!req.user || !req.user.id) {
      console.error('❌ No user in request')
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const userId = req.user.id
    console.log('👤 User ID:', userId)

    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' })
    }

    // Try to find thread by ID first
    let thread = null
    try {
      thread = await NegotiationThread.findById(threadId)
    } catch (findError) {
      console.error('Error finding thread by ID:', findError)
      // Continue to try by quoteId
    }
    
    // If not found by ID, try to find by quoteId
    if (!thread) {
      try {
        thread = await NegotiationThread.findByQuoteId(threadId)
      } catch (quoteError) {
        console.error('Error finding thread by quoteId:', quoteError)
      }
    }

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Ensure thread has an id property
    if (!thread.id) {
      thread.id = thread._id ? thread._id.toString() : threadId
    }

    // Verify thread has required fields
    if (!thread.buyerId || !thread.sellerId) {
      console.error('Thread missing required fields:', { buyerId: thread.buyerId, sellerId: thread.sellerId })
      return res.status(500).json({ error: 'Thread data is incomplete' })
    }

    // Verify user is participant
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get messages - use thread.id or threadId as fallback
    const messagesThreadId = thread.id || threadId
    let messages = []
    try {
      messages = await ChatMessage.findByThreadId(messagesThreadId)
    } catch (msgError) {
      console.error('Error fetching messages:', msgError)
      // Continue with empty messages array if there's an error
      messages = []
    }

    // Clean up thread object - remove _id if present, ensure id is set
    const cleanThread = {
      id: thread.id || threadId,
      requestId: thread.requestId || null,
      quoteId: thread.quoteId || null,
      buyerId: thread.buyerId || null,
      sellerId: thread.sellerId || null,
      buyerGuidelines: thread.buyerGuidelines || null,
      sellerGuidelines: thread.sellerGuidelines || null,
      status: thread.status || 'OPEN',
      createdAt: thread.createdAt || new Date(),
      updatedAt: thread.updatedAt || new Date()
    }

    res.json({
      thread: cleanThread,
      messages: messages || []
    })
  } catch (error) {
    console.error('Get thread error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to fetch thread',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Send message in negotiation thread
 */
export async function sendMessage(req, res) {
  try {
    const { threadId, content } = req.body
    const userId = req.user.id

    if (!threadId || !content) {
      return res.status(400).json({ error: 'Thread ID and message content are required' })
    }

    const thread = await NegotiationThread.findById(threadId)
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Determine sender type
    let senderType = null
    let senderName = null

    if (thread.buyerId === userId) {
      senderType = 'BUYER'
      const buyer = await User.findById(userId)
      senderName = buyer?.name || 'Buyer'
    } else if (thread.sellerId === userId) {
      senderType = 'SELLER'
      const seller = await User.findById(userId)
      senderName = seller?.name || 'Seller'
    } else {
      return res.status(403).json({ error: 'You are not a participant in this negotiation' })
    }

    // Create message
    const message = await ChatMessage.create({
      threadId,
      senderId: userId,
      senderType,
      senderName,
      content
    })

    // Optionally generate AI agent response
    let agentMessage = null
    try {
      const chatHistory = await ChatMessage.findByThreadId(threadId)
      const hints = await aiGetNegotiationHints(
        threadId,
        thread.buyerId,
        thread.sellerId,
        chatHistory
      )

      if (hints && hints.suggestion) {
        agentMessage = await ChatMessage.create({
          threadId,
          senderId: null, // AGENT has no senderId
          senderType: 'AGENT',
          senderName: 'AI Negotiation Assistant',
          content: hints.suggestion,
          aiHint: hints.reasoning
        })
      }
    } catch (error) {
      console.error('AI agent message generation failed:', error)
      // Continue without agent message
    }

    res.status(201).json({
      message,
      agentMessage
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

/**
 * Get all threads for a user
 */
export async function getUserThreads(req, res) {
  try {
    const userId = req.user.id
    const threads = await NegotiationThread.findByParticipant(userId)
    
    // Enrich with request and quote info
    const enrichedThreads = await Promise.all(threads.map(async (thread) => {
      const request = await BuyerRequest.findById(thread.requestId)
      const quote = await SellerQuote.findById(thread.quoteId)
      return {
        ...thread,
        request: request ? {
          id: request.id,
          productName: request.productName,
          quantity: request.quantity
        } : null,
        quote: quote ? {
          id: quote.id,
          sellerPrice: quote.sellerPrice,
          sellerCarbonScore: quote.sellerCarbonScore,
          deliveryDays: quote.deliveryDays
        } : null
      }
    }))

    res.json(enrichedThreads)
  } catch (error) {
    console.error('Get user threads error:', error)
    res.status(500).json({ error: 'Failed to fetch threads' })
  }
}

/**
 * Update guidelines for buyer or seller
 */
export async function updateGuidelines(req, res) {
  try {
    const { threadId, guidelines } = req.body
    const userId = req.user.id

    if (!threadId || guidelines === undefined) {
      return res.status(400).json({ error: 'Thread ID and guidelines are required' })
    }

    const thread = await NegotiationThread.updateGuidelines(threadId, userId, guidelines)
    res.json(thread)
  } catch (error) {
    console.error('Failed to update guidelines:', error)
    res.status(500).json({ error: error.message || 'Failed to update guidelines' })
  }
}

/**
 * Trigger agent-to-agent negotiation
 */
export async function triggerAgentNegotiation(req, res) {
  try {
    console.log('🔄 triggerAgentNegotiation called')
    const { threadId } = req.body
    const userId = req.user.id

    console.log('📋 Request data:', { threadId, userId })

    if (!threadId) {
      console.error('❌ Missing threadId')
      return res.status(400).json({ error: 'Thread ID is required' })
    }

    const thread = await NegotiationThread.findById(threadId)
    if (!thread) {
      console.error('❌ Thread not found:', threadId)
      return res.status(404).json({ error: 'Thread not found' })
    }

    console.log('📋 Thread found:', {
      id: thread.id,
      buyerId: thread.buyerId,
      sellerId: thread.sellerId,
      hasBuyerGuidelines: !!thread.buyerGuidelines,
      hasSellerGuidelines: !!thread.sellerGuidelines
    })

    // Check if both parties have provided guidelines
    if (!thread.buyerGuidelines || !thread.sellerGuidelines) {
      console.warn('⚠️ Missing guidelines:', {
        buyer: !thread.buyerGuidelines,
        seller: !thread.sellerGuidelines
      })
      return res.status(400).json({ 
        error: 'Both parties must provide guidelines before starting negotiation',
        missingGuidelines: {
          buyer: !thread.buyerGuidelines,
          seller: !thread.sellerGuidelines
        }
      })
    }

    // Verify user is participant
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      console.error('❌ Access denied - user not participant')
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get request and quote details
    const request = await BuyerRequest.findById(thread.requestId)
    const quote = await SellerQuote.findById(thread.quoteId)
    if (!request) {
      console.error('❌ Request not found:', thread.requestId)
      return res.status(404).json({ error: `Request not found: ${thread.requestId}` })
    }
    if (!quote) {
      console.error('❌ Quote not found:', thread.quoteId)
      return res.status(404).json({ error: `Quote not found: ${thread.quoteId}` })
    }

    console.log('📋 Request and quote loaded:', {
      productName: request.productName,
      maxPrice: request.maxPrice,
      quotePrice: quote.sellerPrice
    })

    // Get all quotes for this request to enable comparison
    const allQuotes = await SellerQuote.findByRequestId(thread.requestId)
    const competingQuotes = allQuotes.filter(q => q.id !== quote.id && q.status !== 'REJECTED')
    console.log(`📊 Found ${competingQuotes.length} competing quotes`)
    
    // Get existing messages
    const chatHistory = await ChatMessage.findByThreadId(threadId)
    console.log(`📨 Chat history: ${chatHistory.length} messages`)
    
    // Check if this is a continuation (agents have already negotiated)
    const previousAgentMessages = chatHistory.filter(m => 
      m.senderType?.startsWith('AGENT_') || m.senderType === 'AGENT'
    )
    const isContinuation = previousAgentMessages.length >= 2
    console.log(`🔄 Is continuation: ${isContinuation}`)
    
    // Get the last agent message if it exists (to pass to the other agent)
    const lastAgentMessage = chatHistory
      .filter(m => m.senderType?.startsWith('AGENT_'))
      .slice(-1)[0]
    
    // Generate buyer agent message
    console.log('🤖 Generating buyer agent message...')
    let buyerAgentMessage
    try {
      // Get the last seller message to pass to buyer
      const lastSellerMessage = chatHistory
        .filter(m => m.senderType === 'AGENT_SELLER' || m.senderType?.startsWith('AGENT_SELLER'))
        .slice(-1)[0]
      
      buyerAgentMessage = await generateAgentMessage(
        threadId,
        'BUYER',
        thread.buyerId,
        request,
        quote,
        chatHistory,
        competingQuotes,
        isContinuation,
        thread.buyerGuidelines,
        thread.sellerGuidelines, // Pass seller's guidelines so buyer knows seller's constraints
        lastSellerMessage || lastAgentMessage // Pass the seller's last message
      )
      console.log('✅ Buyer agent message created:', buyerAgentMessage.id)
      console.log('📝 Buyer message preview:', buyerAgentMessage.content.substring(0, 100))
    } catch (buyerError) {
      console.error('❌ Failed to generate buyer agent message:', buyerError)
      throw new Error(`Failed to generate buyer agent message: ${buyerError.message}`)
    }

    // Wait a bit, then generate seller agent response
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('🤖 Generating seller agent message...')
    let sellerAgentMessage
    try {
      // Pass buyer's message to seller - this is CRITICAL for back-and-forth
      sellerAgentMessage = await generateAgentMessage(
        threadId,
        'SELLER',
        thread.sellerId,
        request,
        quote,
        [...chatHistory, buyerAgentMessage], // Include buyer's new message in history
        competingQuotes,
        isContinuation,
        thread.sellerGuidelines,
        thread.buyerGuidelines, // Pass buyer's guidelines so seller knows buyer's constraints
        buyerAgentMessage // CRITICAL: Pass buyer's message so seller can respond to it
      )
      console.log('✅ Seller agent message created:', sellerAgentMessage.id)
      console.log('📝 Seller message preview:', sellerAgentMessage.content.substring(0, 100))
    } catch (sellerError) {
      console.error('❌ Failed to generate seller agent message:', sellerError)
      throw new Error(`Failed to generate seller agent message: ${sellerError.message}`)
    }

    // Use negotiation engine to check for settlement
    const buyerAnalysis = analyzeNegotiationPosition('BUYER', request, quote, [...chatHistory, buyerAgentMessage, sellerAgentMessage], competingQuotes, { user: thread.buyerGuidelines, other: thread.sellerGuidelines })
    const sellerAnalysis = analyzeNegotiationPosition('SELLER', request, quote, [...chatHistory, buyerAgentMessage, sellerAgentMessage], competingQuotes, { user: thread.sellerGuidelines, other: thread.buyerGuidelines })
    
    const settlement = checkSettlement(buyerAgentMessage.content, sellerAgentMessage.content, buyerAnalysis)
    const agreementDetected = settlement.settled
    
    console.log(`✅ Agent negotiation round completed. Agreement: ${agreementDetected ? 'YES' : 'NO'}`)
    if (agreementDetected) {
      console.log(`🤝 Settlement reason: ${settlement.reason}`)
      if (settlement.priceDiff !== null) {
        console.log(`💰 Final price difference: $${settlement.priceDiff.toFixed(2)}`)
      }
    }
    
    // If agreement detected, generate confirmation messages from both agents
    let buyerConfirmation = null
    let sellerConfirmation = null
    
    if (agreementDetected) {
      console.log('🤝 Agreement detected! Generating confirmation messages...')
      
      try {
        // Generate buyer confirmation
        buyerConfirmation = await generateAgreementConfirmation(
          threadId,
          'BUYER',
          thread.buyerId,
          buyerAgentMessage.content,
          sellerAgentMessage.content,
          request,
          quote
        )
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate seller confirmation
        sellerConfirmation = await generateAgreementConfirmation(
          threadId,
          'SELLER',
          thread.sellerId,
          buyerAgentMessage.content,
          sellerAgentMessage.content,
          request,
          quote
        )
        
        console.log('✅ Agreement confirmation messages generated')
      } catch (confirmationError) {
        console.error('❌ Failed to generate confirmation messages:', confirmationError)
        // Continue even if confirmation fails
      }
    }
    
    res.json({
      buyerAgentMessage,
      sellerAgentMessage,
      buyerConfirmation,
      sellerConfirmation,
      agreementReached: agreementDetected,
      settlement: settlement,
      shouldContinue: !agreementDetected // Continue if no agreement
    })
  } catch (error) {
    console.error('❌ Agent negotiation error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to trigger agent negotiation',
      details: error.message || 'Unknown error',
      fullError: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    })
  }
}

/**
 * Extract price from message
 */
function extractPrice(message) {
  const pricePattern = /\$[\d,]+\.?\d*/g
  const prices = message.match(pricePattern) || []
  if (prices.length > 0) {
    const lastPrice = parseFloat(prices[prices.length - 1].replace(/[$,]/g, ''))
    return lastPrice || null
  }
  return null
}

/**
 * Detect if agents have reached an agreement
 */
function detectAgreement(buyerMessage, sellerMessage, request, quote) {
  const agreementKeywords = [
    'accept', 'agreed', 'deal', 'accepted', 'agreement', 
    'we have a deal', 'i accept', 'sounds good', 'agreed to',
    'final price', 'final terms', 'we agree', 'mutually agreed'
  ]
  
  const buyerLower = buyerMessage.toLowerCase()
  const sellerLower = sellerMessage.toLowerCase()
  
  // Check if both messages contain agreement keywords
  const buyerAgrees = agreementKeywords.some(keyword => buyerLower.includes(keyword))
  const sellerAgrees = agreementKeywords.some(keyword => sellerLower.includes(keyword))
  
  // Extract prices from both messages
  const buyerPrice = extractPrice(buyerMessage)
  const sellerPrice = extractPrice(sellerMessage)
  
  // Check if prices are equal or very close (within $1 or 1%)
  let priceAgreement = false
  if (buyerPrice && sellerPrice) {
    const diff = Math.abs(buyerPrice - sellerPrice)
    const percentDiff = diff / Math.max(buyerPrice, sellerPrice)
    // Prices are equal if within $1 or 1%
    priceAgreement = diff < 1 || percentDiff < 0.01
    
    console.log(`💰 Price check: Buyer=$${buyerPrice}, Seller=$${sellerPrice}, Diff=$${diff.toFixed(2)}, Agreement=${priceAgreement}`)
  }
  
  // Also check bounds: buyer shouldn't go below 50% of max budget, seller shouldn't go above 150% of original
  if (buyerPrice && buyerPrice < request.maxPrice * 0.5) {
    console.warn(`⚠️ Buyer price $${buyerPrice} is too low (below 50% of max budget $${request.maxPrice})`)
  }
  if (sellerPrice && sellerPrice > quote.sellerPrice * 1.5) {
    console.warn(`⚠️ Seller price $${sellerPrice} is too high (above 150% of original $${quote.sellerPrice})`)
  }
  
  return (buyerAgrees && sellerAgrees) || priceAgreement
}

/**
 * Generate agent message for buyer or seller - REALISTIC HUMAN-LIKE NEGOTIATION
 */
async function generateAgentMessage(threadId, agentType, userId, request, quote, chatHistory, competingQuotes = [], isContinuation = false, userGuidelines = null, otherPartyGuidelines = null, otherAgentMessage = null) {
  const isBuyer = agentType === 'BUYER'
  
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    
    const userName = user.name || agentType

    // Use negotiation engine to analyze position
    const analysis = analyzeNegotiationPosition(
      agentType,
      request,
      quote,
      chatHistory,
      competingQuotes,
      { user: userGuidelines, other: otherPartyGuidelines }
    )

    // Calculate reasonable offer based on analysis
    const suggestedOffer = calculateReasonableOffer(analysis, isBuyer)
    
    // Generate justifications for the offer
    const justifications = generateJustification(
      agentType,
      suggestedOffer,
      analysis,
      request,
      quote
    )

    // Build context
    const competingQuotesInfo = competingQuotes.length > 0 
      ? `\nCOMPETING QUOTES (for reference):\n${competingQuotes.slice(0, 3).map(q => `- $${q.sellerPrice} (${q.deliveryDays} days)`).join('\n')}`
      : ''
    
    // Get recent negotiation history - filter out our own repetitive messages
    const myPreviousMessages = chatHistory
      .filter(m => m.senderType === `AGENT_${agentType}` || m.senderType?.startsWith(`AGENT_${agentType}`))
      .slice(-3)
      .map(m => m.content.toLowerCase().trim())
    
    // Check for repetition - if we've said the same thing 2+ times, force a different approach
    const isRepeating = myPreviousMessages.length >= 2 && 
      myPreviousMessages.every(msg => msg === myPreviousMessages[0])
    
    const recentMessages = chatHistory.slice(-12) // Get more context
    const recentMessagesText = recentMessages.length > 0
      ? recentMessages.map((m, idx) => {
          const isMyMessage = m.senderType === `AGENT_${agentType}` || m.senderType?.startsWith(`AGENT_${agentType}`)
          return `${isMyMessage ? '[YOU]' : '[THEM]'} ${m.senderName}: ${m.content}`
        }).join('\n')
      : 'No previous messages'
    
    // Build repetition warning
    let repetitionWarning = ''
    if (isRepeating) {
      repetitionWarning = `\n\n⚠️ CRITICAL: You have repeated the same message "${myPreviousMessages[0].substring(0, 50)}..." multiple times. You MUST make a DIFFERENT response now. Make a specific counter-offer with a NEW price. Do NOT repeat yourself.`
    } else if (myPreviousMessages.length >= 1) {
      repetitionWarning = `\n\n⚠️ REMINDER: Your last message was similar. Make sure you're making progress and not repeating yourself.`
    }
    
    // Build guidelines section
    let guidelinesSection = ''
    if (userGuidelines || otherPartyGuidelines) {
      guidelinesSection = '\n\n=== NEGOTIATION GUIDELINES ===\n'
      if (userGuidelines) {
        guidelinesSection += `YOUR GUIDELINES:\n${userGuidelines}\n\n`
      }
      if (otherPartyGuidelines) {
        guidelinesSection += `${isBuyer ? 'SELLER' : 'BUYER'}'S GUIDELINES:\n${otherPartyGuidelines}\n\n`
      }
      guidelinesSection += 'Consider both sets of guidelines when negotiating.\n'
      guidelinesSection += '=== END GUIDELINES ===\n'
    }
    
    // Build negotiation status
    const agentMessages = chatHistory.filter(m => m.senderType?.startsWith('AGENT_'))
    const currentRound = Math.floor(agentMessages.length / 2) + 1
    const maxRounds = 5 // Allow more rounds for realistic negotiation
    
    let negotiationStatus = ''
    if (analysis.progress.stage === 'near_settlement') {
      negotiationStatus = `⚠️ NEGOTIATION STATUS: We are very close to agreement (${analysis.progress.convergence.toFixed(0)}% convergence). This is a good time to make a final reasonable offer to close the deal.`
    } else if (analysis.progress.stage === 'negotiating') {
      negotiationStatus = `📊 NEGOTIATION STATUS: Active negotiation in progress (${analysis.progress.convergence.toFixed(0)}% convergence). Continue making reasonable offers.`
    } else {
      negotiationStatus = `🔄 NEGOTIATION STATUS: Early stage negotiation. Make a reasonable opening offer.`
    }
    
    // Build strategy guidance
    const strategyGuidance = analysis.strategy.primary.message
    const secondaryStrategies = analysis.strategy.secondary.map(s => s.message).join('\n')
    
    // Build the other party's last message context - CRITICAL for response
    let otherAgentContext = ''
    if (otherAgentMessage) {
      const theirPrice = extractPriceFromMessage(otherAgentMessage.content)
      otherAgentContext = `\n\n=== YOU MUST RESPOND TO THIS MESSAGE ===\nLATEST MESSAGE FROM ${isBuyer ? 'SELLER' : 'BUYER'}:\n"${otherAgentMessage.content}"`
      if (theirPrice) {
        otherAgentContext += `\n\nThey mentioned a price of $${theirPrice.toFixed(2)}. You MUST respond to this specific offer.`
        if (suggestedOffer) {
          const diff = Math.abs(theirPrice - suggestedOffer)
          const percentDiff = (diff / theirPrice) * 100
          if (percentDiff < 3) {
            otherAgentContext += `\n\nTheir offer ($${theirPrice.toFixed(2)}) is very close to your target ($${suggestedOffer.toFixed(2)}). Consider accepting or making a small final counter-offer.`
          } else {
            otherAgentContext += `\n\nYou should make a counter-offer. Consider offering around $${suggestedOffer.toFixed(2)}.`
          }
        }
      } else {
        otherAgentContext += `\n\nThey haven't made a specific price offer yet. You should make a specific offer now.`
      }
      otherAgentContext += `\n=== END OF THEIR MESSAGE ===\n`
    } else {
      // Get the last message from the other party from chat history
      const otherPartyMessages = chatHistory.filter(m => {
        const isOtherParty = isBuyer 
          ? (m.senderType === 'AGENT_SELLER' || m.senderType?.startsWith('AGENT_SELLER'))
          : (m.senderType === 'AGENT_BUYER' || m.senderType?.startsWith('AGENT_BUYER'))
        return isOtherParty
      })
      if (otherPartyMessages.length > 0) {
        const lastOtherMessage = otherPartyMessages[otherPartyMessages.length - 1]
        const theirPrice = extractPriceFromMessage(lastOtherMessage.content)
        otherAgentContext = `\n\n=== LAST MESSAGE FROM ${isBuyer ? 'SELLER' : 'BUYER'} ===\n"${lastOtherMessage.content}"`
        if (theirPrice) {
          otherAgentContext += `\n\nThey mentioned $${theirPrice.toFixed(2)}. You should respond to this.`
        }
        otherAgentContext += `\n=== END ===\n`
      }
    }
    
    // Build price context - make it very clear what offers have been made
    let priceContext = '\n=== PRICE HISTORY ===\n'
    priceContext += `Original quote: $${analysis.originalPrice.toFixed(2)}\n`
    priceContext += `Fair market price (based on product range): $${analysis.fairMarketPrice.toFixed(2)}\n`
    priceContext += `Product price range: $${analysis.productRange ? `${(analysis.productRange.min * request.quantity).toFixed(2)} - $${(analysis.productRange.max * request.quantity).toFixed(2)}` : 'N/A'}\n`
    
    if (isBuyer) {
      priceContext += `Your budget: $${request.maxPrice.toFixed(2)}\n`
      priceContext += `Your acceptable range: $${analysis.minAcceptablePrice.toFixed(2)} - $${analysis.maxAcceptablePrice.toFixed(2)}\n`
    } else {
      priceContext += `Your acceptable range: $${analysis.sellerMinPrice.toFixed(2)} - $${analysis.sellerMaxPrice.toFixed(2)} (you start high and move DOWN)\n`
    }
    
    if (analysis.lastOffer) {
      priceContext += `Your last offer: $${analysis.lastOffer.price.toFixed(2)}\n`
    } else {
      priceContext += `Your last offer: None yet (this is your first offer)\n`
    }
    if (analysis.otherPartyLastOffer) {
      priceContext += `Their last offer: $${analysis.otherPartyLastOffer.price.toFixed(2)}\n`
      const priceDiff = analysis.lastOffer 
        ? Math.abs(analysis.lastOffer.price - analysis.otherPartyLastOffer.price)
        : Math.abs((isBuyer ? analysis.originalPrice : analysis.maxAcceptablePrice) - analysis.otherPartyLastOffer.price)
      priceContext += `Price difference: $${priceDiff.toFixed(2)}\n`
    } else {
      priceContext += `Their last offer: None yet\n`
    }
    priceContext += `=== END PRICE HISTORY ===\n`
    
    // Add suggested offer prominently
    priceContext += `\n💡 SUGGESTED OFFER FOR YOU: $${suggestedOffer.toFixed(2)}\n`
    if (isBuyer) {
      priceContext += `This is a reasonable offer moving UP toward the fair market price.\n`
    } else {
      priceContext += `This is a reasonable offer moving DOWN from your original quote toward the fair market price.\n`
    }
    
    // Build leverage context
    let leverageContext = ''
    if (analysis.leverage.hasLeverage) {
      leverageContext = `\n\nLEVERAGE: ${analysis.leverage.message}`
    }
    
    // Build justifications context
    const justificationsText = justifications.map(j => 
      `- ${j.reason} ${j.fairness}`
    ).join('\n')
    
    const prompt = `You are ${userName}, representing the ${isBuyer ? 'buyer' : 'seller'} in a real business negotiation. You are professional, fair, and strategic.

YOUR ROLE:
${isBuyer 
  ? `You are the BUYER. Your goal is to get the best value while being fair and reasonable. Your maximum budget is $${request.maxPrice.toFixed(2)}. You start with a lower offer and move UP (increase) toward the fair market price during negotiation.`
  : `You are the SELLER. Your goal is to get fair compensation for your product while being reasonable. Your original quote was $${quote.sellerPrice.toFixed(2)}. You start at this price and move DOWN (decrease) toward the fair market price during negotiation. This is how real negotiations work - sellers reduce their price, not increase it.`
}

DEAL DETAILS:
- Product: ${request.productName}
- Quantity: ${request.quantity}
- Max Budget: $${request.maxPrice.toFixed(2)}
- Original Quote: $${quote.sellerPrice.toFixed(2)}
- Delivery: ${quote.deliveryDays} days
- Carbon Score: ${quote.sellerCarbonScore || 'N/A'}
${competingQuotesInfo}
${priceContext}
${leverageContext}

${guidelinesSection}

${negotiationStatus}

NEGOTIATION STRATEGY:
${strategyGuidance}
${secondaryStrategies ? `\nAdditional considerations:\n${secondaryStrategies}` : ''}

JUSTIFICATIONS TO CONSIDER:
${justificationsText}

NEGOTIATION HISTORY:
${recentMessagesText}
${otherAgentContext}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST respond to the other party's last message. Do NOT ignore what they said.
2. You MUST make a SPECIFIC price offer. Use the suggested offer of $${suggestedOffer.toFixed(2)} as a guide, but you can adjust it slightly.
3. You MUST NOT repeat your previous messages. If you've said something similar before, say something DIFFERENT now.
4. Acknowledge what the other party said: "I see you offered $X" or "Thank you for your offer of $X"
5. Make your counter-offer: "I can offer $${suggestedOffer.toFixed(2)}" or "How about $${suggestedOffer.toFixed(2)}?"
6. ${isBuyer 
  ? 'As the BUYER, you should move UP (increase) your offer from your last one. You start low and increase toward fair price.'
  : 'As the SELLER, you MUST move DOWN (decrease) your price from your last one. You start at your original quote and decrease toward fair price. This is how real negotiations work - sellers reduce prices, not increase them.'}
7. Provide a brief justification: "This is fair because..." or "This works because..."
8. Be conversational and human-like, not robotic.

${repetitionWarning}

RESPONSE TEMPLATE (adapt this, don't copy exactly):
- Acknowledge their message: "I appreciate your offer of $[their price]..."
- Make your counter: "I can offer $${suggestedOffer.toFixed(2)}..."
- Brief justification: "This is fair because [reason]..."
- Closing: "What do you think?" or "Does this work for you?"

${analysis.otherPartyLastOffer 
  ? `THEY JUST OFFERED $${analysis.otherPartyLastOffer.price.toFixed(2)}. You MUST respond to this specific offer with a counter-offer.`
  : `This is early in the negotiation. Make your opening offer.`
}

Write your negotiation message now (3-5 sentences, be specific with numbers):`

    const messages = [
      {
        role: 'system',
        content: `You are ${userName}, a professional ${isBuyer ? 'buyer' : 'seller'} in a business negotiation. You are fair, reasonable, and strategic. You negotiate like a real human would - with reasoning, justification, and respect for the other party. You aim for win-win outcomes. ${isBuyer ? 'As a buyer, you start with a lower offer and increase it during negotiation.' : 'As a seller, you start with your original quote and decrease your price during negotiation. This is how real negotiations work - sellers reduce prices to reach agreement.'}`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await callLLM(messages, 0.7) // Lower temperature for more consistent, realistic responses
    let content = response.trim()
    
    // Validate response - check if it's too generic or repetitive
    const myLastMessage = chatHistory
      .filter(m => m.senderType === `AGENT_${agentType}` || m.senderType?.startsWith(`AGENT_${agentType}`))
      .slice(-1)[0]
    
    // Check if response is too similar to last message
    if (myLastMessage && content.toLowerCase().trim() === myLastMessage.content.toLowerCase().trim()) {
      console.warn(`⚠️ Agent ${agentType} generated identical message, regenerating...`)
      // Try once more with stronger instructions
      const retryPrompt = `${prompt}\n\nCRITICAL: Your previous response was identical to your last message. Generate a COMPLETELY DIFFERENT response with a specific counter-offer.`
      const retryMessages = [
        messages[0],
        { role: 'user', content: retryPrompt }
      ]
      const retryResponse = await callLLM(retryMessages, 0.8) // Slightly higher temp for variation
      content = retryResponse.trim()
    }
    
    // Ensure the response contains a price offer
    const hasPrice = extractPriceFromMessage(content)
    if (!hasPrice && suggestedOffer) {
      // If no price in response, prepend a specific offer
      const priceOffer = isBuyer
        ? `I can offer $${suggestedOffer.toFixed(2)}. `
        : `I'm willing to offer $${suggestedOffer.toFixed(2)}. `
      content = priceOffer + content
      console.log(`⚠️ Added price offer to ${agentType} message: $${suggestedOffer.toFixed(2)}`)
    }
    
    // Check if response is too short or generic
    if (content.length < 50) {
      const enhancedContent = isBuyer
        ? `I appreciate your offer. I can offer $${suggestedOffer.toFixed(2)}. This is fair given the market conditions and my budget constraints. What do you think?`
        : `Thank you for your interest. I can offer $${suggestedOffer.toFixed(2)}. This reflects the quality and value of the product. Does this work for you?`
      content = enhancedContent
      console.log(`⚠️ Enhanced ${agentType} message with more detail`)
    }

    // Create agent message
    const agentMessage = await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent (${userName})`,
      content
    })

    console.log(`✅ ${agentType} agent message created: "${content.substring(0, 100)}..."`)
    return agentMessage
  } catch (error) {
    console.error(`Failed to generate ${agentType} agent message:`, error)
    console.error('Error details:', error.message)
    
    // Better fallback message that includes a specific offer
    const fallbackOffer = calculateReasonableOffer(
      analyzeNegotiationPosition(agentType, request, quote, chatHistory, [], { user: null, other: null }),
      isBuyer
    )
    
    const fallbackContent = isBuyer
      ? `I understand your quote is $${quote.sellerPrice.toFixed(2)}. Given my budget of $${request.maxPrice.toFixed(2)}, I can offer $${fallbackOffer.toFixed(2)}. This is a fair price that works within my constraints. Can we work with this?`
      : `I appreciate your interest. My original quote was $${quote.sellerPrice.toFixed(2)}, but I'm willing to negotiate. I can offer $${fallbackOffer.toFixed(2)}. This reflects the value and quality of the product. What do you think?`
    
    return await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent`,
      content: fallbackContent
    })
  }
}

/**
 * Calculate a reasonable offer based on negotiation analysis
 * CRITICAL: Sellers move DOWN (decrease), Buyers move UP (increase) - they converge toward fair price
 */
function calculateReasonableOffer(analysis, isBuyer) {
  const { 
    fairMarketPrice, 
    minAcceptablePrice, // Buyer's min
    maxAcceptablePrice, // Buyer's max (budget)
    sellerMinPrice, // Seller's min (won't go below)
    sellerMaxPrice, // Seller's max (original quote)
    lastOffer, 
    otherPartyLastOffer, 
    progress 
  } = analysis
  
  // Define price bounds based on agent type
  const myMinPrice = isBuyer ? minAcceptablePrice : sellerMinPrice
  const myMaxPrice = isBuyer ? maxAcceptablePrice : sellerMaxPrice
  
  // If we're near settlement, move toward fair price or their offer
  if (progress.stage === 'near_settlement') {
    if (otherPartyLastOffer) {
      // Move toward their offer but stay within bounds
      const myLastPrice = lastOffer?.price || (isBuyer ? myMaxPrice * 0.7 : myMaxPrice)
      const theirPrice = otherPartyLastOffer.price
      const midpoint = (myLastPrice + theirPrice) / 2
      return Math.max(myMinPrice, Math.min(myMaxPrice, midpoint))
    }
    return Math.max(myMinPrice, Math.min(myMaxPrice, fairMarketPrice))
  }
  
  // If we have a last offer, make a reasonable move from it
  if (lastOffer) {
    if (isBuyer) {
      // BUYER: Move UP (increase offer) toward fair price
      const moveAmount = Math.min(50, (fairMarketPrice - lastOffer.price) * 0.15) // Move 15% toward fair or $50 max
      const newOffer = Math.min(myMaxPrice, lastOffer.price + moveAmount)
      // Don't go below our minimum
      return Math.max(myMinPrice, newOffer)
    } else {
      // SELLER: Move DOWN (decrease price) toward fair price
      const moveAmount = Math.min(50, (lastOffer.price - fairMarketPrice) * 0.15) // Move 15% toward fair or $50 max
      const newOffer = Math.max(myMinPrice, lastOffer.price - moveAmount)
      // Don't go below our minimum
      return Math.max(myMinPrice, newOffer)
    }
  }
  
  // Initial offer: start reasonable but with room to negotiate
  if (isBuyer) {
    // Buyer starts low (70% of fair price or 60% of original, whichever is higher)
    const startPrice = Math.max(
      myMinPrice, 
      Math.min(fairMarketPrice * 0.7, analysis.originalPrice * 0.6)
    )
    return startPrice
  } else {
    // Seller starts at original quote (their maximum) - will move DOWN from here
    return Math.min(myMaxPrice, analysis.originalPrice)
  }
}

/**
 * Generate agreement confirmation message
 */
async function generateAgreementConfirmation(threadId, agentType, userId, buyerMessage, sellerMessage, request, quote) {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    
    const userName = user.name || agentType
    const isBuyer = agentType === 'BUYER'
    
    // Extract agreed price
    const buyerPrice = extractPrice(buyerMessage)
    const sellerPrice = extractPrice(sellerMessage)
    const agreedPrice = buyerPrice || sellerPrice || quote.sellerPrice
    
    const prompt = `You are ${userName}, the ${agentType} Negotiation Agent. 

You have just reached an AGREEMENT with the ${isBuyer ? 'seller' : 'buyer'}!

AGREED TERMS:
- Price: $${agreedPrice}
- Product: ${request.productName}
- Quantity: ${request.quantity}

BUYER'S LAST MESSAGE: "${buyerMessage}"
SELLER'S LAST MESSAGE: "${sellerMessage}"

Write a brief confirmation message (1-2 sentences) acknowledging the agreement. Be professional and positive. Examples:
- "Excellent! I accept. We have a deal at $${agreedPrice}. Looking forward to working together."
- "Perfect! We're in agreement. The deal is confirmed at $${agreedPrice}."

Write your confirmation message:`

    const messages = [
      {
        role: 'system',
        content: `You are ${userName}, a professional ${agentType.toLowerCase()} negotiation agent. You have just reached an agreement and need to confirm it formally.`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await callLLM(messages, 0.7)
    const content = response.trim()

    // Create confirmation message
    const confirmationMessage = await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent (${userName})`,
      content
    })

    return confirmationMessage
  } catch (error) {
    console.error(`Failed to generate ${agentType} confirmation:`, error)
    // Fallback confirmation
    const buyerPrice = extractPrice(buyerMessage)
    const sellerPrice = extractPrice(sellerMessage)
    const agreedPrice = buyerPrice || sellerPrice || quote.sellerPrice
    
    return await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent`,
      content: `I accept! We have a deal at $${agreedPrice}. Let's proceed.`
    })
  }
}

/**
 * Extract negotiated terms from negotiation messages
 */
export async function extractNegotiatedTerms(req, res) {
  try {
    const { threadId } = req.body
    const userId = req.user.id

    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' })
    }

    const thread = await NegotiationThread.findById(threadId)
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Verify user is participant
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const quote = await SellerQuote.findById(thread.quoteId)
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' })
    }

    // Get all messages
    const messages = await ChatMessage.findByThreadId(threadId)
    const agentMessages = messages.filter(m => 
      m.senderType?.startsWith('AGENT_') || m.senderType === 'AGENT'
    )

    // Extract price and delivery from messages
    let negotiatedPrice = quote.sellerPrice
    let negotiatedDelivery = quote.deliveryDays

    // Look for price mentions in messages
    const pricePattern = /\$(\d+\.?\d*)/g
    const deliveryPattern = /(\d+)\s*(?:day|days)/gi

    const allPrices = []
    const allDeliveries = []

    agentMessages.forEach((msg) => {
      const priceMatches = msg.content.match(pricePattern)
      if (priceMatches) {
        priceMatches.forEach(match => {
          const price = parseFloat(match.replace('$', ''))
          if (price > 0 && price < 10000) {
            allPrices.push(price)
          }
        })
      }

      const deliveryMatches = msg.content.match(deliveryPattern)
      if (deliveryMatches) {
        deliveryMatches.forEach(match => {
          const days = parseInt(match)
          if (days > 0 && days < 365) {
            allDeliveries.push(days)
          }
        })
      }
    })

    // Use most recent reasonable values
    if (allPrices.length > 0) {
      negotiatedPrice = allPrices[allPrices.length - 1]
    }
    if (allDeliveries.length > 0) {
      negotiatedDelivery = allDeliveries[allDeliveries.length - 1]
    }

    // Ensure negotiated values are reasonable
    if (negotiatedPrice <= 0 || negotiatedPrice > quote.sellerPrice * 2) {
      negotiatedPrice = quote.sellerPrice
    }
    if (negotiatedDelivery <= 0 || negotiatedDelivery > 365) {
      negotiatedDelivery = quote.deliveryDays
    }

    res.json({
      negotiatedPrice,
      negotiatedDelivery,
      originalPrice: quote.sellerPrice,
      originalDelivery: quote.deliveryDays,
      priceChanged: Math.abs(negotiatedPrice - quote.sellerPrice) > 0.01,
      deliveryChanged: negotiatedDelivery !== quote.deliveryDays
    })
  } catch (error) {
    console.error('Extract terms error:', error)
    res.status(500).json({ error: 'Failed to extract negotiated terms' })
  }
}

