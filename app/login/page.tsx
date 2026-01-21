'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Add timeout wrapper for signIn
      // Trim password to handle any whitespace issues
      const signInPromise = signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl: '/',
      })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )

      const result = await Promise.race([signInPromise, timeoutPromise]) as any

      if (result?.error) {
        toast.error('Invalid email or password', {
          duration: 4000,
        })
        setLoading(false)
        return
      }

      if (result?.ok) {
        toast.success('Logged in successfully!')
        setLoading(false)
        
        // Get user info to determine redirect with timeout
        try {
          const sessionPromise = fetch('/api/auth/session')
          const sessionTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
          )

          const sessionRes = await Promise.race([sessionPromise, sessionTimeoutPromise]) as Response
          
          if (sessionRes.ok) {
            const session = await sessionRes.json()
            if (session?.user?.role === 'admin') {
              // Use window.location for a full page reload to ensure session is fresh
              window.location.href = '/admin'
              return
            }
          }
          
          // Default redirect for non-admin or if session fetch fails
          window.location.href = '/'
        } catch (sessionError) {
          console.error('Error fetching session:', sessionError)
          // Redirect anyway - session will be available on next page load
          window.location.href = '/'
        }
      } else {
        toast.error('Login failed. Please try again.', {
          duration: 4000,
        })
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message === 'Login timeout') {
        toast.error('Login is taking too long. Please check your connection and try again.', {
          duration: 5000,
        })
      } else {
        toast.error('An error occurred. Please try again.', {
          duration: 4000,
        })
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background particles removed to avoid window during SSR */}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="text-4xl font-thin text-white mb-2 tracking-wider"
            >
              FASHIONVOID
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 text-sm tracking-wider uppercase"
            >
              Welcome Back
            </motion.p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'email' ? 'text-white' : 'text-gray-500'
                  }`}
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-black/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 placeholder-gray-600 text-base touch-manipulation"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
                <AnimatePresence>
                  {focusedField === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'password' ? 'text-white' : 'text-gray-500'
                  }`}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-black/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 placeholder-gray-600 text-base touch-manipulation"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <AnimatePresence>
                  {focusedField === 'password' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 md:py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden touch-manipulation min-h-[52px] text-base md:text-lg"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                    />
                    Logging in...
                  </motion.span>
                ) : (
                  <motion.span
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Login
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-white hover:underline font-medium transition-all duration-300 hover:text-gray-300"
              >
                Register
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
