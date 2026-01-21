import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: tsx scripts/reset-user-password.ts <email> <new-password>')
    process.exit(1)
  }

  const email = args[0]
  const newPassword = args[1]

  console.log(`🔄 Resetting password for: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  })

  if (!user) {
    console.log('❌ User not found!')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  console.log('✅ Password reset successfully!')
  console.log(`Email: ${user.email}`)
  console.log(`Password: ${newPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
