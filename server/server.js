/**
 * Carbon Marketplace Server
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb.js'

// Routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import buyerRoutes from './routes/buyer.js'
import sellerRoutes from './routes/seller.js'
import negotiationRoutes from './routes/negotiation.js'
import aiRoutes from './routes/ai.js'
import blockchainRoutes from './routes/blockchain.js'
import analyticsRoutes from './routes/analytics.js'
import transactionRoutes from './routes/transaction.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3001

// Middleware
// CORS configuration - allow multiple origins for production
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow if origin is in whitelist
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true)
    } else {
      // In production, be strict; in development, allow localhost
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'))
      } else {
        callback(null, true)
      }
    }
  },
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Carbon Marketplace API is running' })
})

// MongoDB connection status check
app.get('/health/db', async (req, res) => {
  try {
    const { getDB } = await import('./database/mongodb.js')
    const db = getDB()
    await db.admin().ping()
    res.json({ 
      status: 'connected', 
      message: 'MongoDB is connected',
      database: db.databaseName
    })
  } catch (error) {
    res.status(503).json({ 
      status: 'disconnected', 
      message: 'MongoDB is not connected',
      error: error.message 
    })
  }
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/buyer', buyerRoutes)
app.use('/api/seller', sellerRoutes)
app.use('/api/negotiation', negotiationRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/blockchain', blockchainRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/transaction', transactionRoutes)

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-transaction', (transactionId) => {
    socket.join(`transaction-${transactionId}`)
    console.log(`Client ${socket.id} joined transaction ${transactionId}`)
  })

  socket.on('send-message', (data) => {
    // Broadcast to all clients in the transaction room
    io.to(`transaction-${data.transactionId}`).emit('new-message', data)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Carbon Marketplace Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔌 Socket.io enabled for real-time chat`)
  
  // Connect to MongoDB
  try {
    await connectMongoDB()
    console.log(`💾 MongoDB connected`)
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message)
    console.error('⚠️  Server will continue but database operations will fail')
  }
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await disconnectMongoDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await disconnectMongoDB()
  process.exit(0)
})

export default app

