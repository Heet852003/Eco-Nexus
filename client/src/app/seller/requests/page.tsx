/**
 * Seller Requests Page - View available buyer requests
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getSellerRequests, submitQuote } from '@/lib/api'
import { PRODUCTS } from '@/constants'
import type { BuyerRequest } from '@/types'
import { Send, DollarSign, Leaf, Filter, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerRequestsPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [requests, setRequests] = useState<BuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingQuote, setSubmittingQuote] = useState<string | null>(null)
  const [quoteForm, setQuoteForm] = useState<{ [key: string]: { price: number; deliveryDays: number; localFlag: boolean } }>({})
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showProductSelector, setShowProductSelector] = useState(true)
  const [hasSelectedProducts, setHasSelectedProducts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load selected products from localStorage on mount
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem('sellerProducts')
      if (saved) {
        try {
          const products = JSON.parse(saved)
          if (Array.isArray(products) && products.length > 0) {
            setSelectedProducts(products)
            setHasSelectedProducts(true)
            setShowProductSelector(false)
          }
        } catch (e) {
          // Invalid data, ignore
        }
      }
      
    }
  }, [user])
  
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

  const loadRequests = async () => {
    if (selectedProducts.length === 0) {
      setRequests([])
      return
    }

    try {
      setLoading(true)
      // Load requests for each selected product
      const allRequests: BuyerRequest[] = []
      for (const productId of selectedProducts) {
        const data = await getSellerRequests({ productId })
        allRequests.push(...data)
      }
      
      // Remove duplicates (in case same request appears for multiple products)
      const uniqueRequests = allRequests.filter((req, index, self) =>
        index === self.findIndex(r => r.id === req.id)
      )
      
      setRequests(uniqueRequests)
      // Initialize quote forms
      const forms: any = {}
      uniqueRequests.forEach(req => {
        forms[req.id] = {
          price: req.aiRecommendation?.fairPrice || 50,
          deliveryDays: 7,
          localFlag: false
        }
      })
      setQuoteForm(forms)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && hasSelectedProducts && selectedProducts.length > 0) {
      loadRequests()
    }
  }, [user, authLoading, selectedProducts, hasSelectedProducts])

  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSubmitProducts = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to sell')
      return
    }
    
    // Save to localStorage
    localStorage.setItem('sellerProducts', JSON.stringify(selectedProducts))
    setHasSelectedProducts(true)
    setShowProductSelector(false)
    toast.success(`Selected ${selectedProducts.length} product(s) to sell`)
    loadRequests()
  }

  const handleChangeProducts = () => {
    setShowProductSelector(true)
    setHasSelectedProducts(false)
    setRequests([])
  }

  const handleSubmitQuote = async (requestId: string) => {
    const form = quoteForm[requestId]
    if (!form) return

    setSubmittingQuote(requestId)
    try {
      await submitQuote({
        requestId,
        price: form.price,
        deliveryDays: form.deliveryDays,
        localFlag: form.localFlag
      })
      toast.success('Quote submitted successfully!')
      // Refresh user to get updated sustainability score
      if (refreshUser) {
        await refreshUser()
        // Dispatch event so all pages refresh
        window.dispatchEvent(new Event('user-updated'))
      }
      await loadRequests() // Reload to remove the request
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit quote')
    } finally {
      setSubmittingQuote(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <h1 className="text-4xl font-bold text-white mb-8">Available Requests</h1>

        {/* Product Selection Screen */}
        {showProductSelector && (
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-4">Select Products You Want to Sell</h2>
              <p className="text-gray-400 mb-6">Search and select the products you can provide. You'll only see requests for these products.</p>
              
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                  />
                </div>
              </div>

            {/* Filtered Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {PRODUCTS.filter(product => 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelection(product.id)}
                  className={`p-4 rounded-lg border-2 transition text-left ${
                    selectedProducts.includes(product.id)
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-green-500/40 bg-black/40 hover:border-green-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-400">{product.category}</p>
                    </div>
                    {selectedProducts.includes(product.id) && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {PRODUCTS.filter(product => 
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.category.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No products found matching "{searchQuery}"</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {selectedProducts.length > 0 
                  ? `${selectedProducts.length} product(s) selected`
                  : 'Select at least one product to continue'
                }
              </p>
              <button
                onClick={handleSubmitProducts}
                disabled={selectedProducts.length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg shadow-green-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Requests Display */}
        {!showProductSelector && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-400">Showing requests for:</span>
                {selectedProducts.map(productId => {
                  const product = PRODUCTS.find(p => p.id === productId)
                  return product ? (
                    <span
                      key={productId}
                      className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium"
                    >
                      {product.name}
                    </span>
                  ) : null
                })}
              </div>
              <button
                onClick={handleChangeProducts}
                className="flex items-center gap-2 px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white hover:border-green-500/60 transition"
              >
                <Filter className="w-4 h-4" />
                <span>Change Products</span>
              </button>
            </div>

            {loading ? (
              <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
                <div className="relative z-10">
                  <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading requests...</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
                <div className="relative z-10">
                  <p className="text-gray-400 text-lg">No available requests for your selected products at the moment</p>
                  <button
                    onClick={handleChangeProducts}
                    className="mt-4 text-green-400 hover:text-green-300 transition"
                  >
                    Change product selection
                  </button>
                </div>
              </div>
            ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl"
              >
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">{request.productName}</h3>
                    
                    <div className="space-y-2 text-sm">
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
                      {request.aiRecommendation && (
                        <div className="mt-4 pt-4 border-t border-green-500/20">
                          <p className="text-xs text-gray-400 mb-2">AI Recommended Price:</p>
                          <p className="text-green-400 font-semibold">${request.aiRecommendation.fairPrice}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-white">Submit Quote</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (USD) *
                      </label>
                        <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quoteForm[request.id]?.price || ''}
                          onChange={(e) => setQuoteForm({
                            ...quoteForm,
                            [request.id]: {
                              ...quoteForm[request.id],
                              price: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full pl-10 pr-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Delivery Days *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quoteForm[request.id]?.deliveryDays || ''}
                        onChange={(e) => setQuoteForm({
                          ...quoteForm,
                          [request.id]: {
                            ...quoteForm[request.id],
                            deliveryDays: parseInt(e.target.value) || 1
                          }
                        })}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                      />
                    </div>

                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        id={`local-flag-${request.id}`}
                        checked={quoteForm[request.id]?.localFlag || false}
                        onChange={(e) => setQuoteForm({
                          ...quoteForm,
                          [request.id]: {
                            ...quoteForm[request.id],
                            localFlag: e.target.checked
                          }
                        })}
                        className="form-checkbox h-5 w-5 text-green-500 rounded border-green-500/40 bg-black/40 focus:ring-green-500"
                      />
                      <label htmlFor={`local-flag-${request.id}`} className="ml-2 text-sm text-gray-300">
                        Local supplier
                      </label>
                    </div>

                    <button
                      onClick={() => handleSubmitQuote(request.id)}
                      disabled={submittingQuote === request.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {submittingQuote === request.id ? 'Submitting...' : 'Submit Quote'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

