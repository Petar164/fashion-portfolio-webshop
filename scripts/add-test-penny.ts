import { prisma } from '../lib/prisma'

async function main() {
  const name = 'Test Penny'
  const price = 0.5
  const images = ['https://via.placeholder.com/800?text=Test+Penny']

  const existing = await prisma.product.findFirst({
    where: { name },
  })

  if (existing) {
    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        price,
        quantity: 5,
        inStock: true,
        images,
      },
    })
    console.log('Updated Test Penny product to €0.50 with id:', updated.id)
    return
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: 'Test product priced at €0.50 for checkout testing.',
      price,
      quantity: 5,
      inStock: true,
      category: 'clothing',
      images,
    },
  })

  console.log('Created Test Penny product at €0.50:', product.id)
}

main()
  .catch((err) => {
    console.error(err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

