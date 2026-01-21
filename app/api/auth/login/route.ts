import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          details: { missingFields: !email ? ['email'] : ['password'] }
        },
        { status: 400 }
      )
    }

    // Normalize email (lowercase) and trim password
    const normalizedEmail = email.toLowerCase().trim()
    const trimmedPassword = password.trim()

    console.log('[LOGIN] Attempting login for:', normalizedEmail)

    // Check if user exists
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    } catch (dbError: any) {
      console.error('[LOGIN] Database error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: {
            message: dbError.message,
            code: dbError.code,
            hint: 'Check if DATABASE_URL is configured correctly and database is running'
          }
        },
        { status: 503 }
      )
    }

    if (!user) {
      console.log('[LOGIN] User not found:', normalizedEmail)
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          details: {
            reason: 'User not found',
            email: normalizedEmail,
            hint: 'Make sure you have registered with this email address'
          }
        },
        { status: 401 }
      )
    }

    console.log('[LOGIN] User found:', { id: user.id, email: user.email, role: user.role })

    // Verify password (use trimmed password)
    let isPasswordValid
    try {
      isPasswordValid = await bcrypt.compare(trimmedPassword, user.password)
    } catch (bcryptError: any) {
      console.error('[LOGIN] Password comparison error:', bcryptError)
      return NextResponse.json(
        { 
          error: 'Password verification failed',
          details: {
            message: bcryptError.message,
            hint: 'There was an error verifying your password'
          }
        },
        { status: 500 }
      )
    }

    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password for:', normalizedEmail)
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          details: {
            reason: 'Password does not match',
            email: normalizedEmail,
            hint: 'Double-check your password. Passwords are case-sensitive.'
          }
        },
        { status: 401 }
      )
    }

    console.log('[LOGIN] Login successful for:', normalizedEmail)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('[LOGIN] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: {
          message: error.message,
          hint: 'Please try again or contact support if the problem persists'
        }
      },
      { status: 500 }
    )
  }
}

