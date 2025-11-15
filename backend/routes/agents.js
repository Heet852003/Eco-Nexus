import express from 'express'
import { negotiateWithAgents, getAgentInfo } from '../agents/negotiation.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * POST /api/agents/negotiate
 * Triggers multi-agent negotiation between Buyer Agent and Seller Agents
 * Uses Aristotle AI Agent Framework for structured reasoning
 * 
 * Request body (optional):
 * {
 *   "goals": {
 *     "minimize_cost": 0.3,
 *     "minimize_carbon": 0.3,
 *     "minimize_delivery": 0.2,
 *     "maximize_sustainability": 0.2,
 *     "prefer_local": false
 *   }
 * }
 * 
 * Response: Structured JSON with winner, reasoning, comparison, and negotiation details
 */
router.post('/negotiate', async (req, res) => {
  try {
    // Load vendors (Seller Agents)
    const vendorsPath = join(__dirname, '../data/vendors.json')
    const vendorsData = JSON.parse(readFileSync(vendorsPath, 'utf8'))
    const vendors = vendorsData.vendors

    // Buyer Agent goals (can be customized via request body)
    const buyerGoals = req.body.goals || {
      minimize_cost: 0.3,
      minimize_carbon: 0.3,
      minimize_delivery: 0.2,
      maximize_sustainability: 0.2,
      prefer_local: false
    }

    // Run negotiation using Aristotle AI Agent Framework
    const result = await negotiateWithAgents(vendors, buyerGoals)

    // Return structured JSON response
    res.json(result)
  } catch (error) {
    console.error('Negotiation error:', error)
    res.status(500).json({ 
      error: 'Negotiation failed',
      message: error.message 
    })
  }
})

/**
 * GET /api/agents/info
 * Get information about Buyer and Seller Agents
 * Useful for debugging and understanding agent configuration
 */
router.get('/info', (req, res) => {
  try {
    const vendorsPath = join(__dirname, '../data/vendors.json')
    const vendorsData = JSON.parse(readFileSync(vendorsPath, 'utf8'))
    const vendors = vendorsData.vendors

    const buyerGoals = {
      minimize_cost: 0.3,
      minimize_carbon: 0.3,
      minimize_delivery: 0.2,
      maximize_sustainability: 0.2,
      prefer_local: false
    }

    const agentInfo = getAgentInfo(vendors, buyerGoals)

    res.json({
      framework: 'Aristotle AI Agent Framework',
      agents: agentInfo,
      description: 'Multi-agent negotiation system using Aristotelian reasoning principles'
    })
  } catch (error) {
    console.error('Agent info error:', error)
    res.status(500).json({ 
      error: 'Failed to get agent info',
      message: error.message 
    })
  }
})

export default router

