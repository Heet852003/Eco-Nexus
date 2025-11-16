/**
 * BuyerRequest Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class BuyerRequest {
  /**
   * Create a new buyer request
   */
  static async create(data) {
    const collection = getCollection('buyerRequests')
    const request = {
      buyerId: data.buyerId,
      productId: data.productId,
      productName: data.productName,
      quantity: data.quantity,
      maxPrice: data.maxPrice || null,
      notes: data.notes || '',
      status: 'OPEN',
      aiSuggestedPrice: null,
      aiRecommendation: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(request)
    return { ...request, id: result.insertedId.toString() }
  }

  /**
   * Find request by ID
   */
  static async findById(id) {
    const collection = getCollection('buyerRequests')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const request = await collection.findOne(query)
    if (!request) return null
    return { ...request, id: request._id.toString() }
  }

  /**
   * Find requests by buyer ID
   */
  static async findByBuyerId(buyerId) {
    const collection = getCollection('buyerRequests')
    const requests = await collection.find({ buyerId }).sort({ createdAt: -1 }).toArray()
    return requests.map(r => ({ ...r, id: r._id.toString() }))
  }

  /**
   * Get all pending requests
   */
  static async getAllPending() {
    const collection = getCollection('buyerRequests')
    const requests = await collection.find({
      status: { $in: ['OPEN', 'QUOTED', 'NEGOTIATING'] }
    }).sort({ createdAt: -1 }).toArray()
    return requests.map(r => ({ ...r, id: r._id.toString() }))
  }

  /**
   * Get eligible requests for a seller (excludes seller's own requests)
   */
  static async getEligibleForSeller(sellerId) {
    const collection = getCollection('buyerRequests')
    const requests = await collection.find({
      buyerId: { $ne: sellerId }, // Not created by this seller
      status: { $in: ['OPEN', 'QUOTED', 'NEGOTIATING'] }
    }).sort({ createdAt: -1 }).toArray()
    return requests.map(r => ({ ...r, id: r._id.toString() }))
  }

  /**
   * Update request status
   */
  static async updateStatus(id, status) {
    const collection = getCollection('buyerRequests')
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
          status,
          updatedAt: new Date()
        } 
      }
    )
    return this.findById(id)
  }

  /**
   * Add quote to request
   */
  static async addQuote(id, quote) {
    const collection = getCollection('buyerRequests')
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
          status: 'QUOTED',
          updatedAt: new Date()
        } 
      }
    )
    return this.findById(id)
  }

  /**
   * Set AI recommendation
   */
  static async setAIRecommendation(id, recommendation) {
    const collection = getCollection('buyerRequests')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const update = {
      $set: {
        aiRecommendation: recommendation,
        updatedAt: new Date()
      }
    }

    if (recommendation?.suggestedPrice) {
      update.$set.aiSuggestedPrice = recommendation.suggestedPrice
    }

    await collection.updateOne(query, update)
    return this.findById(id)
  }

  /**
   * Update request details (quantity, maxPrice, notes)
   */
  static async update(id, updates) {
    const collection = getCollection('buyerRequests')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const updateData = {
      updatedAt: new Date()
    }

    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity
    }
    if (updates.maxPrice !== undefined) {
      updateData.maxPrice = updates.maxPrice
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }

    await collection.updateOne(
      query,
      { $set: updateData }
    )
    return this.findById(id)
  }

  /**
   * Get all requests
   */
  static async getAll() {
    const collection = getCollection('buyerRequests')
    const requests = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return requests.map(r => ({ ...r, id: r._id.toString() }))
  }
}
