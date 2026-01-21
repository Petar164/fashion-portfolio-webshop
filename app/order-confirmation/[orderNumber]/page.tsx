'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { CheckCircle, Package, Mail } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCartStore()
  
  // Clear cart when order confirmation page loads (prevents flash of empty cart)
  useEffect(() => {
    clearCart()
  }, [clearCart])

  useEffect(() => {
    // In a real app, you'd fetch order details from API
    // For now, we'll just show the order number
    if (orderNumber) {
      setOrder({
        id: '',
        orderNumber: orderNumber,
        status: 'pending',
        total: 0,
        createdAt: new Date().toISOString(),
      })
      setLoading(false)
    }
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={48} className="text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-light mb-4 text-white tracking-[0.1em] uppercase">
              Order Confirmed
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-light mb-2">
              Thank you for your purchase
            </p>
            <p className="text-white text-lg font-light tracking-wider">
              Order #{orderNumber}
            </p>
          </div>

          <div className="bg-black border-2 border-gray-900 p-6 md:p-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={20} />
                <span className="text-sm uppercase tracking-wider font-light">
                  A confirmation email has been sent to your email address
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Package size={20} />
                <span className="text-sm uppercase tracking-wider font-light">
                  Your order is being processed
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 py-4 border-2 border-gray-900 text-white font-light tracking-[0.1em] uppercase text-sm md:text-base hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="flex-1 py-4 md:py-5 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white text-center"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

