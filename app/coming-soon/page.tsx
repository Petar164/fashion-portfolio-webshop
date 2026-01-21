'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Clock } from 'lucide-react'

export default function ComingSoonPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-black rounded-full flex items-center justify-center">
                <Clock size={48} className="text-white md:w-16 md:h-16" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
              We're Not Open Yet
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 mb-4 leading-relaxed">
              Thank you for your interest in FashionVoid!
            </p>
            
            <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
              We're currently preparing our store and will be launching soon. 
              Check back later or follow us on social media for updates on our grand opening.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors touch-manipulation min-h-[44px]"
              >
                <ArrowLeft size={20} />
                Go Back
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-white border-2 border-black text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Continue Shopping
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

