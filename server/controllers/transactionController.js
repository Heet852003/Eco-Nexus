/**
 * Transaction Controller
 */

import { Transaction } from '../models/Transaction.js'

export async function getTransaction(req, res) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const transaction = await Transaction.findById(id)
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Verify user is part of transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json(transaction)
  } catch (error) {
    console.error('Get transaction error:', error)
    res.status(500).json({ error: 'Failed to fetch transaction' })
  }
}

