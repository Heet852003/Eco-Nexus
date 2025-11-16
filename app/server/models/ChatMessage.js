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
    if (!['BUYER', 'SELLER', 'AGENT'].includes(data.senderType)) {
      throw new Error('Invalid senderType. Must be BUYER, SELLER, or AGENT')
    }

    const collection = getCollection('chatMessages')
    const message = {
      threadId: data.threadId,
      senderId: data.senderType === 'AGENT' ? null : data.senderId,
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
    const collection = getCollection('chatMessages')
    const messages = await collection.find({ threadId })
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
