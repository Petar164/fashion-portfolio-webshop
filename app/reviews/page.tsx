'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import { X, Upload } from 'lucide-react'

interface Review {
  id: string
  title: string | null
  content: string
  rating: number | null
  paymentMethod: string
  imageUrl: string | null
  orderNumber: string | null
  createdAt: string
  user: {
    id: string
    displayName: string
    avatarUrl: string | null
    verified: boolean
    joinedAt: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
}

export default function ReviewsPage() {
  const { status } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [hasOrder, setHasOrder] = useState<boolean | null>(null)
  const isAuthenticated = status === 'authenticated'

  const loadReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reviews')
      const data = await res.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setReviews(data)
      } else {
        console.error('Invalid reviews data:', data)
        setReviews([])
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch (error) {
      console.error('Failed to load reviews', error)
      toast.error('Failed to load reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data || [])
        const hasCompletedOrder = Array.isArray(data) && data.some((order: any) => order.status === 'completed')
        setHasOrder(hasCompletedOrder)
      }
    } catch (error) {
      console.error('Failed to load orders', error)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders()
    } else {
      setHasOrder(null)
    }
  }, [isAuthenticated])

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }

    setUploadingImage(true)
    try {
      // Compress image if needed
      let fileToUpload = file
      const maxSizeMB = 2
      const originalSizeMB = file.size / (1024 * 1024)

      if (originalSizeMB > maxSizeMB) {
        toast.loading(`Compressing image...`, { id: 'compressing' })
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: file.type,
        }
        try {
          fileToUpload = await imageCompression(file, options)
          toast.dismiss('compressing')
        } catch (compressionError) {
          console.warn('Compression failed, using original file:', compressionError)
          toast.dismiss('compressing')
        }
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const res = await fetch('/api/reviews/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await res.json()
      setImageUrl(data.url)
      toast.success('Image uploaded')
    } catch (error: any) {
      console.error('Image upload failed', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Write a review')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (paymentMethod === 'website' && !selectedOrderId) {
      toast.error('Please select an order')
      return
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          rating: rating || null,
          paymentMethod: paymentMethod,
          orderId: paymentMethod === 'website' ? selectedOrderId : null,
          imageUrl: imageUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit review')
        return
      }

      if (paymentMethod === 'website') {
        toast.success('Review submitted!')
      } else {
        toast.success('Review submitted! It will be visible after admin approval.')
      }

      // Reset form
      setContent('')
      setTitle('')
      setRating(null)
      setPaymentMethod('')
      setSelectedOrderId('')
      setImageUrl(null)
      loadReviews()
    } catch (error) {
      console.error('Submit review failed', error)
      toast.error('Failed to submit review')
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'paypal_fnf': return 'PayPal (Friends & Family)'
      case 'paypal_gs': return 'PayPal (Goods & Services)'
      case 'revolut': return 'Revolut'
      case 'website': return 'Through the website'
      default: return method
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-light text-white tracking-[0.1em] uppercase">Reviews</h1>
            <p className="text-gray-400 mt-3 text-sm uppercase tracking-widest font-light">
              See what others say and share your experience
            </p>
          </div>

          {isAuthenticated ? (
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 space-y-4">
              <h2 className="text-xl text-white font-light tracking-[0.1em] uppercase">Leave a review</h2>
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value)
                    if (e.target.value !== 'website') {
                      setSelectedOrderId('')
                    }
                  }}
                  className="w-full bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
                >
                  <option value="">Select payment method</option>
                  <option value="paypal_fnf">PayPal (Friends & Family)</option>
                  <option value="paypal_gs">PayPal (Goods & Services)</option>
                  <option value="revolut">Revolut</option>
                  <option value="website">Through the website</option>
                </select>
              </div>

              {/* Order Dropdown (only for website) */}
              {paymentMethod === 'website' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Order *</label>
                  {hasOrder === false && (
                    <div className="text-yellow-400 text-sm bg-black/40 border border-yellow-800 p-3 mb-2">
                      You need at least one completed order to review through the website.
                    </div>
                  )}
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    disabled={hasOrder === false || orders.length === 0}
                    className="w-full bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40 disabled:opacity-50"
                  >
                    <option value="">Select an order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info message for PayPal/Revolut */}
              {paymentMethod && paymentMethod !== 'website' && (
                <div className="text-blue-400 text-sm bg-black/40 border border-blue-800 p-3">
                  Your review will be sent for admin approval before being published.
                </div>
              )}

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
              />
              
              {/* Rating */}
              <div className="flex items-center gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`px-3 py-2 border ${rating === r ? 'border-white text-white' : 'border-gray-800 text-gray-400'} text-sm`}
                  >
                    {r} ★
                  </button>
                ))}
                <button
                  onClick={() => setRating(null)}
                  className="px-3 py-2 border border-gray-800 text-gray-400 text-sm"
                >
                  No rating
                </button>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Add Photo (optional)</label>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="Review" className="w-full max-w-md h-auto rounded border border-gray-800" />
                    <button
                      onClick={() => setImageUrl(null)}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-black border border-gray-800 text-white cursor-pointer hover:border-white/40 transition-colors">
                    <Upload size={16} />
                    <span className="text-sm">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
                {uploadingImage && (
                  <div className="text-gray-400 text-sm mt-2">Uploading image...</div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  !paymentMethod ||
                  (paymentMethod === 'website' && (!selectedOrderId || hasOrder === false)) ||
                  !content.trim()
                }
                className="px-6 py-3 bg-white text-black tracking-[0.1em] uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 p-6 text-center text-gray-300">
              <p className="mb-3">Login to leave a review.</p>
              <Link href="/login" className="text-white underline">
                Go to Login
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {loading && <div className="text-gray-400">Loading reviews...</div>}
            {!loading && reviews.length === 0 && (
              <div className="text-gray-400">No reviews yet.</div>
            )}
            {!loading &&
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                        {review.user.avatarUrl ? (
                          <img src={review.user.avatarUrl} alt={review.user.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {review.user.displayName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/u/${review.user.id}`}
                            className="text-white hover:underline text-sm"
                          >
                            {review.user.displayName}
                          </Link>
                          {review.user.verified && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium" title="Verified">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        {review.orderNumber && (
                          <div className="text-gray-500 text-xs">
                            Order: {review.orderNumber}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs">
                          {getPaymentMethodLabel(review.paymentMethod)}
                        </div>
                      </div>
                    </div>
                    {review.rating ? (
                      <div className="text-white text-sm">{review.rating} ★</div>
                    ) : null}
                  </div>
                  {review.title && (
                    <h3 className="text-white text-lg font-light mt-3">{review.title}</h3>
                  )}
                  <p className="text-gray-300 mt-2 text-sm leading-relaxed">{review.content}</p>
                  {review.imageUrl && (
                    <div className="mt-3">
                      <img src={review.imageUrl} alt="Review" className="max-w-full h-auto rounded border border-gray-800" />
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
