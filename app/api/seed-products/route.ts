import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const dummyProducts = [
  {
    name: 'Vintage Black Leather Jacket',
    description: 'Classic vintage black leather jacket with a timeless design. Perfect for archive fashion enthusiasts. Features a slim fit and premium quality leather.',
    price: 299.99,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&h=800&fit=crop',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    inStock: true,
    featured: true,
    quantity: 15,
    brand: 'Archive Collection',
    material: '100% Genuine Leather',
    weight: 1200,
    measurements: JSON.stringify({
      'S': { chest: '98cm', length: '68cm', sleeve: '62cm' },
      'M': { chest: '102cm', length: '70cm', sleeve: '63cm' },
      'L': { chest: '106cm', length: '72cm', sleeve: '64cm' },
      'XL': { chest: '110cm', length: '74cm', sleeve: '65cm' },
    }),
  },
  {
    name: 'Oversized White T-Shirt',
    description: 'Minimalist oversized white t-shirt with a relaxed fit. Made from premium cotton for ultimate comfort. Perfect for layering or wearing alone.',
    price: 49.99,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Gray'],
    inStock: true,
    featured: true,
    quantity: 50,
    brand: 'FashionVoid',
    material: '100% Organic Cotton',
    weight: 200,
    measurements: JSON.stringify({
      'S': { chest: '110cm', length: '72cm' },
      'M': { chest: '115cm', length: '74cm' },
      'L': { chest: '120cm', length: '76cm' },
      'XL': { chest: '125cm', length: '78cm' },
    }),
  },
  {
    name: 'Vintage Denim Jeans',
    description: 'Classic vintage-style denim jeans with a straight fit. Pre-washed for that perfect worn-in look. High-quality denim that gets better with age.',
    price: 129.99,
    category: 'bottoms',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c13755374?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop',
    ],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Blue', 'Black'],
    inStock: true,
    featured: true,
    quantity: 30,
    brand: 'Archive Collection',
    material: '98% Cotton, 2% Elastane',
    weight: 600,
    measurements: JSON.stringify({
      '28': { waist: '71cm', inseam: '81cm', leg: '34cm' },
      '30': { waist: '76cm', inseam: '81cm', leg: '35cm' },
      '32': { waist: '81cm', inseam: '81cm', leg: '36cm' },
      '34': { waist: '86cm', inseam: '81cm', leg: '37cm' },
      '36': { waist: '91cm', inseam: '81cm', leg: '38cm' },
    }),
  },
  {
    name: 'Minimalist Black Trousers',
    description: 'Sleek black trousers with a modern slim fit. Perfect for both casual and semi-formal occasions. Made from premium fabric with excellent drape.',
    price: 89.99,
    category: 'bottoms',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=800&fit=crop',
    ],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Gray'],
    inStock: true,
    featured: false,
    quantity: 25,
    brand: 'FashionVoid',
    material: '97% Polyester, 3% Elastane',
    weight: 400,
    measurements: JSON.stringify({
      '28': { waist: '71cm', inseam: '81cm', leg: '32cm' },
      '30': { waist: '76cm', inseam: '81cm', leg: '33cm' },
      '32': { waist: '81cm', inseam: '81cm', leg: '34cm' },
      '34': { waist: '86cm', inseam: '81cm', leg: '35cm' },
      '36': { waist: '91cm', inseam: '81cm', leg: '36cm' },
    }),
  },
  {
    name: 'Classic White Sneakers',
    description: 'Timeless white sneakers with a clean, minimalist design. Comfortable and versatile, perfect for everyday wear. Premium materials and construction.',
    price: 149.99,
    category: 'footwear',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    ],
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    colors: ['White', 'Black'],
    inStock: true,
    featured: true,
    quantity: 40,
    brand: 'Archive Collection',
    material: 'Leather Upper, Rubber Sole',
    weight: 800,
    measurements: null,
  },
  {
    name: 'Vintage Black Boots',
    description: 'Classic black leather boots with a timeless design. Perfect for archive fashion looks. Durable construction and comfortable fit.',
    price: 199.99,
    category: 'footwear',
    images: [
      'https://images.unsplash.com/photo-1608256246200-53bd5492d7c8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&h=800&fit=crop',
    ],
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: ['Black'],
    inStock: true,
    featured: false,
    quantity: 20,
    brand: 'Archive Collection',
    material: '100% Genuine Leather',
    weight: 1200,
    measurements: null,
  },
  {
    name: 'Minimalist Silver Watch',
    description: 'Sleek silver watch with a minimalist design. Perfect for completing any archive fashion look. High-quality materials and precise timekeeping.',
    price: 179.99,
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop',
    ],
    sizes: [],
    colors: ['Silver', 'Black'],
    inStock: true,
    featured: true,
    quantity: 35,
    brand: 'FashionVoid',
    material: 'Stainless Steel, Leather Strap',
    weight: 150,
    measurements: null,
  },
  {
    name: 'Vintage Leather Belt',
    description: 'Classic leather belt with a timeless design. Made from premium genuine leather with a simple, elegant buckle. Adjustable sizing.',
    price: 59.99,
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1624222248312-84d3d3e8b0c4?w=800&h=800&fit=crop',
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Brown'],
    inStock: true,
    featured: false,
    quantity: 45,
    brand: 'Archive Collection',
    material: '100% Genuine Leather',
    weight: 200,
    measurements: JSON.stringify({
      'S': { length: '85-95cm' },
      'M': { length: '95-105cm' },
      'L': { length: '105-115cm' },
    }),
  },
  {
    name: 'Oversized Gray Hoodie',
    description: 'Comfortable oversized gray hoodie with a relaxed fit. Perfect for casual archive fashion looks. Made from premium cotton blend.',
    price: 79.99,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a4?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&h=800&fit=crop',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Gray', 'Black'],
    inStock: true,
    featured: false,
    quantity: 35,
    brand: 'FashionVoid',
    material: '80% Cotton, 20% Polyester',
    weight: 600,
    measurements: JSON.stringify({
      'S': { chest: '112cm', length: '70cm', sleeve: '65cm' },
      'M': { chest: '117cm', length: '72cm', sleeve: '66cm' },
      'L': { chest: '122cm', length: '74cm', sleeve: '67cm' },
      'XL': { chest: '127cm', length: '76cm', sleeve: '68cm' },
    }),
  },
  {
    name: 'Classic Black Blazer',
    description: 'Timeless black blazer with a modern fit. Perfect for elevating any archive fashion ensemble. Premium materials and expert tailoring.',
    price: 249.99,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1594938291221-94f313b0a4c2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    inStock: true,
    featured: true,
    quantity: 18,
    brand: 'Archive Collection',
    material: '100% Wool',
    weight: 800,
    measurements: JSON.stringify({
      'S': { chest: '96cm', length: '72cm', sleeve: '61cm' },
      'M': { chest: '100cm', length: '74cm', sleeve: '62cm' },
      'L': { chest: '104cm', length: '76cm', sleeve: '63cm' },
      'XL': { chest: '108cm', length: '78cm', sleeve: '64cm' },
    }),
  },
]

export async function POST() {
  try {
  await requireAdminApi()

    const createdProducts = []
    const skippedProducts = []

    for (const productData of dummyProducts) {
      try {
        // Check if product already exists
        const existing = await prisma.product.findFirst({
          where: { name: productData.name },
        })

        if (existing) {
          skippedProducts.push(productData.name)
          continue
        }

        // Create product with variants
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            images: productData.images,
            category: productData.category,
            inStock: productData.inStock,
            featured: productData.featured,
            quantity: productData.quantity,
            brand: productData.brand,
            material: productData.material,
            weight: productData.weight,
            measurements: productData.measurements,
            variants: {
              create: productData.sizes.length > 0 && productData.colors.length > 0
                ? productData.sizes.flatMap((size) =>
                    productData.colors.map((color) => ({
                      size,
                      color,
                      quantity: Math.floor(productData.quantity / (productData.sizes.length * productData.colors.length)),
                      inStock: productData.inStock,
                    }))
                  )
                : productData.sizes.length > 0
                ? productData.sizes.map((size) => ({
                    size,
                    quantity: Math.floor(productData.quantity / productData.sizes.length),
                    inStock: productData.inStock,
                  }))
                : productData.colors.length > 0
                ? productData.colors.map((color) => ({
                    color,
                    quantity: Math.floor(productData.quantity / productData.colors.length),
                    inStock: productData.inStock,
                  }))
                : [
                    {
                      quantity: productData.quantity,
                      inStock: productData.inStock,
                    },
                  ],
            },
          },
        })

        createdProducts.push(productData.name)
      } catch (error: any) {
        console.error(`Error creating "${productData.name}":`, error)
        return NextResponse.json(
          { error: `Failed to create product: ${productData.name}`, details: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdProducts.length} products, skipped ${skippedProducts.length} existing products`,
      created: createdProducts,
      skipped: skippedProducts,
    })
  } catch (error: any) {
    console.error('Error seeding products:', error)
    if (error.message?.includes('redirect')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to seed products', details: error.message },
      { status: 500 }
    )
  }
}

