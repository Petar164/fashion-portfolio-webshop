import { NextRequest, NextResponse } from 'next/server'
import { paypalClient, paypalSdk } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FV-${timestamp}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderID, cart } = body

    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })
    }

    // Capture PayPal order
    const captureReq = new paypalSdk.orders.OrdersCaptureRequest(orderID)
    // Cast empty body to satisfy SDK typing; we don't need to send additional params
    captureReq.requestBody({} as any)
    const capture = await paypalClient.execute(captureReq)

    const purchaseUnit = capture.result.purchase_units?.[0]
    const payer = capture.result.payer
    const amount = purchaseUnit?.payments?.captures?.[0]?.amount

    // If cart is provided from client, use it to create our order; otherwise fail
    if (!cart) {
      return NextResponse.json({ error: 'Missing cart data for local order creation' }, { status: 400 })
    }

    const {
      items,
      shippingAddress,
      subtotal = 0,
      shipping = 0,
      tax = 0,
      discount = 0,
      total = 0,
      discountCode,
    } = cart

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 })
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Missing shipping address' }, { status: 400 })
    }

    // Resolve or create user by email
    let userId: string | null = null
    if (shippingAddress.email) {
      let user = await prisma.user.findUnique({ where: { email: shippingAddress.email } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: shippingAddress.email,
            password: 'guest',
            name: shippingAddress.name,
            role: 'customer',
          },
        })
      }
      userId = user.id
    }

    // Create shipping address
    let addressId: string | null = null
    if (userId) {
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
    }

    // Compute order number and payment info
    const orderNumber = generateOrderNumber()
    const paymentIntentId = capture.result.id
    const paidTotal = amount?.value ? Number(amount.value) : Number(total)

    // Create local order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: shippingAddress.email,
        customerName: shippingAddress.name,
        status: 'processing',
        subtotal: Number(subtotal || 0),
        shipping: Number(shipping || 0),
        tax: Number(tax || 0),
        total: paidTotal,
        currency: 'EUR',
        paymentMethod: 'paypal',
        paymentIntentId,
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

    // Inventory updates
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
            data: { quantity: newQuantity, inStock: newInStock },
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
                data: { quantity: newVariantQuantity, inStock: newVariantInStock },
              })
            }
          }
        }
      } catch (err) {
        console.error('[PAYPAL CAPTURE] Inventory update failed for item', item.id, err)
      }
    }

    // Discount usage
    if (discountCode) {
      try {
        await prisma.discountCode.update({
          where: { code: discountCode },
          data: { usedCount: { increment: 1 } },
        })
      } catch (err) {
        console.error('[PAYPAL CAPTURE] Failed to update discount usage', err)
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
      console.error('[PAYPAL CAPTURE] Failed to send confirmation email', emailErr)
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      paymentIntentId,
      total: paidTotal,
    })
  } catch (error: any) {
    console.error('[PAYPAL CAPTURE] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}

