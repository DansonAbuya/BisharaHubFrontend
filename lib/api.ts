/**
 * BiasharaHub API client
 * Backend: 2FA (email code), user addition (owner/staff/assistant_admin), change password.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = sessionStorage.getItem('biashara_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': DEFAULT_TENANT_ID,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  businessId?: string
  businessName?: string
}

export interface LoginResponse {
  token?: string
  refreshToken?: string
  user: AuthUser
  requiresTwoFactor: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

/** Add owner: name, email, business name; backend sends temp password by email */
export interface AddOwnerRequest {
  name: string
  email: string
  businessName: string
}

/** Add staff: name + email only; backend sends temp password by email */
export interface AddStaffRequest {
  name: string
  email: string
}

/** Add assistant admin: name + email only; super_admin only */
export interface AddAssistantAdminRequest {
  name: string
  email: string
}

export async function register(data: RegisterRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Registration failed')
  }
  return res.json()
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.message || 'Invalid credentials')
  }
  return res.json()
}

/** Complete login/register when 2FA is required. Returns tokens and user. Sends code as integer. */
export async function verifyCode(email: string, code: string): Promise<LoginResponse> {
  const codeNum = parseInt(code, 10)
  if (Number.isNaN(codeNum)) throw new Error('Invalid verification code')
  const res = await fetch(`${API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, code: codeNum }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Invalid or expired code')
  }
  return res.json()
}

export async function refreshToken(refreshToken: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error('Session expired')
  return res.json()
}

/** Forgot password: request reset link by email. Available to all users. */
export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': DEFAULT_TENANT_ID },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to send reset email')
  }
}

/** Reset password with token from email link. Available to all users. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': DEFAULT_TENANT_ID },
    body: JSON.stringify({ token: token.trim(), newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Invalid or expired reset link')
  }
}

/** Change password (authenticated). Owner/staff use after first login. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to change password')
  }
}

/** Enable 2FA (owner/super_admin only; customer/staff/assistant_admin get 403) */
export async function enable2FA(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/2fa/enable`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to enable 2FA')
  }
}

/** Disable 2FA (owner/super_admin only) */
export async function disable2FA(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/2fa/disable`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to disable 2FA')
  }
}

export async function addStaff(data: AddStaffRequest): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add staff')
  }
  return res.json()
}

export async function addOwner(data: AddOwnerRequest): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/admin/owners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add owner')
  }
  return res.json()
}

export async function addAssistantAdmin(data: AddAssistantAdminRequest): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/admin/assistant-admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add assistant admin')
  }
  return res.json()
}

export async function listStaff(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/users/staff`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch staff')
  return res.json()
}
