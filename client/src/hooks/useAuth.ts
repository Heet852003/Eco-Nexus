/**
 * Authentication Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { login, register, updateUserRole, getUserProfile } from '@/lib/api'
import type { User } from '@/types'
import { logger } from '@/lib/logger'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      logger.error('Error reading from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await login(email, password)
      if (data.user && typeof window !== 'undefined') {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const handleRegister = async (email: string, name: string, password: string) => {
    try {
      const data = await register(email, name, password)
      if (data.user && typeof window !== 'undefined') {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    } catch (error: any) {
      logger.error('Registration error:', error)
      throw error
    }
  }

  const handleUpdateRole = async (role: 'buyer' | 'seller') => {
    try {
      const data = await updateUserRole(role)
      if (data.user && typeof window !== 'undefined') {
        const updatedUser = data.user
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        // Force a refresh to update all components
        window.dispatchEvent(new Event('user-updated'))
      }
      return data
    } catch (error) {
      logger.error('Update role error:', error)
      throw error
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setUser(null)
    router.push('/login')
  }

  const refreshUser = useCallback(async () => {
    try {
      const data = await getUserProfile()
      if (data.user && typeof window !== 'undefined') {
        const newUser = data.user
        // Only update if user actually changed to prevent infinite loops
        const currentUserStr = localStorage.getItem('user')
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr)
          // Compare only sustainabilityScore to avoid unnecessary updates
          if (currentUser.sustainabilityScore !== newUser.sustainabilityScore) {
            setUser(newUser)
            localStorage.setItem('user', JSON.stringify(newUser))
            // Only dispatch event if sustainability score actually changed
            window.dispatchEvent(new Event('user-updated'))
            return newUser
          }
        } else {
          // No current user, update anyway
          setUser(newUser)
          localStorage.setItem('user', JSON.stringify(newUser))
          return newUser
        }
        return newUser
      }
    } catch (error) {
      logger.error('Failed to refresh user:', error)
    }
    return null
  }, [])

  return {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    updateRole: handleUpdateRole,
    logout: handleLogout,
    refreshUser,
    isAuthenticated: !!user
  }
}

