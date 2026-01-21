'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface CheckoutProgressProps {
  currentStep: number
}

const steps = [
  { number: 1, name: 'Shipping', id: 'shipping' },
  { number: 2, name: 'Payment', id: 'payment' },
  { number: 3, name: 'Review', id: 'review' },
]

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="mb-8 md:mb-12">
      {/* Desktop Progress Bar */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-900 -z-10">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {steps.map((step, index) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <motion.div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-white border-white shadow-[0_4px_20px_rgba(255,255,255,0.3)]'
                    : isActive
                    ? 'bg-white border-white shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                    : 'bg-black border-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {isCompleted ? (
                  <Check size={18} className="text-black" />
                ) : (
                  <span
                    className={`text-xs font-light tracking-widest ${
                      isActive ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    {String(step.number).padStart(2, '0')}
                  </span>
                )}
              </motion.div>
              <span
                className={`mt-3 text-xs uppercase tracking-widest font-light ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-light">
            Step {String(currentStep).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
          <span className="text-xs font-light text-white uppercase tracking-widest">
            {steps[currentStep - 1].name}
          </span>
        </div>
        <div className="w-full h-[2px] bg-gray-900 overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  )
}

