import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (subtotal === undefined || typeof subtotal !== 'number') {
      return NextResponse.json(
        { error: 'Subtotal is required' },
        { status: 400 }
      )
    }

    // Find discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code', valid: false },
        { status: 200 } // Return 200 but with valid: false
      )
    }

    // Debug logging
    console.log('Discount code validation:', {
      code: discountCode.code,
      isActive: discountCode.isActive,
      validFrom: discountCode.validFrom,
      validUntil: discountCode.validUntil,
      validFromType: typeof discountCode.validFrom,
      validFromValue: discountCode.validFrom ? new Date(discountCode.validFrom).toISOString() : null
    })

    // Check if code is active
    if (!discountCode.isActive) {
      return NextResponse.json(
        { error: 'This discount code is no longer available', valid: false },
        { status: 200 }
      )
    }

    // Check expiry dates
    const now = new Date()
    
    // Only check validFrom if it's actually set (not null)
    // Prisma returns dates as Date objects or null, so check both
    if (discountCode.validFrom !== null && discountCode.validFrom !== undefined) {
      const validFromDate = new Date(discountCode.validFrom)
      // Check if the date is valid
      if (!isNaN(validFromDate.getTime())) {
        // Compare dates - if now is before validFrom, code is not yet valid
        // Use getTime() for accurate comparison
        if (now.getTime() < validFromDate.getTime()) {
          console.log('Discount code not yet valid:', {
            now: now.toISOString(),
            validFrom: validFromDate.toISOString(),
            code: discountCode.code,
            timeDifference: validFromDate.getTime() - now.getTime(),
            hoursUntilValid: (validFromDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          })
          return NextResponse.json(
            { 
              error: 'This discount code is not yet valid', 
              valid: false,
              debug: {
                now: now.toISOString(),
                validFrom: validFromDate.toISOString()
              }
            },
            { status: 200 }
          )
        }
      }
    }

    // Only check validUntil if it's actually set (not null)
    if (discountCode.validUntil !== null && discountCode.validUntil !== undefined) {
      const validUntilDate = new Date(discountCode.validUntil)
      // Check if the date is valid
      if (!isNaN(validUntilDate.getTime())) {
        // Add one day to validUntil to include the full day
        const validUntilEndOfDay = new Date(validUntilDate)
        validUntilEndOfDay.setHours(23, 59, 59, 999)
        
        if (now > validUntilEndOfDay) {
          return NextResponse.json(
            { error: 'This discount code has expired', valid: false },
            { status: 200 }
          )
        }
      }
    }

    // Check usage limits
    if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
      return NextResponse.json(
        { error: 'This discount code has reached its usage limit', valid: false },
        { status: 200 }
      )
    }

    // Check minimum purchase requirement
    if (discountCode.minPurchase && subtotal < Number(discountCode.minPurchase)) {
      return NextResponse.json(
        { 
          error: `Minimum purchase of €${Number(discountCode.minPurchase).toFixed(2)} required`,
          valid: false 
        },
        { status: 200 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.type === 'percentage') {
      discountAmount = subtotal * (Number(discountCode.value) / 100)
      // Apply max discount limit if set
      if (discountCode.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(discountCode.maxDiscount))
      }
    } else if (discountCode.type === 'fixed') {
      discountAmount = Number(discountCode.value)
      // Don't allow discount to exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal)
    }

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      type: discountCode.type,
      discountAmount: Number(discountAmount.toFixed(2)),
      originalSubtotal: subtotal,
      discountedSubtotal: subtotal - discountAmount
    })
  } catch (error) {
    console.error('Discount validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    )
  }
}

