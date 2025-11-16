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
      console.error('Registration error:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="glass-strong rounded-3xl p-12 w-full max-w-md border border-purple-500/30 shadow-2xl shadow-purple-500/10 fade-in">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <Leaf className="w-16 h-16 text-purple-400 mx-auto" />
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3 tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-lg">Join EcoNexus today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="modern-input w-full pl-12 pr-4 py-4 rounded-xl"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="modern-input w-full pl-12 pr-4 py-4 rounded-xl"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="modern-input w-full pl-12 pr-4 py-4 rounded-xl"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

