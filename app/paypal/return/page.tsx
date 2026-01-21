'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function PaypalReturnContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [message, setMessage] = useState('Finalizing your payment...')

  useEffect(() => {
    const token = params.get('token')
    const payerId = params.get('PayerID')

    if (!token) {
      setStatus('error')
      setMessage('Missing PayPal token.')
      return
    }

    const capture = async () => {
      try {
        const cartRaw = localStorage.getItem('checkoutCartPayload')
        if (!cartRaw) {
          setStatus('error')
          setMessage('Missing cart data for order creation.')
          return
        }
        const cart = JSON.parse(cartRaw)
        const res = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: token, payerId, cart }),
        })
        const data = await res.json()
        if (!res.ok || !data.success || !data.orderNumber) {
          setStatus('error')
          setMessage(data.error || 'Failed to finalize PayPal payment.')
          return
        }
        localStorage.removeItem('checkoutCartPayload')
        window.location.href = `/order-confirmation/${data.orderNumber}`
      } catch (err) {
        console.error('PayPal capture error', err)
        setStatus('error')
        setMessage('Failed to finalize PayPal payment.')
      }
    }

    capture()
  }, [params])

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl text-white mb-4">PayPal Payment</h1>
          {status === 'processing' ? (
            <p className="text-gray-400">{message}</p>
          ) : (
            <div className="text-red-400">{message}</div>
          )}
          {status === 'error' && (
            <button
              onClick={() => router.push('/checkout')}
              className="mt-6 px-6 py-3 bg-white text-black uppercase tracking-[0.1em] text-sm"
            >
              Return to Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaypalReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <PaypalReturnContent />
    </Suspense>
  )
}

