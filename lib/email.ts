import nodemailer from 'nodemailer'

type OrderLike = {
  orderNumber: string
  customerEmail: string | null
  customerName?: string | null
  total?: number | null
  shipping?: number | null
  subtotal?: number | null
  tax?: number | null
  paymentMethod?: string | null
  status?: string | null
  trackingNumber?: string | null
  shippingMethod?: string | null
  createdAt?: Date
  items?: Array<{
    name?: string | null
    quantity?: number | null
    price?: number | null
    size?: string | null
    color?: string | null
  }>
  shippingAddress?: {
    fullName?: string | null
    street?: string | null
    apartment?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    country?: string | null
    phone?: string | null
  } | null
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env

function canSendEmail() {
  return SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM
}

const transporter = canSendEmail()
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for others
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null

async function sendEmail(options: { to: string; subject: string; text: string; html?: string }) {
  if (!transporter) {
    console.warn('[EMAIL] Transport not configured; skipping send')
    return
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    ...options,
  })
}

function renderAddress(addr: OrderLike['shippingAddress']) {
  if (!addr) return 'No shipping address provided'
  const lines = [
    addr.fullName,
    [addr.street, addr.apartment].filter(Boolean).join(' '),
    [addr.city, addr.province].filter(Boolean).join(', '),
    [addr.postalCode, addr.country].filter(Boolean).join(' '),
    addr.phone ? `Phone: ${addr.phone}` : null,
  ].filter(Boolean)
  return lines.join('<br/>')
}

function renderItems(items: OrderLike['items']) {
  if (!items || items.length === 0) return '<p>No items</p>'
  const rows = items
    .map((item) => {
      const sizeColor = [item.size, item.color].filter(Boolean).join(' / ')
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #222;">${item.name ?? 'Item'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #222;">${sizeColor || '-'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #222;">${item.quantity ?? 0}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #222;">€${(item.price ?? 0).toFixed(2)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th align="left" style="padding:6px 8px;border-bottom:2px solid #111;">Item</th>
          <th align="left" style="padding:6px 8px;border-bottom:2px solid #111;">Size/Color</th>
          <th align="left" style="padding:6px 8px;border-bottom:2px solid #111;">Qty</th>
          <th align="left" style="padding:6px 8px;border-bottom:2px solid #111;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function renderTotals(order: OrderLike) {
  const subtotal = order.subtotal ?? 0
  const shipping = order.shipping ?? 0
  const tax = order.tax ?? 0
  const total = order.total ?? 0

  return `
    <div style="margin-top:12px;font-size:14px;line-height:1.5;">
      <div>Subtotal: €${subtotal.toFixed(2)}</div>
      <div>Shipping: €${shipping.toFixed(2)}</div>
      <div>Tax: €${tax.toFixed(2)}</div>
      <div style="font-weight:bold;margin-top:6px;">Total: €${total.toFixed(2)}</div>
    </div>
  `
}

export async function sendOrderConfirmationEmail(order: OrderLike) {
  if (!order.customerEmail) return

  const subject = `Your FashionVoid order ${order.orderNumber}`
  const text = `Thanks for your purchase!
Order: ${order.orderNumber}
Total: €${(order.total ?? 0).toFixed(2)}
Shipping: €${(order.shipping ?? 0).toFixed(2)}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#eaeaea;padding:16px;">
      <h2 style="margin:0 0 12px 0;">Thanks for your purchase</h2>
      <p style="margin:0 0 8px 0;">Order: <strong>${order.orderNumber}</strong></p>
      <p style="margin:0 0 8px 0;">Payment: ${order.paymentMethod ?? 'n/a'}</p>
      ${renderTotals(order)}
      <div style="margin:16px 0 8px 0;font-weight:bold;">Shipping to</div>
      <div style="font-size:14px;line-height:1.5;">${renderAddress(order.shippingAddress)}</div>
      <div style="margin:16px 0 8px 0;font-weight:bold;">Items</div>
      ${renderItems(order.items)}
      <p style="margin-top:18px;font-size:12px;color:#9a9a9a;">We will notify you when your order ships.</p>
    </div>
  `

  await sendEmail({
    to: order.customerEmail,
    subject,
    text,
    html,
  })
}

export async function sendShippingUpdateEmail(order: OrderLike) {
  if (!order.customerEmail) return

  const subject = `Your FashionVoid order ${order.orderNumber} has shipped`
  const trackingLine = order.trackingNumber
    ? `Tracking: ${order.trackingNumber}`
    : 'Tracking will be shared when available.'
  const methodLine = order.shippingMethod ? `Carrier: ${order.shippingMethod}` : ''

  const text = `Your order has shipped!
Order: ${order.orderNumber}
${trackingLine}
${methodLine}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#eaeaea;padding:16px;">
      <h2 style="margin:0 0 12px 0;">Your order is on its way</h2>
      <p style="margin:0 0 8px 0;">Order: <strong>${order.orderNumber}</strong></p>
      <p style="margin:0 0 4px 0;">${trackingLine}</p>
      ${methodLine ? `<p style="margin:0 0 4px 0;">${methodLine}</p>` : ''}
      ${renderTotals(order)}
      <div style="margin:16px 0 8px 0;font-weight:bold;">Items</div>
      ${renderItems(order.items)}
      <p style="margin-top:18px;font-size:12px;color:#9a9a9a;">Thank you for shopping with FashionVoid.</p>
    </div>
  `

  await sendEmail({
    to: order.customerEmail,
    subject,
    text,
    html,
  })
}

