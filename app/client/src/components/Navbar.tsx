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
        console.log(`Enabling ${newRole} role for user...`)
        const data = await updateRole(newRole) // This will enable the role
        console.log('Role update response:', data)
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
        console.error('Role update error:', error)
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
    <nav className="glass-strong border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative">
            <Leaf className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition" />
          </div>
          <span className="text-2xl font-bold gradient-text tracking-tight">EcoNexus</span>
        </Link>

        {user && (
          <div className="flex items-center space-x-8">
            {/* Main Navigation - Clean & Minimal */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className={`text-sm font-medium transition-all ${
                  pathname === '/dashboard' 
                    ? 'text-purple-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              {activeRole === 'buyer' && (
                <>
                  <Link 
                    href="/buyer/requests" 
                    className={`text-sm font-medium transition-all ${
                      pathname?.startsWith('/buyer') 
                        ? 'text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    My Requests
                  </Link>
                  <Link 
                    href="/buyer/transactions" 
                    className={`text-sm font-medium transition-all ${
                      pathname === '/buyer/transactions' 
                        ? 'text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Transactions
                  </Link>
                  {user?.roles?.isBuyer && (
                    <Link 
                      href="/analytics/report" 
                      className={`text-sm font-medium transition-all ${
                        pathname === '/analytics/report' 
                          ? 'text-purple-400' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Report
                    </Link>
                  )}
                </>
              )}
              {activeRole === 'seller' && (
                <>
                  <Link 
                    href="/seller/requests" 
                    className={`text-sm font-medium transition-all ${
                      pathname?.startsWith('/seller/requests') 
                        ? 'text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Requests
                  </Link>
                  <Link 
                    href="/seller/quotes" 
                    className={`text-sm font-medium transition-all ${
                      pathname === '/seller/quotes' 
                        ? 'text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    My Quotes
                  </Link>
                  <Link 
                    href="/seller/transactions" 
                    className={`text-sm font-medium transition-all ${
                      pathname === '/seller/transactions' 
                        ? 'text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sales
                  </Link>
                </>
              )}
            </div>

            {/* Role Switcher - Modern Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 glass rounded-full p-1 border border-purple-500/30">
                <button
                  onClick={() => handleRoleChange('buyer')}
                  disabled={changingRole}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeRole === 'buyer'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50'
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
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50'
                      : user.roles?.isSeller
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 opacity-50 cursor-not-allowed'
                  } disabled:opacity-50`}
                  title={!user.roles?.isSeller ? 'Click to enable Seller role' : ''}
                >
                  Seller{!user.roles?.isSeller && <span className="ml-1">+</span>}
                </button>
                {changingRole && (
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin mx-2" />
                )}
              </div>
              
              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:block font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

