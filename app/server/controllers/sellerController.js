/**
 * Seller Controller
 */

import { BuyerRequest } from '../models/BuyerRequest.js'
import { SellerQuote } from '../models/SellerQuote.js'
import { User } from '../models/User.js'
import { requireSeller } from '../middleware/auth.js'
import { predictVendorSustainability } from '../services/mlService.js'
// Reliability score removed - using only sustainability scores

export async function getSellerTransactions(req, res) {
  try {
    const sellerId = req.user.id
    const { Transaction } = await import('../models/Transaction.js')
    const allTransactions = await Transaction.findBySellerId(sellerId)
    
    // Only return completed/committed transactions
    const completedTransactions = allTransactions.filter(t => {
      const status = t.status?.toUpperCase()
      return status === 'COMPLETED' || status === 'COMMITTED'
    })
    
    res.json(completedTransactions)
  } catch (error) {
    console.error('Get seller transactions error:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}

export async function getRequests(req, res) {
  try {
    const sellerId = req.user.id
    const { productId } = req.query // Optional product filter

    // Enforce seller role
    if (!req.user.roles?.isSeller) {
      return res.status(403).json({ error: 'Seller role required' })
    }

    // Get seller's product preferences
    const seller = await User.findById(sellerId)
    const sellerProducts = seller?.sellerProducts || []

    // Get eligible requests (excludes requests created by this seller)
    let eligibleRequests = await BuyerRequest.getEligibleForSeller(sellerId)
    
    // Filter by product if seller has product preferences
    if (sellerProducts.length > 0) {
      eligibleRequests = eligibleRequests.filter(req => 
        sellerProducts.includes(req.productId)
      )
    }

    // Apply product filter from query if provided
    if (productId) {
      eligibleRequests = eligibleRequests.filter(req => req.productId === productId)
    }
    
    // Filter out requests that already have quotes from this seller
    const availableRequests = []
    for (const request of eligibleRequests) {
      const existingQuotes = await SellerQuote.findByRequestId(request.id)
      if (!existingQuotes.some(q => q.sellerId === sellerId)) {
        availableRequests.push(request)
      }
    }

    res.json(availableRequests)
  } catch (error) {
    console.error('Get seller requests error:', error)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
}

export async function submitQuote(req, res) {
  try {
    const { requestId, sellerPrice, deliveryDays, localFlag } = req.body
    const sellerId = req.user.id

    // Enforce seller role
    if (!req.user.roles?.isSeller) {
      return res.status(403).json({ error: 'Seller role required' })
    }

    if (!requestId || !sellerPrice || !deliveryDays) {
      return res.status(400).json({ error: 'Request ID, price, and delivery days are required' })
    }

    const request = await BuyerRequest.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // CRITICAL: Prevent self-selling - seller cannot quote on their own request
    if (request.buyerId === sellerId) {
      return res.status(403).json({ error: 'You cannot quote on your own request' })
    }

    // Check if seller already quoted
    const existingQuotes = await SellerQuote.findByRequestId(requestId)
    if (existingQuotes.some(q => q.sellerId === sellerId)) {
      return res.status(400).json({ error: 'You have already submitted a quote for this request' })
    }

    // Get seller
    const seller = await User.findById(sellerId)

    // Update seller sustainability score using ML model when submitting quote
    // This gives immediate feedback on how the quote affects their sustainability score
    if (seller) {
      try {
        // Get past sustainability scores (last 3) for ML model
        const pastScores = await User.getPastSustainabilityScores(sellerId)
        const pastSustainabilityAvg = pastScores.reduce((sum, s) => sum + s, 0) / pastScores.length

        console.log(`📊 Updating seller sustainability score when submitting quote:`)
        console.log(`   Product: ${request.productName}`)
        console.log(`   Price: ${sellerPrice}`)
        console.log(`   Delivery Days: ${deliveryDays}`)
        console.log(`   Local Flag: ${localFlag !== undefined ? (localFlag ? 1 : 0) : 0}`)
        console.log(`   Past Sustainability Avg: ${pastSustainabilityAvg}`)

        // Predict new sustainability score using ML model
        const predictedScore = await predictVendorSustainability({
          productName: request.productName,
          vendorPriceToday: sellerPrice,
          vendorDeliveryDays: deliveryDays,
          localFlagNumeric: localFlag !== undefined ? (localFlag ? 1 : 0) : 0,
          pastSustainabilityAvg: pastSustainabilityAvg
        })

        console.log(`📊 Predicted sustainability score: ${predictedScore}`)
        
        // Update seller's sustainability score immediately
        const updatedUser = await User.updateSustainabilityScore(sellerId, predictedScore)
        if (updatedUser) {
          console.log(`✅ Updated seller sustainability score to ${predictedScore}`)
          console.log(`✅ Verified: User now has sustainability score: ${updatedUser.sustainabilityScore}`)
        } else {
          console.error(`❌ Failed to update sustainability score - no user returned`)
        }
      } catch (mlError) {
        console.error('❌ ML model prediction failed when submitting quote:', mlError)
        console.error('Error details:', mlError.message)
        // Continue without updating sustainability score - quote can still be submitted
      }
    }

    // Create quote (no carbon score, no reliability score - using only sustainability scores)
    const quote = await SellerQuote.create({
      requestId,
      sellerId,
      sellerName: seller?.name || 'Unknown Seller',
      sellerPrice,
      deliveryDays,
      localFlag: localFlag !== undefined ? (localFlag ? 1 : 0) : 0, // Convert boolean to 0/1
      aiSuggestedPrice: null, // Can be populated by AI service
      aiSuggestedScore: null
    })

    // Add quote to request
    await BuyerRequest.addQuote(requestId, quote)

    // Update request status to QUOTED if it was OPEN
    const currentRequest = await BuyerRequest.findById(requestId)
    if (currentRequest && currentRequest.status === 'OPEN') {
      await BuyerRequest.updateStatus(requestId, 'QUOTED')
    }

    console.log('✅ Quote submitted successfully:', quote.id)
    res.status(201).json({
      ...quote,
      price: quote.sellerPrice // Map for frontend
    })
  } catch (error) {
    console.error('Submit quote error:', error)
    res.status(500).json({ error: 'Failed to submit quote' })
  }
}

/**
 * Update quote
 */
export async function updateQuote(req, res) {
  try {
    const { quoteId } = req.params
    const { sellerPrice, deliveryDays } = req.body
    const sellerId = req.user.id

    // Enforce seller role
    if (!req.user.roles?.isSeller) {
      return res.status(403).json({ error: 'Seller role required' })
    }

    const quote = await SellerQuote.findById(quoteId)
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' })
    }

    // Only quote owner can update
    if (quote.sellerId !== sellerId) {
      return res.status(403).json({ error: 'You can only update your own quotes' })
    }

    // Cannot update if already accepted
    if (quote.status === 'ACCEPTED' || quote.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot update an accepted quote' })
    }

    // Check if transaction exists for this quote
    const { Transaction } = await import('../models/Transaction.js')
    const transactions = await Transaction.findBySellerId(sellerId)
    const quoteTransaction = transactions.find(t => t.quoteId === quoteId)
    if (quoteTransaction) {
      return res.status(400).json({ error: 'Cannot update quote after transaction is created' })
    }

    const updates = {}
    if (sellerPrice !== undefined) updates.sellerPrice = sellerPrice
    if (deliveryDays !== undefined) updates.deliveryDays = deliveryDays

    const updatedQuote = await SellerQuote.update(quoteId, updates)

    console.log('✅ Quote updated successfully:', quoteId)
    res.json({
      ...updatedQuote,
      price: updatedQuote.sellerPrice
    })
  } catch (error) {
    console.error('Update quote error:', error)
    res.status(500).json({ error: 'Failed to update quote' })
  }
}

