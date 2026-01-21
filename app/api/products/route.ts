import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featuredCountOnly = searchParams.get('featuredCount') === 'true'
    const allFeaturedOnly = searchParams.get('allFeatured') === 'true'
    
    // If only requesting featured count, return early
    if (featuredCountOnly) {
      const count = await prisma.product.count({
        where: { featured: true },
      })
      return NextResponse.json({ count })
    }
    
    // If requesting all featured products (including out-of-stock), return early
    if (allFeaturedOnly) {
      const featuredProducts = await prisma.product.findMany({
        where: { featured: true },
        include: {
          variants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      // Transform to match frontend Product interface (don't filter out-of-stock)
      const transformed = featuredProducts
        .filter((product) => {
          const images = product.images as string[]
          return Array.isArray(images) && images.length > 0 && images.some(img => img && img.trim())
        })
        .map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          images: product.images as string[],
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
        }))
      
      return NextResponse.json(transformed)
    }
    
    // Fetch all products - this endpoint is public (no auth required)
    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`[GET /api/products] Found ${products.length} products in database`)

    // Transform to match frontend Product interface
    // Filter out products with no images (they won't display properly)
    // Filter out out-of-stock products (hide them from public listing)
    const transformedProducts = products
      .filter((product) => {
        const images = product.images as string[]
        const hasImages = Array.isArray(images) && images.length > 0 && images.some(img => img && img.trim())
        const isInStock = product.inStock && product.quantity > 0
        return hasImages && isInStock
      })
      .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      images: product.images as string[],
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
        .filter((size, index, self) => self.indexOf(size) === index), // Unique sizes
      colors: product.variants
        .filter((v) => v.color)
        .map((v) => v.color!)
        .filter((color, index, self) => self.indexOf(color) === index), // Unique colors
    }))

    console.log(`[GET /api/products] Returning ${transformedProducts.length} products (filtered ${products.length - transformedProducts.length} products without images)`)

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApi()

    let body
    try {
      body = await request.json()
      console.log('[POST /api/products] Received body:', JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error('[POST /api/products] Failed to parse request body:', parseError)
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
    if (!name || !name.trim()) {
      console.log('[POST /api/products] Validation failed: name is missing or empty')
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!description || !description.trim()) {
      console.log('[POST /api/products] Validation failed: description is missing or empty')
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      )
    }

    if (price === undefined || price === null) {
      console.log('[POST /api/products] Validation failed: price is missing')
      return NextResponse.json(
        { error: 'Product price is required' },
        { status: 400 }
      )
    }

    if (!category || !category.trim()) {
      console.log('[POST /api/products] Validation failed: category is missing or empty')
      return NextResponse.json(
        { error: 'Product category is required' },
        { status: 400 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      console.log('[POST /api/products] Invalid price:', price, typeof price)
      return NextResponse.json(
        { error: `Price must be a positive number. Received: ${price} (${typeof price})` },
        { status: 400 }
      )
    }

    // Check featured limit (max 4)
    if (featured) {
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
    const filteredImages = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'string' && img.trim().length > 0)
      : []
    
    // Ensure at least one image if images array was provided
    if (Array.isArray(images) && images.length > 0 && filteredImages.length === 0) {
      console.log('[POST /api/products] Warning: All images were empty strings, but images array was provided')
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      images: filteredImages.length > 0 ? filteredImages : [], // Allow empty array for now
      category: category.trim(),
      inStock: inStock !== false,
      featured: featured || false,
      quantity: quantity || 0,
      brand: brand && brand.trim() ? brand.trim() : null,
      material: material && material.trim() ? material.trim() : null,
      weight: weight ? Number(weight) : null,
      measurements: measurements && measurements.trim() ? measurements.trim() : null,
    }

    console.log('[POST /api/products] Product data prepared:', JSON.stringify(productData, null, 2))

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

    console.log('[POST /api/products] Variants data prepared:', JSON.stringify(variantsData, null, 2))

    // Create product
    const product = await prisma.product.create({
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

    console.log('[POST /api/products] Product created successfully:', product.id)

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
    console.error('[POST /api/products] Error creating product:', error)
    console.error('[POST /api/products] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      name: error.name,
    })
    
    if (error.message?.includes('redirect') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Return more specific error messages
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      return NextResponse.json({ 
        error: `A product with this ${field} already exists`,
        details: `Duplicate value in field: ${field}`,
      }, { status: 400 })
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Invalid data provided. Please check all fields.',
        details: error.meta?.field_name || 'Unknown field',
      }, { status: 400 })
    }
    
    if (error.code === 'P2012') {
      return NextResponse.json({ 
        error: 'Missing required field',
        details: error.meta?.target || 'Unknown field',
      }, { status: 400 })
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('connect')) {
      return NextResponse.json({ 
        error: 'Database connection timeout. Please try again.',
        details: 'The database is not responding. Check your connection.',
      }, { status: 503 })
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error.message || 'Failed to create product')
      : 'Failed to create product. Please check all required fields are filled.'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta,
        name: error.name,
      } : undefined
    }, { status: 500 })
  }
}
