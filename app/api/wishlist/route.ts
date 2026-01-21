import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert to Product format
    const products = wishlistItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: parseFloat(item.product.price.toString()),
      category: item.product.category,
      images: item.product.images as string[],
      inStock: item.product.inStock,
      featured: item.product.featured,
      quantity: item.product.quantity,
      brand: item.product.brand,
      material: item.product.material,
      weight: item.product.weight ? parseFloat(item.product.weight.toString()) : null,
      measurements: item.product.measurements,
      variants: item.product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        price: v.price ? parseFloat(v.price.toString()) : null,
        quantity: v.quantity,
        inStock: v.inStock,
      })),
    }))

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: 'Already in wishlist' })
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId,
      },
    })

    return NextResponse.json(wishlistItem)
  } catch (error: any) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}

