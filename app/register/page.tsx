'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com' // Only this email can be admin

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email format'
        } else {
          delete newErrors.email
        }
        break
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters'
        } else {
          delete newErrors.password
        }
        break
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else {
          delete newErrors.confirmPassword
        }
        break
      case 'name':
        if (!value) {
          newErrors.name = 'Name is required'
        } else {
          delete newErrors.name
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate all fields
    validateField('name', formData.name)
    validateField('email', formData.email)
    validateField('password', formData.password)
    validateField('confirmPassword', formData.confirmPassword)

    if (Object.keys(errors).length > 0 || !formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fix the errors in the form')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      toast.success('Account created successfully! Logging in...')
      
      // Auto-login after registration (trim password and normalize email)
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        redirect: false,
      })

      if (result?.ok) {
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        router.refresh()
      } else {
        router.push('/login')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'An error occurred during registration')
      setLoading(false)
    }
  }

  const passwordStrength = formData.password.length > 0 ? Math.min(formData.password.length / 8, 1) : 0

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

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
              Create Account
            </motion.p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'name' ? 'text-white' : 'text-gray-500'
                  }`}
                />
                <input
                  type="text"
                  autoComplete="name"
                  inputMode="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    validateField('name', e.target.value)
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-black/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 placeholder-gray-600 text-base touch-manipulation"
                  placeholder="John Doe"
                  pattern=".*"
                  required
                  disabled={loading}
                />
                <AnimatePresence>
                  {focusedField === 'name' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.name}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
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
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    validateField('email', e.target.value)
                  }}
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
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    validateField('password', e.target.value)
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-black/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 placeholder-gray-600 text-base touch-manipulation"
                  placeholder="••••••••"
                  required
                  minLength={8}
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
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full ${
                        passwordStrength < 0.5
                          ? 'bg-red-500'
                          : passwordStrength < 0.75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                </motion.div>
              )}
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'confirmPassword' ? 'text-white' : 'text-gray-500'
                  }`}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    validateField('confirmPassword', e.target.value)
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-black/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 placeholder-gray-600 text-base touch-manipulation"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <AnimatePresence>
                  {focusedField === 'confirmPassword' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"
                    />
                  )}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword &&
                    formData.confirmPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <Check className="w-5 h-5 text-green-500" />
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 md:py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden mt-6 touch-manipulation min-h-[52px] text-base md:text-lg"
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
                    Creating account...
                  </motion.span>
                ) : (
                  <motion.span
                    key="register"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Create Account
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
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-white hover:underline font-medium transition-all duration-300 hover:text-gray-300"
              >
                Log in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
