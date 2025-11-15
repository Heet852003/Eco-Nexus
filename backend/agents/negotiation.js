import { BuyerAgent } from './BuyerAgent.js'
import { SellerAgent } from './SellerAgent.js'

/**
 * Main negotiation function using Aristotle AI Agent Framework
 * Orchestrates Buyer Agent vs Seller Agents negotiation
 * 
 * @param {Array} vendors - Array of vendor objects (will be converted to Seller Agents)
 * @param {Object} buyerGoals - Buyer Agent preferences and weights
 * @returns {Promise<Object>} Negotiation result with winner, savings, tokens, and reasoning
 */
export async function negotiateWithAgents(vendors, buyerGoals) {
  try {
    // Step 1: Create Buyer Agent with goals
    const buyerAgent = new BuyerAgent(buyerGoals)
    
    // Step 2: Create Seller Agents from vendor data
    const sellerAgents = vendors.map(vendor => new SellerAgent(vendor))
    
    // Step 3: Buyer Agent evaluates all Seller Agents using Aristotle framework
    const recommendation = await buyerAgent.evaluateVendors(sellerAgents)
    
    // Step 4: Return structured JSON response
    return recommendation
  } catch (error) {
    console.error('Negotiation error:', error)
    throw new Error(`Negotiation failed: ${error.message}`)
  }
}

/**
 * Get agent information (for debugging/monitoring)
 */
export function getAgentInfo(vendors, buyerGoals) {
  const buyerAgent = new BuyerAgent(buyerGoals)
  const sellerAgents = vendors.map(vendor => new SellerAgent(vendor))
  
  return {
    buyer: buyerAgent.getInfo(),
    sellers: sellerAgents.map(agent => agent.getInfo())
  }
}

