import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Test payment endpoint - simulates a successful payment
 * This is for testing order creation and other flows without real payment processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const {
      items,
      shippingAddress,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      discountCode,
    } = body

    // Validate required fields with detailed logging
    console.log('[TEST PAYMENT] Received data:', {
      itemsCount: items?.length || 0,
      hasShippingAddress: !!shippingAddress,
      shippingAddressKeys: shippingAddress ? Object.keys(shippingAddress) : [],
      total: total,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
    })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    if (!shippingAddress) {
      console.error('[TEST PAYMENT] Missing shippingAddress')
      return NextResponse.json(
        { error: 'Missing shipping address information' },
        { status: 400 }
      )
    }

    if (!shippingAddress.email || !shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zip || !shippingAddress.country || !shippingAddress.phone) {
      console.error('[TEST PAYMENT] Incomplete shipping address:', shippingAddress)
      return NextResponse.json(
        { error: 'Shipping address is incomplete. Please fill in all required fields (including phone number).' },
        { status: 400 }
      )
    }

    // Calculate total if not provided or invalid
    // Total should be: subtotal - discount + shipping
    const finalSubtotal = Number(subtotal || 0)
    const finalDiscount = Number(discount || 0)
    const finalShipping = Number(shipping || 0)
    const calculatedTotal = total || (finalSubtotal - finalDiscount + finalShipping)
    
    console.log('[TEST PAYMENT] Total calculation:', {
      providedTotal: total,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      shipping: finalShipping,
      calculatedTotal,
    })
    
    if (calculatedTotal === undefined || calculatedTotal === null || isNaN(calculatedTotal)) {
      console.error('[TEST PAYMENT] Invalid total calculation:', {
        total,
        subtotal: finalSubtotal,
        shipping: finalShipping,
        discount: finalDiscount,
        calculatedTotal,
      })
      return NextResponse.json(
        { error: `Invalid order total calculation. Please try again.` },
        { status: 400 }
      )
    }
    
    // Allow total to be 0 (free order) but warn if it seems wrong
    if (calculatedTotal < 0) {
      console.error('[TEST PAYMENT] Negative total:', calculatedTotal)
      return NextResponse.json(
        { error: 'Order total cannot be negative' },
        { status: 400 }
      )
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate unique order number
    const orderNumber = `FV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const paymentIntentId = `test_${Date.now()}`

    // Check if products exist in database
    // If using placeholder products (IDs like "1", "2"), we need to handle them differently
    const productIds = items.map((item: any) => item.id)
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: { id: true }
    })
    
    const existingProductIds = new Set(existingProducts.map(p => p.id))
    const missingProducts = productIds.filter((id: string) => !existingProductIds.has(id))
    
    // If products don't exist, try to find any product to use as fallback
    // This handles the case where placeholder products are used
    let fallbackProductId: string | null = null
    if (missingProducts.length > 0) {
      console.log('Some products not found in database, using fallback:', missingProducts)
      // Try to find any product in database
      const anyProduct = await prisma.product.findFirst({
        select: { id: true }
      })
      if (anyProduct) {
        fallbackProductId = anyProduct.id
        console.log('Using fallback product ID:', fallbackProductId)
      } else {
        // No products in database - create a dummy product for orders
        console.log('No products found, creating dummy product for order')
        const dummyProduct = await prisma.product.create({
          data: {
            name: 'Order Item',
            description: 'Product placeholder for order',
            price: 0,
            category: 'accessories',
            images: [],
            inStock: false,
            featured: false,
            quantity: 0,
          },
          select: { id: true }
        })
        fallbackProductId = dummyProduct.id
        console.log('Created dummy product with ID:', fallbackProductId)
      }
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

    // Create shipping address
    let addressId: string | null = null
    if (shippingAddress) {
      if (resolvedUserId) {
        try {
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
        } catch (addressError: any) {
          console.error('[TEST PAYMENT] Error creating address:', addressError)
          throw new Error(`Failed to create address: ${addressError.message || 'Unknown error'}`)
        }
      } else {
        // Guest path: create or reuse by email
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
        
        try {
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
        } catch (addressError: any) {
          console.error('[TEST PAYMENT] Error creating guest address:', addressError)
          throw new Error(`Failed to create address: ${addressError.message || 'Unknown error'}`)
        }
      }
    }

    // Create order directly
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
        total: Number(calculatedTotal),
        currency: 'EUR',
        paymentMethod: 'test',
        paymentIntentId,
        shippingAddressId: addressId,
        items: {
          create: items.map((item: any) => {
            // Use actual product ID if it exists, otherwise use fallback
            const productIdToUse = existingProductIds.has(item.id) 
              ? item.id 
              : (fallbackProductId || item.id)
            
            return {
              productId: productIdToUse,
              quantity: item.quantity,
              price: Number(item.price),
              name: item.name,
              size: item.size || null,
              color: item.color || null,
            }
          }),
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
        // Use the actual product ID (not fallback)
        const productId = existingProductIds.has(item.id) ? item.id : fallbackProductId
        
        if (!productId) {
          console.warn(`[TEST PAYMENT] Cannot update inventory: no product ID for item ${item.id}`)
          continue
        }

        // Find the product
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        })

        if (product) {
          // Update product quantity
          const newQuantity = Math.max(0, product.quantity - item.quantity)
          const newInStock = newQuantity > 0

          await prisma.product.update({
            where: { id: productId },
            data: {
              quantity: newQuantity,
              inStock: newInStock,
            },
          })

          console.log(`[TEST PAYMENT] Updated inventory for product ${productId}: quantity ${product.quantity} -> ${newQuantity}, inStock: ${product.inStock} -> ${newInStock}`)

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

              console.log(`[TEST PAYMENT] Updated variant ${variant.id}: quantity ${variant.quantity} -> ${newVariantQuantity}`)
            }
          }
        }
      } catch (error) {
        console.error(`[TEST PAYMENT] Failed to update inventory for item ${item.id}:`, error)
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

    const orderData = {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      },
    }

    // Return success response
    return NextResponse.json({
      success: true,
      paymentIntentId,
      order: orderData.order,
      message: 'Test payment successful',
    })
  } catch (error: any) {
    console.error('[TEST PAYMENT] Error processing test payment:', error)
    console.error('[TEST PAYMENT] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      cause: error?.cause,
    })
    
    // More detailed error message
    let errorMessage = 'Failed to process test payment'
    if (error?.code === 'P2002') {
      errorMessage = 'A record with this information already exists'
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid reference in database'
    } else if (error?.message?.includes('Unknown arg')) {
      errorMessage = `Database schema mismatch: ${error.message}`
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        } : undefined
      },
      { status: 500 }
    )
  }
}

