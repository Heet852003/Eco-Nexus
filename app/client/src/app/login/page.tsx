/**
 * Login Page
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
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
          <h1 className="text-4xl font-bold gradient-text mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 text-lg">Login to your EcoNexus account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

