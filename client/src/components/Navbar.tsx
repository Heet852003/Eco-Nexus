/**
 * Navigation Bar Component
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Leaf, LogOut, User, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { logger } from '@/lib/logger'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, updateRole, refreshUser } = useAuth()
  const [changingRole, setChangingRole] = useState(false)

  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer')

  // Initialize active role from user's roles or localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('activeRole') as 'buyer' | 'seller' | null
    if (user?.roles) {
      if (user.roles.isBuyer && !user.roles.isSeller) {
        setActiveRole('buyer')
      } else if (user.roles.isSeller && !user.roles.isBuyer) {
        setActiveRole('seller')
      } else if (user.roles.isBuyer && user.roles.isSeller) {
        // User has both roles, use stored role or default to buyer
        setActiveRole(storedRole || 'buyer')
      }
    }
  }, [user?.roles])
  
  // Separate effect for user refresh to avoid infinite loops
  useEffect(() => {
    if (!refreshUser) return
    
    // Listen for user update events to refresh user data
    const handleUserUpdate = async () => {
      await refreshUser()
    }
    window.addEventListener('user-updated', handleUserUpdate)
    
    // Auto-refresh user every 10 seconds to catch score updates (increased interval to reduce load)
    const interval = setInterval(() => {
      refreshUser()
    }, 10000)
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate)
      clearInterval(interval)
    }
  }, [refreshUser])

  const handleRoleChange = async (newRole: 'buyer' | 'seller') => {
    // Prevent multiple clicks
    if (changingRole) return
    
    // Check if user has this role capability
    const hasRoleCapability = 
      (newRole === 'buyer' && user?.roles?.isBuyer) ||
      (newRole === 'seller' && user?.roles?.isSeller)
    
    // If user doesn't have this role, enable it first
    if (!hasRoleCapability) {
      setChangingRole(true)
      try {
        const data = await updateRole(newRole) // This will enable the role
        if (data?.user) {
          // Update local state immediately
          setActiveRole(newRole)
          toast.success(`✅ Enabled ${newRole} role!`)
          // Store updated user in localStorage
          localStorage.setItem('user', JSON.stringify(data.user))
          localStorage.setItem('activeRole', newRole)
          // Force page refresh to update all components
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          toast.error('Failed to update role - no user data returned')
        }
      } catch (error: any) {
        logger.error('Role update error:', error)
        const errorMsg = error.response?.data?.error || error.message || `Failed to enable ${newRole} role`
        toast.error(errorMsg)
      } finally {
        setChangingRole(false)
      }
      return
    }
    
    // If user already has the role, just switch context (no API call needed)
    setActiveRole(newRole)
    toast.success(`Switched to ${newRole} mode`)
    // Store active role in localStorage for persistence
    localStorage.setItem('activeRole', newRole)
  }

  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl">Eco-Nexus</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          {user && activeRole === 'buyer' && (
            <>
              <Link href="/buyer/requests" className="text-sm text-gray-400 hover:text-white transition-colors">
                Requests
              </Link>
              <Link href="/buyer/transactions" className="text-sm text-gray-400 hover:text-white transition-colors">
                Transactions
              </Link>
              {user?.roles?.isBuyer && (
                <Link href="/analytics/report" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Report
                </Link>
              )}
            </>
          )}
          {user && activeRole === 'seller' && (
            <>
              <Link href="/seller/requests" className="text-sm text-gray-400 hover:text-white transition-colors">
                Requests
              </Link>
              <Link href="/seller/quotes" className="text-sm text-gray-400 hover:text-white transition-colors">
                My Quotes
              </Link>
              <Link href="/seller/transactions" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sales
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => handleRoleChange('buyer')}
                  disabled={changingRole}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeRole === 'buyer'
                      ? 'bg-green-600 text-white'
                      : user.roles?.isBuyer
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 opacity-50 cursor-not-allowed'
                  } disabled:opacity-50`}
                  title={!user.roles?.isBuyer ? 'Click to enable Buyer role' : ''}
                >
                  Buyer
                </button>
                <button
                  onClick={() => handleRoleChange('seller')}
                  disabled={changingRole}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeRole === 'seller'
                      ? 'bg-green-600 text-white'
                      : user.roles?.isSeller
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 opacity-50 cursor-not-allowed'
                  } disabled:opacity-50`}
                  title={!user.roles?.isSeller ? 'Click to enable Seller role' : ''}
                >
                  Seller{!user.roles?.isSeller && <span className="ml-1">+</span>}
                </button>
                {changingRole && (
                  <RefreshCw className="w-4 h-4 text-green-400 animate-spin mx-2" />
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-sm text-white">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                {activeRole === 'seller' ? 'Seller' : 'Buyer'}
              </Button>
              <Link href="/login">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

