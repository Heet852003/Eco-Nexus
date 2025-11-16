/**
 * Buyer Routes
 */

import express from 'express'
import { authenticateToken, requireBuyer } from '../middleware/auth.js'
import { createRequest, getRequests, getRequest, acceptQuote, updateRequest, getBuyerTransactions } from '../controllers/buyerController.js'

const router = express.Router()

router.use(authenticateToken) // All routes require authentication

router.post('/request', requireBuyer, createRequest)
router.get('/requests', requireBuyer, getRequests)
router.get('/request/:id', requireBuyer, getRequest)
router.put('/request/:id', requireBuyer, updateRequest)
router.post('/accept-quote', requireBuyer, acceptQuote)
router.get('/transactions', requireBuyer, getBuyerTransactions)

export default router

