// /**
//  * Dashboard Page
//  */

// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Navbar from '@/components/Navbar'
// import { useAuth } from '@/hooks/useAuth'
// import { getDashboard } from '@/lib/api'
// import { TrendingUp, Award, Sparkles, Search, FileText, ArrowRight } from 'lucide-react'
// import Link from 'next/link'
// import { motion } from 'framer-motion'
// import { Button } from '@/components/ui/button'
// import { LightBackground } from '@/components/LightBackground'
// import { logger } from '@/lib/logger'

// export default function DashboardPage() {
//   const router = useRouter()
//   const { user, loading: authLoading, refreshUser } = useAuth()
//   const [dashboardData, setDashboardData] = useState<any>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     if (!authLoading && !user) {
//       router.push('/login')
//       return
//     }

//     if (user) {
//       loadDashboard()
      
//       // Auto-refresh dashboard every 10 seconds
//       const interval = setInterval(() => {
//         loadDashboard()
//       }, 10000)
      
//       // Listen for analytics update events
//       const handleAnalyticsUpdate = () => {
//         loadDashboard()
//       }
//       window.addEventListener('analytics-updated', handleAnalyticsUpdate)
      
//       return () => {
//         clearInterval(interval)
//         window.removeEventListener('analytics-updated', handleAnalyticsUpdate)
//       }
//     }
//   }, [user, authLoading])
  
//   // Separate effect for user refresh to avoid infinite loops
//   useEffect(() => {
//     if (!refreshUser) return
    
//     // Listen for user update events to refresh user data
//     const handleUserUpdate = async () => {
//       await refreshUser()
//       loadDashboard()
//     }
//     window.addEventListener('user-updated', handleUserUpdate)
    
//     return () => {
//       window.removeEventListener('user-updated', handleUserUpdate)
//     }
//   }, [refreshUser])

//   const loadDashboard = async () => {
//     try {
//       const data = await getDashboard()
//       setDashboardData(data)
//     } catch (error: any) {
//       logger.error('Failed to load dashboard:', error)
//       // If it's a 401/403, redirect to login
//       if (error.response?.status === 401 || error.response?.status === 403) {
//         router.push('/login')
//         return
//       }
//       // Set empty data on error instead of crashing
//       setDashboardData({ topSellers: [], dailySummary: [], total_transactions: 0 })
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (authLoading || loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center relative bg-[#0a0a0a]">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-400">Loading dashboard...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <section className="relative min-h-screen pt-32 pb-24 px-6 overflow-hidden bg-[#0a0a0a]">
//       <LightBackground />
      
//       <Navbar />
      
//       <div className="max-w-7xl mx-auto relative z-10">
//         {/* Header */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//           className="mb-16"
//         >
//           <h1 className="text-7xl mb-4 font-bold">Welcome to Eco-Nexus</h1>
//           <p className="text-xl text-gray-400">
//             Intelligent carbon credit marketplace powered by AI & blockchain
//           </p>
//         </motion.div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2, duration: 0.6 }}
//             className="relative group"
//           >
//             <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//             <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
//                     <TrendingUp className="w-6 h-6 text-green-400" />
//                   </div>
//                   <div className="text-6xl mb-2">{dashboardData?.total_transactions || 0}</div>
//                   <div className="text-gray-300">Transactions</div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3, duration: 0.6 }}
//             className="relative group"
//           >
//             <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//             <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
//                     <Award className="w-6 h-6 text-green-400" />
//                   </div>
//                   <div className="text-6xl mb-2">{user?.sustainabilityScore || 100}</div>
//                   <div className="text-gray-300">Sustainability Score</div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         {/* Action Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Create Request Card */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.6 }}
//             className="relative group"
//           >
//             <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//             <Link href="/buyer/new-request" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
//               <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
//                 <Sparkles className="w-7 h-7 text-green-400" />
//               </div>
              
//               <h3 className="text-2xl mb-3">Create Request</h3>
//               <p className="text-gray-300 mb-8 flex-grow">
//                 Post a new carbon credit request and get AI-powered recommendations
//               </p>
              
//               <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
//                 New Request
//                 <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
//               </Button>
//             </Link>
//           </motion.div>

//           {/* Browse Requests Card */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5, duration: 0.6 }}
//             className="relative group"
//           >
//             <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//             <Link href="/seller/requests" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
//               <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
//                 <Search className="w-7 h-7 text-green-400" />
//               </div>
              
//               <h3 className="text-2xl mb-3">Browse Requests</h3>
//               <p className="text-gray-300 mb-8 flex-grow">
//                 Discover buyer requests and submit competitive quotes
//               </p>
              
//               <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
//                 View Requests
//                 <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
//               </Button>
//             </Link>
//           </motion.div>

//           {/* View Report Card */}
//           {user?.roles?.isBuyer && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.6, duration: 0.6 }}
//               className="relative group"
//             >
//               <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//               <Link href="/analytics/report" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
//                 <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
//                   <FileText className="w-7 h-7 text-green-400" />
//                 </div>
                
//                 <h3 className="text-2xl mb-3">View Report</h3>
//                 <p className="text-gray-300 mb-8 flex-grow">
//                   Comprehensive transaction reports and analytics
//                 </p>
                
//                 <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
//                   View Report
//                   <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
//                 </Button>
//               </Link>
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </section>
//   )
// }


/**
 * Dashboard Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { getDashboard, getBuyerTransactions, getSellerTransactions } from '@/lib/api'
import { TrendingUp, Award, Sparkles, Search, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LightBackground } from '@/components/LightBackground'
import { logger } from '@/lib/logger'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [userTransactionCount, setUserTransactionCount] = useState<number>(0)
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
      
      // Load user's transactions
      await loadUserTransactions()
    } catch (error: any) {
      logger.error('Failed to load dashboard:', error)
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

  const loadUserTransactions = async () => {
    if (!user) {
      setUserTransactionCount(0)
      return
    }
    
    try {
      let totalCount = 0
      
      // Fetch buyer transactions if user is a buyer
      if (user?.roles?.isBuyer) {
        try {
          const buyerTransactions = await getBuyerTransactions()
          totalCount += buyerTransactions.length
        } catch (error) {
          logger.error('Failed to load buyer transactions:', error)
        }
      }
      
      // Fetch seller transactions if user is a seller
      if (user?.roles?.isSeller) {
        try {
          const sellerTransactions = await getSellerTransactions()
          totalCount += sellerTransactions.length
        } catch (error) {
          logger.error('Failed to load seller transactions:', error)
        }
      }
      
      setUserTransactionCount(totalCount)
    } catch (error) {
      logger.error('Failed to load user transactions:', error)
      setUserTransactionCount(0)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen pt-32 pb-24 px-6 overflow-hidden bg-[#0a0a0a]">
      <LightBackground />
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1 className="text-7xl mb-4 font-bold">Welcome to Eco-Nexus</h1>
          <p className="text-xl text-gray-400">
            Intelligent carbon credit marketplace powered by AI & blockchain
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-6xl mb-2">{userTransactionCount}</div>
                  <div className="text-gray-300">My Transactions</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/60 transition-all duration-300 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-6xl mb-2">{user?.sustainabilityScore || 100}</div>
                  <div className="text-gray-300">Sustainability Score</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Request Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <Link href="/buyer/new-request" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
              <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>
              
              <h3 className="text-2xl mb-3">Create Request</h3>
              <p className="text-gray-300 mb-8 flex-grow">
                Post a new carbon credit request and get AI-powered recommendations
              </p>
              
              <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
                New Request
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Browse Requests Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <Link href="/seller/requests" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
              <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <Search className="w-7 h-7 text-green-400" />
              </div>
              
              <h3 className="text-2xl mb-3">Browse Requests</h3>
              <p className="text-gray-300 mb-8 flex-grow">
                Discover buyer requests and submit competitive quotes
              </p>
              
              <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
                View Requests
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* View Report Card */}
          {user?.roles?.isBuyer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <Link href="/analytics/report" className="relative bg-black/50 border-2 border-green-500/50 rounded-2xl p-8 backdrop-blur-xl hover:border-green-500/70 transition-all duration-300 h-full flex flex-col shadow-2xl block">
                <div className="w-14 h-14 rounded-xl bg-green-500/30 border-2 border-green-500/60 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                  <FileText className="w-7 h-7 text-green-400" />
                </div>
                
                <h3 className="text-2xl mb-3">View Report</h3>
                <p className="text-gray-300 mb-8 flex-grow">
                  Comprehensive transaction reports and analytics
                </p>
                
                <Button className="bg-green-600 hover:bg-green-700 text-white w-fit group/btn shadow-lg shadow-green-600/30">
                  View Report
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}