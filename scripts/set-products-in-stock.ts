import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setProductsInStock() {
  try {
    console.log('Setting all products to in stock...')
    
    const result = await prisma.product.updateMany({
      where: {},
      data: {
        inStock: true,
        quantity: 100, // Set a high quantity for testing
      },
    })

    console.log(`✅ Updated ${result.count} products to in stock`)
    
    // Also update all variants
    const variantResult = await prisma.productVariant.updateMany({
      where: {},
      data: {
        inStock: true,
        quantity: 100,
      },
    })

    console.log(`✅ Updated ${variantResult.count} product variants to in stock`)
    
  } catch (error) {
    console.error('Error setting products in stock:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setProductsInStock()

