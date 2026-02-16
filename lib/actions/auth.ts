'use server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const headers = () => ({ 'Content-Type': 'application/json', 'X-Tenant-ID': DEFAULT_TENANT_ID })

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to send reset email')
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ token: token.trim(), newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Invalid or expired reset link')
  }
}
