/**
 * Register Page
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await register(formData.email, formData.name, formData.password)
      if (result && result.user) {
        toast.success('Registration successful!')
        // Clear form
        setFormData({ email: '', name: '', password: '' })
        // Redirect and refresh to ensure user data is loaded
        router.push('/dashboard')
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error('Registration failed - invalid response')
      }
    } catch (error: any) {
      logger.error('Registration error:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
      <div className="relative bg-black/50 border-2 border-green-500/40 rounded-2xl p-12 w-full max-w-md backdrop-blur-xl shadow-2xl fade-in">
        <div className="absolute inset-0 bg-gradient-radial from-green-500/20 to-transparent blur-2xl opacity-50" />
        <div className="text-center mb-10 relative z-10">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-lg">Join Eco-Nexus today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-black/40 border-2 border-green-500/40 focus:border-green-500/60 text-white placeholder:text-gray-600 outline-none transition-colors backdrop-blur-sm"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-black/40 border-2 border-green-500/40 focus:border-green-500/60 text-white placeholder:text-gray-600 outline-none transition-colors backdrop-blur-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-black/40 border-2 border-green-500/40 focus:border-green-500/60 text-white placeholder:text-gray-600 outline-none transition-colors backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
          >
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-8 text-center text-gray-400 relative z-10">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

