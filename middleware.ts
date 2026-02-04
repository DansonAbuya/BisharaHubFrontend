import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirect HTTP to HTTPS so the app always uses a secure connection.
 * In production (or behind a proxy), when the request is received over HTTP we redirect to HTTPS.
 * When using `next dev --experimental-https`, the dev server is HTTPS so this mainly helps in production.
 */
export function middleware(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host') || request.nextUrl.host
  // If the request came over HTTP (e.g. proxy sent x-forwarded-proto: http), redirect to HTTPS
  if (proto === 'http') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = host
    return NextResponse.redirect(url, 301)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
