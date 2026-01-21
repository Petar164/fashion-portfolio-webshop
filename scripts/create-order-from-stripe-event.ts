import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationEmail } from '../lib/email'

const prisma = new PrismaClient()

async function main() {
  // Order data from the Stripe event
  const orderData = {
    orderNumber: 'FV-MKMOEVT5-BXQ3',
    userId: 'cmkmo58qz0000pm1dz8vfymns',
    customerEmail: 'petarvidakovic41@gmail.com',
    customerName: 'Petar Vidakovic',
    items: [
      {
        id: 'cmkmo4w9v0000pf1dkcd0wb7b',
        name: 'test',
        price: 1,
        quantity: 1,
        size: null,
        color: null,
      }
    ],
    shippingAddress: {
      name: 'Petar Vidakovic',
      email: 'petarvidakovic41@gmail.com',
      address: 'Bingelkruid 2',
      apartment: '',
      city: 'Breda',
      province: '',
      zip: '4823CE',
      country: 'Netherlands',
      zone: 'EU',
      phone: '+31629474989'
    },
    subtotal: 1,
    shipping: 0,
    tax: 0.17355371900826447,
    discount: 0,
    total: 1,
    paymentIntentId: 'pi_3SrfiRHeEsIcvqdJ1n8Llsv4',
  }

  console.log('📦 Creating order from Stripe event data...')
  console.log(`Order Number: ${orderData.orderNumber}`)

  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: orderData.orderNumber }
  })

  if (existingOrder) {
    console.log('⚠️  Order already exists!')
    console.log('   Resending confirmation email...')
    
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderData.orderNumber },
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

  // Verify user exists
  let userId = orderData.userId
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    console.log('⚠️  User not found, creating guest user...')
    const guestUser = await prisma.user.create({
      data: {
        email: orderData.customerEmail,
        password: 'guest',
        name: orderData.customerName,
        role: 'customer',
      },
    })
    userId = guestUser.id
  }

  // Create shipping address
  let addressId: string | null = null
  if (userId) {
    const address = await prisma.address.create({
      data: {
        userId,
        fullName: orderData.shippingAddress.name,
        street: orderData.shippingAddress.address,
        apartment: orderData.shippingAddress.apartment || null,
        city: orderData.shippingAddress.city,
        province: orderData.shippingAddress.province || null,
        postalCode: orderData.shippingAddress.zip,
        country: orderData.shippingAddress.country,
        phone: orderData.shippingAddress.phone || null,
      },
    })
    addressId = address.id
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: orderData.orderNumber,
      userId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      status: 'processing',
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      tax: orderData.tax,
      total: orderData.total,
      currency: 'EUR',
      paymentMethod: 'stripe',
      paymentIntentId: orderData.paymentIntentId,
      paidAt: new Date('2026-01-20T15:15:44Z'), // From event created timestamp
      shippingAddressId: addressId,
      items: {
        create: orderData.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
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

  console.log('✅ Order created successfully!')

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

  console.log(`\n✅ Order ${order.orderNumber} created and email sent!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
