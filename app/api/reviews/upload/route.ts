import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Image upload is not configured' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    return new Promise<NextResponse>((resolve) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'fashionvoid/reviews',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
              { width: 1200, height: 1200, crop: 'limit' },
            ],
          },
          (error, result) => {
            if (error) {
              console.error('[Review Upload] Cloudinary error:', error)
              resolve(
                NextResponse.json(
                  { error: 'Failed to upload image' },
                  { status: 500 }
                )
              )
            } else if (!result || !result.secure_url) {
              resolve(
                NextResponse.json(
                  { error: 'Upload succeeded but no URL was returned' },
                  { status: 500 }
                )
              )
            } else {
              resolve(
                NextResponse.json({
                  url: result.secure_url,
                  publicId: result.public_id,
                })
              )
            }
          }
        )
        .end(buffer)
    })
  } catch (error: any) {
    console.error('[Review Upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
