/**
 * AI Controller
 */

import { recommendPrice as aiRecommendPrice, rankSellers as aiRankSellers, getNegotiationHints as aiGetNegotiationHints } from '../services/aiService.js'
import { BuyerRequest } from '../models/BuyerRequest.js'
import { SellerQuote } from '../models/SellerQuote.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { Transaction } from '../models/Transaction.js'

// Products list
const PRODUCTS = [
  { id: 'prod-1', name: 'Renewable Energy Credits (REC)', category: 'Energy', basePrice: 50, avgCarbonScore: 8.5 },
  { id: 'prod-2', name: 'Carbon Offset Credits', category: 'Offset', basePrice: 25, avgCarbonScore: 7.0 },
  { id: 'prod-3', name: 'Forest Conservation Credits', category: 'Nature', basePrice: 75, avgCarbonScore: 9.0 },
  { id: 'prod-4', name: 'Ocean Carbon Credits', category: 'Nature', basePrice: 60, avgCarbonScore: 8.0 },
  { id: 'prod-5', name: 'Industrial Carbon Capture', category: 'Technology', basePrice: 100, avgCarbonScore: 7.5 },
  { id: 'prod-6', name: 'Agricultural Carbon Credits', category: 'Agriculture', basePrice: 40, avgCarbonScore: 6.5 },
  { id: 'prod-7', name: 'Waste-to-Energy Credits', category: 'Waste', basePrice: 35, avgCarbonScore: 6.0 },
  { id: 'prod-8', name: 'Transportation Efficiency Credits', category: 'Transport', basePrice: 45, avgCarbonScore: 7.5 },
  { id: 'prod-9', name: 'Building Efficiency Credits', category: 'Construction', basePrice: 55, avgCarbonScore: 8.0 },
  { id: 'prod-10', name: 'Water Conservation Credits', category: 'Water', basePrice: 30, avgCarbonScore: 7.0 },
]

export async function recommendPrice(req, res) {
  try {
    const { productId, quantity, desiredCarbonScore } = req.body

    if (!productId || !quantity || !desiredCarbonScore) {
      return res.status(400).json({ error: 'Product ID, quantity, and desired carbon score are required' })
    }

    const product = PRODUCTS.find(p => p.id === productId)
    if (!product) {
      return res.status(400).json({ error: 'Invalid product ID' })
    }

    const recommendation = await aiRecommendPrice(product, quantity, desiredCarbonScore)
    res.json(recommendation)
  } catch (error) {
    console.error('Price recommendation error:', error)
    res.status(500).json({ error: 'Failed to get price recommendation' })
  }
}

export async function rankSellers(req, res) {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' })
    }

    const request = BuyerRequest.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const quotes = SellerQuote.findByRequestId(requestId)
    if (quotes.length === 0) {
      return res.json({ rankings: [] })
    }

    const rankings = await aiRankSellers(request, quotes)
    res.json({ rankings })
  } catch (error) {
    console.error('Seller ranking error:', error)
    res.status(500).json({ error: 'Failed to rank sellers' })
  }
}

export async function getNegotiationHints(req, res) {
  try {
    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' })
    }

    const transaction = Transaction.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const chatHistory = ChatMessage.findByTransactionId(transactionId)
    const hints = await aiGetNegotiationHints(
      transactionId,
      transaction.buyerId,
      transaction.sellerId,
      chatHistory
    )

    res.json(hints)
  } catch (error) {
    console.error('Negotiation hints error:', error)
    res.status(500).json({ error: 'Failed to get negotiation hints' })
  }
}

