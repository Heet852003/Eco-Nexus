/**
 * NegotiationThread Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class NegotiationThread {
  /**
   * Create a new negotiation thread
   */
  static async create(data) {
    // Validate buyer and seller are different
    if (data.buyerId === data.sellerId) {
      throw new Error('Buyer and seller cannot be the same user')
    }

    const collection = getCollection('negotiationThreads')
    const thread = {
      requestId: data.requestId,
      quoteId: data.quoteId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      buyerGuidelines: null,
      sellerGuidelines: null,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(thread)
    return { ...thread, id: result.insertedId.toString() }
  }

  /**
   * Find thread by ID
   */
  static async findById(id) {
    const collection = getCollection('negotiationThreads')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const thread = await collection.findOne(query)
    if (!thread) return null
    return { ...thread, id: thread._id.toString() }
  }

  /**
   * Update guidelines for buyer or seller
   */
  static async updateGuidelines(threadId, userId, guidelines) {
    const collection = getCollection('negotiationThreads')
    let query
    try {
      query = { _id: new ObjectId(threadId) }
    } catch (error) {
      query = { id: threadId }
    }

    const thread = await collection.findOne(query)
    if (!thread) {
      throw new Error('Thread not found')
    }

    const update = { updatedAt: new Date() }
    if (thread.buyerId === userId) {
      update.buyerGuidelines = guidelines
    } else if (thread.sellerId === userId) {
      update.sellerGuidelines = guidelines
    } else {
      throw new Error('User is not a participant in this thread')
    }

    await collection.updateOne(query, { $set: update })
    const updated = await collection.findOne(query)
    return { ...updated, id: updated._id.toString() }
  }

  /**
   * Find threads by request ID
   */
  static async findByRequestId(requestId) {
    const collection = getCollection('negotiationThreads')
    const threads = await collection.find({ requestId }).sort({ createdAt: -1 }).toArray()
    return threads.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Find thread by quote ID
   */
  static async findByQuoteId(quoteId) {
    const collection = getCollection('negotiationThreads')
    const thread = await collection.findOne({ quoteId })
    if (!thread) return null
    return { ...thread, id: thread._id.toString() }
  }

  /**
   * Find threads by buyer ID
   */
  static async findByBuyerId(buyerId) {
    const collection = getCollection('negotiationThreads')
    const threads = await collection.find({ buyerId }).sort({ createdAt: -1 }).toArray()
    return threads.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Find threads by seller ID
   */
  static async findBySellerId(sellerId) {
    const collection = getCollection('negotiationThreads')
    const threads = await collection.find({ sellerId }).sort({ createdAt: -1 }).toArray()
    return threads.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Find threads by participant (buyer or seller)
   */
  static async findByParticipant(userId) {
    const collection = getCollection('negotiationThreads')
    const threads = await collection.find({
      $or: [{ buyerId: userId }, { sellerId: userId }]
    }).sort({ createdAt: -1 }).toArray()
    return threads.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Close thread
   */
  static async closeThread(id) {
    const collection = getCollection('negotiationThreads')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    await collection.updateOne(
      query,
      {
        $set: {
          status: 'CLOSED',
          updatedAt: new Date()
        }
      }
    )
    return this.findById(id)
  }

  /**
   * Get all threads
   */
  static async getAll() {
    const collection = getCollection('negotiationThreads')
    const threads = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return threads.map(t => ({ ...t, id: t._id.toString() }))
  }
}
