/**
 * Negotiation Controller
 * Handles negotiation threads and agent-based chat
 */

import { NegotiationThread } from '../models/NegotiationThread.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { BuyerRequest } from '../models/BuyerRequest.js'
import { SellerQuote } from '../models/SellerQuote.js'
import { User } from '../models/User.js'
import { getNegotiationHints as aiGetNegotiationHints } from '../services/aiService.js'

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

