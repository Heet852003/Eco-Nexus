/**
 * JWT Authentication Middleware
 */

import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    
    try {
      // Load user from database to get latest roles
      const user = await User.findById(decoded.id)
      if (!user) {
        return res.status(403).json({ error: 'User not found' })
      }
      
      // Merge JWT data with latest user data (roles may have changed)
      req.user = {
        id: user.id || user._id?.toString(),
        email: user.email,
        roles: user.roles || { isBuyer: true, isSeller: false }
      }
      next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({ error: 'Authentication error' })
    }
  })
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      roles: user.roles || { isBuyer: true, isSeller: false }
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

/**
 * Middleware to check if user can act as buyer
 */
export function requireBuyer(req, res, next) {
  const user = req.user
  if (!user.roles?.isBuyer) {
    return res.status(403).json({ error: 'Buyer role required' })
  }
  next()
}

/**
 * Middleware to check if user can act as seller
 */
export function requireSeller(req, res, next) {
  const user = req.user
  if (!user.roles?.isSeller) {
    return res.status(403).json({ error: 'Seller role required' })
  }
  next()
}

