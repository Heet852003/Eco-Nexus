/**
 * Test MongoDB Connection
 * Run: node scripts/test-mongodb.js
 */

import dotenv from 'dotenv'
import { connectMongoDB, disconnectMongoDB, getCollection } from '../database/mongodb.js'

dotenv.config()

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...')
    console.log('MONGO_URL:', process.env.MONGO_URL || 'Not set')
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'Not set')
    console.log('MONGODB_URL:', process.env.MONGODB_URL || 'Not set')
    console.log('MONGO_DB_PASSWORD:', process.env.MONGO_DB_PASSWORD ? '***set***' : 'Not set')
    console.log('MONG_DB_PASSWORD:', process.env.MONG_DB_PASSWORD ? '***set***' : 'Not set')
    console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD ? '***set***' : 'Not set')
    console.log('MONGODB_USER:', process.env.MONGODB_USER || process.env.MONGODB_USERNAME || 'Not set (will use default)')
    console.log('MONGODB_HOST:', process.env.MONGODB_HOST || 'Not set (will use default)')
    console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || 'carbon_marketplace (default)')
    console.log('')

    // Connect
    await connectMongoDB()
    console.log('✅ Connection successful!')

    // Test database operations
    const usersCollection = getCollection('users')
    const count = await usersCollection.countDocuments()
    console.log(`📊 Users in database: ${count}`)

    const requestsCollection = getCollection('buyerRequests')
    const requestCount = await requestsCollection.countDocuments()
    console.log(`📊 Buyer requests in database: ${requestCount}`)

    const transactionsCollection = getCollection('transactions')
    const transactionCount = await transactionsCollection.countDocuments()
    console.log(`📊 Transactions in database: ${transactionCount}`)

    console.log('')
    console.log('✅ All tests passed! MongoDB is ready.')
    
    await disconnectMongoDB()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Check MONGODB_URI or MONGODB_URL in .env')
    console.error('2. Check MONGODB_PASSWORD if using separate credentials')
    console.error('3. Verify MongoDB is running')
    console.error('4. Check network/firewall settings')
    process.exit(1)
  }
}

testConnection()

