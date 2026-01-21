import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthApi } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const session = await requireAuthApi()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        createdAt: true,
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    console.error('[PROFILE] GET error', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuthApi()
    const body = await req.json()
    const { displayName, avatarUrl, bio, location } = body

    const data: any = {}
    if (displayName !== undefined) data.displayName = displayName?.trim() || null
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl?.trim() || null
    if (bio !== undefined) data.bio = bio?.trim() || null
    if (location !== undefined) data.location = location?.trim() || null

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    console.error('[PROFILE] PATCH error', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

