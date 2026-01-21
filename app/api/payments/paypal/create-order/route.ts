import { NextRequest, NextResponse } from 'next/server'
import { paypalClient, paypalSdk } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

let SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  'http://localhost:3001'

// Ensure SITE_URL has a protocol to satisfy PayPal URL requirements
if (!/^https?:\/\//i.test(SITE_URL)) {
  SITE_URL = `https://${SITE_URL.replace(/^\/+/, '')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, subtotal, shipping = 0, tax = 0, discount = 0, total, shippingAddress } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 })
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Missing shipping address' }, { status: 400 })
    }

    // Basic sanity check against DB quantities (optional lightweight check)
    const productIds = items.map((i: any) => i.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, quantity: true, inStock: true, price: true },
    })
    const prodMap = new Map(products.map((p) => [p.id, p]))
    for (const it of items) {
      const p = prodMap.get(it.id)
      if (!p || !p.inStock || p.quantity < it.quantity) {
        return NextResponse.json(
          { error: `Item ${it.name || it.id} is out of stock` },
          { status: 400 }
        )
      }
    }

    const finalSubtotal = Number(subtotal || 0) // VAT-inclusive
    const finalTax = Number(tax || 0) // extracted VAT portion
    const finalShipping = Number(shipping || 0)
    const finalDiscount = Math.max(0, Number(discount || 0))
    // item_total should exclude tax if tax is provided separately
    const itemTotal = Math.max(0, finalSubtotal - finalTax)
    const finalTotal = total ?? itemTotal + finalTax + finalShipping - finalDiscount
    if (!finalTotal || Number(finalTotal) <= 0) {
      return NextResponse.json({ error: 'Invalid total' }, { status: 400 })
    }

    const request = new paypalSdk.orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: Number(finalTotal).toFixed(2),
            breakdown: {
              item_total: { currency_code: 'EUR', value: itemTotal.toFixed(2) },
              shipping: { currency_code: 'EUR', value: finalShipping.toFixed(2) },
              tax_total: { currency_code: 'EUR', value: finalTax.toFixed(2) },
              discount: { currency_code: 'EUR', value: finalDiscount.toFixed(2) },
              // set unused fields to zero to satisfy typings
              handling: { currency_code: 'EUR', value: '0.00' },
              insurance: { currency_code: 'EUR', value: '0.00' },
              shipping_discount: { currency_code: 'EUR', value: '0.00' },
            },
          },
        },
      ],
      application_context: {
        return_url: `${SITE_URL}/paypal/return`,
        cancel_url: `${SITE_URL}/checkout?canceled=1`,
      },
    })

    const order = await paypalClient.execute(request)
    const approvalLink = order.result.links?.find((l: any) => l.rel === 'approve')?.href

    if (!approvalLink || !order.result.id) {
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
    }

    return NextResponse.json({ id: order.result.id, approvalUrl: approvalLink })
  } catch (error: any) {
    console.error('[PAYPAL CREATE] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}

