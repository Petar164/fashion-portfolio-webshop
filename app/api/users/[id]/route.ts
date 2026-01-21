import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to fetch with verified field first
    let user: any
    try {
      user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          bio: true,
          location: true,
          verified: true,
          createdAt: true,
        },
      })
    } catch (dbError: any) {
      // If verified column doesn't exist, fetch without it
      if (dbError.code === 'P2021' || dbError.message?.includes('Unknown column') || dbError.message?.includes('verified')) {
        user = await prisma.user.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            bio: true,
            location: true,
            createdAt: true,
          },
        })
        if (user) {
          (user as any).verified = false
        }
      } else {
        throw dbError
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const reviewsCount = await prisma.review.count({
      where: { userId: params.id },
    })

    return NextResponse.json({
      ...user,
      reviewsCount,
      joinedAt: user.createdAt,
    })
  } catch (error) {
    console.error('[PUBLIC PROFILE] GET error', error)
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
  }
}

