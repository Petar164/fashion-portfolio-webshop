'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GalaxyStartScreenProps {
  onEnter: () => void
}

export default function GalaxyStartScreen({ onEnter }: GalaxyStartScreenProps) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleContinueAsGuest = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('✅ Continue as Guest clicked')
    
    if (isTransitioning) {
      console.log('⚠️ Already transitioning, ignoring click')
      return
    }
    
    setIsTransitioning(true)
    console.log('🎬 Starting transition...')
    
    // Call onEnter immediately
    setTimeout(() => {
      console.log('✅ Calling onEnter callback')
      onEnter()
    }, 100)
  }

  const handleLoginOrRegister = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('✅ Log In / Register clicked')
    
    // Use window.location for immediate navigation
    console.log('🚀 Navigating to /login')
    window.location.href = '/login'
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="text-center relative z-10" style={{ pointerEvents: 'auto' }}>
        <h1
          className="text-3xl sm:text-4xl md:text-6xl font-thin text-white mb-8 md:mb-12 tracking-wider px-4"
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.15em',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
          }}
        >
          Welcome to the Void
        </h1>

        <div className="flex flex-row flex-wrap gap-3 md:gap-4 items-center justify-center mt-6 md:mt-8 px-4">
          <button
            type="button"
            onClick={handleContinueAsGuest}
            onMouseDown={(e) => {
              e.preventDefault()
              handleContinueAsGuest(e as any)
            }}
            className="px-6 md:px-12 py-3 md:py-4 bg-transparent border-2 border-white text-white text-xs md:text-lg font-light tracking-widest uppercase transition-all duration-300 hover:bg-white hover:text-black hover:scale-105 active:scale-95 min-h-[44px] cursor-pointer touch-manipulation whitespace-nowrap relative z-20"
            style={{ pointerEvents: 'auto' }}
            disabled={isTransitioning}
          >
            Continue as Guest
          </button>
          <button
            type="button"
            onClick={handleLoginOrRegister}
            onMouseDown={(e) => {
              e.preventDefault()
              handleLoginOrRegister(e as any)
            }}
            className="px-6 md:px-12 py-3 md:py-4 bg-white text-black text-xs md:text-lg font-light tracking-widest uppercase transition-all duration-300 hover:bg-gray-200 hover:scale-105 active:scale-95 min-h-[44px] cursor-pointer touch-manipulation whitespace-nowrap relative z-20"
            style={{ pointerEvents: 'auto' }}
          >
            Log In / Register
          </button>
        </div>
      </div>
    </div>
  )
}
