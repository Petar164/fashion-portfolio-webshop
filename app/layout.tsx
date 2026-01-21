// Force rebuild to regenerate Prisma client
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  title: 'FashionVoid - Immersive Fashion Webshop',
  description: 'Discover unique fashion pieces with an immersive shopping experience',
}

// Force dynamic rendering to skip static generation
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-black text-white`}>
        <Providers>
          {children}
          <Toaster 
            position="top-center"
            containerStyle={{
              top: 20,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

