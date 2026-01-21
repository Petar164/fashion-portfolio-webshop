import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[Upload API] Cloudinary credentials missing:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      })
      return NextResponse.json(
        { 
          error: 'Image upload is not configured. Please add Cloudinary credentials to your .env file.',
          details: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET'
        },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.error('[Upload API] Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      console.error('[Upload API] Forbidden: User is not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('[Upload API] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[Upload API] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (20MB limit - Cloudinary free tier supports up to 10MB, but we allow larger files
    // and let Cloudinary handle optimization. For files >10MB, Cloudinary will optimize them automatically)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      console.error('[Upload API] File too large:', file.size)
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit. Please compress the image or use a smaller file.' },
        { status: 400 }
      )
    }

    console.log('[Upload API] Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Note: Cloudinary free tier supports up to 10MB, paid tiers support up to 100MB
    // For very large files, consider using Cloudinary's large upload API
    // For now, we'll allow uploads and let Cloudinary handle the limit

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    return new Promise<NextResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'fashionvoid',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
            chunk_size: 6000000, // 6MB chunks for large files
          },
          (error, result) => {
            if (error) {
              console.error('[Upload API] Cloudinary upload error:', {
                message: error.message,
                http_code: error.http_code,
                name: error.name,
              })
              resolve(
                NextResponse.json(
                  { 
                    error: 'Failed to upload image to Cloudinary',
                    details: error.message || 'Unknown error',
                    http_code: error.http_code,
                  },
                  { status: 500 }
                )
              )
            } else if (!result || !result.secure_url) {
              console.error('[Upload API] Cloudinary returned no result or URL')
              resolve(
                NextResponse.json(
                  { error: 'Upload succeeded but no URL was returned' },
                  { status: 500 }
                )
              )
            } else {
              console.log('[Upload API] Upload successful:', {
                url: result.secure_url,
                publicId: result.public_id,
              })
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
    console.error('[Upload API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    
    // If it's already a NextResponse, return it
    if (error instanceof NextResponse) {
      return error
    }

    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

