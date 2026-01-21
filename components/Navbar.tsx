'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X, User, LogOut, Package, Heart, LogIn, UserPlus, Star } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Cart from './Cart'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const itemCount = useCartStore((state) => state.getItemCount())
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdminAccount =
    status === 'authenticated' &&
    session?.user?.role === 'admin' &&
    session?.user?.email === 'fashionvoidhelp@gmail.com'
  const isAuthenticated = status === 'authenticated'

  // Prevent hydration mismatch with cart store
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const handleLogout = async () => {
    // Clear cart before signing out
    const { clearCart } = useCartStore.getState()
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
    
    setIsProfileOpen(false)
    // Redirect to home and force show start screen
    router.push('/?showStart=true')
    router.refresh()
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10 transition-all duration-300 hover:bg-black/60 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl md:text-2xl font-thin text-white tracking-[0.1em] uppercase">
              FASHION<span className="text-gray-400">VOID</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm tracking-[0.1em] uppercase font-light">
                Shop
              </Link>
              <Link href="/reviews" className="text-gray-300 hover:text-white transition-colors text-sm tracking-[0.1em] uppercase font-light flex items-center gap-1">
                <Star size={14} />
                Reviews
              </Link>
              {isAdminAccount && (
                <Link href="/admin" className="text-white/60 hover:text-white transition-colors text-sm tracking-widest uppercase font-light">
                  Admin
                </Link>
              )}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-white/60 hover:text-white transition-colors touch-manipulation"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={20} />
                {mounted && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold z-10"
                    style={{ transform: 'translate(25%, -25%)' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="p-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <User size={24} />
                  </button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50"
                      >
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors"
                          >
                            <p className="text-white text-sm font-medium">{session?.user?.name || 'User'}</p>
                            <p className="text-gray-400 text-xs mt-1">{session?.user?.email}</p>
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <Package size={18} />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/wishlist"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <Heart size={18} />
                            <span>Wishlist</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-800"
                          >
                            <LogOut size={18} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors border border-white/20 rounded-sm hover:border-white/40 text-sm tracking-widest uppercase font-light"
                  >
                    <LogIn size={16} />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm tracking-widest uppercase font-light"
                  >
                    <UserPlus size={16} />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button - Optimized touch target */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-3 text-white/80 active:text-white touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            
            {/* Mobile Cart & Profile - Always visible on mobile */}
            <div className="md:hidden flex items-center gap-2 relative">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 text-white/80 active:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={20} />
                {mounted && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-white text-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-semibold z-10"
                    style={{ transform: 'translate(25%, -25%)' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="p-3 text-white/80 active:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="User profile"
                  >
                    <User size={20} />
                  </button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50"
                      >
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors"
                          >
                            <p className="text-white text-sm font-medium">{session?.user?.name || 'User'}</p>
                            <p className="text-gray-400 text-xs mt-1">{session?.user?.email}</p>
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <Package size={18} />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/wishlist"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <Heart size={18} />
                            <span>Wishlist</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-800"
                          >
                            <LogOut size={18} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-3 text-white/80 active:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Login"
                >
                  <LogIn size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-4 py-4 space-y-0 bg-black border-t border-white/10">
                <Link
                  href="/"
                  className="block py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] flex items-center tracking-widest uppercase font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  href="/reviews"
                  className="block py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] flex items-center tracking-widest uppercase font-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reviews
                </Link>
                {isAdminAccount && (
                  <Link
                    href="/admin"
                    className="block py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] flex items-center tracking-widest uppercase font-light"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] tracking-widest uppercase font-light"
                    >
                      <Package size={18} />
                      <span>My Purchases</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] tracking-widest uppercase font-light"
                    >
                      <Heart size={18} />
                      <span>Wishlist</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] text-left tracking-widest uppercase font-light border-t border-white/10 mt-2"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-4 px-4 text-white/80 active:text-white active:bg-white/5 transition-colors text-base touch-manipulation min-h-[48px] tracking-widest uppercase font-light"
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-4 px-4 bg-white text-black active:bg-white/90 transition-colors text-base touch-manipulation min-h-[48px] tracking-widest uppercase font-light mt-2"
                    >
                      <UserPlus size={18} />
                      <span>Register</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

