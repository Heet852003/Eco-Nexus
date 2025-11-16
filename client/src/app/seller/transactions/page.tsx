/**
 * Seller Completed Transactions Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getSellerTransactions } from '@/lib/api'
import type { Transaction } from '@/types'
import { ArrowLeft, CheckCircle, DollarSign, Leaf, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SellerTransactionsPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
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
  
  // Separate effect for user refresh to avoid infinite loops
  useEffect(() => {
    if (!refreshUser) return
    
    // Listen for user update events to refresh user data
    const handleUserUpdate = async () => {
      await refreshUser()
      loadTransactions()
    }
    window.addEventListener('user-updated', handleUserUpdate)
    
    // Auto-refresh user every 10 seconds to catch score updates
    const interval = setInterval(() => {
      refreshUser()
    }, 10000)
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate)
      clearInterval(interval)
    }
  }, [refreshUser])

  const loadTransactions = async () => {
    try {
      const data = await getSellerTransactions()
      setTransactions(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.finalPrice || t.price || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <Link
          href="/seller/quotes"
          className="flex items-center gap-2 text-gray-400 hover:text-green-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Quotes
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Completed Transactions</h1>
          <p className="text-gray-400">All your completed carbon credit sales</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-1 gap-6 mb-8">
          <div className="relative group bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center shadow-lg shadow-green-500/20">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</span>
            </div>
            <p className="text-gray-400 relative z-10">Total Revenue</p>
          </div>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Completed Transactions</h2>
              <p className="text-gray-400 mb-6">You haven't completed any sales yet.</p>
              <Link
                href="/seller/requests"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-lg shadow-green-600/30"
              >
                View Requests
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="relative group bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl"
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
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Date</p>
                        <p className="text-white font-semibold text-sm">
                          {new Date(transaction.completedAt || transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {(transaction.solanaSignature || transaction.blockchainSignature) && (
                        <div className="flex items-center gap-2 text-green-400">
                          <span className="font-mono text-xs">
                            {(transaction.solanaSignature || transaction.blockchainSignature || '').slice(0, 16)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/transaction/${transaction.id}`}
                    className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-lg shadow-green-600/30"
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

