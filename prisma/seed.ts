import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com'
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', existingAdmin.email)
    console.log('✅ Seed completed (no changes made)!')
    return
  }

  // Create admin user with the business email
  const hashedPassword = await bcrypt.hash('admin123', 10) // Change this password!

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  })

  console.log('✅ Admin user created:', admin.email)
  console.log('⚠️  Default password: admin123 - CHANGE THIS IMMEDIATELY!')
  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

