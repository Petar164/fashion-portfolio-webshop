import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FV-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentIntentId,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      discountCode,
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !paymentMethod || !total) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      )
    }

    // Resolve user (handles stale sessions after DB reset)
    let resolvedUserId: string | null = null
    if (session?.user?.id) {
      const existing = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (existing) {
        resolvedUserId = existing.id
      } else if (session.user.email) {
        const byEmail = await prisma.user.findFirst({ where: { email: session.user.email } })
        if (byEmail) {
          resolvedUserId = byEmail.id
        } else {
          const created = await prisma.user.create({
            data: {
              email: session.user.email,
              password: 'guest',
              name: session.user.name,
              role: session.user.role || 'customer',
            },
          })
          resolvedUserId = created.id
        }
      }
    }

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create shipping address
    let addressId: string | null = null
    if (shippingAddress) {
      // If we have a resolved user, use it; otherwise create/locate guest by email
      if (resolvedUserId) {
        const address = await prisma.address.create({
          data: {
            userId: resolvedUserId,
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
      } else {
        // For guest orders, create or reuse user by email
        let guestUser = await prisma.user.findUnique({
          where: { email: shippingAddress.email },
        })
        
        if (!guestUser) {
          // Create a temporary guest user
          guestUser = await prisma.user.create({
            data: {
              email: shippingAddress.email,
              password: 'guest', // Temporary password, guest users can't login
              name: shippingAddress.name,
              role: 'customer',
            },
          })
        }
        
        // Create address for guest user
        const address = await prisma.address.create({
          data: {
            userId: guestUser.id,
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
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: resolvedUserId,
        customerEmail: shippingAddress.email,
        customerName: shippingAddress.name,
        status: 'pending',
        subtotal: Number(subtotal || 0),
        shipping: Number(shipping || 0),
        tax: Number(tax || 0),
        total: Number(total),
        currency: 'EUR',
        paymentMethod,
        paymentIntentId: paymentIntentId || null,
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
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    })

    // Update inventory for each ordered item
    for (const item of items) {
      try {
        // Find the product
        const product = await prisma.product.findUnique({
          where: { id: item.id },
          include: { variants: true },
        })

        if (product) {
          // Update product quantity
          const newQuantity = Math.max(0, product.quantity - item.quantity)
          const newInStock = newQuantity > 0

          await prisma.product.update({
            where: { id: item.id },
            data: {
              quantity: newQuantity,
              inStock: newInStock,
            },
          })

          console.log(`[ORDER CREATE] Updated inventory for product ${item.id}: quantity ${product.quantity} -> ${newQuantity}, inStock: ${product.inStock} -> ${newInStock}`)

          // If item has size/color, also update variant quantity
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

              console.log(`[ORDER CREATE] Updated variant ${variant.id}: quantity ${variant.quantity} -> ${newVariantQuantity}`)
            }
          }
        }
      } catch (error) {
        console.error(`[ORDER CREATE] Failed to update inventory for product ${item.id}:`, error)
        // Don't fail the order creation if inventory update fails
      }
    }

    // If discount code was used, increment its usage count
    if (discountCode) {
      try {
        await prisma.discountCode.update({
          where: { code: discountCode },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        })
      } catch (error) {
        // Discount code might not exist, that's okay
        console.error('Failed to update discount code usage:', error)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

