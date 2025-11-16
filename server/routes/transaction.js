/**
 * Transaction Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getTransaction } from '../controllers/transactionController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/:id', getTransaction)

export default router

