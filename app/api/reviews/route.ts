import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthApi } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        approved: true, // Only show approved reviews publicly
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    })

    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        rating: r.rating,
        paymentMethod: (r as any).paymentMethod || 'website',
        imageUrl: (r as any).imageUrl || null,
        orderNumber: r.order?.orderNumber || null,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          displayName: r.user.displayName || r.user.name || 'User',
          avatarUrl: r.user.avatarUrl || null,
          verified: (r.user as any).verified || false,
          joinedAt: r.user.createdAt,
        },
      }))
    )
  } catch (error: any) {
    console.error('[REVIEWS] GET error', error)
    // If migration hasn't run, return empty array instead of error
    if (error.code === 'P2021' || error.message?.includes('Unknown column')) {
      console.warn('[REVIEWS] Database migration may not have run yet, returning empty array')
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthApi()
    const body = await req.json()
    const { title, content, rating, paymentMethod, orderId, imageUrl } = body

    // Validate payment method
    const validPaymentMethods = ['paypal_fnf', 'paypal_gs', 'revolut', 'website']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be one of: paypal_fnf, paypal_gs, revolut, website' },
        { status: 400 }
      )
    }

    // If website payment, require completed order and orderId
    if (paymentMethod === 'website') {
      if (!orderId) {
        return NextResponse.json(
          { error: 'Order ID is required for website reviews' },
          { status: 400 }
        )
      }

      // Verify the order exists and belongs to the user
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found or does not belong to you' },
          { status: 404 }
        )
      }
    }

    if (!content || typeof content !== 'string' || content.trim().length < 3) {
      return NextResponse.json(
        { error: 'Review content must be at least 3 characters' },
        { status: 400 }
      )
    }
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Set approval status: approved=true for website, approved=false for paypal/revolut
    const approved = paymentMethod === 'website'

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        orderId: paymentMethod === 'website' ? orderId : null,
        title: title?.trim() || null,
        content: content.trim(),
        rating: rating ? Number(rating) : null,
        paymentMethod: paymentMethod,
        imageUrl: imageUrl || null,
        approved: approved,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: review.id,
      title: review.title,
      content: review.content,
      rating: review.rating,
      paymentMethod: review.paymentMethod,
      imageUrl: review.imageUrl,
      orderNumber: review.order?.orderNumber || null,
      approved: review.approved,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        displayName: review.user.displayName || review.user.name || 'User',
        avatarUrl: review.user.avatarUrl || null,
        joinedAt: review.user.createdAt,
      },
    })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    console.error('[REVIEWS] POST error', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

