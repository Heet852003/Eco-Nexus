/**
 * Chat Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { sendMessage, getMessages } from '../controllers/chatController.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/send', sendMessage)
router.get('/:id', getMessages)

export default router

