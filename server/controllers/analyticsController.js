/**
 * Analytics Controller
 */

import { getCarbonAnalytics as getSnowflakeCarbonAnalytics, getDashboardAnalytics } from '../services/snowflakeService.js'
import { Transaction } from '../models/Transaction.js'

export async function getCarbonAnalytics(req, res) {
  try {
    console.log('📊 Fetching carbon analytics...')
    // Try Snowflake first
    let analytics
    try {
      analytics = await getSnowflakeCarbonAnalytics()
      console.log('✅ Got analytics from Snowflake')
    } catch (error) {
      console.error('Snowflake analytics failed, using local data:', error)
      // Fallback to local data
      const allTransactions = await Transaction.getAll()
      console.log(`📦 Total transactions in DB: ${allTransactions.length}`)
      const transactions = allTransactions.filter(t => {
        const status = t.status?.toUpperCase()
        return status === 'COMPLETED' || status === 'COMMITTED'
      })
      console.log(`✅ Filtered to ${transactions.length} completed/committed transactions`)
      analytics = {
        total_carbon_saved: transactions.reduce((sum, t) => {
          const carbon = t.finalCarbonScore || t.carbonScore || 0
          return sum + (carbon * t.quantity)
        }, 0),
        total_transactions: transactions.length,
        avg_carbon_score: transactions.length > 0
          ? transactions.reduce((sum, t) => {
              const carbon = t.finalCarbonScore || t.carbonScore || 0
              return sum + carbon
            }, 0) / transactions.length
          : 0
      }
      console.log('📊 Calculated analytics:', analytics)
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get carbon analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch carbon analytics' })
  }
}

export async function getDashboard(req, res) {
  try {
    // Try Snowflake first
    let dashboard
    try {
      dashboard = await getDashboardAnalytics()
    } catch (error) {
      console.error('Snowflake dashboard failed, using local data:', error)
      // Fallback to local data
      try {
        const allTransactions = await Transaction.getAll()
        const transactions = allTransactions.filter(t => {
          const status = t.status?.toUpperCase()
          return status === 'COMPLETED' || status === 'COMMITTED'
        })
        
        // Group by seller
        const sellerMap = new Map()
        transactions.forEach(t => {
          if (!sellerMap.has(t.sellerId)) {
            sellerMap.set(t.sellerId, {
              sellerId: t.sellerId,
              sellerName: 'Seller',
              carbonSaved: 0,
              transactions: 0
            })
          }
          const seller = sellerMap.get(t.sellerId)
          const carbon = t.finalCarbonScore || t.carbonScore || 0
          seller.carbonSaved += carbon * t.quantity
          seller.transactions += 1
        })

        dashboard = {
          topSellers: Array.from(sellerMap.values())
            .sort((a, b) => b.carbonSaved - a.carbonSaved)
            .slice(0, 10),
          dailySummary: [], // Would need date grouping for full implementation
          total_transactions: transactions.length
        }
      } catch (dbError) {
        console.error('Database error in getDashboard:', dbError)
        // Return empty dashboard if DB fails
        dashboard = {
          topSellers: [],
          dailySummary: [],
          total_transactions: 0
        }
      }
    }

    res.json(dashboard)
  } catch (error) {
    console.error('Get dashboard error:', error)
    // Return empty dashboard instead of error
    res.json({
      topSellers: [],
      dailySummary: [],
      total_transactions: 0
    })
  }
}

