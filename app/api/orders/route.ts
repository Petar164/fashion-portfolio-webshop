import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET - Get all orders (admin only) or user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isAdmin = session.user.role === 'admin'

    // Build where clause
    const where: any = {}
    
    if (!isAdmin) {
      // Regular users only see their own orders
      where.userId = session.user.id
    }
    
    if (status && status !== 'all') {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: String(Number(order.total).toFixed(2)), // Frontend expects string
      subtotal: String(Number(order.subtotal).toFixed(2)),
      shipping: String(Number(order.shipping).toFixed(2)),
      tax: String(Number(order.tax).toFixed(2)),
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
        name: item.name, // Frontend expects 'name' not 'productName'
        quantity: item.quantity,
        price: String(Number(item.price).toFixed(2)), // Frontend expects string
        size: item.size,
        color: item.color,
        product: item.product ? {
          id: item.product.id,
          images: Array.isArray(item.product.images) 
            ? item.product.images 
            : typeof item.product.images === 'string' 
              ? JSON.parse(item.product.images) 
              : [],
        } : null,
      })),
      user: order.user,
      shippingAddress: order.shippingAddress,
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
