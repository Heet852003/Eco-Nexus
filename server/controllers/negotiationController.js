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
 * Trigger agent-to-agent negotiation
 */
export async function triggerAgentNegotiation(req, res) {
  try {
    const { threadId } = req.body
    const userId = req.user.id

    console.log('🔄 triggerAgentNegotiation called:', { threadId, userId })

    if (!threadId) {
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

    // Get all quotes for this request to enable comparison
    const allQuotes = await SellerQuote.findByRequestId(thread.requestId)
    const competingQuotes = allQuotes.filter(q => q.id !== quote.id && q.status !== 'REJECTED')
    
    console.log('📋 Request details:', {
      productName: request.productName,
      quantity: request.quantity,
      maxPrice: request.maxPrice
    })
    console.log('📋 Current quote details:', {
      sellerPrice: quote.sellerPrice,
      deliveryDays: quote.deliveryDays
    })
    console.log(`📊 Found ${competingQuotes.length} competing quotes for comparison`)

    // Get existing messages
    const chatHistory = await ChatMessage.findByThreadId(threadId)
    console.log(`📨 Existing chat history: ${chatHistory.length} messages`)
    
    // Check if this is a continuation (agents have already negotiated)
    const previousAgentMessages = chatHistory.filter(m => 
      m.senderType?.startsWith('AGENT_') || m.senderType === 'AGENT'
    )
    const isContinuation = previousAgentMessages.length >= 2
    
    // Generate buyer agent message
    let buyerAgentMessage
    try {
      console.log('🤖 Generating buyer agent message...')
      buyerAgentMessage = await generateAgentMessage(
        threadId,
        'BUYER',
        thread.buyerId,
        request,
        quote,
        chatHistory,
        competingQuotes,
        isContinuation,
        thread.buyerGuidelines
      )
      console.log('✅ Buyer agent message generated')
    } catch (buyerError) {
      console.error('❌ Failed to generate buyer agent message:', buyerError)
      throw new Error(`Failed to generate buyer agent message: ${buyerError.message}`)
    }

    // Wait a bit, then generate seller agent response
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let sellerAgentMessage
    try {
      console.log('🤖 Generating seller agent message...')
      sellerAgentMessage = await generateAgentMessage(
        threadId,
        'SELLER',
        thread.sellerId,
        request,
        quote,
        [...chatHistory, buyerAgentMessage],
        competingQuotes,
        isContinuation,
        thread.sellerGuidelines
      )
      console.log('✅ Seller agent message generated')
    } catch (sellerError) {
      console.error('❌ Failed to generate seller agent message:', sellerError)
      throw new Error(`Failed to generate seller agent message: ${sellerError.message}`)
    }

    res.json({
      buyerAgentMessage,
      sellerAgentMessage
    })
  } catch (error) {
    console.error('❌ Agent negotiation error:', error)
    console.error('Error stack:', error.stack)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to trigger agent negotiation'
    let errorDetails = error.message || 'Unknown error'
    
    // Check for common error types
    if (error.message?.includes('OpenRouter API key')) {
      errorMessage = 'OpenRouter API key issue'
      errorDetails = 'Please check your OPENROUTER_API_KEY in the .env file. See server/README_API_KEY.md for setup instructions.'
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded'
      errorDetails = 'OpenRouter API rate limit reached. Please wait a moment and try again.'
    } else if (error.message?.includes('guidelines')) {
      errorMessage = 'Guidelines missing'
      errorDetails = error.message
    } else if (error.message?.includes('User') && error.message?.includes('not found')) {
      errorMessage = 'User not found'
      errorDetails = 'One of the negotiation participants could not be found in the database.'
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      fullError: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    })
  }
}

/**
 * Generate agent message for buyer or seller
 */
async function generateAgentMessage(threadId, agentType, userId, request, quote, chatHistory, competingQuotes = [], isContinuation = false, userGuidelines = null) {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    
    const isBuyer = agentType === 'BUYER'
    const userName = user.name || agentType
    
    // Build comparison data for buyer agent
    let comparisonData = ''
    if (isBuyer && competingQuotes.length > 0) {
      const validPrices = competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).map(q => q.sellerPrice)
      const validDeliveries = competingQuotes.filter(q => q.deliveryDays && q.deliveryDays > 0).map(q => q.deliveryDays)
      
      if (validPrices.length > 0 && validDeliveries.length > 0) {
        const avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
        const minPrice = Math.min(...validPrices)
        const avgDelivery = validDeliveries.reduce((sum, d) => sum + d, 0) / validDeliveries.length
        const minDelivery = Math.min(...validDeliveries)
        
        const priceDiff = quote.sellerPrice > avgPrice 
          ? `${((quote.sellerPrice / avgPrice - 1) * 100).toFixed(1)}% above average`
          : `${((1 - quote.sellerPrice / avgPrice) * 100).toFixed(1)}% below average`
        
        const deliveryDiff = quote.deliveryDays > avgDelivery
          ? `${(quote.deliveryDays - avgDelivery).toFixed(1)} days slower`
          : `${(avgDelivery - quote.deliveryDays).toFixed(1)} days faster`
        
        comparisonData = `

COMPETING QUOTES ANALYSIS (${competingQuotes.length} other offers):
- Average Price: $${avgPrice.toFixed(2)}
- Best Price Available: $${minPrice.toFixed(2)}
- Average Delivery: ${avgDelivery.toFixed(1)} days
- Best Delivery: ${minDelivery} days
- Current Quote Price: $${quote.sellerPrice} (${priceDiff})
- Current Quote Delivery: ${quote.deliveryDays} days (${deliveryDiff} than average)

SPECIFIC NEGOTIATION POINTS:
${quote.sellerPrice > avgPrice ? `- Price is ${((quote.sellerPrice / avgPrice - 1) * 100).toFixed(1)}% higher than market average. Consider requesting a $${((quote.sellerPrice - avgPrice) * 0.8).toFixed(2)} reduction to be competitive.` : `- Price is competitive (${((1 - quote.sellerPrice / avgPrice) * 100).toFixed(1)}% below average), but could potentially improve delivery terms.`}
${quote.deliveryDays > avgDelivery ? `- Delivery is ${(quote.deliveryDays - avgDelivery).toFixed(1)} days slower than average. Request faster delivery or price adjustment.` : `- Delivery is ${(avgDelivery - quote.deliveryDays).toFixed(1)} days faster than average, which is a strength.`}
`
      } else {
        comparisonData = `

MARKET CONTEXT:
- There are ${competingQuotes.length} other quotes available for comparison
- Use this information to negotiate competitive terms
`
      }
    } else if (!isBuyer && competingQuotes.length > 0) {
      const validPrices = competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).map(q => q.sellerPrice)
      if (validPrices.length > 0) {
        const avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
        comparisonData = `

MARKET CONTEXT:
- There are ${competingQuotes.length} other quotes for this request
- Average market price: $${avgPrice.toFixed(2)}
- Your quote: $${quote.sellerPrice} (${quote.sellerPrice > avgPrice ? `${((quote.sellerPrice / avgPrice - 1) * 100).toFixed(1)}% above` : `${((1 - quote.sellerPrice / avgPrice) * 100).toFixed(1)}% below`} market average)
- Consider your competitive position when negotiating
`
      } else {
        comparisonData = `

MARKET CONTEXT:
- There are ${competingQuotes.length} other quotes for this request
- Consider your competitive position when negotiating
`
      }
    } else if (isBuyer) {
      comparisonData = `

MARKET CONTEXT:
- No competing quotes available for comparison
- Negotiate based on your budget ($${request.maxPrice}) and requirements
- Focus on getting the best value for price, delivery, and sustainability
`
  }
  
    // Get the last message from the other party to respond to
    const otherAgentType = isBuyer ? 'SELLER' : 'BUYER'
    const lastOtherMessage = chatHistory
      .filter(m => m.senderType === `AGENT_${otherAgentType}` || m.senderType === otherAgentType)
      .slice(-1)[0]
    
    // Extract price and delivery from recent messages to detect loops
    const recentPrices = []
    const recentDeliveries = []
    chatHistory.slice(-6).forEach((m) => {
      const priceMatch = m.content.match(/\$(\d+\.?\d*)/g)
      if (priceMatch) {
        priceMatch.forEach((p) => {
          const price = parseFloat(p.replace('$', ''))
          if (price > 0 && price < 100000) recentPrices.push(price)
        })
      }
      const deliveryMatch = m.content.match(/(\d+)\s*(?:day|days)/i)
      if (deliveryMatch) {
        const days = parseInt(deliveryMatch[1])
        if (days > 0 && days < 365) recentDeliveries.push(days)
      }
    })
    
    // Detect if we're stuck in a loop (same prices being repeated)
    const uniquePrices = new Set(recentPrices)
    const isStuck = recentPrices.length >= 4 && uniquePrices.size <= 2
    
    const lastMessageContext = lastOtherMessage 
      ? `\nLAST MESSAGE FROM ${otherAgentType}: "${lastOtherMessage.content}"\nYou MUST respond directly to this message and make progress.`
      : '\nThis is the first message in the negotiation.\n'
    
    const loopWarning = isStuck 
      ? `\n⚠️ WARNING: You're stuck in a loop! Recent prices mentioned: ${[...uniquePrices].join(', ')}. You MUST make a NEW offer that's different from previous ones. Move toward agreement - don't repeat the same numbers.`
      : ''
    
    const prompt = `You are ${userName}, the ${agentType} Negotiation Agent. You are negotiating on behalf of your user.

BUYER REQUEST:
- Product: ${request.productName}
- Quantity: ${request.quantity}
- Max Budget: $${request.maxPrice}
- Desired Carbon Score: ${request.desiredCarbonScore || 'N/A'}
${request.notes ? `- Additional Notes: ${request.notes}` : ''}

CURRENT QUOTE BEING NEGOTIATED:
- Price: $${quote.sellerPrice}
- Carbon Score: ${quote.sellerCarbonScore || 'N/A'}
- Delivery Days: ${quote.deliveryDays}
- Local Sourcing: ${quote.localFlag ? 'Yes' : 'No'}
${quote.notes ? `- Seller Notes: ${quote.notes}` : ''}
${comparisonData}
${lastMessageContext}
RECENT NEGOTIATION HISTORY (last 3 messages):
${chatHistory.slice(-3).map(m => `${m.senderName}: ${m.content}`).join('\n') || 'No previous messages'}

${userGuidelines ? `\nYOUR USER'S GUIDELINES (MUST FOLLOW):
${userGuidelines}

These are direct instructions from your user. Follow them strictly.` : ''}

${isContinuation ? '\n⚠️ IMPORTANT: This is a continuation. DO NOT repeat your previous messages. Build on what was discussed. Make progress toward agreement.' : ''}

YOUR ROLE AS ${agentType} AGENT:
${isBuyer 
  ? `- Your user's budget is $${request.maxPrice}
- Current quote is $${quote.sellerPrice} (${quote.sellerPrice > request.maxPrice ? 'OVER budget' : 'within budget'})
${competingQuotes.length > 0 ? `- Market average price: $${(competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).reduce((sum, q) => sum + q.sellerPrice, 0) / competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).length).toFixed(2)}` : ''}
- Goal: Negotiate better price/delivery while staying within budget
- Be specific: Use exact numbers, percentages, and comparisons`
  : `- Your current quote: $${quote.sellerPrice} with ${quote.deliveryDays} days delivery
${competingQuotes.length > 0 ? `- Market average: $${(competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).reduce((sum, q) => sum + q.sellerPrice, 0) / competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).length).toFixed(2)}` : ''}
- Goal: Maintain fair price while being flexible to close the deal
- Highlight your value: Local sourcing, sustainability, quality
- Be specific: Use exact numbers when making counter-offers`
}

WRITE A NEGOTIATION MESSAGE:
1. If there's a last message from the other party, respond directly to it
2. Address specific numbers mentioned (price, delivery days, etc.)
3. Propose concrete counter-offers with exact numbers
4. Reference market data when relevant
5. Keep it conversational and direct - NO formal letter structure
6. NO placeholders like "[Your Name]" - use your actual name: ${userName}
7. NO email signatures or closings like "Best regards"
8. Be concise (2-4 sentences is ideal)
9. Make progress toward agreement
10. ${isStuck ? 'CRITICAL: You are stuck in a loop! Make a DIFFERENT offer. Move closer to their last proposal or make a final offer.' : 'Move toward agreement - each message should get closer to a deal'}

${loopWarning}

${isContinuation && recentPrices.length >= 2 ? `
NEGOTIATION PROGRESS CHECK:
- Recent prices discussed: $${[...uniquePrices].slice(-3).join(', $')}
- Current quote: $${quote.sellerPrice}
${isBuyer ? `- Your budget: $${request.maxPrice}` : ''}
- You need to make progress! ${isBuyer ? 'Move closer to their price OR make a final offer.' : 'Move closer to their price OR accept if reasonable.'}
` : ''}

${isContinuation && Math.abs((recentPrices[recentPrices.length - 1] || quote.sellerPrice) - (recentPrices[recentPrices.length - 2] || quote.sellerPrice)) < 50 ? `
⚠️ PRICE CONVERGENCE: You're very close! Consider making a final offer or accepting if within 5% of your target.
` : ''}

EXAMPLE GOOD MESSAGE (FIRST ROUND):
"Your price of $${quote.sellerPrice} is ${quote.sellerPrice > request.maxPrice ? 'above my budget of $' + request.maxPrice : 'workable'}. I can offer $${isBuyer ? (quote.sellerPrice * 0.9).toFixed(2) : (quote.sellerPrice * 1.05).toFixed(2)} with ${isBuyer ? Math.max(1, quote.deliveryDays - 2) : quote.deliveryDays}-day delivery. Does this work?"

EXAMPLE GOOD MESSAGE (CONTINUATION - MAKING PROGRESS):
${isBuyer 
  ? `"I understand your position on $2375. I can move up to $2325 with 4-day delivery - that's $50 more than my last offer. This is my best and final offer."`
  : `"I appreciate your flexibility. I can come down to $2350 with 5-day delivery - that's $25 less than my last offer. This works for me if it works for you."`
}

EXAMPLE BAD MESSAGE (DON'T DO THIS):
"Dear Seller, I appreciate your prompt response... [Your Name] Best regards"
"Your price of $2250 is too low. I can offer $2375." (repeating same numbers)

Write your negotiation message now:`

    const messages = [
      {
        role: 'system',
        content: `You are ${userName}, a professional ${agentType.toLowerCase()} negotiation agent. 

CRITICAL RULES - FOLLOW EXACTLY:
1. Write SHORT, DIRECT messages (2-4 sentences max)
2. NO placeholders - use your real name: ${userName}
3. NO formal greetings like "Dear X" or "Hello"
4. NO closings like "Best regards", "Sincerely", "Thank you"
5. NO letter structure - just the negotiation content
6. Be conversational, like texting, not emailing
7. Use specific numbers: prices, percentages, days
8. Respond directly to what the other party just said
9. ${isStuck ? 'CRITICAL: You are in a loop! Make a DIFFERENT offer that moves toward agreement. Don\'t repeat the same numbers.' : 'Make progress - each message should move closer to a deal'}
10. If prices are within 5% of each other, consider making a final offer or accepting

${isStuck ? '⚠️ LOOP DETECTED: Recent prices mentioned: $' + [...uniquePrices].join(', $') + '. You MUST make a NEW offer that\'s different and moves toward their last proposal.' : ''}

BAD: "Dear Seller, I appreciate... Best regards, [Your Name]"
BAD: "Your price of $2250 is too low. I can offer $2375." (repeating same numbers)
GOOD: "Your price of $100 is above my $80 budget. Can you do $85 with 5-day delivery?"
GOOD: "I understand your position on $2375. I can move up to $2325 with 4-day delivery - that's $50 more than my last offer. This is my best and final offer."`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    console.log(`🤖 Generating ${agentType} agent message for ${userName}...`)
    const response = await callLLM(messages, 0.8) // Slightly higher temperature for more natural responses
    let content = response.trim()
    
    // Aggressive cleanup of placeholders and formal structures
    content = content
      // Remove placeholders
      .replace(/\[Your Name\]/gi, userName)
      .replace(/\[Company Name\]/gi, '')
      .replace(/\[Your Company\]/gi, '')
      .replace(/\[.*?\]/g, '') // Remove any remaining brackets
      // Remove formal closings
      .replace(/Best\s+regards,?/gi, '')
      .replace(/Sincerely,?/gi, '')
      .replace(/Regards,?/gi, '')
      .replace(/Thank\s+you,?/gi, '')
      .replace(/Yours\s+(truly|sincerely|faithfully),?/gi, '')
      .replace(/Respectfully,?/gi, '')
      // Remove formal greetings
      .replace(/Dear\s+[^,]+,\s*/gi, '')
      .replace(/Hello\s+[^,]+,\s*/gi, '')
      .replace(/Hi\s+[^,]+,\s*/gi, '')
      // Remove trailing signatures
      .replace(/\n\s*[-–—]\s*\n.*$/s, '') // Remove anything after a dash line
      .replace(/\n\s*${userName}.*$/i, '') // Remove name at end
      .replace(/\n\s*${agentType}\s+Agent.*$/i, '') // Remove agent title at end
      .trim()
    
    // Split by newlines and remove empty lines, then rejoin
    content = content.split('\n').filter(line => line.trim().length > 0).join(' ').trim()
    
    // If content is still too long or formal, take first sentence
    if (content.length > 300) {
      const sentences = content.split(/[.!?]+/)
      content = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '')
    }
    
    console.log(`✅ ${agentType} agent (${userName}) response:`, content.substring(0, 150))

    // Create agent message
    const agentMessage = await ChatMessage.create({
      threadId,
      senderId: null,
      senderType: `AGENT_${agentType}`,
      senderName: `${agentType} Agent (${userName})`,
      content
    })
    console.log(`✅ ${agentType} agent message created:`, agentMessage.id)

    return agentMessage
  } catch (error) {
    console.error(`❌ Failed to generate ${agentType} agent message:`, error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    
    // Check for recent similar messages to avoid repetition
    const recentSameAgentMessages = chatHistory
      .filter(m => (m.senderType === `AGENT_${agentType}` || m.senderType === agentType))
      .slice(-3) // Check last 3 messages from same agent
    
    // Get the most recent message from the OTHER agent to respond to
    const otherAgentType = agentType === 'BUYER' ? 'SELLER' : 'BUYER'
    const recentOtherAgentMessages = chatHistory
      .filter(m => (m.senderType === `AGENT_${otherAgentType}` || m.senderType === otherAgentType))
      .slice(-2)
    const lastOtherMessage = recentOtherAgentMessages[recentOtherAgentMessages.length - 1]
    
    // Generate intelligent fallback message using actual data
    let fallbackContent = ''
    
    if (isBuyer) {
      if (competingQuotes.length > 0) {
        const validPrices = competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).map(q => q.sellerPrice)
        if (validPrices.length > 0) {
          const avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
          const minPrice = Math.min(...validPrices)
          const priceDiff = quote.sellerPrice - avgPrice
          const pricePercent = ((priceDiff / avgPrice) * 100).toFixed(1)
          
          if (quote.sellerPrice > avgPrice) {
            const proposedPrice = isContinuation 
              ? (avgPrice * 1.08).toFixed(2)  // Slightly higher in continuation
              : (avgPrice * 1.05).toFixed(2)
            fallbackContent = `I've reviewed the market and found ${competingQuotes.length} other quotes. Your price of $${quote.sellerPrice} is ${pricePercent}% above the market average of $${avgPrice.toFixed(2)}. The best available price is $${minPrice.toFixed(2)}. ${isContinuation ? 'Following up on our previous discussion, ' : ''}I'd like to propose $${proposedPrice} - this would be competitive while still above the lowest offer. Can we work with this?`
          } else {
            fallbackContent = `I've reviewed the market and your price of $${quote.sellerPrice} is competitive (${Math.abs(parseFloat(pricePercent)).toFixed(1)}% below average). ${isContinuation ? 'As we discussed, ' : ''}I'd like to focus on delivery terms. Can you improve the ${quote.deliveryDays}-day delivery timeline to ${Math.max(1, quote.deliveryDays - 2)} days?`
          }
        } else {
          fallbackContent = `I have ${competingQuotes.length} other quotes to consider. Your current price is $${quote.sellerPrice} and delivery is ${quote.deliveryDays} days. To be competitive, I'd like to negotiate a better price or faster delivery. What can you offer?`
        }
      } else {
        // No competing quotes
        if (quote.sellerPrice > request.maxPrice * 0.9) {
          fallbackContent = `Your quote of $${quote.sellerPrice} is close to my maximum budget of $${request.maxPrice}. I'd like to negotiate this down to $${(request.maxPrice * 0.85).toFixed(2)} to leave room for other costs. Also, can you improve the ${quote.deliveryDays}-day delivery time?`
        } else {
          fallbackContent = `Your price of $${quote.sellerPrice} is within my budget of $${request.maxPrice}. However, I'd like to discuss improving the delivery time from ${quote.deliveryDays} days. Can you offer faster delivery, or would you consider a price adjustment if delivery stays the same?`
        }
      }
    } else {
      // Seller agent
      if (competingQuotes.length > 0) {
        const validPrices = competingQuotes.filter(q => q.sellerPrice && q.sellerPrice > 0).map(q => q.sellerPrice)
        if (validPrices.length > 0) {
          const avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
          const priceDiff = quote.sellerPrice - avgPrice
          
          if (quote.sellerPrice > avgPrice) {
            fallbackContent = `I understand there are ${competingQuotes.length} other quotes in the market. My price of $${quote.sellerPrice} is ${((priceDiff / avgPrice) * 100).toFixed(1)}% above the average of $${avgPrice.toFixed(2)}, but I offer ${quote.localFlag ? 'local sourcing' : 'quality service'} and ${quote.deliveryDays}-day delivery. I'm willing to adjust to $${(avgPrice * 1.1).toFixed(2)} if that helps, or I can improve delivery to ${Math.max(1, quote.deliveryDays - 2)} days at the current price.`
          } else {
            fallbackContent = `I'm pleased that my quote of $${quote.sellerPrice} is competitive in the market. I'm offering ${quote.localFlag ? 'local sourcing' : 'quality service'} with ${quote.deliveryDays}-day delivery. I'm flexible on delivery time - I can reduce it to ${Math.max(1, quote.deliveryDays - 2)} days if needed. What works best for you?`
          }
        } else {
          fallbackContent = `I understand there's competition in the market. My quote offers $${quote.sellerPrice} with ${quote.deliveryDays}-day delivery${quote.localFlag ? ' and local sourcing' : ''}. I'm open to discussing adjustments - would you prefer a price reduction or faster delivery?`
        }
      } else {
        fallbackContent = `I'm offering $${quote.sellerPrice} with ${quote.deliveryDays}-day delivery${quote.localFlag ? ' and local sourcing' : ''}. I'm flexible and want to make this work. Would you like me to adjust the price or improve delivery terms?`
      }
    }

    // If fallback is still empty, use a basic one
    if (!fallbackContent) {
      fallbackContent = isBuyer
        ? `I'd like to negotiate the price of $${quote.sellerPrice} and ${quote.deliveryDays}-day delivery. Can we find terms that work for both of us?`
        : `I'm offering $${quote.sellerPrice} with ${quote.deliveryDays}-day delivery. I'm open to discussing adjustments to make this work for both parties.`
    }

    // Extract recent prices to detect loops in fallback
    const recentPricesFallback = []
    chatHistory.slice(-6).forEach((m) => {
      const priceMatch = m.content.match(/\$(\d+\.?\d*)/g)
      if (priceMatch) {
        priceMatch.forEach((p) => {
          const price = parseFloat(p.replace('$', ''))
          if (price > 0 && price < 100000) recentPricesFallback.push(price)
        })
      }
    })
    const uniquePricesFallback = new Set(recentPricesFallback)
    const isStuckFallback = recentPricesFallback.length >= 4 && uniquePricesFallback.size <= 2
    
    // Check if this message is too similar to recent messages
    const isSimilarToRecent = recentSameAgentMessages.some(msg => {
      const similarity = calculateSimilarity(msg.content, fallbackContent)
      return similarity > 0.7 // 70% similar
    })
    
    // If message is too similar, generate a different approach
    if (isSimilarToRecent && recentSameAgentMessages.length > 0) {
      // If there's a message from the other agent, respond to it directly
      if (lastOtherMessage) {
        if (isBuyer) {
          // Buyer responds to seller's last message
          const otherPrice = lastOtherMessage.content.match(/\$(\d+\.?\d*)/)?.[1]
          if (otherPrice) {
            const price = parseFloat(otherPrice)
            // If stuck, make a final offer closer to seller's price
            if (isStuckFallback && recentPricesFallback.length >= 4) {
              const lastBuyerPrice = recentPricesFallback[recentPricesFallback.length - 2] || price * 0.9
              const convergencePrice = Math.min(request.maxPrice, (lastBuyerPrice + price) / 2)
              fallbackContent = `I understand we've been going back and forth. Let me make my final offer: $${convergencePrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 2)}-day delivery. This is my best and final offer.`
            } else {
              // Normal negotiation - move toward seller's price
              const moveTowardPrice = Math.min(request.maxPrice, price * 0.98)
              fallbackContent = `I can move up to $${moveTowardPrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 2)}-day delivery. This is closer to your $${price} proposal.`
            }
          } else {
            fallbackContent = `I appreciate your flexibility. Let me propose: $${(quote.sellerPrice * 0.92).toFixed(2)} with ${Math.max(1, quote.deliveryDays - 2)}-day delivery. Does this work?`
          }
        } else {
          // Seller responds to buyer's last message
          const buyerPrice = lastOtherMessage.content.match(/\$(\d+\.?\d*)/)?.[1]
          if (buyerPrice) {
            const price = parseFloat(buyerPrice)
            // If stuck, make a final offer closer to buyer's price
            if (isStuckFallback && recentPricesFallback.length >= 4) {
              const lastSellerPrice = recentPricesFallback[recentPricesFallback.length - 1] || quote.sellerPrice
              const convergencePrice = Math.max(quote.sellerPrice * 0.9, (lastSellerPrice + price) / 2)
              fallbackContent = `I understand we need to close this. My final offer: $${convergencePrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 1)}-day delivery. This is my best offer.`
            } else {
              // Normal negotiation - move toward buyer's price
              const moveTowardPrice = Math.max(quote.sellerPrice * 0.92, price * 1.02)
              fallbackContent = `I can come down to $${moveTowardPrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 1)}-day delivery. This moves toward your $${price} proposal.`
            }
          } else {
            fallbackContent = `I appreciate your proposal. Let me offer $${(quote.sellerPrice * 0.95).toFixed(2)} with ${Math.max(1, quote.deliveryDays - 1)}-day delivery as a compromise.`
          }
        }
      } else {
        // No other agent message, just vary the wording
        if (isBuyer) {
          const newPrice = isStuckFallback ? (quote.sellerPrice * 0.95) : (quote.sellerPrice * 0.9)
          fallbackContent = `Let me propose: $${newPrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 2)}-day delivery. This addresses both price and timing.`
        } else {
          const newPrice = isStuckFallback ? (quote.sellerPrice * 0.97) : (quote.sellerPrice * 0.95)
          fallbackContent = `I can offer: $${newPrice.toFixed(2)} with ${Math.max(1, quote.deliveryDays - 1)}-day delivery. This is a fair compromise.`
        }
      }
    }

    try {
      console.log(`📝 Using intelligent fallback for ${agentType}:`, fallbackContent.substring(0, 100))
      return await ChatMessage.create({
        threadId,
        senderId: null,
        senderType: `AGENT_${agentType}`,
        senderName: `${agentType} Agent (${user?.name || agentType})`,
        content: fallbackContent
      })
    } catch (fallbackError) {
      console.error(`❌ Failed to create fallback message for ${agentType}:`, fallbackError)
      throw new Error(`Failed to create agent message: ${error.message}`)
    }
  }
}

/**
 * Calculate similarity between two strings (simple word overlap)
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/))
  const words2 = new Set(str2.toLowerCase().split(/\s+/))
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  return intersection.size / union.size
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

    // Look for price mentions in messages - prioritize final proposals
    // Patterns that indicate final/agreed terms
    const finalPricePatterns = [
      /(?:propose|proposing|offer|offering|can do|will do|agree to|accept|deal at|final price|agreed price|settle on)\s*\$(\d+\.?\d*)/gi,
      /\$(\d+\.?\d*)\s*(?:works?|deal|agreed|acceptable|final|settled)/gi
    ]
    
    // General price pattern
    const pricePattern = /\$(\d+\.?\d*)/g
    
    // Delivery patterns - prioritize final proposals
    const finalDeliveryPatterns = [
      /(?:delivery|deliver|ship|shipping)\s*(?:in|of|within|by)\s*(\d+)\s*(?:day|days)/gi,
      /(\d+)\s*(?:day|days)\s*(?:delivery|deliver|ship|shipping|works?|deal|agreed)/gi
    ]
    const deliveryPattern = /(\d+)\s*(?:day|days|day's)/gi

    // Get the most recent price and delivery mentions
    const allPrices = []
    const allDeliveries = []
    let finalPrice = null
    let finalDelivery = null

    // Process messages in reverse to find most recent final terms
    for (let i = agentMessages.length - 1; i >= 0; i--) {
      const msg = agentMessages[i]
      const content = msg.content.toLowerCase()
      
      // Check for final price proposals first
      if (!finalPrice) {
        for (const pattern of finalPricePatterns) {
          const matches = msg.content.match(pattern)
          if (matches) {
            matches.forEach(match => {
              const priceMatch = match.match(/\$(\d+\.?\d*)/)
              if (priceMatch) {
                const price = parseFloat(priceMatch[1])
                if (price > 0 && price < 10000 && price >= quote.sellerPrice * 0.5 && price <= quote.sellerPrice * 1.5) {
                  finalPrice = price
                }
              }
            })
          }
        }
      }
      
      // Check for final delivery proposals
      if (!finalDelivery) {
        for (const pattern of finalDeliveryPatterns) {
          const matches = msg.content.match(pattern)
          if (matches) {
            matches.forEach(match => {
              const dayMatch = match.match(/(\d+)\s*(?:day|days)/i)
              if (dayMatch) {
                const days = parseInt(dayMatch[1])
                if (days > 0 && days < 365) {
                  finalDelivery = days
                }
              }
            })
          }
        }
      }
      
      // Also collect all prices and deliveries as fallback
      const priceMatches = msg.content.match(pricePattern)
      if (priceMatches) {
        priceMatches.forEach(match => {
          const price = parseFloat(match.replace('$', ''))
          if (price > 0 && price < 10000 && price >= quote.sellerPrice * 0.5 && price <= quote.sellerPrice * 1.5) {
            allPrices.push({ price, index: i })
          }
        })
      }

      const deliveryMatches = msg.content.match(deliveryPattern)
      if (deliveryMatches) {
        deliveryMatches.forEach(match => {
          const days = parseInt(match)
          if (days > 0 && days < 365) {
            allDeliveries.push({ days, index: i })
          }
        })
      }
    }

    // Use final price if found, otherwise use most recent reasonable price
    if (finalPrice) {
      negotiatedPrice = finalPrice
    } else if (allPrices.length > 0) {
      // Sort by index (most recent first) and take the most recent
      allPrices.sort((a, b) => b.index - a.index)
      negotiatedPrice = allPrices[0].price
    }

    // Use final delivery if found, otherwise use most recent reasonable delivery
    if (finalDelivery) {
      negotiatedDelivery = finalDelivery
    } else if (allDeliveries.length > 0) {
      // Sort by index (most recent first) and take the most recent
      allDeliveries.sort((a, b) => b.index - a.index)
      negotiatedDelivery = allDeliveries[0].days
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

