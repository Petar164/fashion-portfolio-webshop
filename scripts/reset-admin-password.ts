import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com'
  // Get password from environment variable or use default for development
  const NEW_PASSWORD = process.env.ADMIN_RESET_PASSWORD || 'admin123'

  console.log('🔄 Resetting admin password...')
  console.log('⚠️  PERMANENT PASSWORD - This will not be changed again')

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

  console.log('✅ Password reset successfully!')
  console.log(`Email: ${admin.email}`)
  console.log(`Password: ${NEW_PASSWORD}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

