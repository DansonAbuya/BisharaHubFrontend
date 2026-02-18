'use server'

import { backendFetch } from '@/lib/server/backend'

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await backendFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to change password')
  }
}

export async function enable2FA(): Promise<void> {
  const res = await backendFetch('/auth/2fa/enable', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to enable 2FA')
  }
}

export async function disable2FA(): Promise<void> {
  const res = await backendFetch('/auth/2fa/disable', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to disable 2FA')
  }
}
