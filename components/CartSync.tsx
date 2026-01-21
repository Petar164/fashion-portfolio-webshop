'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/lib/store'

/**
 * Component that clears cart when user logs out
 */
export default function CartSync() {
  const { status } = useSession()
  const { clearCart } = useCartStore()
  const wasAuthenticated = useRef<boolean>(false)

  useEffect(() => {
    // Track authentication status
    const isAuthenticated = status === 'authenticated'
    
    // If user logs out, clear the cart
    if (wasAuthenticated.current && !isAuthenticated) {
      clearCart()
    }
    
    wasAuthenticated.current = isAuthenticated
  }, [status, clearCart])

  return null
}

