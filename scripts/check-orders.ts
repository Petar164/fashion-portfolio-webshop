import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking orders...')
  
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  console.log(`\n✅ Found ${orders.length} orders\n`)

  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}:`)
    console.log(`  Order Number: ${order.orderNumber}`)
    console.log(`  User: ${order.user?.email || order.customerEmail || 'Guest'}`)
    console.log(`  User ID: ${order.userId || 'N/A'}`)
    console.log(`  Status: ${order.status}`)
    console.log(`  Total: €${order.total}`)
    console.log(`  Items: ${order.items.length}`)
    order.items.forEach((item, i) => {
      console.log(`    Item ${i + 1}: ${item.name} (Qty: ${item.quantity})`)
      console.log(`      Product ID: ${item.productId || 'N/A'}`)
      console.log(`      Has Product: ${!!item.product}`)
    })
    console.log('')
  })

  // Check for orders with petarvidakovic41@gmail.com
  const user = await prisma.user.findUnique({
    where: { email: 'petarvidakovic41@gmail.com' }
  })

  if (user) {
    console.log(`\n👤 User found: ${user.email} (ID: ${user.id})`)
    const userOrders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true
      }
    })
    console.log(`   Orders for this user: ${userOrders.length}`)
  } else {
    console.log('\n❌ User petarvidakovic41@gmail.com not found')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
