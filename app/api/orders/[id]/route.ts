import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'
import { sendShippingUpdateEmail } from '@/lib/email'

// GET - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                category: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        shippingAddress: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (admin or order owner)
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Transform order for frontend
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      currency: order.currency,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      paymentMethod: order.paymentMethod,
      paymentIntentId: order.paymentIntentId,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        size: item.size,
        color: item.color,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          images: item.product.images as string[],
          category: item.product.category,
        } : null,
      })),
      user: order.user,
      shippingAddress: order.shippingAddress,
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PATCH - Update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const { status, trackingNumber, shippingMethod } = body

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        shippingAddress: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status) {
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status
      
      // Set paidAt when status changes to processing or shipped
      if (status === 'processing' || status === 'shipped') {
        updateData.paidAt = new Date()
      }
    }
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    })

    if (status && status === 'shipped' && existing.status !== 'shipped') {
      try {
        await sendShippingUpdateEmail({
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          total: Number(order.total || 0),
          shipping: Number(order.shipping || 0),
          subtotal: Number(order.subtotal || 0),
          tax: Number(order.tax || 0),
          paymentMethod: order.paymentMethod,
          trackingNumber: order.trackingNumber,
          shippingMethod: order.shippingMethod,
          items: order.items.map((item) => ({
            name: item.name ?? item.product?.name ?? '',
            quantity: item.quantity,
            price: Number(item.price ?? 0),
            size: item.size || null,
            color: item.color || null,
          })),
          shippingAddress: order.shippingAddress,
        })
      } catch (emailErr) {
        console.error('[ORDER PATCH] Failed to send shipping update email', emailErr)
      }
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      shippingMethod: order.shippingMethod,
      paidAt: order.paidAt,
    })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

