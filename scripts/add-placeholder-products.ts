import { prisma } from '@/lib/prisma'

async function main() {
  const products = [
    {
      name: 'Test Hoodie',
      description: 'Placeholder hoodie for checkout testing.',
      price: 49.99,
      category: 'tops',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      ],
      quantity: 10,
    },
    {
      name: 'Test Sneakers',
      description: 'Placeholder sneakers for checkout testing.',
      price: 89.99,
      category: 'footwear',
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      ],
      quantity: 8,
    },
  ]

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } })
    if (existing) {
      console.log(`Skipping existing product: ${p.name}`)
      continue
    }
    const created = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        images: p.images,
        inStock: true,
        featured: false,
        quantity: p.quantity,
        variants: {
          create: [
            {
              quantity: p.quantity,
              inStock: true,
            },
          ],
        },
      },
    })
    console.log(`Created product: ${created.name}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

