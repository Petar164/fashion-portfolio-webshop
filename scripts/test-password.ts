import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'fashionvoidhelp@gmail.com'
  const testPassword = 'HmgBhHDp6d4h9Tun'

  console.log('🔍 Testing password...')

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  })

  if (!user) {
    console.log('❌ User not found!')
    return
  }

  console.log('✅ User found:', user.email)
  console.log('Password hash length:', user.password.length)

  const isValid = await bcrypt.compare(testPassword, user.password)
  console.log('Password test result:', isValid ? '✅ VALID' : '❌ INVALID')

  if (!isValid) {
    console.log('⚠️  Password does not match!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

