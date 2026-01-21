import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Check protocol from multiple sources
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedSsl = request.headers.get('x-forwarded-ssl')
  const isHttps = url.protocol === 'https:' || 
                  forwardedProto === 'https' || 
                  forwardedSsl === 'on' ||
                  request.headers.get('x-forwarded-port') === '443'
  
  // Remove any port from hostname
  const cleanHostname = hostname.split(':')[0]
  
  // Redirect non-www to www (always use HTTPS)
  if (cleanHostname === 'fashionvoid.net') {
    url.hostname = 'www.fashionvoid.net'
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }
  
  // Force HTTPS in production - check URL protocol directly
  if (process.env.NODE_ENV === 'production' && !isHttps) {
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
