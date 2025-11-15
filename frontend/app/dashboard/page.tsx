'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Leaf, 
  DollarSign, 
  Coins, 
  TrendingUp,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { getAnalytics } from '@/lib/api'

interface Analytics {
  total_carbon_saved: number
  total_cost_saved: number
  total_scc_tokens: number
  decisions_count: number
  monthly_data?: Array<{
    month: string
    carbon_saved: number
    cost_saved: number
    tokens_earned: number
  }>
}

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534']

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Use mock data if API fails
      setAnalytics({
        total_carbon_saved: 125.5,
        total_cost_saved: 2450.75,
        total_scc_tokens: 1250.5,
        decisions_count: 12,
        monthly_data: [
          { month: 'Jan', carbon_saved: 20, cost_saved: 400, tokens_earned: 200 },
          { month: 'Feb', carbon_saved: 25, cost_saved: 500, tokens_earned: 250 },
          { month: 'Mar', carbon_saved: 30, cost_saved: 600, tokens_earned: 300 },
          { month: 'Apr', carbon_saved: 35, cost_saved: 700, tokens_earned: 350 },
          { month: 'May', carbon_saved: 15.5, cost_saved: 250.75, tokens_earned: 150.5 },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No analytics data available</p>
          <Link href="/" className="text-primary-500 hover:text-primary-400">
            Go to marketplace
          </Link>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Carbon Saved', value: analytics.total_carbon_saved },
    { name: 'Cost Saved', value: analytics.total_cost_saved / 10 }, // Normalized for visualization
    { name: 'Tokens Earned', value: analytics.total_scc_tokens / 10 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Header */}
      <header className="glass border-b border-primary-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition">
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <span className="text-white font-semibold">Analytics Dashboard</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-6 h-6 text-green-400" />
              <p className="text-gray-400 text-sm">Total Carbon Saved</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{analytics.total_carbon_saved.toFixed(1)} kg</p>
            <p className="text-xs text-gray-500 mt-1">CO₂ equivalent</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              <p className="text-gray-400 text-sm">Total Cost Saved</p>
            </div>
            <p className="text-3xl font-bold text-green-400">${analytics.total_cost_saved.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Cumulative savings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-primary-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-6 h-6 text-primary-400" />
              <p className="text-gray-400 text-sm">Total SCC Tokens</p>
            </div>
            <p className="text-3xl font-bold text-primary-400">{analytics.total_scc_tokens.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">On Solana Devnet</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 border border-primary-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary-400" />
              <p className="text-gray-400 text-sm">Total Decisions</p>
            </div>
            <p className="text-3xl font-bold text-primary-400">{analytics.decisions_count}</p>
            <p className="text-xs text-gray-500 mt-1">Sustainable choices</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          {analytics.monthly_data && analytics.monthly_data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl p-6 border border-primary-500/20"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #22c55e',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="carbon_saved"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Carbon Saved (kg)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cost_saved"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Cost Saved ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens_earned"
                    stroke="#4ade80"
                    strokeWidth={2}
                    name="Tokens Earned"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Impact Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 border border-primary-500/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Impact Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #22c55e',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bar Chart */}
        {analytics.monthly_data && analytics.monthly_data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 border border-primary-500/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Monthly Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #22c55e',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="carbon_saved" fill="#22c55e" name="Carbon Saved (kg)" />
                <Bar dataKey="cost_saved" fill="#16a34a" name="Cost Saved ($)" />
                <Bar dataKey="tokens_earned" fill="#4ade80" name="Tokens Earned" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  )
}

