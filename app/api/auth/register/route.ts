import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com' // Only this email can be admin

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'admin' },
    })

    // Only allow admin if:
    // 1. Email matches the admin email
    // 2. No admin exists yet
    const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    const shouldBeAdmin = isAdminEmail && !adminExists

    if (isAdminEmail && adminExists) {
      return NextResponse.json(
        { error: 'Admin account already exists. Please contact support.' },
        { status: 403 }
      )
    }

    // Trim and hash password to prevent whitespace issues
    const trimmedPassword = password.trim()
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: shouldBeAdmin ? 'admin' : 'customer',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json({
      message: 'User created successfully',
      user,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Check for database connection errors
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      )
    }
    
    // Check for Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

