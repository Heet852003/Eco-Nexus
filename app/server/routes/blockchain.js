/**
 * Blockchain Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { commitTransactionToBlockchain } from '../controllers/blockchainController.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/commit', commitTransactionToBlockchain)

export default router

