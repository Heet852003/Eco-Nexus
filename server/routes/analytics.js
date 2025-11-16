/**
 * Analytics Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getCarbonAnalytics, getDashboard } from '../controllers/analyticsController.js'
import { getReportAnalytics } from '../controllers/reportAnalyticsController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/carbon', getCarbonAnalytics)
router.post('/carbon', getCarbonAnalytics) // Support both for compatibility
router.get('/dashboard', getDashboard)
router.get('/report', getReportAnalytics)

export default router

