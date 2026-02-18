'use server'

import type { AuthUser } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

/** Current user (id, name, email, phone, role) for role-based UI. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await backendFetch('/users/me')
  if (!res.ok) return null
  return res.json()
}

/** Update current user profile (name, phone). */
export async function updateMyProfile(body: { name?: string; phone?: string | null }): Promise<AuthUser> {
  const res = await backendFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update profile')
  }
  return res.json()
}
