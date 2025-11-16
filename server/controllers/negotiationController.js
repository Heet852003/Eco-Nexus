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
    const userId = req.user.id

    // Try to find thread by ID first
    let thread = await NegotiationThread.findById(threadId)
    
    // If not found by ID, try to find by quoteId
    if (!thread) {
      thread = await NegotiationThread.findByQuoteId(threadId)
    }

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Verify user is participant
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get messages
    const messages = await ChatMessage.findByThreadId(thread.id)

    res.json({
      thread,
      messages
    })
  } catch (error) {
    console.error('Get thread error:', error)
    res.status(500).json({ error: 'Failed to fetch thread' })
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
        lastAgentMessage // Pass the other agent's last message
      )
      console.log('✅ Buyer agent message created:', buyerAgentMessage.id)
    } catch (buyerError) {
      console.error('❌ Failed to generate buyer agent message:', buyerError)
      throw new Error(`Failed to generate buyer agent message: ${buyerError.message}`)
    }

    // Wait a bit, then generate seller agent response
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('🤖 Generating seller agent message...')
    let sellerAgentMessage
    try {
      sellerAgentMessage = await generateAgentMessage(
        threadId,
        'SELLER',
        thread.sellerId,
        request,
        quote,
        [...chatHistory, buyerAgentMessage],
        competingQuotes,
        isContinuation,
        thread.sellerGuidelines,
        buyerAgentMessage // Pass buyer's message to seller
      )
      console.log('✅ Seller agent message created:', sellerAgentMessage.id)
    } catch (sellerError) {
      console.error('❌ Failed to generate seller agent message:', sellerError)
      throw new Error(`Failed to generate seller agent message: ${sellerError.message}`)
    }

    // Check if agents have reached an agreement
    const agreementDetected = detectAgreement(buyerAgentMessage.content, sellerAgentMessage.content, request, quote)
    
    console.log(`✅ Agent negotiation round completed. Agreement: ${agreementDetected ? 'YES' : 'NO'}`)
    
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
 * Generate agent message for buyer or seller
 */
async function generateAgentMessage(threadId, agentType, userId, request, quote, chatHistory, competingQuotes = [], isContinuation = false, userGuidelines = null, otherAgentMessage = null) {
  const isBuyer = agentType === 'BUYER'
  
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    
    const userName = user.name || agentType

    // Build profit-focused prompt based on agent type
    const competingQuotesInfo = competingQuotes.length > 0 
      ? `\nCOMPETING QUOTES (for reference):\n${competingQuotes.slice(0, 3).map(q => `- $${q.sellerPrice} (${q.deliveryDays} days)`).join('\n')}`
      : ''
    
    // Calculate price bounds
    const minPrice = request.maxPrice * 0.5 // Buyer shouldn't go below 50% of max budget
    const maxPrice = quote.sellerPrice * 1.5 // Seller shouldn't go above 150% of original
    
    const profitGoal = isBuyer
      ? `YOUR GOAL: Maximize buyer profit by negotiating the LOWEST possible price. Your buyer's maximum budget is $${request.maxPrice}. DO NOT go below $${minPrice.toFixed(2)}. Try to get the price as low as possible while staying within budget. Also negotiate for faster delivery and better terms.`
      : `YOUR GOAL: Maximize seller profit by negotiating the HIGHEST possible price. The current quote is $${quote.sellerPrice}. DO NOT go above $${maxPrice.toFixed(2)}. Try to maintain or increase this price while offering reasonable delivery terms. Protect your profit margins.`
    
    // Get round number from agent messages
    const agentMessages = chatHistory.filter(m => m.senderType?.startsWith('AGENT_'))
    const currentRound = Math.floor(agentMessages.length / 2) + 1
    const maxRounds = 3
    
    const otherAgentResponse = otherAgentMessage 
      ? `\n\nLATEST MESSAGE FROM ${isBuyer ? 'SELLER' : 'BUYER'} AGENT:\n"${otherAgentMessage.content}"\n\nRespond directly to this message.`
      : ''
    
    const prompt = `You are ${userName}, the ${agentType} Negotiation Agent. Your PRIMARY OBJECTIVE is to maximize profit for your ${agentType.toLowerCase()}.

${profitGoal}

BUYER REQUEST:
- Product: ${request.productName}
- Quantity: ${request.quantity}
- Max Budget: $${request.maxPrice}
- Desired Carbon Score: ${request.desiredCarbonScore || 'N/A'}

CURRENT QUOTE:
- Price: $${quote.sellerPrice}
- Carbon Score: ${quote.sellerCarbonScore || 'N/A'}
- Delivery Days: ${quote.deliveryDays}
${competingQuotesInfo}

${userGuidelines ? `YOUR USER'S ADDITIONAL GUIDELINES: ${userGuidelines}` : ''}

NEGOTIATION STATUS:
- Current Round: ${currentRound} of ${maxRounds}
- ${currentRound >= maxRounds ? '⚠️ THIS IS THE FINAL ROUND - Try to reach an agreement now!' : `You have ${maxRounds - currentRound} rounds left. Make progress toward agreement.`}

RECENT NEGOTIATION MESSAGES (last 6 messages):
${chatHistory.slice(-6).map(m => `${m.senderName}: ${m.content}`).join('\n') || 'No previous messages'}
${otherAgentResponse}

INSTRUCTIONS:
- Be assertive and profit-focused
- Use SPECIFIC numbers (prices, delivery days)
- Make concrete offers or counter-offers
- ${isBuyer ? `Push for lower prices (but not below $${minPrice.toFixed(2)}) and faster delivery` : `Defend your price (but not above $${maxPrice.toFixed(2)}) and negotiate favorable terms`}
- CRITICAL: If the other agent's price matches your offer (within $1), you MUST immediately respond with: "I accept! We have a deal at $[price]. Let's proceed."
- If prices are equal or very close, explicitly state "I agree" or "We have a deal"
- If you agree to terms, clearly state "I accept" or "We have a deal" - don't just imply it
- ${currentRound >= maxRounds ? 'This is the final round - be willing to compromise to reach agreement' : 'Make reasonable progress toward agreement'}
- Keep messages to 2-4 sentences, direct and specific

Write your negotiation message:`

    const messages = [
      {
        role: 'system',
        content: `You are ${userName}, a professional ${agentType.toLowerCase()} negotiation agent focused on maximizing profit. You are assertive, use specific numbers, and make concrete offers. ${isBuyer ? 'You push for lower prices and better terms.' : 'You defend your prices and negotiate favorable terms.'}`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await callLLM(messages, 0.8)
    const content = response.trim()

    // Create agent message
    const agentMessage = await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent (${userName})`,
      content
    })

    return agentMessage
  } catch (error) {
    console.error(`Failed to generate ${agentType} agent message:`, error)
    // Fallback message
    const fallbackContent = isBuyer
      ? `I'd like to negotiate the price of $${quote.sellerPrice} and ${quote.deliveryDays}-day delivery. Can we find terms that work for both of us?`
      : `I'm offering $${quote.sellerPrice} with ${quote.deliveryDays}-day delivery. I'm open to discussing adjustments.`
    
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

