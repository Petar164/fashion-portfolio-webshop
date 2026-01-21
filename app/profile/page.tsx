'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Package, Heart, LogOut, MapPin, Upload, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useCartStore } from '@/lib/store'
import Navbar from '@/components/Navbar'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: Array<{
    id: string
    productName: string
    quantity: number
    price: number
  }>
}

interface WishlistItem {
  id: string
  name: string
  price: number
  images: string[]
  category: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState({
    displayName: '',
    avatarUrl: '',
    bio: '',
    location: '',
  })
  const { clearCart } = useCartStore()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchProfileData()
    }
  }, [status, router])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setProfileLoading(true)
      // Fetch orders and wishlist in parallel
      const [ordersRes, wishlistRes, profileRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/wishlist'),
        fetch('/api/profile'),
      ])

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        // Normalize data to ensure consistent types (API returns strings, but interface expects numbers)
        const normalizedOrders = ordersData.map((order: any) => ({
          ...order,
          total: typeof order.total === 'string' ? parseFloat(order.total) : Number(order.total || 0),
          subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : Number(order.subtotal || 0),
          shipping: typeof order.shipping === 'string' ? parseFloat(order.shipping) : Number(order.shipping || 0),
          tax: typeof order.tax === 'string' ? parseFloat(order.tax) : Number(order.tax || 0),
        }))
        setOrders(normalizedOrders)
      }

      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json()
        setWishlistItems(wishlistData)
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile({
          displayName: profileData.displayName || '',
          avatarUrl: profileData.avatarUrl || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
      setProfileLoading(false)
    }
  }

  const handleLogout = async () => {
    clearCart()
    
    // Sign out and clear all session data
    await signOut({ 
      redirect: false,
      callbackUrl: '/'
    })
    
    // Clear any cached session data
    if (typeof window !== 'undefined') {
      // Clear NextAuth session cookie explicitly
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
        if (name.startsWith('next-auth') || name.startsWith('__Secure-next-auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
    }
    
    router.push('/?showStart=true')
    router.refresh()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to upload image')
        return
      }

      const data = await res.json()
      setProfile((p) => ({ ...p, avatarUrl: data.url }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingAvatar(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removeAvatar = () => {
    setProfile((p) => ({ ...p, avatarUrl: '' }))
  }

  const saveProfile = async () => {
    try {
      setProfileLoading(true)
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Failed to update profile', data)
      } else {
        // Refresh profile data
        fetchProfileData()
      }
    } catch (error) {
      console.error('Failed to update profile', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-400',
      processing: 'text-blue-400',
      shipped: 'text-purple-400',
      delivered: 'text-green-400',
      cancelled: 'text-red-400',
      refunded: 'text-gray-400',
    }
    return colors[status] || 'text-gray-400'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-16 md:pt-20 px-4 md:px-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="text-gray-400">Loading profile...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              <span className="text-sm uppercase tracking-wider">Back</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-thin text-white tracking-wider mb-2">
              Profile
            </h1>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8 mb-6 md:mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-400 md:w-12 md:h-12" />
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-light text-white mb-2">
                  {profile.displayName || session?.user?.name || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm md:text-base">
                  <Mail size={16} />
                  <span>{session?.user?.email}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                    <MapPin size={14} />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.bio && (
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed">{profile.bio}</p>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm md:text-base touch-manipulation min-h-[44px]"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>

          {/* Profile customization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8 mb-6 md:mb-8"
          >
            <h3 className="text-xl md:text-2xl font-light text-white tracking-wider mb-4">Customize Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Display name</label>
                <input
                  value={profile.displayName}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  className="bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
                  placeholder="How you appear in reviews"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Profile Picture</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`flex items-center gap-2 px-4 py-3 bg-black border border-gray-800 text-white text-sm cursor-pointer hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        uploadingAvatar ? 'opacity-50' : ''
                      }`}
                    >
                      <Upload size={16} />
                      {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                  {profile.avatarUrl && (
                    <button
                      onClick={removeAvatar}
                      className="px-4 py-3 bg-black border border-gray-800 text-white text-sm hover:border-red-500/50 transition-all flex items-center gap-2"
                      type="button"
                    >
                      <X size={16} />
                      Remove
                    </button>
                  )}
                </div>
                {profile.avatarUrl && (
                  <p className="text-xs text-gray-500 mt-1">Current: {profile.avatarUrl.substring(0, 50)}...</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Location</label>
                <input
                  value={profile.location}
                  onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                  className="bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
                  placeholder="City / Country"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="bg-black border border-gray-800 text-white px-4 py-3 text-sm outline-none focus:border-white/40"
                  placeholder="Tell others about you"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={profileLoading}
                className="px-6 py-3 bg-white text-black tracking-[0.1em] uppercase text-sm disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <Link
              href="/orders"
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Package size={20} className="text-gray-400" />
                <span className="text-gray-400 text-sm uppercase tracking-wider">Orders</span>
              </div>
              <p className="text-2xl md:text-3xl font-light text-white">{orders.length}</p>
            </Link>
            <Link
              href="/wishlist"
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Heart size={20} className="text-gray-400" />
                <span className="text-gray-400 text-sm uppercase tracking-wider">Wishlist</span>
              </div>
              <p className="text-2xl md:text-3xl font-light text-white">{wishlistItems.length}</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-light text-white tracking-wider">
                Recent Orders
              </h3>
              {orders.length > 0 && (
                <Link
                  href="/orders"
                  className="text-gray-400 hover:text-white text-sm uppercase tracking-wider transition-colors"
                >
                  View All →
                </Link>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 md:p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">No orders yet</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-white text-black font-light tracking-[0.1em] uppercase text-sm hover:bg-gray-200 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <Link
                    key={order.id}
                    href={`/order-confirmation/${order.orderNumber}`}
                    className="block bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-light text-base md:text-lg">
                            Order #{order.orderNumber}
                          </span>
                          <span className={`text-xs md:text-sm uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                          {order.items.length} item(s)
                        </p>
                      </div>
                      <div className="text-white font-medium text-base md:text-lg">
                        €{typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : Number(order.total || 0).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Preview */}
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-light text-white tracking-wider">
                Wishlist
              </h3>
              {wishlistItems.length > 0 && (
                <Link
                  href="/wishlist"
                  className="text-gray-400 hover:text-white text-sm uppercase tracking-wider transition-colors"
                >
                  View All →
                </Link>
              )}
            </div>

            {wishlistItems.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 md:p-12 text-center">
                <Heart size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-white text-black font-light tracking-[0.1em] uppercase text-sm hover:bg-gray-200 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {wishlistItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors"
                  >
                    {item.images && item.images[0] && (
                      <div className="aspect-square relative overflow-hidden bg-gray-800">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-3 md:p-4">
                      <p className="text-white text-xs md:text-sm font-light mb-1 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-gray-400 text-xs md:text-sm">
                        €{item.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

