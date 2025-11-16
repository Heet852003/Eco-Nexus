/**
 * Report Analytics Controller
 * Provides comprehensive analytics for reporting purposes
 */

import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'

export async function getReportAnalytics(req, res) {
  try {
    const userId = req.user.id
    console.log('📊 Fetching report analytics for user:', userId)

    // Get all completed/committed transactions for this user (as buyer)
    const allTransactions = await Transaction.findByBuyerId(userId)
    const completedTransactions = allTransactions.filter(t => {
      const status = t.status?.toUpperCase()
      return status === 'COMPLETED' || status === 'COMMITTED'
    })

    console.log(`✅ Found ${completedTransactions.length} completed transactions`)

    // Calculate totals
    const totalAmountPurchased = completedTransactions.reduce((sum, t) => {
      const price = t.finalPrice || t.price || 0
      return sum + price
    }, 0)

    const totalQuantity = completedTransactions.reduce((sum, t) => sum + t.quantity, 0)

    // Build detailed transaction list (no carbon score tracking)
    const transactions = completedTransactions.map(t => {
      const price = t.finalPrice || t.price || 0

      return {
        id: t.id,
        date: t.createdAt || t.completedAt || new Date().toISOString(),
        productName: t.productName,
        quantity: t.quantity,
        price: price,
        blockchainSignature: t.solanaSignature || t.blockchainSignature || null
      }
    })

    const avgPrice = completedTransactions.length > 0
      ? totalAmountPurchased / completedTransactions.length
      : 0

    const analytics = {
      totalAmountPurchased,
      totalQuantity,
      totalPrice: totalAmountPurchased, // Alias for clarity
      transactions: transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      summary: {
        avgPrice: completedTransactions.length > 0
          ? totalAmountPurchased / completedTransactions.length
          : 0,
        totalTransactions: completedTransactions.length
      }
    }

    console.log('📊 Report analytics calculated:', {
      totalAmountPurchased,
      totalQuantity,
      transactionCount: transactions.length
    })

    res.json(analytics)
  } catch (error) {
    console.error('Get report analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch report analytics' })
  }
}

