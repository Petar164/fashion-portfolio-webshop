import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let product
    product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Transform to match frontend Product interface
    const images = (product.images as string[]) || []
    const price = product.price ? Number(product.price) : 0

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: price,
      images: images,
      category: product.category,
      inStock: product.inStock,
      featured: product.featured,
      quantity: product.quantity,
      brand: product.brand || undefined,
      material: product.material || undefined,
      weight: product.weight ? Number(product.weight) : undefined,
      measurements: product.measurements || undefined,
      sizes: product.variants
        .filter((v) => v.size)
        .map((v) => v.size!)
        .filter((size, index, self) => self.indexOf(size) === index),
      colors: product.variants
        .filter((v) => v.color)
        .map((v) => v.color!)
        .filter((color, index, self) => self.indexOf(color) === index),
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    let body
    try {
      body = await request.json()
      console.log('[PUT /api/products] Received body:', JSON.stringify(body, null, 2))
      console.log('[PUT /api/products] Product ID:', params.id)
    } catch (parseError: any) {
      console.error('[PUT /api/products] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const {
      name,
      description,
      price,
      images,
      category,
      sizes,
      colors,
      inStock,
      featured,
      quantity,
      brand,
      material,
      weight,
      measurements,
    } = body

    // Validate required fields
    if (!name || !description || price === undefined || !category) {
      console.log('[PUT /api/products] Validation failed:', { name, description, price, category })
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price, and category are required' },
        { status: 400 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      console.log('[PUT /api/products] Invalid price:', price)
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Check if product is currently featured
    const currentProduct = await prisma.product.findUnique({
      where: { id: params.id },
      select: { featured: true },
    })

    // Check featured limit (max 4) - only if setting to featured and it wasn't already featured
    if (featured && !currentProduct?.featured) {
      const featuredCount = await prisma.product.count({
        where: { featured: true },
      })
      // Allow exactly 4 featured products (if count is 4 or more, that means we're trying to add a 5th)
      if (featuredCount >= 4) {
        return NextResponse.json(
          { error: 'Maximum 4 featured products allowed. Please remove one first.' },
          { status: 400 }
        )
      }
    }

    // Prepare product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      images: Array.isArray(images) ? images.filter(img => img && img.trim()) : [],
      category: category.trim(),
      inStock: inStock !== false,
      featured: featured || false,
      quantity: quantity || 0,
      brand: brand && brand.trim() ? brand.trim() : null,
      material: material && material.trim() ? material.trim() : null,
      weight: weight ? Number(weight) : null,
      measurements: measurements && measurements.trim() ? measurements.trim() : null,
    }

    console.log('[PUT /api/products] Product data prepared:', JSON.stringify(productData, null, 2))

    // Prepare variants
    const variantsData: any[] = []
    if (sizes && colors && sizes.length > 0 && colors.length > 0) {
      sizes.forEach((size: string) => {
        colors.forEach((color: string) => {
          if (size.trim() && color.trim()) {
            variantsData.push({
              size: size.trim(),
              color: color.trim(),
              quantity: quantity || 0,
              inStock: inStock !== false,
            })
          }
        })
      })
    } else if (sizes && sizes.length > 0) {
      sizes.forEach((size: string) => {
        if (size.trim()) {
          variantsData.push({
            size: size.trim(),
            quantity: quantity || 0,
            inStock: inStock !== false,
          })
        }
      })
    } else if (colors && colors.length > 0) {
      colors.forEach((color: string) => {
        if (color.trim()) {
          variantsData.push({
            color: color.trim(),
            quantity: quantity || 0,
            inStock: inStock !== false,
          })
        }
      })
    } else {
      variantsData.push({
        quantity: quantity || 0,
        inStock: inStock !== false,
      })
    }

    console.log('[PUT /api/products] Variants data prepared:', JSON.stringify(variantsData, null, 2))

    // Delete existing variants
    await prisma.productVariant.deleteMany({
      where: { productId: params.id },
    })

    console.log('[PUT /api/products] Existing variants deleted')

    // Update product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...productData,
        variants: {
          create: variantsData,
        },
      },
      include: {
        variants: true,
      },
    })

    console.log('[PUT /api/products] Product updated successfully:', product.id)

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      images: product.images as string[],
      category: product.category,
      inStock: product.inStock,
      featured: product.featured,
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    
    if (error.message?.includes('redirect') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this name already exists' }, { status: 400 })
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid data provided. Please check all fields.' }, { status: 400 })
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('connect')) {
      return NextResponse.json({ error: 'Database connection timeout. Please try again.' }, { status: 503 })
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error.message || 'Failed to update product')
      : 'Failed to update product. Please check all required fields are filled.'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta,
      } : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    // Check if this is a placeholder product (IDs like '1', '2', '3', etc.)
    if (/^\d+$/.test(params.id)) {
      return NextResponse.json(
        { error: 'Cannot delete placeholder products. Add real products to the database first.' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has order items
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: params.id },
    })

    // Set productId to null in order items first (preserves order history)
    // First, make the column nullable if it isn't already, then update
    if (orderItemsCount > 0) {
      try {
        // Try to alter the table to make productId nullable (if not already)
        await prisma.$executeRawUnsafe(`
          ALTER TABLE order_items 
          MODIFY COLUMN productId VARCHAR(191) NULL
        `)
      } catch (alterError: any) {
        // Column might already be nullable, or error might be expected
        console.log('Column alteration result (may be expected):', alterError.message)
      }
      
      // Now set productId to null for order items
      await prisma.$executeRawUnsafe(`
        UPDATE order_items 
        SET productId = NULL 
        WHERE productId = '${params.id}'
      `)
    }

    // Delete the product
    // Variants and wishlist will cascade automatically
    await prisma.product.delete({
      where: { id: params.id },
    })

    // Return success with info about order items if any
    if (orderItemsCount > 0) {
      return NextResponse.json({ 
        success: true,
        message: `Product deleted. ${orderItemsCount} order item(s) preserved with null product reference.`
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    
    if (error.message?.includes('redirect') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('connect')) {
      return NextResponse.json({ error: 'Database connection timeout. Please try again.' }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to delete product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
