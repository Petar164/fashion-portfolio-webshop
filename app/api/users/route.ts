import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET - Get all users (admin only)
export async function GET() {
  try {
    await requireAdminApi()
    
    // Try to fetch with verified field first
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          role: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(users)
    } catch (dbError: any) {
      // If verified column doesn't exist (P2021 = unknown column), fetch without it
      if (dbError.code === 'P2021' || dbError.message?.includes('Unknown column') || dbError.message?.includes('verified')) {
        console.log('[Users API] verified column not found, fetching without it')
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            location: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Add verified: false to all users for frontend compatibility
        return NextResponse.json(users.map((u: any) => ({ ...u, verified: false })))
      }
      throw dbError
    }
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

