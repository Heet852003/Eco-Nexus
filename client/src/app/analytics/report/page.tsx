/**
 * Report Analytics Page
 * Comprehensive analytics board for reporting purposes
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getReportAnalytics } from '@/lib/api'
import { Download, FileText, TrendingUp, Leaf, DollarSign, Package, Award } from 'lucide-react'

interface ReportAnalytics {
  totalAmountPurchased: number
  totalQuantity: number
  totalPrice: number
  transactions: Array<{
    id: string
    date: string
    productName: string
    quantity: number
    price: number
    blockchainSignature?: string
  }>
  summary: {
    avgPrice: number
    totalTransactions: number
  }
}

export default function ReportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadReportAnalytics()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadReportAnalytics()
      }, 30000)
      
      // Listen for analytics update events
      const handleAnalyticsUpdate = () => {
        loadReportAnalytics()
      }
      window.addEventListener('analytics-updated', handleAnalyticsUpdate)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('analytics-updated', handleAnalyticsUpdate)
      }
    }
  }, [user, authLoading])

  const loadReportAnalytics = async () => {
    try {
      const data = await getReportAnalytics()
      setAnalytics(data)
    } catch (error: any) {
      console.error('Failed to load report analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const headers = ['Date', 'Product', 'Quantity', 'Price', 'Blockchain Signature']
    const rows = analytics.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.productName,
      t.quantity,
      `$${t.price.toFixed(2)}`,
      t.blockchainSignature || 'N/A'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbon-marketplace-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="container mx-auto px-6 py-12 pt-32">
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12 pt-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Report & Analytics</h1>
            <p className="text-gray-400">Comprehensive transaction data for reporting purposes</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-lg shadow-green-600/30"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative group bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center shadow-lg shadow-green-500/20">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                ${analytics.totalAmountPurchased.toFixed(2)}
              </span>
            </div>
            <p className="text-gray-400 relative z-10">Total Amount Purchased</p>
          </div>

          <div className="relative group bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center shadow-lg shadow-green-500/20">
                <Package className="w-8 h-8 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {analytics.totalQuantity}
              </span>
            </div>
            <p className="text-gray-400 relative z-10">Total Quantity</p>
          </div>
        </div>

        {/* Detailed Summary */}
        <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Summary Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Average Price</p>
              <p className="text-3xl font-bold text-white">${analytics.summary.avgPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
              <p className="text-3xl font-bold text-white">{analytics.summary.totalTransactions}</p>
            </div>
          </div>
        </div>

        {/* Transaction Details Table */}
        <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
            <span className="text-gray-400 text-sm">{analytics.transactions.length} transactions</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Product</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">Quantity</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">Price</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Blockchain</th>
                </tr>
              </thead>
              <tbody>
                {analytics.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800 hover:bg-dark-800/50 transition">
                    <td className="py-3 px-4 text-white">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {transaction.productName}
                    </td>
                    <td className="py-3 px-4 text-white text-right">
                      {transaction.quantity}
                    </td>
                    <td className="py-3 px-4 text-white text-right">
                      ${transaction.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.blockchainSignature ? (
                        <span className="text-green-400 font-mono text-xs">
                          {transaction.blockchainSignature.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-green-500/40">
                  <td colSpan={2} className="py-4 px-4 text-white font-bold">TOTAL</td>
                  <td className="py-4 px-4 text-white font-bold text-right">{analytics.totalQuantity}</td>
                  <td className="py-4 px-4 text-white font-bold text-right">${analytics.totalAmountPurchased.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

