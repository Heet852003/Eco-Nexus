/**
 * Authentication Controller
 */

import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { generateToken } from '../middleware/auth.js'

export async function register(req, res) {
  try {
    console.log('Registration request received:', { email: req.body?.email, name: req.body?.name })
    const { email, name, password } = req.body

    if (!email || !name || !password) {
      console.log('Missing required fields')
      return res.status(400).json({ error: 'Email, name, and password are required' })
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      console.log('User already exists:', email)
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with default roles (buyer only initially)
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      roles: { isBuyer: true, isSeller: false } // Default: buyer only
    })

    console.log('User created:', user.id, user.email)

    // Generate token
    const token = generateToken(user)

    const response = {
      user: {
        id: user.id || user._id?.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        sustainabilityScore: user.sustainabilityScore || 50
      },
      token
    }

    console.log('Registration successful for:', email)
    res.status(201).json(response)
  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Registration failed', details: error.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash || user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user)

    res.json({
      user: {
        id: user.id || user._id?.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        sustainabilityScore: user.sustainabilityScore || 50
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

