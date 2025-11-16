/**
 * Dashboard Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getDashboard } from '@/lib/api'
import { TrendingUp, Leaf, Award, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadDashboard()
      
      // Auto-refresh dashboard every 10 seconds
      const interval = setInterval(() => {
        loadDashboard()
      }, 10000)
      
      // Listen for analytics update events
      const handleAnalyticsUpdate = () => {
        loadDashboard()
      }
      window.addEventListener('analytics-updated', handleAnalyticsUpdate)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('analytics-updated', handleAnalyticsUpdate)
      }
    }
  }, [user, authLoading])
  
  // Separate effect for user refresh to avoid infinite loops
  useEffect(() => {
    if (!refreshUser) return
    
    // Listen for user update events to refresh user data
    const handleUserUpdate = async () => {
      await refreshUser()
      loadDashboard()
    }
    window.addEventListener('user-updated', handleUserUpdate)
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate)
    }
  }, [refreshUser])

  const loadDashboard = async () => {
    try {
      const data = await getDashboard()
      setDashboardData(data)
    } catch (error: any) {
      console.error('Failed to load dashboard:', error)
      // If it's a 401/403, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login')
        return
      }
      // Set empty data on error instead of crashing
      setDashboardData({ topSellers: [], dailySummary: [], total_transactions: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16 fade-in">
          <h1 className="text-6xl md:text-7xl font-bold gradient-text mb-4 tracking-tight">
            Welcome to EcoNexus
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Intelligent carbon credit marketplace powered by AI & blockchain
          </p>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="glass-strong rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {dashboardData?.total_transactions || 0}
              </span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Transactions</p>
          </div>

          <div className="glass-strong rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {user?.sustainabilityScore || 50}
              </span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Sustainability Score</p>
          </div>

        </div>

        {/* Quick Actions - Modern Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/buyer/new-request" 
            className="glass-strong rounded-2xl p-10 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center mb-4 group-hover:from-purple-500/40 group-hover:to-purple-600/40 transition">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Create Request</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Post a new carbon credit request and get AI-powered recommendations</p>
            </div>
            <div className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2">
              New Request
              <span>→</span>
            </div>
          </Link>

          <Link 
            href="/seller/requests" 
            className="glass-strong rounded-2xl p-10 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center mb-4 group-hover:from-purple-500/40 group-hover:to-purple-600/40 transition">
                <span className="text-2xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Browse Requests</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Discover buyer requests and submit competitive quotes</p>
            </div>
            <div className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2">
              View Requests
              <span>→</span>
            </div>
          </Link>

          {user?.roles?.isBuyer && (
            <Link 
              href="/analytics/report" 
              className="glass-strong rounded-2xl p-10 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center mb-4 group-hover:from-purple-500/40 group-hover:to-purple-600/40 transition">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">View Report</h2>
                <p className="text-gray-400 text-sm leading-relaxed">Comprehensive transaction reports and analytics</p>
              </div>
              <div className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2">
                View Report
                <span>→</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

