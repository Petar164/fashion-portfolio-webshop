'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { Package, Calendar, DollarSign, Truck } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: string
  size?: string
  color?: string
  product: {
    id: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: string
  subtotal: string
  shipping: string
  tax: string
  createdAt: string
  items: OrderItem[]
  trackingNumber?: string
}

export default function PurchasesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        // Ensure all totals are strings for consistency
        const normalizedData = data.map((order: any) => ({
          ...order,
          total: String(order.total || 0),
          subtotal: String(order.subtotal || 0),
          shipping: String(order.shipping || 0),
          tax: String(order.tax || 0),
          items: order.items?.map((item: any) => ({
            ...item,
            price: String(item.price || 0),
          })) || [],
        }))
        setOrders(normalizedData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-400'
      case 'completed':
        return 'text-emerald-400'
      case 'shipped':
        return 'text-blue-400'
      case 'processing':
        return 'text-yellow-400'
      case 'cancelled':
      case 'refunded':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">My Purchases</h1>
            <p className="text-gray-400">View your order history</p>
          </motion.div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Package size={64} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">No orders yet</h2>
              <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">Order {order.orderNumber}</h3>
                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="flex items-center gap-1">
                            <Truck size={14} />
                            <span>Tracking: {order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <div className="flex items-center gap-2 text-white font-semibold text-lg">
                        <DollarSign size={20} />
                        <span>€{typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : Number(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 bg-gray-800/50 rounded-lg p-4"
                      >
                        {item.product && item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.name}
                            className="w-20 h-20 object-contain rounded"
                          />
                        )}
                        <div className="flex-1">
                          <Link
                            href={item.product?.id ? `/product/${item.product.id}` : '#'}
                            className="text-white font-medium hover:text-gray-300 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>Quantity: {item.quantity}</span>
                            {(item.size || item.color) && (
                              <span>
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.color && ' • '}
                                {item.color && `Color: ${item.color}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-white font-semibold">
                          €{typeof item.price === 'string' ? (parseFloat(item.price) * item.quantity).toFixed(2) : (Number(item.price || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

