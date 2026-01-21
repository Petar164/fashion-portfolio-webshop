import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com'
  const TEST_PASSWORD = 'Admin123!@#'

  console.log('🔍 Debugging password issue...')
  console.log('Email:', ADMIN_EMAIL)
  console.log('Test password:', TEST_PASSWORD)
  console.log('Test password length:', TEST_PASSWORD.length)
  console.log('Test password bytes:', Buffer.from(TEST_PASSWORD).toString('hex'))

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase().trim() },
  })

  if (!user) {
    console.log('❌ User not found!')
    return
  }

  console.log('\n✅ User found:')
  console.log('  ID:', user.id)
  console.log('  Email:', user.email)
  console.log('  Name:', user.name)
  console.log('  Role:', user.role)
  console.log('  Password hash length:', user.password.length)
  console.log('  Password hash (first 20 chars):', user.password.substring(0, 20))

  // Test password comparison
  console.log('\n🔐 Testing password comparison...')
  const isValid = await bcrypt.compare(TEST_PASSWORD, user.password)
  console.log('Password valid:', isValid)

  // Test with trimmed password
  const trimmedPassword = TEST_PASSWORD.trim()
  console.log('\n🔐 Testing with trimmed password...')
  console.log('Trimmed password:', trimmedPassword)
  console.log('Trimmed password length:', trimmedPassword.length)
  const isValidTrimmed = await bcrypt.compare(trimmedPassword, user.password)
  console.log('Password valid (trimmed):', isValidTrimmed)

  // Try to hash the password again and see if it matches
  console.log('\n🔐 Testing new hash...')
  const newHash = await bcrypt.hash(TEST_PASSWORD, 10)
  console.log('New hash (first 20 chars):', newHash.substring(0, 20))
  console.log('New hash matches old hash:', newHash === user.password)
  const newHashCompare = await bcrypt.compare(TEST_PASSWORD, newHash)
  console.log('New hash comparison works:', newHashCompare)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
