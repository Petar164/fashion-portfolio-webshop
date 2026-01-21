import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth error handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  
  // Log the error for debugging
  console.log('[AUTH ERROR]', error)
  
  // Redirect to login page with error message
  return NextResponse.redirect(new URL(`/login?error=${error || 'unknown'}`, request.url))
}

