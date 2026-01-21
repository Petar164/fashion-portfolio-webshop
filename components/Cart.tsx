'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import Image from 'next/image'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.x > 200) {
                onClose()
              }
            }}
            className="fixed right-0 top-0 h-full w-full md:max-w-md bg-black border-l-2 border-gray-800 shadow-xl z-50 overflow-y-auto touch-pan-y"
          >
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                <h2 className="text-xl md:text-2xl font-bold text-white">Shopping Cart</h2>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-900 rounded-full transition-colors touch-manipulation text-white"
                  aria-label="Close cart"
                >
                  <X size={24} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">Your cart is empty</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:space-y-4 mb-6">
                    {items.map((item) => (
                      <motion.div
                        key={item.cartId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 md:gap-4 p-3 md:p-4 border border-gray-800 rounded-lg bg-gray-950"
                      >
                        <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base text-white truncate">{item.name}</h3>
                          {item.size && <p className="text-xs md:text-sm text-gray-400 mt-1">Size: {item.size}</p>}
                          {item.color && <p className="text-xs md:text-sm text-gray-400">Color: {item.color}</p>}
                          <p className="text-white font-semibold mt-2 text-base md:text-lg">€{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-2">
                          <button
                            onClick={() => removeItem(item.cartId)}
                            className="p-2 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors touch-manipulation text-gray-400"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="flex items-center gap-2 bg-gray-900 rounded-lg border border-gray-800">
                            <button
                              onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                              className="p-2 hover:bg-gray-800 rounded-l-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="w-10 text-center font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                              className="p-2 hover:bg-gray-800 rounded-r-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                              aria-label="Increase quantity"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t border-gray-800 pt-4 mt-6 sticky bottom-0 bg-black pb-4">
                    <div className="flex justify-between text-lg md:text-xl font-bold mb-4">
                      <span className="text-white">Total:</span>
                      <span className="text-white">€{getTotal().toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 text-center">Including VAT</p>
                    <div className="flex gap-2">
                      <a
                        href="/cart"
                        onClick={(e) => {
                          e.preventDefault()
                          onClose()
                          window.location.href = '/cart'
                        }}
                        className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 active:bg-gray-700 transition-all text-center text-sm touch-manipulation border-2 border-gray-800"
                      >
                        View Cart
                      </a>
                      <a
                        href="/checkout"
                        onClick={(e) => {
                          e.preventDefault()
                          onClose()
                          window.location.href = '/checkout'
                        }}
                        className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all text-center text-sm touch-manipulation"
                      >
                        Checkout
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

