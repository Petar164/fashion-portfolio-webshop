import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking all orders...\n')
  
  const allOrders = await prisma.order.findMany({
    select: {
      orderNumber: true,
      paymentMethod: true,
      total: true,
      status: true,
      createdAt: true,
      customerEmail: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`Total orders: ${allOrders.length}\n`)
  
  const stripeOrders = allOrders.filter(o => o.paymentMethod === 'stripe')
  const paypalOrders = allOrders.filter(o => o.paymentMethod === 'paypal')
  
  console.log(`Stripe orders: ${stripeOrders.length}`)
  stripeOrders.forEach(o => {
    console.log(`  ${o.orderNumber} - €${o.total} - ${o.status} - ${o.createdAt}`)
  })
  
  console.log(`\nPayPal orders: ${paypalOrders.length}`)
  paypalOrders.forEach(o => {
    console.log(`  ${o.orderNumber} - €${o.total} - ${o.status} - ${o.createdAt}`)
  })
  
  console.log(`\nOther orders: ${allOrders.length - stripeOrders.length - paypalOrders.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
