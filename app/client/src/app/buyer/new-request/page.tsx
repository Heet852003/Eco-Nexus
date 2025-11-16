/**
 * Create New Buyer Request Page
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { createBuyerRequest, recommendPrice } from '@/lib/api'
import { PRODUCTS } from '@/constants'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Use PRODUCTS from constants - matches ML model training data
const PRODUCTS_LIST = PRODUCTS

export default function NewRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    maxPrice: undefined as number | undefined,
  })
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [gettingRecommendation, setGettingRecommendation] = useState(false)

  const handleGetRecommendation = async () => {
    if (!formData.productId || !formData.quantity) {
      toast.error('Please fill in product and quantity first')
      return
    }

    setGettingRecommendation(true)
    try {
      // Use default carbon score of 7.0 for AI recommendation
      const recommendation = await recommendPrice(
        formData.productId,
        formData.quantity,
        7.0 // Default carbon score
      )
      setAiRecommendation(recommendation)
      if (recommendation.fairPrice) {
        setFormData({ ...formData, maxPrice: recommendation.fairPrice })
      }
      toast.success('AI recommendation received!')
    } catch (error: any) {
      console.error('AI recommendation error:', error)
      toast.error(error.response?.data?.error || 'Failed to get AI recommendation. Please check your OpenRouter API key.')
    } finally {
      setGettingRecommendation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const request = await createBuyerRequest(formData)
      toast.success('Request created successfully!')
      router.push(`/buyer/request/${request.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = PRODUCTS_LIST.find(p => p.id === formData.productId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/buyer/requests"
          className="flex items-center gap-2 text-gray-400 hover:text-primary-400 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        <h1 className="text-4xl font-bold gradient-text mb-8">Create New Request</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass rounded-xl p-6 border border-primary-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Request Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select a product</option>
                  {PRODUCTS_LIST.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxPrice || ''}
                  onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Request...' : 'Create Request'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border border-primary-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">AI Recommendation</h2>
                <button
                  onClick={handleGetRecommendation}
                  disabled={gettingRecommendation || !formData.productId}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {gettingRecommendation ? 'Getting...' : 'Get AI Recommendation'}
                </button>
              </div>

              {aiRecommendation ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm">Fair Price:</span>
                    <p className="text-2xl font-bold text-primary-400">${aiRecommendation.fairPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Recommended Carbon Range:</span>
                    <p className="text-white font-semibold">
                      {aiRecommendation.recommendedCarbonRange?.min} - {aiRecommendation.recommendedCarbonRange?.max}/10
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Market Justification:</span>
                    <p className="text-gray-300 text-sm">{aiRecommendation.marketJustification}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Sustainability Reasoning:</span>
                    <p className="text-gray-300 text-sm">{aiRecommendation.sustainabilityReasoning}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Click "Get AI Recommendation" to receive AI-powered pricing and carbon score suggestions.</p>
              )}
            </div>

            {selectedProduct && (
              <div className="glass rounded-xl p-6 border border-primary-500/20">
                <h3 className="text-lg font-bold text-white mb-4">Selected Product</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Category:</span> <span className="text-white">{selectedProduct.category}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

