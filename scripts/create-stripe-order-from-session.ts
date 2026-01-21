import { PrismaClient } from '@prisma/client'
import { stripe } from '../lib/stripe'
import { sendOrderConfirmationEmail } from '../lib/email'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.log('Usage: tsx scripts/create-stripe-order-from-session.ts <stripe-session-id>')
    console.log('Example: tsx scripts/create-stripe-order-from-session.ts cs_test_...')
    console.log('\nTo find your Stripe session ID:')
    console.log('1. Go to Stripe Dashboard → Payments')
    console.log('2. Find your payment')
    console.log('3. Click on it and copy the "Checkout Session ID"')
    process.exit(1)
  }

  const sessionId = args[0]
  console.log(`🔍 Fetching Stripe session: ${sessionId}`)

  try {
    // Fetch the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    })

    if (session.payment_status !== 'paid') {
      console.log('❌ Payment is not completed!')
      process.exit(1)
    }

    console.log('✅ Session found, payment status: paid')
    
    const metadata = session.metadata || {}
    const orderNumber = metadata.orderNumber
    const items = metadata.items ? JSON.parse(metadata.items) : []
    const shippingAddress = metadata.shippingAddress ? JSON.parse(metadata.shippingAddress) : null

    if (!orderNumber || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      console.error('❌ Missing required metadata in session')
      console.log('Metadata:', metadata)
      process.exit(1)
    }

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber }
    })

    if (existingOrder) {
      console.log('⚠️  Order already exists:', orderNumber)
      console.log('   Resending confirmation email...')
      
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          shippingAddress: true
        }
      })

      if (order) {
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
        console.log('✅ Email sent!')
      }
      process.exit(0)
    }

    console.log('📦 Creating order from Stripe session...')

    // Resolve user
    let userId: string | null = metadata.userId || null
    if (userId) {
      const existing = await prisma.user.findUnique({ where: { id: userId } })
      if (!existing) {
        userId = null
      }
    }
    if (!userId && shippingAddress.email) {
      let guestUser = await prisma.user.findUnique({
        where: { email: shippingAddress.email },
      })

      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            email: shippingAddress.email,
            password: 'guest',
            name: shippingAddress.name,
            role: 'customer',
          },
        })
      }

      userId = guestUser.id
    }

    // Create shipping address
    let addressId: string | null = null
    if (userId) {
      const address = await prisma.address.create({
        data: {
          userId,
          fullName: shippingAddress.name,
          street: shippingAddress.address,
          apartment: shippingAddress.apartment || null,
          city: shippingAddress.city,
          province: shippingAddress.province || null,
          postalCode: shippingAddress.zip,
          country: shippingAddress.country,
          phone: shippingAddress.phone || null,
        },
      })
      addressId = address.id
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: shippingAddress.email,
        customerName: shippingAddress.name,
        status: 'processing',
        subtotal: Number(metadata.subtotal || 0),
        shipping: Number(metadata.shipping || 0),
        tax: Number(metadata.tax || 0),
        total: session.amount_total ? Number(session.amount_total) / 100 : Number(metadata.total || 0),
        currency: session.currency ? session.currency.toUpperCase() : 'EUR',
        paymentMethod: 'stripe',
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
        paidAt: new Date(),
        shippingAddressId: addressId,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            name: item.name,
            size: item.size || null,
            color: item.color || null,
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    })

    console.log('✅ Order created:', order.orderNumber)

    // Send confirmation email
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
      console.log('✅ Confirmation email sent!')
    } catch (emailErr) {
      console.error('⚠️  Failed to send email:', emailErr)
    }

    console.log('\n✅ Order successfully created and email sent!')
    console.log(`   Order Number: ${order.orderNumber}`)
    console.log(`   Customer: ${order.customerEmail}`)
    console.log(`   Total: €${order.total}`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Invalid Stripe session ID. Make sure you copied the correct session ID from Stripe Dashboard.')
    }
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
