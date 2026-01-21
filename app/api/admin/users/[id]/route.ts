import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth-helpers'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// GET - Get user details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    // Try to fetch with verified field first
    let user: any
    try {
      user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          role: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (dbError: any) {
      // If verified column doesn't exist, fetch without it
      if (dbError.code === 'P2021' || dbError.message?.includes('Unknown column') || dbError.message?.includes('verified')) {
        user = await prisma.user.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            location: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        if (user) {
          (user as any).verified = false
        }
      } else {
        throw dbError
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    console.error('[Admin User] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user (admin can edit name, displayName, bio, location, remove avatar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const { name, displayName, bio, location, verified, removeAvatar } = body

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data: any = {}
    if (name !== undefined) data.name = name?.trim() || null
    if (displayName !== undefined) data.displayName = displayName?.trim() || null
    if (bio !== undefined) data.bio = bio?.trim() || null
    if (location !== undefined) data.location = location?.trim() || null
    if (verified !== undefined) data.verified = Boolean(verified)

    // Remove avatar if requested
    if (removeAvatar && user.avatarUrl) {
      // Try to delete from Cloudinary if it's a Cloudinary URL
      try {
        const urlParts = user.avatarUrl.split('/')
        const publicIdIndex = urlParts.findIndex(part => part === 'user-profiles')
        if (publicIdIndex !== -1) {
          const publicId = urlParts.slice(publicIdIndex).join('/').replace(/\.[^/.]+$/, '')
          await cloudinary.uploader.destroy(publicId).catch(() => {
            // Ignore errors - image might not exist or already deleted
          })
        }
      } catch (error) {
        console.error('[Admin User] Error deleting avatar from Cloudinary:', error)
        // Continue anyway - we'll still remove the URL from database
      }
      data.avatarUrl = null
    }

    // Handle verified field - try update with it, fallback without it if column doesn't exist
    const updateData = { ...data }
    const hasVerified = 'verified' in updateData
    
    try {
      // Try to update with verified field
      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      
      // Try to include verified in response - if column exists, fetch it; otherwise default to false
      let verifiedValue = false
      if (hasVerified) {
        try {
          const userWithVerified = await prisma.user.findUnique({
            where: { id: params.id },
            select: { verified: true },
          })
          verifiedValue = (userWithVerified as any)?.verified || false
        } catch (verifyError: any) {
          // Column doesn't exist, keep verifiedValue as false
          console.log('[Admin User] Could not fetch verified field:', verifyError.message)
        }
      }
      
      return NextResponse.json({ ...updatedUser, verified: verifiedValue })
    } catch (dbError: any) {
      // If error is about verified column not existing, retry without it
      const isVerifiedColumnError = dbError.code === 'P2021' || 
        dbError.message?.includes('Unknown column') || 
        dbError.message?.includes('verified') ||
        dbError.message?.includes('doesn\'t exist') ||
        (dbError.message?.includes('Column') && dbError.message?.includes('not found'))
      
      if (hasVerified && isVerifiedColumnError) {
        console.log('[Admin User] verified column not found, retrying without it:', dbError.message)
        delete updateData.verified
        
        try {
          const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: {
              id: true,
              email: true,
              name: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              location: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          })
          return NextResponse.json({ ...updatedUser, verified: false })
        } catch (retryError: any) {
          console.error('[Admin User] Retry update failed:', retryError)
          throw retryError
        }
      }
      // Re-throw other errors so they're caught by outer catch
      throw dbError
    }
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.status }
      )
    }
    console.error('[Admin User] PATCH error:', error)
    console.error('[Admin User] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
