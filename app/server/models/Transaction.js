/**
 * Transaction Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class Transaction {
  /**
   * Create a new transaction
   */
  static async create(data) {
    // Validate buyer and seller are different
    if (data.buyerId === data.sellerId) {
      throw new Error('Buyer and seller cannot be the same user')
    }

    const collection = getCollection('transactions')
    const transaction = {
      requestId: data.requestId,
      quoteId: data.quoteId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      productId: data.productId,
      productName: data.productName,
      quantity: data.quantity,
      finalPrice: data.price || data.finalPrice,
      status: 'PENDING',
      solanaSignature: null,
      blockchainTxHash: null,
      sccTokensMinted: null,
      createdAt: new Date(),
      completedAt: null
    }

    const result = await collection.insertOne(transaction)
    return { ...transaction, id: result.insertedId.toString() }
  }

  /**
   * Find transaction by ID
   */
  static async findById(id) {
    const collection = getCollection('transactions')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const transaction = await collection.findOne(query)
    if (!transaction) return null
    return { ...transaction, id: transaction._id.toString() }
  }

  /**
   * Find transactions by buyer ID
   */
  static async findByBuyerId(buyerId) {
    const collection = getCollection('transactions')
    const transactions = await collection.find({ buyerId }).sort({ createdAt: -1 }).toArray()
    return transactions.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Find transactions by seller ID
   */
  static async findBySellerId(sellerId) {
    const collection = getCollection('transactions')
    const transactions = await collection.find({ sellerId }).sort({ createdAt: -1 }).toArray()
    return transactions.map(t => ({ ...t, id: t._id.toString() }))
  }

  /**
   * Update transaction status
   */
  static async updateStatus(id, status) {
    const collection = getCollection('transactions')
    let query
    try {
      query = { _id: new ObjectId(id) }
    } catch (error) {
      query = { id: id }
    }

    const update = { $set: { status } }
    if (status === 'COMPLETED') {
      update.$set.completedAt = new Date()
    }

    await collection.updateOne(query, update)
    return this.findById(id)
  }

  /**
   * Set blockchain data
   */
  static async setBlockchainData(id, signature, txHash, tokensMinted) {
    const collection = getCollection('transactions')
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
          solanaSignature: signature,
          blockchainTxHash: txHash,
          sccTokensMinted: tokensMinted,
          status: 'COMMITTED'
        }
      }
    )
    return this.findById(id)
  }

  /**
   * Get all transactions
   */
  static async getAll() {
    const collection = getCollection('transactions')
    const transactions = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return transactions.map(t => ({ ...t, id: t._id.toString() }))
  }
}
