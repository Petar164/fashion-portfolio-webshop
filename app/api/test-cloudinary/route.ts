import { NextResponse } from 'next/server'

// Test endpoint to check Cloudinary configuration
export async function GET() {
  const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME
  const hasApiKey = !!process.env.CLOUDINARY_API_KEY
  const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET

  return NextResponse.json({
    configured: hasCloudName && hasApiKey && hasApiSecret,
    details: {
      CLOUDINARY_CLOUD_NAME: hasCloudName ? '✅ Set' : '❌ Missing',
      CLOUDINARY_API_KEY: hasApiKey ? '✅ Set' : '❌ Missing',
      CLOUDINARY_API_SECRET: hasApiSecret ? '✅ Set' : '❌ Missing',
    },
    cloudNamePreview: hasCloudName 
      ? process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 10) + '...' 
      : 'Not set',
  })
}



