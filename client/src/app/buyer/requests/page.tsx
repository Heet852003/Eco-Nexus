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
import { Plus, Eye, Clock, CheckCircle, XCircle, Link as LinkIcon, Sparkles, ArrowRight } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">My Requests</h1>
            <p className="text-gray-400 text-lg">Manage your carbon credit requests</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/buyer/transactions"
              className="px-6 py-3 rounded-lg font-semibold text-sm transition bg-black/50 border-2 border-green-500/40 text-white hover:border-green-500/60 hover:bg-black/60"
            >
              Transactions
            </Link>
            <Link
              href="/buyer/new-request"
              className="px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              <Plus className="w-5 h-5" />
              New Request
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-16 text-center backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <Sparkles className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-gray-300 text-xl mb-2 font-semibold">No requests yet</p>
              <p className="text-gray-500 mb-6">Get started by creating your first carbon credit request</p>
              <Link
                href="/buyer/new-request"
                className="px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
              >
                Create Request
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/buyer/request/${request.id}`}
                className="relative group bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl hover:shadow-green-500/20"
              >
                <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="flex items-start justify-between relative z-10">
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
                        <p className="text-green-400 font-bold text-lg">{request.quoteCount ?? request.quotes?.length ?? 0}</p>
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
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-green-600/30"
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
                  
                  <Eye className="w-5 h-5 text-gray-500 group-hover:text-green-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

