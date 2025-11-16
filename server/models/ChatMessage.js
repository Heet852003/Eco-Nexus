/**
 * ChatMessage Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class ChatMessage {
  /**
   * Create a new chat message
   */
  static async create(data) {
    // Validate senderType
    const validTypes = ['BUYER', 'SELLER', 'AGENT', 'AGENT_BUYER', 'AGENT_SELLER']
    if (!validTypes.includes(data.senderType)) {
      throw new Error(`Invalid senderType. Must be one of: ${validTypes.join(', ')}`)
    }

    const collection = getCollection('chatMessages')
    // Agent messages (AGENT, AGENT_BUYER, AGENT_SELLER) have no senderId
    const isAgentType = data.senderType === 'AGENT' || 
                       data.senderType === 'AGENT_BUYER' || 
                       data.senderType === 'AGENT_SELLER'
    
    const message = {
      threadId: data.threadId,
      senderId: isAgentType ? null : data.senderId,
      senderType: data.senderType,
      senderName: data.senderName,
      content: data.content,
      aiHint: data.aiHint || null,
      timestamp: new Date()
    }

    const result = await collection.insertOne(message)
    return { ...message, id: result.insertedId.toString() }
  }

  /**
   * Find messages by thread ID
   */
  static async findByThreadId(threadId) {
    if (!threadId) {
      return []
    }
    
    const collection = getCollection('chatMessages')
    
    // Try to find by string threadId first (most common case)
    let query = { threadId: threadId }
    
    // If threadId looks like an ObjectId, also try converting it
    // This handles cases where threadId might be stored as ObjectId
    try {
      if (typeof threadId === 'string' && threadId.length === 24) {
        // Try both string and ObjectId formats
        query = {
          $or: [
            { threadId: threadId },
            { threadId: new ObjectId(threadId) }
          ]
        }
      }
    } catch (error) {
      // If ObjectId conversion fails, just use string
      query = { threadId: threadId }
    }
    
    const messages = await collection.find(query)
      .sort({ timestamp: 1 })
      .toArray()
    return messages.map(m => ({ ...m, id: m._id.toString() }))
  }

  /**
   * Find messages by request ID (via threads)
   */
  static async findByRequestId(requestId) {
    // First get all threads for this request
    const { NegotiationThread } = await import('./NegotiationThread.js')
    const threads = await NegotiationThread.findByRequestId(requestId)
    const threadIds = threads.map(t => t.id)

    if (threadIds.length === 0) return []

    const collection = getCollection('chatMessages')
    const messages = await collection.find({ threadId: { $in: threadIds } })
      .sort({ timestamp: 1 })
      .toArray()
    return messages.map(m => ({ ...m, id: m._id.toString() }))
  }

  /**
   * Get all messages
   */
  static async getAll() {
    const collection = getCollection('chatMessages')
    const messages = await collection.find({}).sort({ timestamp: -1 }).toArray()
    return messages.map(m => ({ ...m, id: m._id.toString() }))
  }
}
