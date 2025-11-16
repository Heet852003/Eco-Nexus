/**
 * Buyer Controller
 */

import { BuyerRequest } from '../models/BuyerRequest.js'
import { SellerQuote } from '../models/SellerQuote.js'
import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import { requireBuyer } from '../middleware/auth.js'
import { recommendPrice as aiRecommendPrice, rankSellers as aiRankSellers } from '../services/aiService.js'
// Products list (10 products matching ML model training data)
const PRODUCTS = [
  { id: 'prod-1', name: 'Ballpoint Pen', category: 'Office Supplies', basePrice: 2, avgCarbonScore: 6.5 },
  { id: 'prod-2', name: 'Binder Clips', category: 'Office Supplies', basePrice: 5, avgCarbonScore: 7.0 },
  { id: 'prod-3', name: 'Keyboard', category: 'Electronics', basePrice: 50, avgCarbonScore: 5.5 },
  { id: 'prod-4', name: 'Webcam', category: 'Electronics', basePrice: 40, avgCarbonScore: 5.0 },
  { id: 'prod-5', name: 'Coffee Mug', category: 'Kitchenware', basePrice: 8, avgCarbonScore: 7.5 },
  { id: 'prod-6', name: 'Cutlery Set', category: 'Kitchenware', basePrice: 25, avgCarbonScore: 6.0 },
  { id: 'prod-7', name: 'Cardboard', category: 'Packaging', basePrice: 3, avgCarbonScore: 8.0 },
  { id: 'prod-8', name: 'Paper', category: 'Office Supplies', basePrice: 4, avgCarbonScore: 6.5 },
  { id: 'prod-9', name: 'Stapler', category: 'Office Supplies', basePrice: 12, avgCarbonScore: 6.0 },
  { id: 'prod-10', name: 'Paper Shredder', category: 'Office Equipment', basePrice: 80, avgCarbonScore: 4.5 },
]

export async function createRequest(req, res) {
  try {
    const { productId, quantity, maxPrice, notes } = req.body
    const buyerId = req.user.id

    // Enforce buyer role
    if (!req.user.roles?.isBuyer) {
      return res.status(403).json({ error: 'Buyer role required to create requests' })
    }

    if (!productId || !quantity || !maxPrice) {
      return res.status(400).json({ error: 'Product ID, quantity, and price are required' })
    }

    // Find product
    const product = PRODUCTS.find(p => p.id === productId)
    if (!product) {
      return res.status(400).json({ error: 'Invalid product ID' })
    }

    // Create request
    const request = await BuyerRequest.create({
      buyerId,
      productId,
      productName: product.name,
      quantity,
      maxPrice,
      notes: notes || ''
    })

    // Get AI recommendation and set suggested price
    // IMPORTANT: This uses real-world product price ranges, NOT the user's maxPrice input
    // ALWAYS generate AI recommendation - it's required for fair price display
    let aiRecommendation = null
    try {
      // Use default carbon score of 7.0 for AI recommendation (not stored)
      aiRecommendation = await aiRecommendPrice(product, quantity, 7.0)
      
      // Ensure fairPrice and suggestedPrice are the same
      const fairPrice = aiRecommendation.fairPrice || aiRecommendation.suggestedPrice
      if (fairPrice) {
        aiRecommendation.fairPrice = fairPrice
        aiRecommendation.suggestedPrice = fairPrice
      }
      
      // Store in database
      await BuyerRequest.setAIRecommendation(request.id, aiRecommendation)
      
      // Update request object for response
      request.aiRecommendation = aiRecommendation
      request.aiSuggestedPrice = fairPrice
      
      console.log(`✅ AI recommendation generated for request ${request.id}: Fair Price = $${fairPrice?.toFixed(2)}`)
    } catch (error) {
      console.error('❌ AI recommendation failed:', error)
      // Even if AI fails, try to calculate fair price from product ranges
      try {
        const { calculateFairMarketPrice } = await import('../constants/productPrices.js')
        const fallbackFairPrice = calculateFairMarketPrice(product.name, quantity)
        if (fallbackFairPrice) {
          aiRecommendation = {
            fairPrice: fallbackFairPrice,
            suggestedPrice: fallbackFairPrice,
            recommendedCarbonRange: { min: 6, max: 8 },
            marketJustification: `Based on real-world market data for ${product.name}`,
            sustainabilityReasoning: 'Standard sustainability metrics applied',
            confidence: 75
          }
          await BuyerRequest.setAIRecommendation(request.id, aiRecommendation)
          request.aiRecommendation = aiRecommendation
          request.aiSuggestedPrice = fallbackFairPrice
          console.log(`⚠️ Using fallback fair price: $${fallbackFairPrice.toFixed(2)}`)
        }
      } catch (fallbackError) {
        console.error('❌ Fallback fair price calculation also failed:', fallbackError)
      }
    }

    res.status(201).json(request)
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ error: 'Failed to create request' })
  }
}

export async function getBuyerTransactions(req, res) {
  try {
    const buyerId = req.user.id
    const { Transaction } = await import('../models/Transaction.js')
    const allTransactions = await Transaction.findByBuyerId(buyerId)
    
    // Only return completed/committed transactions
    const completedTransactions = allTransactions.filter(t => {
      const status = t.status?.toUpperCase()
      return status === 'COMPLETED' || status === 'COMMITTED'
    })
    
    res.json(completedTransactions)
  } catch (error) {
    console.error('Get buyer transactions error:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}

export async function getRequests(req, res) {
  try {
    const buyerId = req.user.id
    const requests = await BuyerRequest.findByBuyerId(buyerId)
    
    // Filter out requests that have completed transactions
    const { Transaction } = await import('../models/Transaction.js')
    const allTransactions = await Transaction.findByBuyerId(buyerId)
    const completedRequestIds = new Set(
      allTransactions
        .filter(t => {
          const status = t.status?.toUpperCase()
          return status === 'COMPLETED' || status === 'COMMITTED'
        })
        .map(t => t.requestId)
    )
    
    const activeRequests = requests.filter(req => !completedRequestIds.has(req.id))
    
    // Enrich each request with quote count and latest quote info
    const enrichedRequests = await Promise.all(activeRequests.map(async (request) => {
      const quotes = await SellerQuote.findByRequestId(request.id)
      return {
        ...request,
        quoteCount: quotes.length,
        quotes: quotes.map(quote => ({
          ...quote,
          price: quote.sellerPrice,
          status: quote.status?.toLowerCase() || 'pending'
        }))
      }
    }))
    
    res.json(enrichedRequests)
  } catch (error) {
    console.error('Get requests error:', error)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
}

export async function getRequest(req, res) {
  try {
    const { id } = req.params
    const request = await BuyerRequest.findById(id)

    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check ownership
    if (request.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get quotes for this request
    const quotes = await SellerQuote.findByRequestId(id)
    // Map backend fields to frontend expected fields
    request.quotes = quotes.map(quote => ({
      ...quote,
      price: quote.sellerPrice, // Map sellerPrice to price for frontend
      status: quote.status?.toLowerCase() || 'pending'
    }))

    // Get transaction for this request if it exists
    const { Transaction } = await import('../models/Transaction.js')
    const transactions = await Transaction.findByBuyerId(req.user.id)
    const requestTransaction = transactions.find(t => t.requestId === id)
    if (requestTransaction) {
      request.transaction = {
        id: requestTransaction.id,
        status: requestTransaction.status,
        blockchainSignature: requestTransaction.solanaSignature || requestTransaction.blockchainSignature
      }
    }

    // Get AI ranking if quotes exist
    if (quotes.length > 0) {
      try {
        const rankings = await aiRankSellers(request, quotes)
        request.sellerRankings = rankings
      } catch (error) {
        console.error('AI ranking failed:', error)
      }
    }

    res.json(request)
  } catch (error) {
    console.error('Get request error:', error)
    res.status(500).json({ error: 'Failed to fetch request' })
  }
}

export async function acceptQuote(req, res) {
  try {
    const { requestId, quoteId } = req.body
    const buyerId = req.user.id

    // Enforce buyer role
    if (!req.user.roles?.isBuyer) {
      return res.status(403).json({ error: 'Buyer role required' })
    }

    const request = await BuyerRequest.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Only original buyer can accept
    if (request.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Only the original buyer can accept quotes' })
    }

    const quote = await SellerQuote.findById(quoteId)
    if (!quote || quote.requestId !== requestId) {
      return res.status(404).json({ error: 'Quote not found' })
    }

    // CRITICAL: Prevent self-dealing - buyer cannot accept their own quote
    if (request.buyerId === quote.sellerId) {
      return res.status(400).json({ error: 'Cannot accept your own quote. Buyer and seller must be different users.' })
    }

    // Check if already completed
    if (request.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Request already completed' })
    }

    if (quote.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Quote already accepted' })
    }

    // Get buyer and seller for sustainability score calculation
    const buyer = await User.findById(buyerId)
    const seller = await User.findById(quote.sellerId)
    
    // Calculate sustainability score as average of (seller + buyer) when accepting quote
    // Since buyer and seller are the same account, update the same sustainability score
    if (buyer && seller) {
      const buyerCurrentScore = buyer.sustainabilityScore || 50
      const sellerCurrentScore = seller.sustainabilityScore || 50
      const newScore = Math.round((buyerCurrentScore + sellerCurrentScore) / 2)
      
      console.log(`📊 Accepting quote - sustainability score update:`)
      console.log(`   Buyer current: ${buyerCurrentScore}, Seller current: ${sellerCurrentScore}`)
      console.log(`   New score (avg): ${newScore}`)
      
      // Update sustainability score (same for buyer and seller since it's one account)
      await User.updateSustainabilityScore(buyerId, newScore)
      if (buyerId !== quote.sellerId) {
        await User.updateSustainabilityScore(quote.sellerId, newScore)
      }
      console.log(`✅ Updated sustainability score to ${newScore}`)
    }

    // Create transaction
    const transaction = await Transaction.create({
      requestId,
      quoteId,
      buyerId,
      sellerId: quote.sellerId,
      productId: request.productId,
      productName: request.productName,
      quantity: request.quantity,
      price: quote.sellerPrice
    })

    // Update statuses
    await BuyerRequest.updateStatus(requestId, 'COMPLETED')
    await SellerQuote.updateStatus(quoteId, 'ACCEPTED')
    
    // Reject other quotes for this request
    const otherQuotes = await SellerQuote.findByRequestId(requestId)
    for (const q of otherQuotes) {
      if (q.id !== quoteId) {
        await SellerQuote.updateStatus(q.id, 'REJECTED')
      }
    }

    // Transaction created - user will manually commit to blockchain from transaction page
    // Analytics will be calculated after blockchain commit

    res.status(201).json(transaction)
  } catch (error) {
    console.error('Accept quote error:', error)
    res.status(500).json({ error: 'Failed to accept quote' })
  }
}

/**
 * Update request
 */
export async function updateRequest(req, res) {
  try {
    const { id } = req.params
    const { quantity, maxPrice, notes } = req.body
    const buyerId = req.user.id

    // Enforce buyer role
    if (!req.user.roles?.isBuyer) {
      return res.status(403).json({ error: 'Buyer role required' })
    }

    const request = await BuyerRequest.findById(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Only request owner can update
    if (request.buyerId !== buyerId) {
      return res.status(403).json({ error: 'You can only update your own requests' })
    }

    // Cannot update if already completed
    if (request.status === 'COMPLETED' || request.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update a completed request' })
    }

    // Check if transaction exists for this request
    const { Transaction } = await import('../models/Transaction.js')
    const transactions = await Transaction.findByBuyerId(buyerId)
    const requestTransaction = transactions.find(t => t.requestId === id)
    if (requestTransaction) {
      return res.status(400).json({ error: 'Cannot update request after transaction is created' })
    }

    const updates = {}
    if (quantity !== undefined) updates.quantity = quantity
    if (maxPrice !== undefined) updates.maxPrice = maxPrice
    if (notes !== undefined) updates.notes = notes

    const updatedRequest = await BuyerRequest.update(id, updates)

    console.log('✅ Request updated successfully:', id)
    res.json(updatedRequest)
  } catch (error) {
    console.error('Update request error:', error)
    res.status(500).json({ error: 'Failed to update request' })
  }
}

