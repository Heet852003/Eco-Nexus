/**
 * User Model - MongoDB Implementation
 */

import { getCollection } from '../database/mongodb.js'
import { ObjectId } from 'mongodb'

export class User {
  /**
   * Create a new user
   */
  static async create(data) {
    const collection = getCollection('users')
    const user = {
      email: data.email,
      name: data.name,
      passwordHash: data.password,
      roles: data.roles || { isBuyer: true, isSeller: false },
      sustainabilityScore: 50, // Initial sustainability score for all users
      carbonSavings: 0,
      totalTransactions: 0,
      sellerProducts: data.sellerProducts || [], // Products this seller can sell
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(user)
    return { ...user, id: result.insertedId.toString() }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const collection = getCollection('users')
    const user = await collection.findOne({ email })
    if (!user) return null
    return { ...user, id: user._id.toString() }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const collection = getCollection('users')
    let query
    try {
      // Try as ObjectId first
      query = { _id: new ObjectId(id) }
    } catch (error) {
      // If id is not a valid ObjectId, try as string id field or email
      if (id.includes('@')) {
        query = { email: id }
      } else {
        query = { id: id }
      }
    }
    
    const user = await collection.findOne(query)
    if (!user) return null
    return { ...user, id: user._id.toString() }
  }

  /**
   * Get all users
   */
  static async getAll() {
    const collection = getCollection('users')
    const users = await collection.find({}).toArray()
    return users.map(u => ({ ...u, id: u._id.toString() }))
  }

  // Reliability score removed - using only sustainability scores

  /**
   * Update user roles
   */
  static async updateRoles(userId, roles) {
    const collection = getCollection('users')
    let query
    try {
      query = { _id: new ObjectId(userId) }
    } catch (error) {
      query = { id: userId }
    }

    // Get current user to check existing roles
    const currentUser = await collection.findOne(query)
    if (!currentUser) {
      throw new Error('User not found')
    }

    const update = { 
      $set: { 
        updatedAt: new Date()
      } 
    }

    // Always update both roles to ensure consistency
    // If not provided, use current values
    const isBuyer = roles.isBuyer !== undefined ? roles.isBuyer : (currentUser.roles?.isBuyer ?? true)
    const isSeller = roles.isSeller !== undefined ? roles.isSeller : (currentUser.roles?.isSeller ?? false)

    // Set roles object
    update.$set['roles'] = {
      isBuyer: Boolean(isBuyer),
      isSeller: Boolean(isSeller)
    }

    // Initialize reliability score for sellers
    // Reliability score removed - using only sustainability scores

    const result = await collection.updateOne(query, update)
    
    if (result.matchedCount === 0) {
      throw new Error('User not found for update')
    }

    if (result.modifiedCount === 0) {
      console.warn('No changes made to user roles')
    }

    // Return updated user
    return this.findById(userId)
  }

  /**
   * Check if user can buy
   */
  static async canBuy(userId) {
    const user = await this.findById(userId)
    return user?.roles?.isBuyer === true
  }

  /**
   * Check if user can sell
   */
  static async canSell(userId) {
    const user = await this.findById(userId)
    return user?.roles?.isSeller === true
  }

  /**
   * Update user stats
   */
  static async updateStats(userId, stats) {
    const collection = getCollection('users')
    let query
    try {
      query = { _id: new ObjectId(userId) }
    } catch (error) {
      query = { id: userId }
    }

    const update = { $set: { updatedAt: new Date() } }
    if (stats.carbonSavings !== undefined) {
      update.$inc = { carbonSavings: stats.carbonSavings }
    }
    if (stats.totalTransactions !== undefined) {
      if (!update.$inc) update.$inc = {}
      update.$inc.totalTransactions = stats.totalTransactions
    }

    await collection.updateOne(query, update)
    return this.findById(userId)
  }

  /**
   * Update carbon savings
   */
  static async updateCarbonSavings(userId, carbonSavings) {
    const collection = getCollection('users')
    let query
    try {
      query = { _id: new ObjectId(userId) }
    } catch (error) {
      query = { id: userId }
    }

    await collection.updateOne(
      query,
      { 
        $set: { 
          carbonSavings,
          updatedAt: new Date()
        } 
      }
    )
    return this.findById(userId)
  }

  /**
   * Update total transactions count
   */
  static async updateTotalTransactions(userId, totalTransactions) {
    const collection = getCollection('users')
    let query
    try {
      query = { _id: new ObjectId(userId) }
    } catch (error) {
      query = { id: userId }
    }

    await collection.updateOne(
      query,
      { 
        $set: { 
          totalTransactions,
          updatedAt: new Date()
        } 
      }
    )
    return this.findById(userId)
  }

  /**
   * Update sustainability score
   */
  static async updateSustainabilityScore(userId, sustainabilityScore) {
    const collection = getCollection('users')
    let query
    try {
      query = { _id: new ObjectId(userId) }
    } catch (error) {
      query = { id: userId }
    }

    const clampedScore = Math.max(0, Math.min(100, sustainabilityScore))
    console.log(`💾 Updating sustainability score in MongoDB:`)
    console.log(`   User ID: ${userId}`)
    console.log(`   New Score: ${clampedScore}`)

    const result = await collection.updateOne(
      query,
      { 
        $set: { 
          sustainabilityScore: clampedScore,
          updatedAt: new Date()
        } 
      }
    )

    console.log(`💾 MongoDB update result:`, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    })

    if (result.matchedCount === 0) {
      console.error(`❌ User not found for sustainability score update: ${userId}`)
      throw new Error('User not found')
    }

    const updatedUser = await this.findById(userId)
    console.log(`✅ Verified updated score: ${updatedUser?.sustainabilityScore}`)
    return updatedUser
  }

  /**
   * Get past sustainability scores for a seller (last 3 transactions)
   * Used for ML model prediction
   */
  static async getPastSustainabilityScores(userId) {
    const { Transaction } = await import('./Transaction.js')
    const sellerTransactions = await Transaction.findBySellerId(userId)
    const completedTransactions = sellerTransactions.filter(t => {
      const s = t.status?.toUpperCase()
      return s === 'COMPLETED' || s === 'COMMITTED'
    }).slice(0, 3) // Get last 3
    
    // If we have transactions with sustainability scores, use them
    // Otherwise return current sustainability score repeated
    const user = await this.findById(userId)
    const currentScore = user?.sustainabilityScore || 50
    
    if (completedTransactions.length === 0) {
      return [currentScore, currentScore, currentScore] // Return current score 3 times
    }
    
    // For now, return current score (can be enhanced to store historical scores)
    return [currentScore, currentScore, currentScore]
  }
}
