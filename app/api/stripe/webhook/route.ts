import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripeWebhookSecret, stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')

  if (!stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured' },
      { status: 500 }
    )
  }

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing Stripe-Signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event | null = null
  const rawBody = await req.text()

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret)
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK] Signature verification failed', err?.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}

      const orderNumber = metadata.orderNumber
      const items = metadata.items ? JSON.parse(metadata.items) : []
      const shippingAddress = metadata.shippingAddress ? JSON.parse(metadata.shippingAddress) : null

      if (!orderNumber || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
        console.error('[STRIPE WEBHOOK] Missing required metadata', {
          orderNumber,
          itemsLength: Array.isArray(items) ? items.length : 'invalid',
          hasShippingAddress: !!shippingAddress,
        })
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
      }

      // Idempotency: if order already exists, ack
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber },
      })
      if (existingOrder) {
        return NextResponse.json({ received: true })
      }

      // Resolve user
      let userId: string | null = metadata.userId || null
      // Ensure the user exists; if not, fall back to email-based guest
      if (userId) {
        const existing = await prisma.user.findUnique({ where: { id: userId } })
        if (!existing) {
          userId = null
        }
      }
      if (!userId && shippingAddress.email) {
        let guestUser = await prisma.user.findUnique({
          where: { email: shippingAddress.email },
        })

        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: {
              email: shippingAddress.email,
              password: 'guest',
              name: shippingAddress.name,
              role: 'customer',
            },
          })
        }

        userId = guestUser.id
      }

      // Create shipping address
      let addressId: string | null = null
      if (userId) {
        try {
          const address = await prisma.address.create({
            data: {
              userId,
              fullName: shippingAddress.name,
              street: shippingAddress.address,
              apartment: shippingAddress.apartment || null,
              city: shippingAddress.city,
              province: shippingAddress.province || null,
              postalCode: shippingAddress.zip,
              country: shippingAddress.country,
              phone: shippingAddress.phone || null,
            },
          })
          addressId = address.id
        } catch (addressError: any) {
          console.error('[STRIPE WEBHOOK] Failed to create address:', addressError)
        }
      } else {
        console.warn('[STRIPE WEBHOOK] No userId available, skipping address creation')
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.name,
          status: 'processing',
          subtotal: Number(metadata.subtotal || 0),
          shipping: Number(metadata.shipping || 0),
          tax: Number(metadata.tax || 0),
          total: session.amount_total ? Number(session.amount_total) / 100 : Number(metadata.total || 0),
          currency: session.currency ? session.currency.toUpperCase() : 'EUR',
          paymentMethod: 'stripe',
          paymentIntentId: session.payment_intent?.toString() || null,
          paidAt: new Date(),
          shippingAddressId: addressId,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: Number(item.price),
              name: item.name,
              size: item.size || null,
              color: item.color || null,
            })),
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      })

      // Update inventory
      for (const item of items) {
        try {
          const product = await prisma.product.findUnique({
            where: { id: item.id },
            include: { variants: true },
          })

          if (product) {
            const newQuantity = Math.max(0, product.quantity - item.quantity)
            const newInStock = newQuantity > 0

            await prisma.product.update({
              where: { id: item.id },
              data: {
                quantity: newQuantity,
                inStock: newInStock,
              },
            })

            if (item.size || item.color) {
              const variant = product.variants.find(
                (v) => v.size === item.size && v.color === item.color
              )

              if (variant) {
                const newVariantQuantity = Math.max(0, variant.quantity - item.quantity)
                const newVariantInStock = newVariantQuantity > 0

                await prisma.productVariant.update({
                  where: { id: variant.id },
                  data: {
                    quantity: newVariantQuantity,
                    inStock: newVariantInStock,
                  },
                })
              }
            }
          }
        } catch (inventoryError) {
          console.error('[STRIPE WEBHOOK] Inventory update failed for item', item.id, inventoryError)
        }
      }

      // Update discount usage if present
      if (metadata.discountCode) {
        try {
          await prisma.discountCode.update({
            where: { code: metadata.discountCode },
            data: {
              usedCount: { increment: 1 },
            },
          })
        } catch (discountError) {
          console.error('[STRIPE WEBHOOK] Failed to update discount usage', discountError)
        }
      }

      try {
        await sendOrderConfirmationEmail({
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          total: Number(order.total || 0),
          shipping: Number(order.shipping || 0),
          subtotal: Number(order.subtotal || 0),
          tax: Number(order.tax || 0),
          paymentMethod: order.paymentMethod,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price ?? 0),
            size: item.size || null,
            color: item.color || null,
          })),
          shippingAddress: order.shippingAddress,
        })
      } catch (emailErr) {
        console.error('[STRIPE WEBHOOK] Failed to send confirmation email', emailErr)
      }

      console.log('[STRIPE WEBHOOK] Order created from Checkout session', orderNumber)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

