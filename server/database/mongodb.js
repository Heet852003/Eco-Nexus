/**
 * MongoDB Connection Service
 * Handles connection to MongoDB using MongoDB native driver
 */

import { MongoClient } from 'mongodb'

let client = null
let db = null

// Helper to extract database name from URI
function extractDbNameFromUri(uri) {
  try {
    // Match pattern: mongodb://.../DATABASE_NAME? or mongodb://.../DATABASE_NAME
    const match = uri.match(/mongodb(\+srv)?:\/\/[^\/]+\/([^?\/]+)/)
    if (match && match[2]) {
      return match[2]
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Helper to get MongoDB URI from environment variables
function getMongoUri() {
  // Support multiple environment variable names (MONGO_URL, MONGODB_URI, MONGODB_URL)
  // Trim whitespace and remove trailing semicolons
  const rawUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017'
  let MONGODB_URI = rawUri.trim().replace(/[;\s]+$/, '') // Remove trailing semicolons and whitespace
  
  // Support MONGO_DB_PASSWORD, MONG_DB_PASSWORD, or MONGODB_PASSWORD
  const MONGODB_PASSWORD = process.env.MONGO_DB_PASSWORD || process.env.MONG_DB_PASSWORD || process.env.MONGODB_PASSWORD

  // If URI already has credentials (contains @), use it as-is
  if (MONGODB_URI.includes('@')) {
    // URI already has credentials, use it directly
    return MONGODB_URI
  } else if (MONGODB_PASSWORD && !MONGODB_URI.includes('@')) {
    // If URI doesn't have credentials but password is provided, construct it
    const username = process.env.MONGODB_USER || process.env.MONGODB_USERNAME || 'admin'
    const host = process.env.MONGODB_HOST || extractHostFromUri(MONGODB_URI) || 'localhost:27017'
    const dbName = process.env.MONGODB_DB_NAME || 'carbon_marketplace'
    
    if (MONGODB_URI.includes('mongodb+srv://')) {
      // MongoDB Atlas - extract cluster from URI if present
      const clusterMatch = MONGODB_URI.match(/mongodb\+srv:\/\/([^\/]+)/)
      const cluster = clusterMatch ? clusterMatch[1] : host
      return `mongodb+srv://${username}:${encodeURIComponent(MONGODB_PASSWORD)}@${cluster}/${dbName}?retryWrites=true&w=majority`
    } else {
      // Local MongoDB
      return `mongodb://${username}:${encodeURIComponent(MONGODB_PASSWORD)}@${host}/${dbName}?authSource=admin`
    }
  }
  
  return MONGODB_URI
}

function getDbName() {
  // First, try to extract from URI if it's set
  const rawUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGODB_URL
  if (rawUri) {
    const dbNameFromUri = extractDbNameFromUri(rawUri.trim().replace(/[;\s]+$/, ''))
    if (dbNameFromUri) {
      return dbNameFromUri
    }
  }
  
  // Fall back to environment variable or default
  return process.env.MONGODB_DB_NAME || 'carbon_marketplace'
}

// Helper to extract host from URI
function extractHostFromUri(uri) {
  try {
    const match = uri.match(/mongodb:\/\/([^\/]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function connectMongoDB() {
  try {
    if (client && db) {
      return { client, db }
    }

    const finalMongoUri = getMongoUri()
    const dbName = getDbName()

    if (!finalMongoUri) {
      throw new Error('MONGODB_URI or MONGODB_URL environment variable is not set')
    }

    // Log connection details (mask password)
    const maskedUri = finalMongoUri.replace(/:([^:@]+)@/, ':***@')
    console.log(`🔌 Connecting to MongoDB: ${maskedUri}`)

    // Only enable TLS for MongoDB Atlas (mongodb+srv://), not for local MongoDB
    const isAtlas = finalMongoUri.includes('mongodb+srv://')
    
    client = new MongoClient(finalMongoUri, {
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // SSL/TLS options - only for MongoDB Atlas
      ...(isAtlas && {
        tls: true,
        tlsAllowInvalidCertificates: false,
      }),
    })

    await client.connect()
    console.log('✅ Connected to MongoDB')

    db = client.db(dbName)
    
    // Create indexes
    await createIndexes()

    return { client, db }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

export async function disconnectMongoDB() {
  try {
    if (client) {
      await client.close()
      client = null
      db = null
      console.log('✅ Disconnected from MongoDB')
    }
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error)
    throw error
  }
}

export function getDB() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first')
  }
  return db
}

export function getCollection(collectionName) {
  const database = getDB()
  return database.collection(collectionName)
}

/**
 * Create indexes for performance
 */
async function createIndexes() {
  try {
    const database = getDB()

    // Users indexes
    await database.collection('users').createIndex({ email: 1 }, { unique: true })
    await database.collection('users').createIndex({ 'roles.isBuyer': 1 })
    await database.collection('users').createIndex({ 'roles.isSeller': 1 })

    // Buyer Requests indexes
    await database.collection('buyerRequests').createIndex({ buyerId: 1 })
    await database.collection('buyerRequests').createIndex({ status: 1 })
    await database.collection('buyerRequests').createIndex({ createdAt: -1 })
    await database.collection('buyerRequests').createIndex({ buyerId: 1, status: 1 })

    // Seller Quotes indexes
    await database.collection('sellerQuotes').createIndex({ requestId: 1 })
    await database.collection('sellerQuotes').createIndex({ sellerId: 1 })
    await database.collection('sellerQuotes').createIndex({ status: 1 })
    await database.collection('sellerQuotes').createIndex({ requestId: 1, sellerId: 1 }, { unique: true })

    // Negotiation Threads indexes
    await database.collection('negotiationThreads').createIndex({ requestId: 1 })
    await database.collection('negotiationThreads').createIndex({ quoteId: 1 })
    await database.collection('negotiationThreads').createIndex({ buyerId: 1 })
    await database.collection('negotiationThreads').createIndex({ sellerId: 1 })
    await database.collection('negotiationThreads').createIndex({ status: 1 })

    // Chat Messages indexes
    await database.collection('chatMessages').createIndex({ threadId: 1, timestamp: 1 })
    await database.collection('chatMessages').createIndex({ threadId: 1 })

    // Transactions indexes
    await database.collection('transactions').createIndex({ buyerId: 1 })
    await database.collection('transactions').createIndex({ sellerId: 1 })
    await database.collection('transactions').createIndex({ status: 1 })
    await database.collection('transactions').createIndex({ createdAt: -1 })

    console.log('✅ MongoDB indexes created')
  } catch (error) {
    console.error('❌ Error creating MongoDB indexes:', error)
    // Don't throw - indexes might already exist
  }
}

