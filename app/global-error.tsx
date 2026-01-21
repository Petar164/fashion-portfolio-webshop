'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
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
              className="mb-6 flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                <AlertCircle size={40} className="text-white" />
              </div>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-8">
              {error.message || 'An unexpected error occurred'}
            </p>

            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors mx-auto"
            >
              <RefreshCw size={20} />
              Try again
            </motion.button>
          </motion.div>
        </div>
      </body>
    </html>
  )
}

