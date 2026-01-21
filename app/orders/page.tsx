'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Package, Calendar, Euro } from 'lucide-react'

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
  color?: string
  product?: {
    id: string
    name: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  shipping: number
  tax: number
  createdAt: string
  items: OrderItem[]
  trackingNumber?: string
  shippingMethod?: string
}

export default function OrdersPage() {
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
      setLoading(true)
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        // Normalize data to ensure consistent types (API returns strings, but interface expects numbers)
        const normalizedData = data.map((order: any) => ({
          ...order,
          total: typeof order.total === 'string' ? parseFloat(order.total) : Number(order.total || 0),
          subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : Number(order.subtotal || 0),
          shipping: typeof order.shipping === 'string' ? parseFloat(order.shipping) : Number(order.shipping || 0),
          tax: typeof order.tax === 'string' ? parseFloat(order.tax) : Number(order.tax || 0),
          items: order.items?.map((item: any) => ({
            ...item,
            price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price || 0),
          })) || [],
        }))
        setOrders(normalizedData)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-400',
      processing: 'text-blue-400',
      shipped: 'text-purple-400',
      delivered: 'text-green-400',
      completed: 'text-emerald-400',
      cancelled: 'text-red-400',
      refunded: 'text-gray-400',
    }
    return colors[status] || 'text-gray-400'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-16 md:pt-20 px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400">Loading orders...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16 md:pt-20 px-4 md:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="text-sm uppercase tracking-wider">Back to Profile</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-thin text-white tracking-wider mb-2">
            Order History
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            View all your past orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-light text-white mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-8">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-white text-black font-light tracking-[0.1em] uppercase text-sm hover:bg-gray-200 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-xl md:text-2xl font-light text-white">
                        Order #{order.orderNumber}
                      </h2>
                      <span className={`text-sm uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro size={16} />
                        <span>€{typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : Number(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/order-confirmation/${order.orderNumber}`}
                    className="text-sm uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                  >
                    View Details →
                  </Link>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-black border border-gray-800">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.productName}
                          className="w-16 h-16 md:w-20 md:h-20 object-contain border border-gray-800"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-light">{item.productName}</p>
                        {item.size && (
                          <p className="text-gray-400 text-sm">Size: {item.size}</p>
                        )}
                        {item.color && (
                          <p className="text-gray-400 text-sm">Color: {item.color}</p>
                        )}
                        <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-white font-medium">
                        €{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-gray-400 text-sm text-center pt-2">
                      +{order.items.length - 3} more item(s)
                    </p>
                  )}
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-500">Tracking:</span>{' '}
                      <span className="text-white">{order.trackingNumber}</span>
                    </p>
                    {order.shippingMethod && (
                      <p className="text-sm text-gray-400 mt-1">
                        <span className="text-gray-500">Shipping:</span>{' '}
                        <span className="text-white">{order.shippingMethod}</span>
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

