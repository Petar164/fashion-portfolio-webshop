import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ADMIN PASSWORD RESET
// This endpoint resets the admin password using environment variable
export async function GET() {
  try {
    const ADMIN_EMAIL = 'fashionvoidhelp@gmail.com'
    // Get password from environment variable or use default for development
    const NEW_PASSWORD = process.env.ADMIN_RESET_PASSWORD || 'admin123'

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL.toLowerCase().trim() }
    })

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)

    // Update password
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully!',
      email: admin.email,
      password: NEW_PASSWORD,
      warning: '⚠️ PERMANENT PASSWORD - This password will not be changed again. Use it to diagnose login issues.'
    })
  } catch (error: any) {
    console.error('[RESET-PASSWORD] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

