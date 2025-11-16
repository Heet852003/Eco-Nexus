/**
 * Buyer Requests List Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getBuyerRequests } from '@/lib/api'
import type { BuyerRequest } from '@/types'
import { Plus, Eye, Clock, CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function BuyerRequestsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadRequests()
    }
  }, [user, authLoading])

  const loadRequests = async () => {
    try {
      const data = await getBuyerRequests()
      setRequests(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'accepted':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'quoted':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'pending':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      default:
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-2 tracking-tight">My Requests</h1>
            <p className="text-gray-400 text-lg">Manage your carbon credit requests</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/buyer/transactions"
              className="btn-secondary px-6 py-3 rounded-xl font-semibold text-sm transition"
            >
              Transactions
            </Link>
            <Link
              href="/buyer/new-request"
              className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Request
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="glass-strong rounded-2xl p-16 text-center border border-purple-500/20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-gray-300 text-xl mb-2 font-semibold">No requests yet</p>
            <p className="text-gray-500 mb-6">Get started by creating your first carbon credit request</p>
            <Link
              href="/buyer/new-request"
              className="btn-primary px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
            >
              Create Request
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/buyer/request/${request.id}`}
                className="glass-strong rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-2xl font-bold text-white">{request.productName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-gray-500 text-xs mb-1 font-medium">Quantity</p>
                        <p className="text-white font-bold text-lg">{request.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1 font-medium">Quotes</p>
                        <p className="text-purple-400 font-bold text-lg">{request.quoteCount ?? request.quotes?.length ?? 0}</p>
                      </div>
                      {request.maxPrice && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1 font-medium">Max Price</p>
                          <p className="text-white font-bold text-lg">${request.maxPrice}</p>
                        </div>
                      )}
                      {request.transaction && (
                        <div className="md:col-span-4 mt-4">
                          <Link
                            href={`/transaction/${request.transaction.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-purple-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkIcon className="w-4 h-4" />
                            View Transaction
                            {request.transaction.status === 'PENDING' && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                                Commit to Blockchain
                              </span>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Eye className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

