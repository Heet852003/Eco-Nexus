/**
 * Seller Routes
 */

import express from 'express'
import { authenticateToken, requireSeller } from '../middleware/auth.js'
import { getRequests, submitQuote, updateQuote, getSellerTransactions } from '../controllers/sellerController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/requests', requireSeller, getRequests)
router.post('/quote', requireSeller, submitQuote)
router.put('/quote/:quoteId', requireSeller, updateQuote)
router.get('/transactions', requireSeller, getSellerTransactions)

export default router

