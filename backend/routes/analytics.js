import express from 'express'
import { getAnalyticsReport } from '../services/snowflake.js'

const router = express.Router()

/**
 * GET /api/analytics/report
 * Fetches analytics data from Snowflake
 * Returns aggregated metrics: total carbon saved, cost saved, tokens, etc.
 */
router.get('/report', async (req, res) => {
  try {
    const analytics = await getAnalyticsReport()
    res.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    
    // Return mock data if Snowflake is not configured
    if (error.message.includes('not configured') || error.message.includes('connection')) {
      console.log('Using mock analytics data (Snowflake not configured)')
      res.json({
        total_carbon_saved: 125.5,
        total_cost_saved: 2450.75,
        total_scc_tokens: 1250.5,
        decisions_count: 12,
        monthly_data: [
          { month: 'Jan', carbon_saved: 20, cost_saved: 400, tokens_earned: 200 },
          { month: 'Feb', carbon_saved: 25, cost_saved: 500, tokens_earned: 250 },
          { month: 'Mar', carbon_saved: 30, cost_saved: 600, tokens_earned: 300 },
          { month: 'Apr', carbon_saved: 35, cost_saved: 700, tokens_earned: 350 },
          { month: 'May', carbon_saved: 15.5, cost_saved: 250.75, tokens_earned: 150.5 },
        ]
      })
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch analytics',
        message: error.message 
      })
    }
  }
})

export default router

