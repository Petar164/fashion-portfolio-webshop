import * as paypal from '@paypal/checkout-server-sdk'

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
  throw new Error('Missing PayPal live credentials')
}

const environment = new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
export const paypalClient = new paypal.core.PayPalHttpClient(environment)
export const paypalSdk = paypal

