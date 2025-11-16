/**
 * Negotiation Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { createThread, getThread, sendMessage, getUserThreads } from '../controllers/negotiationController.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/thread', createThread)
router.get('/thread/:threadId', getThread)
router.post('/message', sendMessage)
router.get('/user-threads', getUserThreads)

export default router

