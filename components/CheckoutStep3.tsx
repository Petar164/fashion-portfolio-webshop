'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Package, MapPin, CreditCard, AlertCircle, Lock } from 'lucide-react'
import { CartItem } from '@/lib/store'

interface CheckoutStep3Props {
  items: CartItem[]
  formData: {
    name: string
    email: string
    address: string
    city: string
    zip: string
    country: string
  }
  paymentMethod: string | null
  subtotal: number
  appliedDiscount?: number
  discountCode?: string
  discountCodeData?: { code: string; type: string } | null
  onDiscountCodeChange?: (code: string) => void
  onApplyDiscount?: () => void
  onRemoveDiscount?: () => void
  validatingDiscount?: boolean
  shipping: number
  shippingMethod?: string
  vat: number
  total: number
  onBack: () => void
  onPurchase: () => void
  isProcessing: boolean
  paypalButtons?: React.ReactNode
  hidePurchaseButton?: boolean
}

export default function CheckoutStep3({
  items,
  formData,
  paymentMethod,
  subtotal,
  appliedDiscount = 0,
  discountCode = '',
  discountCodeData,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  validatingDiscount = false,
  shipping,
  shippingMethod,
  vat,
  total,
  onBack,
  onPurchase,
  isProcessing,
  paypalButtons,
  hidePurchaseButton = false,
}: CheckoutStep3Props) {
  const paymentMethodNames: Record<string, string> = {
    stripe: 'Credit/Debit Card',
    paypal: 'PayPal',
    applepay: 'Apple Pay',
    klarna: 'Klarna',
  }

  // Check if US customer (for import fees estimate)
  const isUSCustomer = formData.country === 'United States'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-[0.1em] uppercase">
          Review Your Order
        </h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest font-light">
          Please review your order details before purchasing
        </p>
      </div>

      <div className="space-y-6">
        {/* Shipping Address Review */}
        <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
          <h3 className="text-base md:text-lg font-light mb-4 text-white uppercase tracking-widest">
            Shipping Address
          </h3>
          <div className="text-gray-300 text-sm space-y-1.5 font-light">
            <p className="text-white font-normal">{formData.name}</p>
            <p>{formData.address}</p>
            <p>
              {formData.city}, {formData.zip}
            </p>
            <p className="uppercase tracking-wider">{formData.country}</p>
          </div>
        </div>

        {/* Payment Method Review */}
        <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
          <h3 className="text-base md:text-lg font-light mb-4 text-white uppercase tracking-widest">
            Payment Method
          </h3>
          <p className="text-gray-300 text-sm uppercase tracking-wider font-light">
            {paymentMethod ? paymentMethodNames[paymentMethod] : 'Not selected'}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
          <h3 className="text-base md:text-lg font-light mb-6 text-white uppercase tracking-widest">
            Order Items
          </h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.cartId}
                className="flex gap-4 pb-4 border-b border-gray-900 last:border-0 last:pb-0"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden border-2 border-gray-900">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-light text-white text-sm md:text-base truncate uppercase tracking-wide mb-1">
                    {item.name}
                  </h4>
                  {item.size && (
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-light">Size: {item.size}</p>
                  )}
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-light">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-white text-base md:text-lg tracking-wider">
                  €{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Discount Code Input */}
        {onDiscountCodeChange && onApplyDiscount && (
          <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
            <h3 className="text-base md:text-lg font-light mb-4 text-white uppercase tracking-widest">
              Discount Code
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-3 bg-black border-2 border-gray-800 text-white placeholder:text-gray-500 focus:border-gray-700 focus:outline-none transition-all duration-300 font-light text-sm uppercase tracking-wider"
                disabled={validatingDiscount || !!discountCodeData}
              />
              {discountCodeData ? (
                <motion.button
                  type="button"
                  onClick={onRemoveDiscount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="px-4 py-3 border-2 border-gray-800 text-white hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-xs uppercase tracking-widest font-light"
                >
                  Remove
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={onApplyDiscount}
                  disabled={validatingDiscount || !discountCode.trim()}
                  whileHover={{ scale: validatingDiscount ? 1 : 1.02 }}
                  whileTap={{ scale: validatingDiscount ? 1 : 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="px-4 py-3 border-2 border-gray-800 text-white hover:border-gray-700 hover:bg-white/5 transition-all duration-300 text-xs uppercase tracking-widest font-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingDiscount ? 'Validating...' : 'Apply'}
                </motion.button>
              )}
            </div>
            {discountCodeData && (
              <div className="mt-3 flex items-center justify-between text-sm text-green-400">
                <span>Discount applied ({discountCodeData.code})</span>
                <span>-€{appliedDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
          <h3 className="text-base md:text-lg font-light mb-6 text-white uppercase tracking-widest">
            Price Breakdown
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-300">
              <span className="uppercase tracking-wider font-light">Subtotal</span>
              <span className="font-light">€{subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span className="uppercase tracking-wider font-light">Discount</span>
                <span className="font-light">-€{appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-300">
              <span className="uppercase tracking-wider font-light">Shipping</span>
              <span className="font-light text-right">
                <span className="block">€{shipping.toFixed(2)}</span>
                {shippingMethod && (
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-light block mt-1">
                    {shippingMethod}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span className="uppercase tracking-wider font-light">VAT (21% included)</span>
              <span className="font-light">€{vat.toFixed(2)}</span>
            </div>
            {isUSCustomer && (
              <div className="pt-3 border-t border-gray-900">
                <div className="flex items-start gap-2 text-gray-400 text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="font-light leading-relaxed">
                    Import fees/tariffs may apply. These are typically handled by the
                    carrier and paid upon delivery.
                  </span>
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-gray-900 flex justify-between text-lg md:text-xl font-medium text-white mt-4">
              <span className="uppercase tracking-wider">Total</span>
              <span className="tracking-wider">€{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-light">
              All prices include 21% VAT. VAT breakdown shown for transparency. All sales final.
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-black border-2 border-gray-900 p-5 md:p-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 border-2 border-gray-800 bg-black text-white focus:border-white focus:ring-0 cursor-pointer transition-all duration-300 group-hover:border-gray-700"
            />
            <span className="text-xs md:text-sm text-gray-300 font-light leading-relaxed">
              I agree to the{' '}
              <a href="/terms" className="text-white underline hover:text-gray-400 transition-colors">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-white underline hover:text-gray-400 transition-colors">
                Privacy Policy
              </a>
              . I understand that all sales are final.
            </span>
          </label>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-900">
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex-1 py-4 border-2 border-gray-900 text-white font-light tracking-[0.1em] uppercase text-sm md:text-base hover:border-gray-700 hover:bg-white/5 transition-all duration-300 touch-manipulation min-h-[56px]"
          >
            ← Back
          </motion.button>
          {!hidePurchaseButton && (
            <motion.button
              type="button"
              onClick={onPurchase}
              disabled={isProcessing}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex-1 py-4 md:py-5 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation min-h-[56px] hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Purchase
                </>
              )}
            </motion.button>
          )}
        </div>
        {hidePurchaseButton && paypalButtons && (
          <div className="pt-4 flex justify-center">
            <div className="w-full max-w-[420px]">
              {paypalButtons}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

