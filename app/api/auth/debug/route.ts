import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Debug endpoint to check database connection and users
export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    // Get all users (without passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
      },
      users,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        database: {
          connected: false,
        },
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      },
      { status: 500 }
    )
  }
}

