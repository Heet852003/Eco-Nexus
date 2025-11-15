import express from 'express'
import { mintSCCToken } from '../services/solana.js'

const router = express.Router()

/**
 * POST /api/solana/reward
 * Mints SCC tokens on Solana Devnet as a reward for sustainable choices
 * 
 * Body: {
 *   amount: number,
 *   walletAddress: string (optional, uses default if not provided)
 * }
 */
router.post('/reward', async (req, res) => {
  try {
    const { amount, walletAddress } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Amount must be a positive number' 
      })
    }

    // Mint tokens on Solana Devnet
    const result = await mintSCCToken(amount, walletAddress)

    res.json({
      success: true,
      message: 'SCC tokens minted successfully',
      txHash: result.txHash,
      amount: amount,
      walletAddress: result.walletAddress || 'default'
    })
  } catch (error) {
    console.error('Solana reward error:', error)
    res.status(500).json({ 
      error: 'Failed to mint tokens',
      message: error.message 
    })
  }
})

/**
 * GET /api/solana/balance/:address
 * Gets SCC token balance for a wallet address
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params
    // This would query Solana for token balance
    // For now, return mock data
    res.json({
      address,
      balance: 0,
      tokenSymbol: 'SCC',
      message: 'Balance query not fully implemented - use Solana explorer for devnet'
    })
  } catch (error) {
    console.error('Balance query error:', error)
    res.status(500).json({ 
      error: 'Failed to query balance',
      message: error.message 
    })
  }
})

export default router

