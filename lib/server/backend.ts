/**
 * Server-only helpers for calling the backend API from Server Actions.
 * Uses the auth cookie set at login so requests are authenticated.
 */
import { cookies } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const TOKEN_COOKIE = 'biashara_token'

export async function getBackendAuthHeaders(): Promise<Record<string, string>> {
  const c = await cookies()
  const token = c.get(TOKEN_COOKIE)?.value ?? null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': DEFAULT_TENANT_ID,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function backendFetch(
  path: string,
  init?: RequestInit & { method?: string; body?: string | object | FormData }
): Promise<Response> {
  const baseHeaders = await getBackendAuthHeaders()
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const rawBody = init?.body
  let body: string | FormData | undefined
  let headers = { ...baseHeaders }
  if (rawBody != null) {
    if (rawBody instanceof FormData) {
      body = rawBody
      delete (headers as Record<string, unknown>)['Content-Type'] // let fetch set multipart boundary
    } else {
      body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)
    }
  } else {
    body = undefined
  }
  const { body: _b, ...rest } = init ?? {}
  return fetch(url, {
    ...rest,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    ...(body !== undefined && { body }),
  })
}
