/**
 * Buyer Request Detail Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NegotiationChat from '@/components/NegotiationChat'
import { useAuth } from '@/hooks/useAuth'
import { getBuyerRequest, acceptQuote, updateBuyerRequest } from '@/lib/api'
import type { BuyerRequest, SellerQuote } from '@/types'
import { ArrowLeft, CheckCircle, DollarSign, Leaf, Clock, Award, MessageCircle, X, Edit2, Save, X as XIcon, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState<BuyerRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState<{ quoteId: string; sellerId: string; sellerName: string } | null>(null)
  const [editingRequest, setEditingRequest] = useState(false)
  const [editForm, setEditForm] = useState({ quantity: 0, maxPrice: 0, notes: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadRequest(params.id as string)
    }
  }, [params.id])

  const loadRequest = async (id: string) => {
    try {
      const data = await getBuyerRequest(id)
      setRequest(data)
      setEditForm({
        quantity: data.quantity,
        maxPrice: data.maxPrice || 0,
        notes: data.notes || ''
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load request')
      router.push('/buyer/requests')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRequest = async () => {
    if (!request) return

    setUpdating(true)
    try {
      const updated = await updateBuyerRequest(request.id, editForm)
      setRequest(updated)
      setEditingRequest(false)
      toast.success('Request updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update request')
    } finally {
      setUpdating(false)
    }
  }

  // Auto-refresh quotes every 5 seconds
  useEffect(() => {
    if (!request?.id) return

    const interval = setInterval(() => {
      loadRequest(request.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [request?.id])

  const handleAcceptQuote = async (quoteId: string) => {
    if (!request) return

    if (!confirm('Are you sure you want to accept this quote?')) {
      return
    }

    try {
      const transaction = await acceptQuote(request.id, quoteId)
      toast.success('Quote accepted! Transaction created.')
      router.push(`/transaction/${transaction.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept quote')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <Link
          href="/buyer/requests"
          className="flex items-center gap-2 text-gray-400 hover:text-green-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">{request.productName}</h1>
                {request.status !== 'completed' && request.status !== 'COMPLETED' && !request.transaction && (
                  <button
                    onClick={() => editingRequest ? setEditingRequest(false) : setEditingRequest(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white hover:border-green-500/60 transition"
                  >
                    {editingRequest ? <XIcon className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {editingRequest ? 'Cancel' : 'Edit'}
                  </button>
                )}
                {request.transaction && (
                  <Link
                    href={`/transaction/${request.transaction.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-lg shadow-green-600/30"
                  >
                    <LinkIcon className="w-4 h-4" />
                    View Transaction
                  </Link>
                )}
              </div>
            
            {editingRequest ? (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Quantity</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Max Price ($)</label>
                  <input
                    type="number"
                    value={editForm.maxPrice}
                    onChange={(e) => setEditForm({ ...editForm, maxPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleUpdateRequest}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition shadow-lg shadow-green-600/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white font-semibold">{request.quantity}</span>
                </div>
                {request.maxPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Max Price:</span>
                    <span className="text-white font-semibold">${request.maxPrice}</span>
                  </div>
                )}
                {request.notes && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-400">Notes:</span>
                    <span className="text-white font-semibold text-right max-w-[60%]">{request.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white font-semibold capitalize">{request.status}</span>
                </div>
              </div>
            )}

            {request.aiRecommendation && (
              <div className="mt-6 pt-6 border-t border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-4">AI Recommendation</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Fair Price:</span> <span className="text-green-400 font-semibold">${request.aiRecommendation.fairPrice}</span></p>
                  <p><span className="text-gray-400">Carbon Range:</span> <span className="text-white">{request.aiRecommendation.recommendedCarbonRange.min} - {request.aiRecommendation.recommendedCarbonRange.max}/10</span></p>
                </div>
              </div>
            )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Seller Quotes ({request.quotes?.length || 0})</h2>
            
            {!request.quotes || request.quotes.length === 0 ? (
              <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
                <p className="text-gray-400 relative z-10">No quotes received yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {request.quotes.map((quote: SellerQuote) => (
                  <div
                    key={quote.id}
                    className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{quote.sellerName}</h3>
                      </div>
                      {quote.status === 'accepted' && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Price</p>
                          <p className="text-white font-semibold">${quote.price || quote.sellerPrice || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Delivery</p>
                          <p className="text-white font-semibold">{quote.deliveryDays} days</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Chat button - always enabled (except for accepted/completed quotes) */}
                      {quote.status !== 'accepted' && request.status !== 'completed' && (
                        <button
                          onClick={() => setShowChat({ 
                            quoteId: quote.id, 
                            sellerId: quote.sellerId, 
                            sellerName: quote.sellerName 
                          })}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition shadow-lg shadow-blue-600/30"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {quote.status === 'negotiating' ? 'Continue Chat' : 'Negotiate'}
                        </button>
                      )}
                      
                      {/* Accept Quote button - available for pending AND negotiating quotes */}
                      {(quote.status === 'pending' || quote.status === 'negotiating') && request.status !== 'accepted' && request.status !== 'completed' && (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow-lg shadow-green-600/30 transition"
                        >
                          Accept Quote
                        </button>
                      )}
                      
                      {/* Show status for accepted quotes */}
                      {quote.status === 'accepted' && (
                        <div className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 text-green-400 py-2 rounded-lg font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Accepted
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Negotiation Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-black/90 border-2 border-green-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] relative backdrop-blur-xl shadow-2xl">
              <button
                onClick={() => setShowChat(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <NegotiationChat
                requestId={request.id}
                quoteId={showChat.quoteId}
                buyerId={request.buyerId}
                sellerId={showChat.sellerId}
                sellerName={showChat.sellerName}
                onClose={() => setShowChat(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

