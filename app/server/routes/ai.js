/**
 * AI Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { recommendPrice, rankSellers, getNegotiationHints } from '../controllers/aiController.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/recommend-price', recommendPrice)
router.post('/rank-sellers', rankSellers)
router.post('/negotiation-hints', getNegotiationHints)

export default router

