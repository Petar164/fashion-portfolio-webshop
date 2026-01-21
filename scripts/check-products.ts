import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedProductNames = [
  'Vintage Black Leather Jacket',
  'Oversized White T-Shirt',
  'Minimalist Black Trousers',
  'Classic White Sneakers',
  'Minimalist Silver Watch',
]

async function main() {
  console.log('🔍 Checking which products exist in database...\n')

  // Get all products from database
  const dbProducts = await prisma.product.findMany({
    select: {
      name: true,
    },
  })

  const dbProductNames = dbProducts.map((p) => p.name)

  console.log('📦 Products in database:')
  dbProductNames.forEach((name) => {
    console.log(`  ✅ ${name}`)
  })

  console.log('\n🌱 Products in seed script:')
  seedProductNames.forEach((name) => {
    const exists = dbProductNames.includes(name)
    console.log(`  ${exists ? '✅' : '❌'} ${name}`)
  })

  console.log('\n🗑️  Products that were deleted (not in database):')
  const deletedProducts = seedProductNames.filter(
    (name) => !dbProductNames.includes(name)
  )

  if (deletedProducts.length === 0) {
    console.log('  (None - all seed products exist in database)')
  } else {
    deletedProducts.forEach((name) => {
      console.log(`  ❌ ${name}`)
    })
  }

  console.log('\n✨ Check completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

