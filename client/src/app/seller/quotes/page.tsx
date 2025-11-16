/**
 * Seller Quotes Page - View submitted quotes and negotiations
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NegotiationChat from '@/components/NegotiationChat'
import { useAuth } from '@/hooks/useAuth'
import { getUserNegotiationThreads, updateSellerQuote, getSellerRequests } from '@/lib/api'
import { MessageCircle, X, Clock, CheckCircle, XCircle, Edit2, Save, X as XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface NegotiationThread {
  id: string
  requestId: string
  quoteId: string
  buyerId: string
  sellerId: string
  status: string
  buyerName?: string
  sellerName?: string
  request?: {
    id: string
    productName: string
    quantity: number
  }
  quote?: {
    id: string
    sellerPrice: number
    deliveryDays?: number
  }
}

export default function SellerQuotesPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [threads, setThreads] = useState<NegotiationThread[]>([])
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState<{ 
    threadId: string
    requestId: string
    quoteId: string
    buyerId: string
    sellerId: string
    buyerName: string
  } | null>(null)
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ [key: string]: { price: number; deliveryDays: number } }>({})
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadThreads()
    }
  }, [user, authLoading])
  
  // Separate effect for user refresh to avoid infinite loops
  useEffect(() => {
    if (!refreshUser) return
    
    // Listen for user update events to refresh user data
    const handleUserUpdate = async () => {
      await refreshUser()
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

  const loadThreads = async () => {
    try {
      setLoading(true)
      const data = await getUserNegotiationThreads()
      // Filter to only show threads where user is seller
      const sellerThreads = data.filter((t: NegotiationThread) => t.sellerId === user?.id)
      setThreads(sellerThreads)
      
      // Initialize edit forms
      const forms: { [key: string]: { price: number; deliveryDays: number } } = {}
      sellerThreads.forEach((thread: NegotiationThread) => {
        if (thread.quote) {
          forms[thread.quoteId] = {
            price: thread.quote.sellerPrice,
            deliveryDays: thread.quote.deliveryDays || 7
          }
        }
      })
      setEditForm(forms)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuote = async (quoteId: string) => {
    if (!editForm[quoteId]) return

    setUpdating(true)
    try {
      await updateSellerQuote(quoteId, editForm[quoteId])
      toast.success('Quote updated successfully!')
      setEditingQuote(null)
      await loadThreads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update quote')
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading quotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <h1 className="text-4xl font-bold text-white mb-8">My Quotes & Negotiations</h1>

        {threads.length === 0 ? (
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
              <p className="text-gray-400 text-lg mb-4">No active negotiations</p>
              <p className="text-gray-500 text-sm">Quotes you submit will appear here when buyers start negotiations</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {thread.request?.productName || 'Product Request'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Quantity: {thread.request?.quantity || 'N/A'}</span>
                      {thread.quote && (
                        <>
                          <span>Price: ${thread.quote.sellerPrice}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    thread.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                    thread.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {thread.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {editingQuote === thread.quoteId ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Price ($)</label>
                        <input
                          type="number"
                          value={editForm[thread.quoteId]?.price || 0}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            [thread.quoteId]: {
                              ...editForm[thread.quoteId],
                              price: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Delivery Days</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm[thread.quoteId]?.deliveryDays || 7}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            [thread.quoteId]: {
                              ...editForm[thread.quoteId],
                              deliveryDays: parseInt(e.target.value) || 7
                            }
                          })}
                          className="w-full px-3 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateQuote(thread.quoteId)}
                          disabled={updating}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition shadow-lg shadow-green-600/30 disabled:opacity-50 text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingQuote(null)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition text-sm"
                        >
                          <XIcon className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowChat({
                          threadId: thread.id,
                          requestId: thread.requestId,
                          quoteId: thread.quoteId,
                          buyerId: thread.buyerId,
                          sellerId: thread.sellerId,
                          buyerName: thread.buyerName || 'Buyer'
                        })}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition shadow-lg shadow-blue-600/30"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {thread.status === 'OPEN' ? 'Open Chat' : 'Continue Chat'}
                      </button>
                      {thread.status !== 'CLOSED' && thread.quote && thread.quote.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => setEditingQuote(thread.quoteId)}
                          className="w-full flex items-center justify-center gap-2 bg-black/40 border-2 border-green-500/40 hover:border-green-500/60 text-white py-2 rounded-lg font-semibold transition"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Quote
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
                requestId={showChat.requestId}
                quoteId={showChat.quoteId}
                buyerId={showChat.buyerId}
                sellerId={showChat.sellerId}
                sellerName={user?.name || 'Seller'}
                threadId={showChat.threadId}
                onClose={() => setShowChat(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

