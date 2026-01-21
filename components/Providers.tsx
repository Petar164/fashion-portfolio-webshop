'use client'

import { SessionProvider } from 'next-auth/react'
import CartSync from './CartSync'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CartSync />
    </SessionProvider>
  )
}

