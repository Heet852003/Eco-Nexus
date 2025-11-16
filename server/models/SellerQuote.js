/**
 * SellerQuote Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class SellerQuote {
  /**
   * Create a new seller quote
   */
  static async create(data) {
    const collection = getCollection('sellerQuotes')
    
    // Check for duplicate quote (same seller, same request)
    const existing = await collection.findOne({
      requestId: data.requestId,
      sellerId: data.sellerId
    })
    if (existing) {
      throw new Error('Quote already exists for this request')
    }

    const quote = {
      requestId: data.requestId,
      sellerId: data.sellerId,
      sellerName: data.sellerName,
      sellerPrice: data.sellerPrice,
      deliveryDays: data.deliveryDays,
      localFlag: data.localFlag || 0, // 0 = not local, 1 = local
      aiSuggestedPrice: data.aiSuggestedPrice || null,
      aiSuggestedScore: data.aiSuggestedScore || null,
      aiJustification: null,
      status: 'PENDING',
      createdAt: new Date()
    }

    const result = await collection.insertOne(quote)
    return { ...quote, id: result.insertedId.toString() }
  }

  /**
   * Find quote by ID
   */
  static async findById(id) {
    const collection = getCollection('sellerQuotes')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const quote = await collection.findOne(query)
    if (!quote) return null
    return { ...quote, id: quote._id.toString() }
  }

  /**
   * Find quotes by request ID
   */
  static async findByRequestId(requestId) {
    const collection = getCollection('sellerQuotes')
    const quotes = await collection.find({ requestId }).sort({ createdAt: -1 }).toArray()
    return quotes.map(q => ({ ...q, id: q._id.toString() }))
  }

  /**
   * Find quotes by seller ID
   */
  static async findBySellerId(sellerId) {
    const collection = getCollection('sellerQuotes')
    const quotes = await collection.find({ sellerId }).sort({ createdAt: -1 }).toArray()
    return quotes.map(q => ({ ...q, id: q._id.toString() }))
  }

  /**
   * Update quote status
   */
  static async updateStatus(id, status) {
    const collection = getCollection('sellerQuotes')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    await collection.updateOne(
      query,
      { $set: { status } }
    )
    return this.findById(id)
  }

  /**
   * Update quote details (price, delivery days)
   */
  static async update(id, updates) {
    const collection = getCollection('sellerQuotes')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const updateData = {
      updatedAt: new Date()
    }

    if (updates.sellerPrice !== undefined) {
      updateData.sellerPrice = updates.sellerPrice
    }
    if (updates.deliveryDays !== undefined) {
      updateData.deliveryDays = updates.deliveryDays
    }

    await collection.updateOne(
      query,
      { $set: updateData }
    )
    return this.findById(id)
  }

  /**
   * Get all quotes
   */
  static async getAll() {
    const collection = getCollection('sellerQuotes')
    const quotes = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return quotes.map(q => ({ ...q, id: q._id.toString() }))
  }
}
