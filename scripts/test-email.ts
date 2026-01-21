import { sendOrderConfirmationEmail } from '../lib/email'

async function main() {
  console.log('📧 Testing email configuration...')
  
  const testOrder = {
    orderNumber: 'TEST-ORDER-123',
    customerEmail: 'petarvidakovic41@gmail.com',
    customerName: 'Test User',
    total: 1.00,
    shipping: 0,
    subtotal: 1.00,
    tax: 0,
    paymentMethod: 'stripe',
    items: [
      {
        name: 'Test Product',
        quantity: 1,
        price: 1.00,
        size: null,
        color: null,
      }
    ],
    shippingAddress: {
      fullName: 'Test User',
      street: '123 Test St',
      apartment: null,
      city: 'Test City',
      province: null,
      postalCode: '12345',
      country: 'Netherlands',
      phone: null,
    }
  }

  try {
    await sendOrderConfirmationEmail(testOrder)
    console.log('✅ Email sent successfully!')
  } catch (error: any) {
    console.error('❌ Email failed:', error.message)
  }
}

main()
