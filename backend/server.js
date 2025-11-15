import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import vendorsRouter from './routes/vendors.js'
import agentsRouter from './routes/agents.js'
import solanaRouter from './routes/solana.js'
import analyticsRouter from './routes/analytics.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Eco-Nexus SCOS API is running' })
})

// API Routes
app.use('/api/vendors', vendorsRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/solana', solanaRouter)
app.use('/api/analytics', analyticsRouter)

// Recommendation endpoint (alias for latest negotiation result)
app.get('/api/recommendation', async (req, res) => {
  try {
    // In a real app, this would fetch from a database
    // For now, return a mock recommendation
    res.json({
      winner: {
        id: 'vendor-1',
        name: 'GreenTech Solutions',
        price: 10.5,
        carbon: 18,
        delivery: 2,
        sustainability_score: 9
      },
      carbon_saved: 5.2,
      cost_saved: 2.5,
      scc_tokens: 15.5,
      reasoning: 'GreenTech Solutions offers the best balance of cost, carbon footprint, and sustainability score.',
      comparison: []
    })
  } catch (error) {
    console.error('Error fetching recommendation:', error)
    res.status(500).json({ error: 'Failed to fetch recommendation' })
  }
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
app.listen(PORT, () => {
  console.log(`🚀 Eco-Nexus SCOS Backend running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app

