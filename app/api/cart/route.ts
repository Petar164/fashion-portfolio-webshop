import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get user's cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('[CART API] Loading cart for user:', session.user.id)
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    })

    if (!cart) {
      console.log('[CART API] No cart found for user')
      return NextResponse.json({ items: [] })
    }

    console.log('[CART API] Cart found. Items:', (cart.items as any[]).length)
    return NextResponse.json({ items: cart.items as any[] })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST/PUT - Save user's cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      )
    }

    // Upsert cart (create if doesn't exist, update if it does)
    console.log('[CART API] Saving cart for user:', session.user.id, 'Items:', items.length)
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {
        items: items,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        items: items
      }
    })

    console.log('[CART API] Cart saved successfully. Items in DB:', (cart.items as any[]).length)
    return NextResponse.json({ items: cart.items as any[] })
  } catch (error) {
    console.error('Error saving cart:', error)
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user's cart
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    await prisma.cart.delete({
      where: { userId: session.user.id }
    }).catch(() => {
      // Cart might not exist, that's okay
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}

