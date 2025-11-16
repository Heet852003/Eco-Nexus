/**
 * Buyer Completed Transactions Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getBuyerTransactions } from '@/lib/api'
import type { Transaction } from '@/types'
import { ArrowLeft, CheckCircle, DollarSign, Leaf, Package, Coins, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function BuyerTransactionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadTransactions()
      
      // Listen for analytics update events
      const handleAnalyticsUpdate = () => {
        loadTransactions()
      }
      window.addEventListener('analytics-updated', handleAnalyticsUpdate)
      
      return () => {
        window.removeEventListener('analytics-updated', handleAnalyticsUpdate)
      }
    }
  }, [user, authLoading])

  const loadTransactions = async () => {
    try {
      const data = await getBuyerTransactions()
      setTransactions(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const totalAmount = transactions.reduce((sum, t) => sum + ((t.finalPrice || t.price || 0) * t.quantity), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/buyer/requests"
          className="flex items-center gap-2 text-gray-400 hover:text-primary-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Requests
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Completed Transactions</h1>
          <p className="text-gray-400">All your completed carbon credit purchases</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-strong rounded-2xl p-8 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">${totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Total Amount Spent</p>
          </div>

        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="glass rounded-xl p-12 border border-primary-500/20 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Completed Transactions</h2>
            <p className="text-gray-400 mb-6">You haven't completed any transactions yet.</p>
            <Link
              href="/buyer/new-request"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition"
            >
              Create New Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="glass rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <h3 className="text-xl font-bold text-white">{transaction.productName}</h3>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                        Completed
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Quantity</p>
                        <p className="text-white font-semibold">{transaction.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Price</p>
                        <p className="text-white font-semibold">${transaction.finalPrice || transaction.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {(transaction.solanaSignature || transaction.blockchainSignature) && (
                        <div className="flex items-center gap-2 text-primary-400">
                          <ExternalLink className="w-4 h-4" />
                          <span className="font-mono text-xs">
                            {(transaction.solanaSignature || transaction.blockchainSignature || '').slice(0, 16)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/transaction/${transaction.id}`}
                    className="ml-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

