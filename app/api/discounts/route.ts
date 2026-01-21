import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

// GET - List all discount codes (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(discountCodes)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    console.error('Error fetching discount codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    )
  }
}

// POST - Create new discount code (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const {
      code,
      type, // 'percentage' or 'fixed'
      value,
      minPurchase,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive = true
    } = body

    // Validate required fields
    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: 'Code, type, and value are required' },
        { status: 400 }
      )
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json(
        { error: 'Type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    // Create discount code
    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minPurchase: minPurchase ? Number(minPurchase) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        // Only set dates if they're provided and not empty strings
        validFrom: validFrom && validFrom !== '' && validFrom !== null ? new Date(validFrom) : null,
        validUntil: validUntil && validUntil !== '' && validUntil !== null ? new Date(validUntil) : null,
        isActive: Boolean(isActive)
      }
    })

    return NextResponse.json(discountCode, { status: 201 })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    )
  }
}

