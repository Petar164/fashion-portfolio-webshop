'use client'

import { motion } from 'framer-motion'

interface CheckoutStep2Props {
  paymentMethod: string | null
  setPaymentMethod: (method: string) => void
  onNext: () => void
  onBack: () => void
}

const paymentMethods = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pay with card via Stripe Checkout',
    logo: <img src="/icons/stripe.png" alt="Stripe" className="h-10 w-auto object-contain" />,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    logo: <img src="/icons/paypal.png" alt="PayPal" className="h-10 w-auto object-contain" />,
  },
]

export default function CheckoutStep2({
  paymentMethod,
  setPaymentMethod,
  onNext,
  onBack,
}: CheckoutStep2Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentMethod) {
      onNext()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-[0.1em] uppercase">
          Payment Method
        </h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest font-light">
          Choose how you'd like to pay
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Options */}
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const isSelected = paymentMethod === method.id

            return (
              <motion.label
                key={method.id}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`flex items-center gap-4 md:gap-6 p-5 md:p-6 border-2 cursor-pointer transition-all duration-300 group ${
                  isSelected
                    ? 'bg-white border-white text-black'
                    : 'bg-black border-gray-900 text-white hover:border-gray-700 hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => setPaymentMethod(method.id)}
                  className="w-5 h-5 text-black accent-black cursor-pointer"
                />
                {method.logo && (
                  <div className={`w-16 flex justify-center ${isSelected ? 'text-black' : 'text-white'}`}>
                    {method.logo}
                  </div>
                )}
                <div className="flex-1">
                  <div className={`font-light text-base md:text-lg uppercase tracking-wider ${isSelected ? 'text-black' : 'text-white'}`}>
                    {method.name}
                  </div>
                  <div
                    className={`text-xs md:text-sm uppercase tracking-wider font-light mt-1 ${
                      isSelected ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {method.description}
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-8 h-8 rounded-full bg-black flex items-center justify-center"
                  >
                    <span className="text-white text-sm">✓</span>
                  </motion.div>
                )}
              </motion.label>
            )
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-8 border-t border-gray-900">
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
          <motion.button
            type="submit"
            disabled={!paymentMethod}
            whileHover={{ scale: paymentMethod ? 1.02 : 1 }}
            whileTap={{ scale: paymentMethod ? 0.98 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex-1 py-4 md:py-5 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation min-h-[56px] hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white flex items-center justify-center gap-2"
          >
            Continue to Review
            <span className="text-lg">→</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

