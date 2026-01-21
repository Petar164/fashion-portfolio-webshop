'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { Product } from '@/lib/products'
import { ShoppingBag, ArrowLeft, Plus, Minus, ChevronLeft, ChevronRight, Ruler, Heart, Share2, X, Maximize2 } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/products/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setProduct(data)
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0])
          }
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0])
          }
          // Limit quantity to available stock
          const availableStock = data.quantity ?? 0
          if (availableStock > 0) {
            setQuantity(Math.min(quantity, availableStock))
          }
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [params.id])
  
  // Update quantity when stock changes
  useEffect(() => {
    if (product) {
      const availableStock = product.quantity ?? 0
      if (availableStock > 0 && quantity > availableStock) {
        setQuantity(availableStock)
      }
    }
  }, [product, quantity])

  const handleAddToCart = () => {
    if (!product) return
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }

    // Check stock availability
    const availableStock = product.quantity ?? 0
    if (availableStock <= 0) {
      toast.error('This product is out of stock')
      return
    }

    // Check if adding this quantity would exceed stock
    const currentCartItems = useCartStore.getState().items
    const cartId = `${product.id}-${selectedSize || 'no-size'}-${selectedColor || 'no-color'}`
    const existingCartItem = currentCartItems.find((i) => i.cartId === cartId)
    const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0
    
    if (currentCartQuantity + quantity > availableStock) {
      toast.error(`Only ${availableStock} item(s) available in stock`)
      return
    }

    const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'
    const productPrice = product.price ? Number(product.price) : 0

    // Add items one by one with stock validation
    let addedCount = 0
    for (let i = 0; i < quantity; i++) {
      const success = addItem({
        id: product.id,
        name: product.name,
        price: productPrice,
        image: firstImage,
        category: product.category || 'accessories',
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      }, availableStock)
      
      if (success) {
        addedCount++
      } else {
        toast.error(`Only ${availableStock - currentCartQuantity} more item(s) available`)
        break
      }
    }
    
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} item(s) to cart!`)
    }
  }

  const nextImage = () => {
    if (product && product.images && selectedImage < product.images.length - 1) {
      setSelectedImage(selectedImage + 1)
    }
  }

  const prevImage = () => {
    if (selectedImage > 0) {
      setSelectedImage(selectedImage - 1)
    }
  }

  // Touch/Swipe handlers for mobile
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !product || !product.images) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && selectedImage < product.images.length - 1) {
      nextImage()
    }
    if (isRightSwipe && selectedImage > 0) {
      prevImage()
    }
    
    touchStartX.current = null
    touchEndX.current = null
  }

  const { data: session } = useSession()

  // Check wishlist status
  useEffect(() => {
    const checkWishlist = async () => {
      if (!session?.user) return
      try {
        const response = await fetch('/api/wishlist')
        if (response.ok) {
          const wishlist = await response.json()
          setIsWishlisted(wishlist.some((item: Product) => item.id === product?.id))
        }
      } catch (error) {
        // Error fetching wishlist
      }
    }
    if (product && session) {
      checkWishlist()
    }
  }, [product, session])

  // Keyboard navigation
  useEffect(() => {
    if (!product) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') {
          setIsLightboxOpen(false)
        }
      }
      if (e.key === 'ArrowLeft' && selectedImage > 0) {
        setSelectedImage(selectedImage - 1)
      }
      if (e.key === 'ArrowRight' && product.images && selectedImage < product.images.length - 1) {
        setSelectedImage(selectedImage + 1)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, product, isLightboxOpen])

  const handleWishlistToggle = async () => {
    if (!product) return
    
    try {
      if (isWishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: 'DELETE' })
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        })
        setIsWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      toast.error('Please log in to use wishlist')
    }
  }

  const handleShare = async () => {
    if (!product) return
    
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: url,
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="w-16 h-16 border-2 border-white/20 rounded-full mx-auto"></div>
            <p className="text-white/40 text-sm tracking-widest uppercase">Loading</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-6 tracking-widest uppercase">Product not found</h2>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 tracking-widest uppercase text-sm font-light"
          >
            Return to Archive
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-16 md:pt-20 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Minimalist back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 md:mb-6 transition-colors touch-manipulation group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs md:text-sm tracking-widest uppercase font-light">Back</span>
          </motion.button>

          {/* Editorial-style layout - asymmetric grid, optimized for fullscreen */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Editorial Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-w-lg"
            >
              {/* Main Image - Full bleed, editorial style */}
              <div className="relative group" ref={imageContainerRef}>
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  className="relative aspect-[3/4] md:aspect-[3/4] lg:aspect-[2/3] overflow-hidden bg-black border-2 border-gray-900 group-hover:border-gray-700 transition-all duration-500 max-h-[80vh] select-none cursor-pointer"
                  style={{ touchAction: 'pan-y' }}
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {product.images && product.images[selectedImage] ? (
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <span className="text-white/40 text-sm">No image</span>
                    </div>
                  )}
                  
                  {/* Fullscreen Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsLightboxOpen(true)
                    }}
                    className="absolute top-4 left-4 w-12 h-12 bg-white/10 backdrop-blur-md border-2 border-gray-800 rounded-full text-white transition-all duration-300 touch-manipulation flex items-center justify-center hover:bg-white/20 hover:border-gray-700 opacity-0 md:opacity-100 md:group-hover:opacity-100"
                    aria-label="View fullscreen"
                  >
                    <Maximize2 size={18} />
                  </button>
                  
                  {/* Minimalist Navigation - Bottom corners */}
                  {product.images && product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                        disabled={selectedImage === 0}
                        className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 backdrop-blur-md border-2 border-gray-800 rounded-full text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center hover:bg-white/20 hover:border-gray-700 opacity-0 md:opacity-100 md:group-hover:opacity-100"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        disabled={selectedImage === product.images.length - 1}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center hover:bg-white/15 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] opacity-0 md:opacity-100 md:group-hover:opacity-100"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                      
                      {/* Image Counter - Minimalist with Glass Morphism */}
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm text-white text-xs tracking-widest shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        {String(selectedImage + 1).padStart(2, '0')} / {String(product.images.length).padStart(2, '0')}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Thumbnail Gallery - Horizontal scroll, minimalist */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden border-2 transition-all duration-300 touch-manipulation ${
                        selectedImage === index
                          ? 'border-white'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <Image
                        src={image || '/placeholder.jpg'}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="80px"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Editorial Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6 md:space-y-8 lg:space-y-8 lg:max-w-lg"
            >
              {/* Header Section - Editorial Style */}
              <div className="space-y-4 md:space-y-6">
                {/* brand removed - not in Product type */}
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-thin text-white tracking-[-0.02em] leading-[1.1]"
                  style={{
                    filter: 'drop-shadow(0 2px 15px rgba(255,255,255,0.1))',
                  }}
                >
                  {product.name}
                </motion.h1>
                
                {/* Price - Large, minimalist */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-baseline gap-3 pt-2 border-t border-white/10"
                >
                  <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-wider">
                    €{product.price ? Number(product.price).toFixed(2) : '0.00'}
                  </span>
                  <span className="text-gray-400 text-xs tracking-[0.15em] uppercase font-light">EUR</span>
                  <span className="text-gray-500 text-[10px] tracking-[0.1em] uppercase font-light ml-2">incl. 21% VAT</span>
                </motion.div>
                
                {/* Description - Editorial spacing */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-300 leading-relaxed text-sm md:text-base pt-4 border-t border-white/10 font-normal"
                >
                  {product.description}
                </motion.p>
                
                {/* Product Details removed (material/weight not in Product type) */}
              </div>

              {/* Size Selection - Editorial Style */}
              {product.sizes && product.sizes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4 border-t border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs md:text-sm text-white/40 uppercase tracking-widest font-light">
                      Size
                    </label>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-light"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.sizes.map((size) => (
                      <motion.button
                        key={size}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 md:px-6 md:py-3.5 border-2 transition-all duration-300 text-sm md:text-base touch-manipulation min-w-[52px] min-h-[52px] font-light tracking-wider ${
                          selectedSize === size
                            ? 'border-white bg-white text-black'
                            : 'border-gray-800 text-white/60 hover:border-gray-700 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Color Selection - Editorial Style */}
              {product.colors && product.colors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="pt-4 border-t border-white/10"
                >
                  <label className="block text-xs md:text-sm text-white/40 uppercase tracking-widest mb-4 font-light">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.colors.map((color) => (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-3 md:px-6 md:py-3.5 border-2 transition-all duration-300 text-sm md:text-base touch-manipulation min-w-[52px] min-h-[52px] font-light tracking-wider ${
                          selectedColor === color
                            ? 'border-white bg-white text-black'
                            : 'border-gray-800 text-white/60 hover:border-gray-700 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {color}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Measurements removed (not in Product type) */}

              {/* Quantity - Minimalist */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="pt-4 border-t border-white/10"
              >
                <label className="block text-xs md:text-sm text-white/40 uppercase tracking-widest mb-4 font-light">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 border-2 border-gray-800 hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-white touch-manipulation flex items-center justify-center font-light"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
                  </motion.button>
                  <span className="text-2xl font-light w-16 text-center text-white tracking-wider">{quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => {
                      const availableStock = product?.quantity ?? 0
                      const maxQuantity = Math.min(quantity + 1, availableStock)
                      setQuantity(maxQuantity)
                      if (maxQuantity >= availableStock && availableStock > 0) {
                        toast.error(`Only ${availableStock} item(s) available`)
                      }
                    }}
                    disabled={!product || (product.quantity ?? 0) <= quantity}
                    className="w-12 h-12 border-2 border-gray-800 hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-white touch-manipulation flex items-center justify-center font-light disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Action Buttons - Editorial Style */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="pt-4 border-t border-white/10 space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={handleAddToCart}
                  disabled={false}
                  className="w-full py-4 md:py-5 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation min-h-[56px] hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white"
                >
                  <ShoppingBag size={18} />
                  Add to Cart
                </motion.button>

                {/* Share & Wishlist Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    className="flex-1 py-3 border-2 border-gray-800 text-white font-light tracking-[0.1em] uppercase text-xs md:text-sm flex items-center justify-center gap-2 hover:border-gray-700 hover:bg-white/5 hover:backdrop-blur-sm transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                  >
                    <Share2 size={16} />
                    Share
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWishlistToggle}
                    className={`flex-1 py-3 border-2 font-light tracking-[0.1em] uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)] ${
                      isWishlisted
                        ? 'border-white bg-white text-black hover:bg-gray-100'
                        : 'border-gray-800 text-white hover:border-gray-700 hover:bg-white/5 hover:backdrop-blur-sm'
                    }`}
                  >
                    <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                    Wishlist
                  </motion.button>
                </div>

                {!product.inStock && (
                  <p className="text-white/40 text-xs text-center tracking-widest uppercase">
                    Currently unavailable
                  </p>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && product && product.images && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full text-white hover:bg-white/15 hover:border-white/20 transition-all duration-300 flex items-center justify-center z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {product.images[selectedImage] && (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  width={1200}
                  height={1600}
                  className="object-contain max-w-full max-h-[90vh]"
                  priority
                />
              )}

              {/* Navigation in lightbox */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prevImage()
                    }}
                    disabled={selectedImage === 0}
                    className="absolute left-4 w-12 h-12 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center hover:bg-white/15 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                    disabled={selectedImage === product.images.length - 1}
                    className="absolute right-4 w-12 h-12 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center hover:bg-white/15 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm text-white text-sm tracking-widest shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    {String(selectedImage + 1).padStart(2, '0')} / {String(product.images.length).padStart(2, '0')}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/90 backdrop-blur-2xl border-2 border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-light text-white tracking-widest uppercase">Size Guide</h3>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="w-10 h-10 border-2 border-gray-800 hover:border-gray-700 transition-all duration-300 flex items-center justify-center text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 text-gray-300">
                <p className="text-sm leading-relaxed">
                  Please refer to size guide details. Measurements are not available for this product.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

