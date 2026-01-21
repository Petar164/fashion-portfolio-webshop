'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/lib/products'

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchWishlist()
    }
  }, [status, router])

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist')
      if (res.ok) {
        const data = await res.json()
        setWishlistItems(data)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWishlistItems(wishlistItems.filter((item) => item.id !== productId))
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
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
            <h1 className="text-4xl font-bold text-white mb-2">My Wishlist</h1>
            <p className="text-gray-400">Items you've saved for later</p>
          </motion.div>

          {wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Heart size={64} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Your wishlist is empty</h2>
              <p className="text-gray-400 mb-6">Start adding items you love to your wishlist</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <ProductCard product={product} index={index} />
                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-4 right-4 p-2 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors z-10"
                  >
                    <Heart size={20} className="text-red-500 fill-red-500" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

