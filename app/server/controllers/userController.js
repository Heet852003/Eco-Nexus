/**
 * User Controller
 */

import { User } from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

/**
 * Update user roles (enable/disable buyer or seller capabilities)
 */
export async function updateRoles(req, res) {
  try {
    const { isBuyer, isSeller } = req.body
    const userId = req.user.id

    console.log('Update roles request:', { userId, isBuyer, isSeller })

    if (isBuyer === undefined && isSeller === undefined) {
      return res.status(400).json({ error: 'At least one role (isBuyer or isSeller) must be provided' })
    }

    // Get current user to merge roles
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      console.error('User not found:', userId)
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('Current user roles:', currentUser.roles)

    // Build updates - only update provided roles, keep others as-is
    const updates = {}
    if (isBuyer !== undefined) {
      updates.isBuyer = Boolean(isBuyer)
    } else {
      // Keep current buyer role, default to true if not set
      updates.isBuyer = currentUser.roles?.isBuyer ?? true
    }
    
    if (isSeller !== undefined) {
      updates.isSeller = Boolean(isSeller)
    } else {
      // Keep current seller role, default to false if not set
      updates.isSeller = currentUser.roles?.isSeller ?? false
    }

    console.log('Role updates to apply:', updates)

    // Ensure user has at least one role
    if (!updates.isBuyer && !updates.isSeller) {
      return res.status(400).json({ error: 'User must have at least one role (buyer or seller)' })
    }

    // Update roles in MongoDB
    const updatedUser = await User.updateRoles(userId, updates)
    
    if (!updatedUser) {
      console.error('Failed to update user roles - no user returned')
      return res.status(500).json({ error: 'Failed to update user roles' })
    }

    console.log('✅ Roles updated successfully for user:', userId)
    console.log('   Old roles:', currentUser.roles)
    console.log('   New roles:', updatedUser.roles)
    
    res.json({
      user: {
        id: updatedUser.id || updatedUser._id?.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        roles: updatedUser.roles,
        sustainabilityScore: updatedUser.sustainabilityScore || 50
      }
    })
  } catch (error) {
    console.error('❌ Update roles error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to update roles', details: error.message })
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id || user._id?.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        sustainabilityScore: user.sustainabilityScore || 50,
        carbonSavings: user.carbonSavings || 0,
        totalTransactions: user.totalTransactions || 0,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

