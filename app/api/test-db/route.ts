import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test connection
    await prisma.$connect()
    
    // Try a simple query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    })
  } catch (error: any) {
    console.error('[TEST-DB] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...',
    }, { status: 500 })
  }
}

