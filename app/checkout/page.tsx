'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { useCartStore } from '@/lib/store'
import CheckoutProgress from '@/components/CheckoutProgress'
import CheckoutStep1 from '@/components/CheckoutStep1'
import CheckoutStep2 from '@/components/CheckoutStep2'
import CheckoutStep3 from '@/components/CheckoutStep3'
import { calculateVAT } from '@/lib/vat'
import { getCountryCode } from '@/lib/countries'
import toast from 'react-hot-toast'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    apartment: '',
    city: '',
    province: '',
    zip: '',
    country: '',
    zone: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shipping, setShipping] = useState({ cost: 0, method: '', estimatedDays: '' })
  const [shippingLoading, setShippingLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0)
  const [discountCodeData, setDiscountCodeData] = useState<{ code: string; type: string } | null>(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  
  // Calculate subtotal (VAT-inclusive - prices already include VAT)
  const subtotal = getTotal()
  const subtotalAfterDiscount = subtotal - appliedDiscount
  
  // Extract VAT from VAT-inclusive prices (always 21% regardless of country)
  // VAT is calculated on the discounted subtotal
  const vatResult = calculateVAT({ subtotal: subtotalAfterDiscount })
  
  const vat = vatResult.amount
  // Total = subtotal (VAT-inclusive) - discount + shipping
  const total = subtotalAfterDiscount + shipping.cost

  // PayPal client ID (live)
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

  const orderPayload = useMemo(() => ({
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    shippingAddress: formData,
    subtotal,
    shipping: shipping.cost || 0,
    tax: vat,
    discount: appliedDiscount,
    total: subtotalAfterDiscount + shipping.cost,
    discountCode: discountCodeData?.code || null,
  }), [items, formData, subtotal, shipping.cost, vat, appliedDiscount, subtotalAfterDiscount, discountCodeData])

  // Prevent hydration mismatch by only rendering cart-dependent content on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Clear errors when form data changes (only when user types)
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Clear errors for fields that have been filled
      const newErrors = { ...errors }
      let hasChanges = false

      if (formData.name.trim() && errors.name) {
        delete newErrors.name
        hasChanges = true
      }
      if (formData.email.trim() && errors.email) {
        // Only clear if email format is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(formData.email.trim())) {
          delete newErrors.email
          hasChanges = true
        }
      }
      if (formData.address.trim() && errors.address) {
        delete newErrors.address
        hasChanges = true
      }
      if (formData.city.trim() && errors.city) {
        delete newErrors.city
        hasChanges = true
      }
      if (formData.zip.trim() && errors.zip) {
        const zipRegex = /^[A-Z0-9\s-]{4,10}$/i
        if (zipRegex.test(formData.zip.trim())) {
          delete newErrors.zip
          hasChanges = true
        }
      }
      if (formData.country && errors.country) {
        delete newErrors.country
        hasChanges = true
      }
      if (formData.phone.trim() && errors.phone) {
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
        if (phoneRegex.test(formData.phone.trim())) {
          delete newErrors.phone
          hasChanges = true
        }
      }

      if (hasChanges) {
        setErrors(newErrors)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, formData.email, formData.address, formData.city, formData.zip, formData.country, formData.phone])

  // Calculate shipping when zone or items change
  useEffect(() => {
    if (!formData.zone || items.length === 0) {
      setShipping({ cost: 0, method: '', estimatedDays: '' })
      return
    }

    const calculateShippingCost = async () => {
      setShippingLoading(true)
      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(item => ({
              category: item.category || 'accessories',
              quantity: item.quantity
            })),
            zone: formData.zone,
            countryName: formData.country,
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setShipping({
            cost: data.cost || 0,
            method: data.method || '',
            estimatedDays: data.estimatedDays || ''
          })
        }
      } catch (error) {
        console.error('Failed to calculate shipping:', error)
      } finally {
        setShippingLoading(false)
      }
    }

    calculateShippingCost()
  }, [formData.zone, items])

  // Handle discount code validation
  const handleApplyDiscount = async () => {
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
          subtotal: subtotal
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
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(0)
    setDiscountCodeData(null)
    setDiscountCode('')
  }

  // Validate Step 1 (Shipping Address)
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required'
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Please enter a complete address'
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'Please enter a valid city name'
    }

    // ZIP validation
    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required'
    } else {
      // Basic ZIP validation (allows various formats)
      const zipRegex = /^[A-Z0-9\s-]{4,10}$/i
      if (!zipRegex.test(formData.zip.trim())) {
        newErrors.zip = 'Please enter a valid ZIP code'
      }
    }

    // Shipping zone validation
    if (!formData.zone) {
      newErrors.country = 'Please select a shipping zone'
    }
    // Country name for label
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required for the shipping label'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      // Basic phone validation (allows various formats)
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate Step 2 (Payment Method)
  const validateStep2 = (): boolean => {
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
      } else {
        // Scroll to first error
        const firstErrorField = Object.keys(errors)[0]
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                         document.querySelector(`input[placeholder*="${firstErrorField}"]`)
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3)
      }
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    // Clear errors when going back
    setErrors({})
  }

  const handlePurchase = async () => {
    setIsProcessing(true)
    
    try {
      // Ensure shipping is calculated
      if (!formData.zone) {
        toast.error('Please select a shipping zone')
        setIsProcessing(false)
        return
      }
      if (!formData.country.trim()) {
        toast.error('Please enter your country')
        setIsProcessing(false)
        return
      }

      // Recalculate total to ensure it's correct
      const finalSubtotal = subtotal
      const finalDiscount = appliedDiscount
      const finalShipping = shipping.cost || 0
      const finalTotal = finalSubtotal - finalDiscount + finalShipping

      console.log('[CHECKOUT] Purchase calculation:', {
        subtotal: finalSubtotal,
        discount: finalDiscount,
        shipping: finalShipping,
        total: finalTotal,
        shippingLoading,
      })

      if (finalTotal <= 0 && finalSubtotal > 0) {
        toast.error('Please wait for shipping calculation to complete')
        setIsProcessing(false)
        return
      }

      const orderData = orderPayload

      console.log('[CHECKOUT] Sending order data:', {
        itemsCount: orderData.items.length,
        shippingAddress: orderData.shippingAddress,
        total: orderData.total,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
      })

      let paymentResponse

      // Handle different payment methods
      if (paymentMethod === 'stripe') {
        paymentResponse = await fetch('/api/checkout/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        })

        const data = await paymentResponse.json().catch(() => ({}))

        if (!paymentResponse.ok || !data.url) {
          console.error('Stripe session error:', data)
          toast.error(data.error || 'Unable to start Stripe Checkout')
          setIsProcessing(false)
          return
        }

        window.location.href = data.url
      } else if (paymentMethod === 'paypal') {
        if (paypalButtons) {
          toast.error('Please use the PayPal button to complete payment.')
        } else {
          toast.error('PayPal is not available (missing client ID).')
        }
        setIsProcessing(false)
        return
      } else {
        toast.error('Payment method not implemented')
        setIsProcessing(false)
        return
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('An error occurred during checkout')
      setIsProcessing(false)
    }
  }

  const paypalButtons = useMemo(() => {
    if (paymentMethod !== 'paypal' || !paypalClientId) return null
    return (
      <div className="flex flex-col gap-3">
        <PayPalButtons
          style={{ layout: 'vertical', height: 48 }}
          createOrder={async () => {
            try {
              const res = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
              })
              const data = await res.json()
              if (!res.ok || !data.id) {
                toast.error(data.error || 'Unable to start PayPal Checkout')
                throw new Error(data.error || 'PayPal create failed')
              }
              return data.id
            } catch (err) {
              console.error('PayPal create error:', err)
              toast.error('Unable to start PayPal Checkout')
              throw err
            }
          }}
          onApprove={async (data) => {
            try {
              setIsProcessing(true)
              const res = await fetch('/api/payments/paypal/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID, cart: orderPayload }),
              })
              const result = await res.json()
              if (!res.ok || !result.success || !result.orderNumber) {
                console.error('PayPal capture error:', result)
                toast.error(result.error || 'Failed to finalize PayPal payment')
                setIsProcessing(false)
                return
              }
              window.location.href = `/order-confirmation/${result.orderNumber}`
            } catch (err) {
              console.error('PayPal capture error:', err)
              toast.error('Failed to finalize PayPal payment')
              setIsProcessing(false)
            }
          }}
          onError={(err) => {
            console.error('PayPal button error:', err)
            toast.error('PayPal checkout failed')
          }}
        />
      </div>
    )
  }, [paymentMethod, paypalClientId, orderPayload])

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-light mb-4 text-white tracking-widest uppercase">Your cart is empty</h2>
            <p className="text-gray-400 mb-8 text-sm uppercase tracking-wider font-light">Add some items to your cart to continue</p>
            <a
              href="/"
              className="inline-block px-8 py-4 bg-white text-black border-2 border-white font-light tracking-[0.1em] uppercase text-sm hover:bg-gray-100 hover:border-gray-200 transition-all duration-300"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    )
  }

  const content = (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-light mb-8 md:mb-12 text-white text-center tracking-[0.1em] uppercase">
            Checkout
          </h1>

          {/* Progress Indicator */}
          <CheckoutProgress currentStep={currentStep} />

          {/* Checkout Steps */}
          <div className="bg-black border-2 border-gray-900 p-6 md:p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <CheckoutStep1
                  key="step1"
                  formData={formData}
                  setFormData={setFormData}
                  onNext={handleNext}
                  errors={errors}
                />
              )}
              {currentStep === 2 && (
                <CheckoutStep2
                  key="step2"
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <CheckoutStep3
                  key="step3"
                  items={items}
                  formData={formData}
                  paymentMethod={paymentMethod}
                  subtotal={subtotal}
                  appliedDiscount={appliedDiscount}
                  discountCode={discountCode}
                  discountCodeData={discountCodeData}
                  onDiscountCodeChange={setDiscountCode}
                  onApplyDiscount={handleApplyDiscount}
                  onRemoveDiscount={handleRemoveDiscount}
                  validatingDiscount={validatingDiscount}
                  shipping={shipping.cost}
                  shippingMethod={shipping.method}
                  vat={vat}
                  total={total}
                  onBack={handleBack}
                  onPurchase={handlePurchase}
                  isProcessing={isProcessing}
                  hidePurchaseButton={paymentMethod === 'paypal' && !!paypalButtons}
                  paypalButtons={paypalButtons}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )

  if (paypalClientId) {
    return (
      <PayPalScriptProvider
        options={{
          'client-id': paypalClientId,
          clientId: paypalClientId,
          currency: 'EUR',
          // hide card / iDEAL options in the Smart Button
          'disable-funding': 'card,ideal',
        }}
      >
        {content}
      </PayPalScriptProvider>
    )
  }

  return content
}

