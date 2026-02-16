'use server'

import { cookies } from 'next/headers'

const TOKEN_KEY = 'biashara_token'
const REFRESH_KEY = 'biashara_refresh_token'
const MAX_AGE = 60 * 60 * 24 // 1 day
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setAuthCookie(token: string, refreshToken?: string): Promise<void> {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'
  cookieStore.set(TOKEN_KEY, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  if (refreshToken) {
    cookieStore.set(REFRESH_KEY, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE,
      path: '/',
    })
  }
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_KEY)
  cookieStore.delete(REFRESH_KEY)
}
