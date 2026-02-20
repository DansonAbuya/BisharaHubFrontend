import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirect HTTP to HTTPS in production so the app uses a secure connection.
 * Skipped on localhost so dev can run over HTTP (no SSL) and avoid ERR_SSL_PROTOCOL_ERROR.
 * 
 * Note: In Next.js 16+, this file replaces middleware.ts with the proxy convention.
 * The proxy is restricted to edge-level network tasks like redirects, rewrites, and header modifications.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || request.nextUrl.host
  const isLocalhost =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:')
  if (isLocalhost) return NextResponse.next()

  const proto = request.headers.get('x-forwarded-proto')
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
