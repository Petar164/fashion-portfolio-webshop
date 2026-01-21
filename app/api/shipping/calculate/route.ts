import { NextRequest, NextResponse } from 'next/server'
import { calculateShipping, ShippingCalculationInput } from '@/lib/shipping'

export async function POST(request: NextRequest) {
  try {
    const body: ShippingCalculationInput = await request.json()
    
    // Validate input
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!body.zone || typeof body.zone !== 'string') {
      return NextResponse.json(
        { error: 'Shipping zone is required' },
        { status: 400 }
      )
    }

    // Calculate shipping
    const result = calculateShipping(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}

