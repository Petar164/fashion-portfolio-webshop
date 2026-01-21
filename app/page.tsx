'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import GalaxyStartScreen from '@/components/GalaxyStartScreen'
import { Product } from '@/lib/products'
import { ArrowRight, Instagram, Mail, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest')
  const [displayCount, setDisplayCount] = useState(12)
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin'
  
  // Only show start screen if user is not logged in or if showStart query param is present
  const [showStartScreen, setShowStartScreen] = useState(true)
  
  useEffect(() => {
    // Add timeout for session check to prevent infinite loading
    const timeoutId = setTimeout(() => {
      // If session is still loading after 5 seconds, assume unauthenticated
      if (status === 'loading') {
        console.warn('Session check timed out, assuming unauthenticated')
        setShowStartScreen(true)
      }
    }, 5000)

    // Check if we should force show start screen (from logout)
    const forceShowStart = searchParams?.get('showStart') === 'true'
    
    // If user is logged in and not forcing start screen, skip the start screen
    if (status === 'authenticated' && !forceShowStart) {
      clearTimeout(timeoutId)
      setShowStartScreen(false)
    } else if (status === 'unauthenticated' || forceShowStart) {
      clearTimeout(timeoutId)
      // Show start screen if not authenticated or if forced
      setShowStartScreen(true)
      // Clean up the query parameter
      if (forceShowStart && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/')
      }
    }

    return () => clearTimeout(timeoutId)
  }, [status, searchParams])

  const handleEnter = () => {
    console.log('🎯 handleEnter called in page.tsx')
    setShowStartScreen(false)
  }

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Products fetch timed out, using empty array')
        setProducts([])
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    fetch('/api/products')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch products')
        }
        return res.json()
      })
      .then((data) => {
        clearTimeout(timeoutId)
        setProducts(data)
        setLoading(false)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.error('Error fetching products:', error)
        // Fallback to empty array
        setProducts([])
        setLoading(false)
      })

    return () => clearTimeout(timeoutId)
  }, [])

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return 0 // newest is default order from API
  })

  // Include all products in archive collection (featured items appear both in featured section and archive)
  const displayedProducts = sortedProducts.slice(0, displayCount)
  const hasMore = sortedProducts.length > displayCount

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 12)
  }

  // Parallax Section Component
  const ParallaxSection = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ["start end", "end start"]
    })
    const y = useTransform(scrollYProgress, [0, 1], [0, -50])
    
    return (
      <motion.div ref={ref} style={{ y }}>
        {children}
      </motion.div>
    )
  }

  // Show start screen immediately if status is still loading (prevents blank screen)
  if (status === 'loading' && showStartScreen) {
    return <GalaxyStartScreen onEnter={handleEnter} />
  }

  return (
    <>
      {showStartScreen ? (
        <GalaxyStartScreen onEnter={handleEnter} />
      ) : (
        <div className="min-h-screen bg-black">
          <Navbar />
      
      {/* Hero Section - Mobile Optimized */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 lg:pt-56 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Enhanced background pattern with grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{
            backgroundImage: `
              radial-gradient(circle, white 1px, transparent 1px),
              linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.01) 50%, transparent 100%)
            `,
            backgroundSize: '40px 40px, 100% 1px',
            backgroundPosition: '0 0, 0 0'
          }}
        />
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, white 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-thin tracking-[-0.05em] leading-[0.85] md:leading-[0.9] relative"
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="block bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
                  style={{
                    filter: 'drop-shadow(0 2px 20px rgba(255,255,255,0.1))',
                  }}
                >
                  FASHION
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="block text-gray-400 md:ml-8 lg:ml-12"
                  style={{
                    filter: 'drop-shadow(0 2px 10px rgba(255,255,255,0.05))',
                  }}
                >
                  VOID
                </motion.span>
                {/* Decorative line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="hidden md:block absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-px bg-white/20 origin-center"
                />
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 max-w-xl mx-auto tracking-[0.15em] uppercase font-light leading-relaxed px-2 flex items-center justify-center gap-1"
              >
                Available in the void
                <span className="inline-flex items-center gap-1 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 0, opacity: 0 }}
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0, 1, 1],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.15 + 2.5,
                        ease: "easeOut",
                        repeatDelay: 2.5,
                      }}
                      className="inline-block"
                    >
                      .
                    </motion.span>
                  ))}
                </span>
              </motion.p>
              <motion.a
                href="#products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white font-light tracking-[0.1em] uppercase text-xs sm:text-sm md:text-base hover:bg-white hover:text-black hover:border-gray-200 transition-all duration-300 touch-manipulation min-h-[48px] active:bg-gray-100 active:text-black"
              >
                <span>Explore</span>
                <ArrowRight size={16} className="md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </div>
          </motion.div>

          {/* Featured Products Banner - Editorial Style with Asymmetric Layout */}
          <ParallaxSection>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-12 md:mb-16 relative"
            >
              {/* Decorative divider line */}
              <div className="hidden md:block absolute -top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {products
              .filter((p) => p.featured)
              .slice(0, 4)
              .map((product, index) => {
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'
                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="block">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] overflow-hidden group cursor-pointer border border-gray-900 md:border-2 hover:border-gray-700 transition-all duration-500 active:scale-[0.98] ${
                        index === 1 ? 'md:-translate-y-5' : ''
                      }`}
                    >
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      
                      {/* Refined gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                      
                      {/* Text overlay with animation */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12"
                      >
                        <div className="border-t border-white/20 pt-4 md:pt-6">
                          <motion.h3 
                            className="text-white font-light text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 md:mb-3 tracking-wide uppercase leading-tight"
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.3 }}
                          >
                            {product.name}
                          </motion.h3>
                          <p className="text-gray-200 text-xs sm:text-sm md:text-base font-medium tracking-wider">
                            €{product.price.toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </Link>
                )
              })}
            </motion.div>
          </ParallaxSection>
        </div>
      </section>

      {/* Products Section - Mobile Optimized */}
      <section id="products" className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8 md:mb-12"
          >
            <div className="inline-block border-t border-b border-white/20 py-3 md:py-4 px-6 md:px-8 mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-[0.1em] uppercase mb-1 md:mb-2">
                Archive Collection
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase font-light">
                {sortedProducts.length} Pieces
              </p>
            </div>

            {/* Filter/Sort Bar - Editorial Style with Glass Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-8 md:mb-12"
            >
              <div className="flex items-center gap-2 border-2 border-gray-900 bg-black/40 backdrop-blur-sm px-4 py-2 hover:border-gray-800 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-light">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
                  className="bg-transparent text-white text-xs uppercase tracking-widest font-light border-none outline-none cursor-pointer appearance-none pr-6"
                >
                  <option value="newest" className="bg-black">Newest</option>
                  <option value="price-low" className="bg-black">Price: Low to High</option>
                  <option value="price-high" className="bg-black">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="text-gray-400 pointer-events-none -ml-4" />
              </div>
            </motion.div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-900 border border-gray-800 mb-3"></div>
                  <div className="h-3 bg-gray-900 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-900 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400 text-sm md:text-lg">No products available yet.</p>
              {isAdmin && (
                <a
                  href="/admin"
                  className="mt-4 inline-block px-6 py-3 bg-white text-black text-sm md:text-base rounded-sm hover:bg-gray-200 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                >
                  Add Your First Product
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 auto-rows-fr mb-8 md:mb-12">
                {displayedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.button
                    onClick={handleLoadMore}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="px-8 py-4 border-2 border-gray-900 text-white font-light tracking-[0.1em] uppercase text-sm hover:border-gray-700 hover:bg-white/5 hover:backdrop-blur-sm transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                  >
                    Load More
                  </motion.button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-20 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h3 className="text-2xl font-thin mb-4 tracking-[0.1em] uppercase" style={{ filter: 'drop-shadow(0 2px 10px rgba(255,255,255,0.1))' }}>
            FashionVoid
          </h3>
          <p className="text-gray-400 mb-6 text-sm uppercase tracking-widest font-light">Your destination for archive fashion</p>
          <div className="flex justify-center items-center gap-6 md:gap-8 flex-wrap">
            <a 
              href="https://www.instagram.com/fashion_v0id/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gray-300 transition-colors touch-manipulation"
              aria-label="Follow us on Instagram"
            >
              <Instagram size={20} />
              <span className="text-sm md:text-base">Instagram</span>
            </a>
            <a 
              href="https://www.pinterest.com/Fashion_Void/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gray-300 transition-colors touch-manipulation"
              aria-label="Follow us on Pinterest"
            >
              <svg 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
              <span className="text-sm md:text-base">Pinterest</span>
            </a>
            <a 
              href="https://www.tiktok.com/@myyvoid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gray-300 transition-colors touch-manipulation"
              aria-label="Follow us on TikTok"
            >
              <svg
                className="w-6 h-6 md:w-6 md:h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M21 8.18c-1.18 0-2.31-.37-3.26-1.05a5.72 5.72 0 0 1-1.5-1.64c-.13-.22-.24-.44-.34-.67-.09-.21-.16-.43-.23-.65-.06-.21-.12-.44-.16-.66-.05-.26-.08-.52-.11-.78H12.9v9.79a2.71 2.71 0 0 1-5.42.16c0-1.5 1.23-2.72 2.73-2.72.22 0 .43.02.64.08v-2.3a5.04 5.04 0 0 0-.64-.04 5 5 0 1 0 5.01 5V8.62a7.6 7.6 0 0 0 2.95 1.22c.27.05.55.09.83.12.29.03.58.04.87.04V8.18Z" />
              </svg>
              <span className="text-sm md:text-base">TikTok</span>
            </a>
          </div>
        </div>
      </footer>
        </div>
      )}
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}

