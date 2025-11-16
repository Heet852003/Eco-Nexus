/**
 * Transaction Detail Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getTransaction, commitTransactionToBlockchain } from '@/lib/api'
import type { Transaction } from '@/types'
import { ArrowLeft, CheckCircle, DollarSign, Leaf, Clock, Award, Link as LinkIcon, Loader } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TransactionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, refreshUser } = useAuth()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadTransaction(params.id as string)
    }
  }, [params.id])

  const loadTransaction = async (id: string) => {
    try {
      const data = await getTransaction(id)
      setTransaction(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load transaction')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCommitToBlockchain = async () => {
    if (!transaction) return

    if (!confirm('Commit this transaction to blockchain? This action cannot be undone.')) {
      return
    }

    setCommitting(true)
    try {
      const result = await commitTransactionToBlockchain(transaction.id)
      console.log('✅ Blockchain commit result:', result)
      
      // Fetch updated transaction
      await new Promise(resolve => setTimeout(resolve, 1500)) // Wait for backend to update
      await loadTransaction(transaction.id)
      
      // Refresh user to get updated sustainability score
      if (refreshUser) {
        await refreshUser()
        console.log('✅ User refreshed after blockchain commit')
      }
      
      toast.success('Transaction committed to blockchain! Sustainability scores updated.')
      
      // Trigger analytics refresh event for other pages
      console.log('📢 Dispatching analytics-updated event')
      window.dispatchEvent(new Event('analytics-updated'))
      window.dispatchEvent(new Event('user-updated'))
      
      // Also try direct refresh if on analytics page
      if (window.location.pathname.includes('/analytics')) {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('❌ Blockchain commit error:', error)
      toast.error(error.response?.data?.error || 'Failed to commit to blockchain')
    } finally {
      setCommitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transaction...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  const isBuyer = user?.id === transaction.buyerId
  const isSeller = user?.id === transaction.sellerId

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-400 hover:text-primary-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass rounded-xl p-6 border border-primary-500/20">
            <h1 className="text-3xl font-bold gradient-text mb-6">Transaction Details</h1>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Product:</span>
                <span className="text-white font-semibold">{transaction.productName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white font-semibold">{transaction.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Price:</span>
                <span className="text-white font-semibold">${transaction.finalPrice || transaction.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold capitalize ${
                  transaction.status === 'completed' || transaction.status === 'COMPLETED' ? 'text-green-400' :
                  transaction.status === 'committed' || transaction.status === 'COMMITTED' ? 'text-blue-400' :
                  'text-yellow-400'
                }`}>
                  {transaction.status.toLowerCase()}
                </span>
              </div>
              {(transaction.blockchainSignature || transaction.solanaSignature) && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Blockchain:</span>
                  <span className="text-primary-400 font-mono text-sm">
                    {(transaction.blockchainSignature || transaction.solanaSignature || '').slice(0, 10)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {(transaction.status === 'pending' || transaction.status === 'PENDING') && (isBuyer || isSeller) && (
              <div className="glass rounded-xl p-6 border border-primary-500/20">
                <h2 className="text-xl font-bold text-white mb-4">Commit to Blockchain</h2>
                <p className="text-gray-400 mb-4 text-sm">
                  Finalize this transaction by committing it to the Solana blockchain. 
                  This will update sustainability scores and make the transaction immutable.
                </p>
                <button
                  onClick={handleCommitToBlockchain}
                  disabled={committing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition disabled:opacity-50"
                >
                  {committing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Committing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Commit to Blockchain
                    </>
                  )}
                </button>
              </div>
            )}

            {(transaction.status === 'committed' || transaction.status === 'COMMITTED' || transaction.status === 'completed' || transaction.status === 'COMPLETED') ? (
              <div className="glass rounded-xl p-6 border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Transaction Completed</h2>
                </div>
                <p className="text-gray-300 mb-4">
                  This transaction has been successfully committed to the blockchain.
                </p>
                {transaction.blockchainTxHash && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Transaction Hash:</p>
                    <p className="text-primary-400 font-mono text-xs break-all">
                      {transaction.blockchainTxHash}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

