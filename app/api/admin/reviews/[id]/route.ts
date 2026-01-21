import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

// PATCH - Approve, edit, or update review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const { approved, title, content, rating, paymentMethod, imageUrl } = body

    const updateData: any = {}
    if (approved !== undefined) updateData.approved = Boolean(approved)
    if (title !== undefined) updateData.title = title?.trim() || null
    if (content !== undefined) updateData.content = content.trim()
    if (rating !== undefined) {
      if (rating === null || rating === '') {
        updateData.rating = null
      } else {
        const ratingNum = Number(rating)
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
        }
        updateData.rating = ratingNum
      }
    }
    if (paymentMethod !== undefined) {
      const validPaymentMethods = ['paypal_fnf', 'paypal_gs', 'revolut', 'website']
      if (!validPaymentMethods.includes(paymentMethod)) {
        return NextResponse.json(
          { error: 'Invalid payment method' },
          { status: 400 }
        )
      }
      updateData.paymentMethod = paymentMethod
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null

    const review = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(review)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    console.error('[ADMIN REVIEWS] PATCH error', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

// DELETE - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    await prisma.review.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    console.error('[ADMIN REVIEWS] DELETE error', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
