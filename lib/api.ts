/**
 * BiasharaHub API client
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
  token: string
  user: AuthUser
  requiresTwoFactor: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AddUserRequest {
  name: string
  email: string
  password: string
  role: 'owner' | 'staff'
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
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function addStaff(data: Omit<AddUserRequest, 'role'>): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...data, role: 'staff' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add staff')
  }
  return res.json()
}

export async function addOwner(data: Omit<AddUserRequest, 'role'>): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/admin/owners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...data, role: 'owner' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add owner')
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
