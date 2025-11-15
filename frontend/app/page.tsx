'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Leaf, 
  TrendingUp, 
  Zap, 
  Award, 
  ArrowRight,
  ShoppingCart,
  Coins,
  BarChart3
} from 'lucide-react'
import VendorCard from '@/components/VendorCard'
import { getVendors, negotiate } from '@/lib/api'

interface Vendor {
  id: string
  name: string
  price: number
  carbon: number
  delivery: number
  sustainability_score: number
  willing_to_discount: boolean
  description?: string
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [negotiating, setNegotiating] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const data = await getVendors()
      setVendors(data)
    } catch (error) {
      console.error('Failed to load vendors:', error)
      // Show error message to user
      alert(`Failed to load vendors: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that the backend is running on http://localhost:3001`)
    } finally {
      setLoading(false)
    }
  }

  const handleNegotiate = async () => {
    setNegotiating(true)
    try {
      const result = await negotiate()
      // Store result in sessionStorage for results page
      sessionStorage.setItem('negotiationResult', JSON.stringify(result))
      window.location.href = '/results'
    } catch (error) {
      console.error('Negotiation failed:', error)
      alert('Negotiation failed. Please try again.')
    } finally {
      setNegotiating(false)
    }
  }

  // Debug: Log when component renders
  useEffect(() => {
    console.log('Home component rendered', { vendorsCount: vendors.length, loading })
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  }, [vendors.length, loading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass border-b border-primary-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold gradient-text">Eco-Nexus SCOS</h1>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-primary-400 transition">
              Marketplace
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 gradient-text">
            Sustainable Choice Operating System
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Make automated sustainable decisions with AI-powered multi-agent negotiation.
            Compare vendors on cost, carbon footprint, and sustainability.
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-300">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              <span>AI Negotiation</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary-500" />
              <span>Blockchain Rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <span>Analytics</span>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition"
          >
            <TrendingUp className="w-10 h-10 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cost Optimization</h3>
            <p className="text-gray-400">
              Compare vendors and negotiate the best prices automatically
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition"
          >
            <Leaf className="w-10 h-10 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Carbon Reduction</h3>
            <p className="text-gray-400">
              Track and minimize your carbon footprint with every decision
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition"
          >
            <Award className="w-10 h-10 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Token Rewards</h3>
            <p className="text-gray-400">
              Earn SCC tokens on Solana for making sustainable choices
            </p>
          </motion.div>
        </div>

        {/* Vendor Marketplace */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold gradient-text">Vendor Marketplace</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNegotiate}
              disabled={negotiating || vendors.length === 0}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {negotiating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Negotiating...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Compare & Negotiate
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VendorCard vendor={vendor} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-primary-500/20 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>Eco-Nexus SCOS - Hackathon Project 2024</p>
          <p className="text-sm mt-2">Powered by AI, Blockchain, and Sustainability</p>
        </div>
      </footer>
    </div>
  )
}

