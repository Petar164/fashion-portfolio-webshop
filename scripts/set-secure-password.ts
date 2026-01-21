import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com'
  const NEW_PASSWORD = 'HmgBhHDp6d4h9Tun' // Secure password

  console.log('🔐 Setting secure admin password...')

  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase().trim() }
  })

  if (!admin) {
    throw new Error('Admin user not found!')
  }

  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)

  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashedPassword }
  })

  console.log('✅ Secure password set successfully!')
  console.log(`Email: ${admin.email}`)
  console.log(`Password: ${NEW_PASSWORD}`)
  console.log('⚠️  Save this password securely!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

