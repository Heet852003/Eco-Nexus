/**
 * Chat Controller
 */

import { ChatMessage } from '../models/ChatMessage.js'
import { Transaction } from '../models/Transaction.js'
import { getNegotiationHints } from '../services/aiService.js'

export async function sendMessage(req, res) {
  try {
    const { transactionId, message } = req.body
    const senderId = req.user.id
    const senderName = req.user.name || 'User'

    if (!transactionId || !message) {
      return res.status(400).json({ error: 'Transaction ID and message are required' })
    }

    // Note: ChatController is deprecated - use NegotiationController instead
    // This is kept for backward compatibility with transaction-based chat
    // Verify transaction exists and user is part of it
    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.buyerId !== senderId && transaction.sellerId !== senderId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get AI negotiation hints
    let aiHint = null
    try {
      // For transaction-based chat, we need to find the thread first
      const { NegotiationThread } = await import('../models/NegotiationThread.js')
      const threads = await NegotiationThread.findByRequestId(transaction.requestId)
      if (threads.length > 0) {
        const chatHistory = await ChatMessage.findByThreadId(threads[0].id)
        const hint = await getNegotiationHints(threads[0].id, transaction.buyerId, transaction.sellerId, chatHistory)
        aiHint = hint.suggestion
      }
    } catch (error) {
      console.error('AI hint generation failed:', error)
    }

    // Create message - Note: ChatMessage now uses threadId, not transactionId
    // This is a legacy endpoint - should migrate to negotiation-based chat
    res.status(400).json({ error: 'This endpoint is deprecated. Use /api/negotiation/message instead' })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

export async function getMessages(req, res) {
  try {
    const { id: transactionId } = req.params
    const userId = req.user.id

    // Verify transaction exists and user is part of it
    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // For transaction-based chat, find the negotiation thread
    const { NegotiationThread } = await import('../models/NegotiationThread.js')
    const threads = await NegotiationThread.findByRequestId(transaction.requestId)
    if (threads.length === 0) {
      return res.json([])
    }

    const messages = await ChatMessage.findByThreadId(threads[0].id)
    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

