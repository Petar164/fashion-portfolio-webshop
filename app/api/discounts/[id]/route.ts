import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

// GET - Get single discount code (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    const discountCode = await prisma.discountCode.findUnique({
      where: { id: params.id }
    })

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(discountCode)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    console.error('Error fetching discount code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    )
  }
}

// PATCH - Update discount code (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      usedCount
    } = body

    // Build update data object
    const updateData: any = {}
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = Number(value)
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? Number(minPurchase) : null
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? Number(usageLimit) : null
    // Handle dates - only set if provided and not empty string
    if (validFrom !== undefined) {
      updateData.validFrom = validFrom && validFrom !== '' && validFrom !== null ? new Date(validFrom) : null
    }
    if (validUntil !== undefined) {
      updateData.validUntil = validUntil && validUntil !== '' && validUntil !== null ? new Date(validUntil) : null
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (usedCount !== undefined) updateData.usedCount = Number(usedCount)

    const discountCode = await prisma.discountCode.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(discountCode)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      )
    }
    console.error('Error updating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    )
  }
}

// DELETE - Delete discount code (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    await prisma.discountCode.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Discount code deleted' })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting discount code:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    )
  }
}

