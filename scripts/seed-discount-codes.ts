/**
 * Seed script to create initial discount codes
 * Run with: npx tsx scripts/seed-discount-codes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding discount codes...')

  // Create WELCOME10 discount code
  const welcome10 = await prisma.discountCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10, // 10% discount
      minPurchase: null,
      maxDiscount: null,
      usageLimit: 1, // One-time use per customer
      validFrom: null,
      validUntil: null,
      isActive: true
    }
  })

  console.log('Created discount code:', welcome10)
  console.log('✅ Discount codes seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding discount codes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

