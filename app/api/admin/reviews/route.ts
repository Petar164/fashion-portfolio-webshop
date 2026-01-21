import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

// GET - Get all reviews (approved and pending) for admin
export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'pending', 'approved', or 'all'

    const where: any = {}
    if (filter === 'pending') {
      where.approved = false
    } else if (filter === 'approved') {
      where.approved = true
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
            avatarUrl: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    })

    return NextResponse.json(reviews)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    console.error('[ADMIN REVIEWS] GET error', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
