'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6"
        >
          <h1 className="text-8xl md:text-9xl font-bold text-white mb-4">404</h1>
        </motion.div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
            >
              <Home size={20} />
              Go home
            </motion.button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold border-2 border-gray-800 hover:border-gray-600 transition-colors w-full sm:w-auto"
          >
            <ArrowLeft size={20} />
            Go back
          </button>
        </div>
      </motion.div>
    </div>
  )
}

