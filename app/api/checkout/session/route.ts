import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FV-${timestamp}-${random}`
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const {
      items,
      shippingAddress,
      subtotal,
      shipping = 0,
      tax = 0,
      discount = 0,
      discountCode,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 })
    }

    if (
      !shippingAddress ||
      !shippingAddress.email ||
      !shippingAddress.name ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.zip ||
      !shippingAddress.country ||
      !shippingAddress.phone
    ) {
      return NextResponse.json(
        { error: 'Shipping address is incomplete. Please fill in all required fields (including phone number).' },
        { status: 400 }
      )
    }

    if (Number(discount) > 0) {
      return NextResponse.json(
        { error: 'Discount codes are not yet supported with Stripe Checkout. Please remove the discount and try again.' },
        { status: 400 }
      )
    }

    const productIds = items.map((item: any) => item.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const sanitizedItems = items.map((item: any) => {
      const product = productMap.get(item.id)
      if (!product) {
        throw new Error(`Product not found: ${item.id}`)
      }
      if (!product.inStock || product.quantity < item.quantity) {
        throw new Error(`Product ${product.name} is out of stock or insufficient quantity`)
      }

      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
      }
    })

    const computedSubtotal = sanitizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const finalShipping = Number(shipping || 0)
    const finalTotal = computedSubtotal + finalShipping - Number(discount || 0)

    if (finalTotal <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero' }, { status: 400 })
    }

    const lineItems = sanitizedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          metadata: {
            productId: item.id,
            size: item.size || '',
            color: item.color || '',
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
    }))

    if (finalShipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Shipping',
            metadata: {
              productId: 'shipping',
              size: '',
              color: '',
            },
          },
          unit_amount: Math.round(finalShipping * 100),
        },
      })
    }

    const orderNumber = generateOrderNumber()
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3001'

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: shippingAddress.email,
      success_url: `${baseUrl}/order-confirmation/${orderNumber}`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      line_items: lineItems,
      metadata: {
        orderNumber,
        userId: session?.user?.id || '',
        shippingAddress: JSON.stringify(shippingAddress),
        items: JSON.stringify(sanitizedItems),
        subtotal: computedSubtotal.toString(),
        shipping: finalShipping.toString(),
        tax: Number(tax || 0).toString(),
        discount: Number(discount || 0).toString(),
        discountCode: discountCode || '',
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error('[STRIPE CHECKOUT SESSION] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

