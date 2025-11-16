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
import { Button } from '@/components/ui/button'

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

        <h1 className="text-4xl font-bold text-white mb-8">Create New Request</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
            <div className="relative z-10">
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
                    className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
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
                    className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
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
                    className="w-full px-4 py-3 bg-black/40 border-2 border-green-500/40 rounded-lg text-white focus:outline-none focus:border-green-500/60 backdrop-blur-sm transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                >
                  {loading ? 'Creating Request...' : 'Create Request'}
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">AI Recommendation</h2>
                  <Button
                    onClick={handleGetRecommendation}
                    disabled={gettingRecommendation || !formData.productId}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    {gettingRecommendation ? 'Getting...' : 'Get AI Recommendation'}
                  </Button>
                </div>

                {aiRecommendation ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-400 text-sm">Fair Price:</span>
                      <p className="text-2xl font-bold text-green-400">${aiRecommendation.fairPrice?.toFixed(2)}</p>
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
            </div>

            {selectedProduct && (
              <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-4">Selected Product</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Category:</span> <span className="text-white">{selectedProduct.category}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
