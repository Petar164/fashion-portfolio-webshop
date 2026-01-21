import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationEmail } from '../lib/email'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.log('Usage: tsx scripts/resend-order-email.ts <orderNumber>')
    console.log('Example: tsx scripts/resend-order-email.ts FV-MKMO6AYT-0LNU')
    process.exit(1)
  }

  const orderNumber = args[0]
  console.log(`📧 Resending confirmation email for order: ${orderNumber}`)

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: true
        }
      },
      shippingAddress: true
    }
  })

  if (!order) {
    console.log('❌ Order not found!')
    process.exit(1)
  }

  console.log(`✅ Order found: ${order.orderNumber}`)
  console.log(`   Customer: ${order.customerEmail}`)
  console.log(`   Total: €${order.total}`)
  console.log(`   Items: ${order.items.length}`)

  try {
    await sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      total: Number(order.total || 0),
      shipping: Number(order.shipping || 0),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      paymentMethod: order.paymentMethod,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price ?? 0),
        size: item.size || null,
        color: item.color || null,
      })),
      shippingAddress: order.shippingAddress,
    })
    console.log('✅ Confirmation email sent successfully!')
    console.log(`   Check inbox for: ${order.customerEmail}`)
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
