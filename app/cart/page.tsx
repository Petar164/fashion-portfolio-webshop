'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useCartStore } from '@/lib/store'
import { calculateVAT } from '@/lib/vat'
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, Heart, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0)
  const [discountCodeData, setDiscountCodeData] = useState<{ code: string; type: string } | null>(null)
  const [savedItems, setSavedItems] = useState<string[]>([])
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  const [productStocks, setProductStocks] = useState<Record<string, number>>({})

  useEffect(() => {
    setMounted(true)
    
    // Fetch stock information for all products in cart
    const fetchProductStocks = async () => {
      const productIds = [...new Set(items.map(item => item.id))]
      const stockMap: Record<string, number> = {}
      
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await fetch(`/api/products/${productId}`)
            if (res.ok) {
              const product = await res.json()
              stockMap[productId] = product.quantity ?? 0
            }
          } catch (error) {
            console.error('Error fetching product stock:', error)
          }
        })
      )
      
      setProductStocks(stockMap)
    }
    
    if (items.length > 0) {
      fetchProductStocks()
    }
  }, [items.length])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>Continue Shopping</span>
            </Link>
            <h1 className="text-3xl md:text-5xl font-light text-white tracking-[0.1em] uppercase flex items-center gap-3">
              Shopping Cart
            </h1>
            <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 border-2 border-gray-900"
            >
              <ShoppingBag size={64} className="mx-auto mb-6 text-gray-700" />
              <h2 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-widest uppercase">Your cart is empty</h2>
              <p className="text-gray-400 mb-8 text-sm uppercase tracking-wider">Add some items to your cart to continue</p>
              <Link
                href="/"
                className="inline-block px-8 py-4 bg-white text-black border-2 border-white font-light tracking-[0.1em] uppercase text-sm hover:bg-gray-100 hover:border-gray-200 transition-all duration-300"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items
                  .filter(item => !savedItems.includes(item.cartId))
                  .map((item, index) => (
                  <motion.div
                    key={item.cartId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black border-2 border-gray-900 p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 group hover:border-gray-700 transition-all duration-300"
                  >
                    {/* Product Image & Info Container */}
                    <div className="flex gap-4 md:gap-6 flex-1 min-w-0">
                      {/* Product Image - Larger */}
                      <Link href={`/product/${item.id}`} className="flex-shrink-0">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 overflow-hidden border-2 border-gray-900 group-hover:border-gray-700 transition-all duration-300">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link href={`/product/${item.id}`}>
                            <h3 className="font-light text-white text-sm sm:text-base md:text-lg mb-2 tracking-wide uppercase hover:text-gray-300 transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                          {item.size && (
                            <p className="text-xs md:text-sm text-gray-400 mb-1 uppercase tracking-wider">Size: {item.size}</p>
                          )}
                          {item.color && (
                            <p className="text-xs md:text-sm text-gray-400 mb-2 sm:mb-3 uppercase tracking-wider">Color: {item.color}</p>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="mt-auto">
                          <p className="text-base sm:text-lg md:text-xl font-medium text-white tracking-wider">
                            €{item.price.toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                              {item.quantity} × €{item.price.toFixed(2)} = €{(item.price * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3 sm:gap-4">
                      {/* Remove & Save for Later */}
                      <div className="flex gap-2 order-2 sm:order-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSavedItems([...savedItems, item.cartId])
                            toast.success('Saved for later')
                          }}
                          className="p-2 border-2 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all duration-300 touch-manipulation rounded-lg"
                          aria-label="Save for later"
                        >
                          <Heart size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            removeItem(item.cartId)
                            toast.success('Removed from cart')
                          }}
                          className="p-2 border-2 border-gray-800 hover:border-red-900/50 hover:text-red-400 transition-all duration-300 touch-manipulation text-gray-400 rounded-lg"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </motion.button>
                      </div>
                      
                      {/* Quantity Controls - Refined */}
                      <div className="flex items-center gap-2 sm:gap-3 border-2 border-gray-800 order-1 sm:order-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const availableStock = productStocks[item.id] ?? item.maxQuantity ?? 999
                            updateQuantity(item.cartId, Math.max(1, item.quantity - 1), availableStock)
                          }}
                          className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:bg-white/5 transition-all duration-300 touch-manipulation font-light"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </motion.button>
                        <span className="w-10 sm:w-12 text-center font-light text-white text-sm sm:text-base tracking-wider">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const availableStock = productStocks[item.id] ?? item.maxQuantity ?? 999
                            const newQuantity = item.quantity + 1
                            
                            if (newQuantity > availableStock) {
                              toast.error(`Only ${availableStock} item(s) available in stock`)
                              return
                            }
                            
                            const success = updateQuantity(item.cartId, newQuantity, availableStock)
                            if (!success) {
                              toast.error(`Only ${availableStock} item(s) available in stock`)
                            }
                          }}
                          disabled={(productStocks[item.id] ?? item.maxQuantity ?? 999) <= item.quantity}
                          className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:bg-white/5 transition-all duration-300 touch-manipulation font-light disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Saved for Later Section */}
                {savedItems.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-900">
                    <h3 className="text-lg font-light text-white mb-4 tracking-widest uppercase">Saved for Later</h3>
                    <div className="space-y-4">
                      {items
                        .filter(item => savedItems.includes(item.cartId))
                        .map((item) => (
                        <motion.div
                          key={item.cartId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-black border border-gray-900 p-4 flex gap-4 opacity-60"
                        >
                          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden border border-gray-900">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm text-white font-light uppercase">{item.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">€{item.price.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSavedItems(savedItems.filter(id => id !== item.cartId))
                              toast.success('Removed from saved items')
                            }}
                            className="p-2 text-gray-500 hover:text-white transition-colors"
                            aria-label="Remove from saved"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-black border-2 border-gray-900 p-6 md:p-8 sticky top-20 space-y-6"
                >
                  <h2 className="text-xl md:text-2xl font-light text-white tracking-[0.1em] uppercase mb-6">Order Summary</h2>
                  
                  {/* Discount Code Input */}
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400 uppercase tracking-widest font-light">Discount Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2 bg-black border-2 border-gray-800 text-white placeholder:text-gray-500 focus:border-gray-700 focus:outline-none transition-all duration-300 font-light text-sm uppercase tracking-wider"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          if (!discountCode.trim()) {
                            toast.error('Please enter a discount code')
                            return
                          }

                          setValidatingDiscount(true)
                          try {
                            const response = await fetch('/api/discounts/validate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                code: discountCode.trim(),
                                subtotal: getTotal()
                              })
                            })

                            const data = await response.json()

                            if (data.valid) {
                              setAppliedDiscount(data.discountAmount)
                              setDiscountCodeData({ code: data.code, type: data.type })
                              toast.success('Discount applied!')
                            } else {
                              setAppliedDiscount(0)
                              setDiscountCodeData(null)
                              toast.error(data.error || 'Invalid discount code')
                            }
                          } catch (error) {
                            console.error('Discount validation error:', error)
                            toast.error('Failed to validate discount code')
                            setAppliedDiscount(0)
                            setDiscountCodeData(null)
                          } finally {
                            setValidatingDiscount(false)
                          }
                        }}
                        disabled={validatingDiscount}
                        className="px-4 py-2 border-2 border-gray-800 text-white hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-xs uppercase tracking-widest font-light disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingDiscount ? 'Validating...' : 'Apply'}
                      </motion.button>
                    </div>
                    {appliedDiscount > 0 && discountCodeData && (
                      <div className="flex items-center justify-between text-sm text-green-400">
                        <span>Discount applied ({discountCodeData.code})</span>
                        <span>-€{appliedDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-gray-900">
                    <div className="flex justify-between text-gray-300 text-sm">
                      <span className="uppercase tracking-wider font-light">Subtotal</span>
                      <span className="font-light">€{getTotal().toFixed(2)}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span className="uppercase tracking-wider font-light">Discount</span>
                        <span className="font-light">-€{appliedDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span className="uppercase tracking-wider font-light">Shipping</span>
                      <span className="font-light">Calculated at checkout</span>
                    </div>
                    {(() => {
                      // Extract VAT from VAT-inclusive price (always 21%)
                      const subtotalAfterDiscount = getTotal() - appliedDiscount
                      const vatResult = calculateVAT({ subtotal: subtotalAfterDiscount })
                      return (
                        <div className="flex justify-between text-gray-400 text-xs">
                          <span className="uppercase tracking-wider font-light">VAT (21% included)</span>
                          <span className="font-light">€{vatResult.amount.toFixed(2)}</span>
                        </div>
                      )
                    })()}
                    <div className="border-t border-gray-900 pt-4 mt-4">
                      <div className="flex justify-between text-xl font-medium text-white mb-1">
                        <span className="uppercase tracking-wider">Total</span>
                        <span className="tracking-wider">€{(getTotal() - appliedDiscount).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-light">Including VAT</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t border-gray-900">
                    <Link
                      href="/checkout"
                      className="block w-full py-4 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base text-center hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white"
                    >
                      Proceed to Checkout
                    </Link>
                    <Link
                      href="/"
                      className="block w-full py-3 border-2 border-gray-800 text-white font-light tracking-[0.1em] uppercase text-sm text-center hover:border-gray-700 hover:bg-white/5 transition-all duration-300"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

