'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Product } from '@/lib/products'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  index?: number
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check stock availability
    const availableStock = product.quantity ?? 0
    if (availableStock <= 0) {
      toast.error('This product is out of stock')
      return
    }
    
    const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'
    const success = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: firstImage,
      category: product.category || 'accessories',
    }, availableStock)
    
    if (success) {
      toast.success('Added to cart!')
    } else {
      toast.error(`Only ${availableStock} item(s) available in stock`)
    }
  }

  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: (index % 8) * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        y: -8, 
        scale: 1.01,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }}
      className="group relative"
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Mobile-optimized image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-black border border-gray-900 md:border-2 group-hover:border-gray-700 transition-all duration-500">
          {/* Gradient overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-active:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={index < 4}
          />
          
          {/* Minimalist featured badge - mobile optimized */}
          {product.featured && (
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] md:border-l-[60px] border-l-transparent border-t-[40px] md:border-t-[60px] border-t-white z-20">
              <span className="absolute -top-[32px] md:-top-[50px] right-1 md:right-2 text-black text-[8px] md:text-[10px] font-bold tracking-widest rotate-45 origin-center">
                NEW
              </span>
            </div>
          )}
          
          {/* Out of stock overlay - temporarily disabled for testing */}
          {false && !product.inStock && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 backdrop-blur-sm">
              <span className="text-white font-light text-xs md:text-sm tracking-[0.2em] uppercase">SOLD OUT</span>
            </div>
          )}
          
          {/* Add to cart - always visible on mobile, hover on desktop */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleQuickAdd}
            disabled={false}
            className="absolute bottom-3 left-3 md:bottom-4 md:left-4 w-11 h-11 md:w-12 md:h-12 bg-white/90 md:bg-white/5 backdrop-blur-xl border-2 border-white/30 md:border-white/10 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center z-20 active:bg-white/100 md:hover:bg-white/15 md:hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} className="md:w-[18px] md:h-[18px] text-black md:text-white transition-transform group-hover:scale-110" />
          </motion.button>
        </div>
        
        {/* Mobile-optimized text layout */}
        <div className="mt-3 md:mt-6 space-y-1">
          <h3 className="font-light text-xs md:text-sm lg:text-base mb-1.5 md:mb-2 text-white tracking-wide uppercase leading-tight line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-between">
            <p className="text-gray-200 md:text-gray-300 text-xs md:text-sm font-medium tracking-wider">
              €{product.price.toFixed(2)}
            </p>
            {/* brand removed - not in Product type */}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

