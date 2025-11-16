/**
 * User Routes
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { updateRoles, getProfile } from '../controllers/userController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/profile', getProfile)
router.post('/update-roles', updateRoles)

export default router

