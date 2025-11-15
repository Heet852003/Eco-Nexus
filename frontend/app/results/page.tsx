'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Leaf, 
  DollarSign, 
  Coins, 
  ArrowLeft,
  Trophy,
  TrendingDown
} from 'lucide-react'

interface NegotiationResult {
  winner: {
    id: string
    name: string
    price: number
    carbon: number
    delivery: number
    sustainability_score: number
  }
  carbon_saved: number
  cost_saved: number
  scc_tokens: number
  reasoning: string
  comparison: Array<{
    vendor: string
    score: number
  }>
}

export default function ResultsPage() {
  const [result, setResult] = useState<NegotiationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('negotiationResult')
    if (stored) {
      setResult(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No negotiation results found</p>
          <Link href="/" className="text-primary-500 hover:text-primary-400">
            Go back to marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Header */}
      <header className="glass border-b border-primary-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition">
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition">
            View Dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Success Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 mb-8 border border-primary-500/30 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-12 h-12 text-primary-500" />
          </motion.div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Negotiation Complete!</h1>
          <p className="text-gray-400 text-lg">
            Best sustainable option selected through AI-powered multi-agent negotiation
          </p>
        </motion.div>

        {/* Winner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 mb-8 border-2 border-primary-500/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-primary-500" />
            <h2 className="text-3xl font-bold text-white">Winner: {result.winner.name}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="glass rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Price</span>
              </div>
              <p className="text-2xl font-bold text-white">${result.winner.price.toFixed(2)}</p>
            </div>
            <div className="glass rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Leaf className="w-4 h-4" />
                <span className="text-sm">Carbon</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{result.winner.carbon} kg</p>
            </div>
            <div className="glass rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <span className="text-sm">Delivery</span>
              </div>
              <p className="text-2xl font-bold text-white">{result.winner.delivery} days</p>
            </div>
            <div className="glass rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <span className="text-sm">Sustainability</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{result.winner.sustainability_score}/10</p>
            </div>
          </div>
        </motion.div>

        {/* Savings & Rewards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Cost Saved</p>
                <p className="text-2xl font-bold text-green-400">${result.cost_saved.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Carbon Saved</p>
                <p className="text-2xl font-bold text-green-400">{result.carbon_saved.toFixed(1)} kg</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-xl p-6 border border-primary-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">SCC Tokens Earned</p>
                <p className="text-2xl font-bold text-primary-400">{result.scc_tokens.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Minted on Solana Devnet</p>
          </motion.div>
        </div>

        {/* Reasoning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-xl p-6 mb-8 border border-primary-500/20"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">AI Reasoning</h3>
          <p className="text-gray-300 leading-relaxed">{result.reasoning}</p>
        </motion.div>

        {/* Comparison Table */}
        {result.comparison && result.comparison.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-xl p-6 border border-primary-500/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Vendor Comparison Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400">Vendor</th>
                    <th className="text-right py-3 px-4 text-gray-400">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-800 ${
                        item.vendor === result.winner.name ? 'bg-primary-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-white">
                        {item.vendor}
                        {item.vendor === result.winner.name && (
                          <span className="ml-2 text-primary-400 text-sm">✓ Winner</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-primary-400">
                        {item.score.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass border border-primary-500/30 text-primary-400 px-6 py-3 rounded-lg font-semibold hover:bg-primary-500/10 transition"
            >
              New Negotiation
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition"
            >
              View Analytics Dashboard
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  )
}

