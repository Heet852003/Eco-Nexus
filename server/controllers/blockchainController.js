/**
 * Blockchain Controller
 */

import { Transaction } from '../models/Transaction.js'
import { commitTransaction } from '../services/solanaService.js'
import { storeTransaction, updateSellerRating, storeAnalyticsScore } from '../services/snowflakeService.js'
import { User } from '../models/User.js'
import { SellerQuote } from '../models/SellerQuote.js'
// Reliability score removed - using only sustainability scores
import { predictVendorSustainability, calculateBuyerSustainabilityChange } from '../services/mlService.js'

export async function commitTransactionToBlockchain(req, res) {
  try {
    const { transactionId, buyerWalletAddress } = req.body
    const userId = req.user.id

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' })
    }

    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Verify user is part of transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check status (case-insensitive)
    const status = transaction.status?.toUpperCase()
    if (status !== 'PENDING') {
      return res.status(400).json({ 
        error: `Transaction already processed. Current status: ${transaction.status}` 
      })
    }

    // Validate transaction has required fields
    if (!transaction.finalPrice && !transaction.price) {
      return res.status(400).json({ error: 'Transaction missing price information' })
    }

    // Prepare transaction data for blockchain
    const transactionData = {
      ...transaction,
      price: transaction.finalPrice || transaction.price,
      buyerWalletAddress: buyerWalletAddress || null
    }

    // Commit to blockchain (without SCC token minting)
    let blockchainResult
    try {
      blockchainResult = await commitTransaction(transactionData)
      console.log('✅ Blockchain commit successful:', blockchainResult.signature)
    } catch (blockchainError) {
      console.error('❌ Blockchain commit failed:', blockchainError)
      console.error('Error stack:', blockchainError.stack)
      return res.status(500).json({ 
        error: 'Failed to commit to blockchain',
        details: blockchainError.message || 'Unknown blockchain error',
        fullError: process.env.NODE_ENV === 'development' ? blockchainError.toString() : undefined
      })
    }

    // Update transaction with blockchain data (no SCC tokens)
    try {
      await Transaction.setBlockchainData(
        transactionId,
        blockchainResult.signature,
        blockchainResult.txHash,
        null // No SCC tokens minted
      )
      console.log('✅ Transaction updated with blockchain data')
    } catch (updateError) {
      console.error('❌ Failed to update transaction with blockchain data:', updateError)
      // Continue anyway - blockchain commit succeeded
    }

    // Get buyer and seller for analytics
    const buyer = await User.findById(transaction.buyerId)
    const seller = await User.findById(transaction.sellerId)

    // Get quote details for ML model prediction
    let quote = null
    if (transaction.quoteId) {
      quote = await SellerQuote.findById(transaction.quoteId)
    }

    // Update sustainability score using ML model when transaction is committed
    // Since buyer and seller are the same account, they share the same sustainability score
    if (buyer && seller && quote) {
      try {
        // Get past sustainability scores (last 3) for ML model
        const pastScores = await User.getPastSustainabilityScores(transaction.sellerId)
        const pastSustainabilityAvg = pastScores.reduce((sum, s) => sum + s, 0) / pastScores.length

        console.log(`📊 ML Model Input:`)
        console.log(`   Product: ${transaction.productName}`)
        console.log(`   Price: ${transaction.finalPrice || transaction.price}`)
        console.log(`   Delivery Days: ${quote.deliveryDays || 5}`)
        console.log(`   Local Flag: ${quote.localFlag || 0}`)
        console.log(`   Past Sustainability Avg: ${pastSustainabilityAvg}`)

        // Predict new sustainability score using ML model
        const predictedScore = await predictVendorSustainability({
          productName: transaction.productName,
          vendorPriceToday: transaction.finalPrice || transaction.price,
          vendorDeliveryDays: quote.deliveryDays || 5,
          localFlagNumeric: quote.localFlag || 0,
          pastSustainabilityAvg: pastSustainabilityAvg
        })

        console.log(`📊 Predicted sustainability score: ${predictedScore}`)
        
        // Update sustainability score (same for buyer and seller since it's one account)
        const updatedBuyer = await User.updateSustainabilityScore(transaction.buyerId, predictedScore)
        if (updatedBuyer) {
          console.log(`✅ Updated buyer sustainability score to ${predictedScore}`)
          console.log(`✅ Verified: Buyer now has sustainability score: ${updatedBuyer.sustainabilityScore}`)
        }
        
        if (transaction.buyerId !== transaction.sellerId) {
          const updatedSeller = await User.updateSustainabilityScore(transaction.sellerId, predictedScore)
          if (updatedSeller) {
            console.log(`✅ Updated seller sustainability score to ${predictedScore}`)
            console.log(`✅ Verified: Seller now has sustainability score: ${updatedSeller.sustainabilityScore}`)
          }
        }
        console.log(`✅ Updated sustainability score to ${predictedScore}`)
      } catch (mlError) {
        console.error('❌ ML model prediction failed:', mlError)
        console.error('Error details:', mlError.message)
        // Continue without updating sustainability score
      }
    } else {
      console.warn('⚠️ Missing buyer, seller, or quote for sustainability score update')
      if (!buyer) console.warn('   Buyer not found')
      if (!seller) console.warn('   Seller not found')
      if (!quote) console.warn('   Quote not found')
    }

    // Update transaction count (no reliability or carbon tracking)
    if (buyer) {
      const buyerTransactions = await Transaction.findByBuyerId(transaction.buyerId)
      const completedBuyerTransactions = buyerTransactions.filter(t => {
        const s = t.status?.toUpperCase()
        return s === 'COMPLETED' || s === 'COMMITTED'
      })
      
      await User.updateTotalTransactions(transaction.buyerId, completedBuyerTransactions.length)
    }

    // Store in Snowflake AFTER blockchain commit
    try {
      await storeTransaction({
        transactionId: transaction.id,
        requestId: transaction.requestId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        productId: transaction.productId,
        productName: transaction.productName,
        quantity: transaction.quantity,
        price: transaction.finalPrice || transaction.price,
        blockchainSignature: blockchainResult.signature,
        blockchainTxHash: blockchainResult.txHash,
        sccTokensMinted: null, // No longer using SCC tokens
        status: 'committed',
        completedAt: new Date().toISOString()
      })

      console.log('✅ Transaction synced to Snowflake for analytics')
    } catch (error) {
      console.error('Snowflake storage failed:', error)
      // Continue even if Snowflake fails
    }

    // Update transaction status to COMPLETED (after blockchain commit and analytics)
    // Note: Status was already set to COMMITTED by setBlockchainData
    // We set it to COMPLETED to mark it as fully processed
    await Transaction.updateStatus(transactionId, 'COMPLETED')
    console.log('✅ Transaction status updated to COMPLETED')

    const updatedTransaction = await Transaction.findById(transactionId)
    res.json({
      transaction: updatedTransaction,
      blockchain: blockchainResult
    })
  } catch (error) {
    console.error('Blockchain commit error:', error)
    res.status(500).json({ error: 'Failed to commit transaction to blockchain' })
  }
}

