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

/** Add owner: name, email, business name; optional applyingForTier (tier1/tier2/tier3) so owner knows which documents to submit */
export interface AddOwnerRequest {
  name: string
  email: string
  businessName: string
  applyingForTier?: string
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

// --- Owner verification (admin: list pending, approve/reject with tier) ---

/** Owner DTO as returned by verification endpoints (includes verification status, seller tier, applying for tier). */
export interface OwnerVerificationDto {
  id: string
  name: string
  email: string
  role: string
  businessId?: string
  businessName?: string
  verificationStatus?: string
  verifiedAt?: string
  verifiedByUserId?: string
  verificationNotes?: string
  sellerTier?: string
  applyingForTier?: string
}

/** Verification document (owner uploads; admin reviews). */
export interface OwnerVerificationDocumentDto {
  documentId: string
  userId: string
  documentType: string
  fileUrl: string
  uploadedAt: string
}

/** List owners pending verification. Admin only. */
export async function listPendingOwners(): Promise<OwnerVerificationDto[]> {
  const res = await fetch(`${API_BASE}/verification/admin/pending-owners`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch pending owners')
  return res.json()
}

/** Admin: get verification documents for an owner (to review before verify/reject). */
export async function getOwnerDocuments(ownerId: string): Promise<OwnerVerificationDocumentDto[]> {
  const res = await fetch(`${API_BASE}/verification/admin/owners/${ownerId}/documents`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch owner documents')
  return res.json()
}

/** Set owner verification status and optionally seller tier. Admin only. status: verified | rejected; sellerTier: tier1 | tier2 | tier3. */
export async function setOwnerVerification(
  ownerId: string,
  body: { status: 'verified' | 'rejected'; notes?: string; sellerTier?: 'tier1' | 'tier2' | 'tier3' }
): Promise<OwnerVerificationDto> {
  const res = await fetch(`${API_BASE}/verification/admin/owners/${ownerId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update verification')
  }
  return res.json()
}

/** Owner: get my verification status (pending/verified/rejected, applyingForTier). */
export async function getMyVerificationStatus(): Promise<OwnerVerificationDto | null> {
  const res = await fetch(`${API_BASE}/verification/status`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  return res.json()
}

/** Owner: list my uploaded verification documents. */
export async function getMyVerificationDocuments(): Promise<OwnerVerificationDocumentDto[]> {
  const res = await fetch(`${API_BASE}/verification/documents`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

/** Owner: upload a verification document (documentType + fileUrl). Use uploadVerificationDocumentFile for file uploads. */
export async function uploadVerificationDocument(
  documentType: string,
  fileUrl: string
): Promise<OwnerVerificationDocumentDto> {
  const res = await fetch(`${API_BASE}/verification/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentType, fileUrl }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to upload document')
  }
  return res.json()
}

/** Owner: upload a verification document file (image or PDF). Uses dedicated verification upload endpoint. */
export async function uploadVerificationDocumentFile(
  documentType: string,
  file: File
): Promise<OwnerVerificationDocumentDto> {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('biashara_token') : null
  const headers: Record<string, string> = { 'X-Tenant-ID': DEFAULT_TENANT_ID }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/verification/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to upload document')
  }
  return res.json()
}

// --- Products & Categories (backend: business-scoped for owner/staff, R2 images) ---

export interface ProductCategoryDto {
  id: string
  name: string
  displayOrder: number
}

export interface BusinessDto {
  id: string
  name: string
  ownerName: string
  sellerTier?: string
}

/** List businesses (owners) for customer filter dropdown. */
export async function listBusinesses(): Promise<BusinessDto[]> {
  const res = await fetch(`${API_BASE}/products/businesses`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch businesses')
  return res.json()
}

export interface ProductDto {
  id: string
  name: string
  category: string | null
  price: number
  quantity: number
  description: string | null
  image: string | null
  images: string[] | null
  businessId: string | null
}

/** List product categories for dropdown. Public endpoint; auth sent when available. */
export async function listProductCategories(): Promise<ProductCategoryDto[]> {
  const res = await fetch(`${API_BASE}/products/categories`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

/** List products. Customers: optional category, businessId, businessName, ownerId. Owner/staff: only their business. */
export async function listProducts(params?: {
  category?: string
  businessId?: string
  businessName?: string
  ownerId?: string
}): Promise<ProductDto[]> {
  const search = new URLSearchParams()
  if (params?.category) search.set('category', params.category)
  if (params?.businessId) search.set('businessId', params.businessId)
  if (params?.businessName) search.set('businessName', params.businessName)
  if (params?.ownerId) search.set('ownerId', params.ownerId)
  const qs = search.toString()
  const url = qs ? `${API_BASE}/products?${qs}` : `${API_BASE}/products`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

/** Get single product (owner/staff: only their business). */
export async function getProduct(id: string): Promise<ProductDto> {
  const res = await fetch(`${API_BASE}/products/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

/** Create product (owner/staff only; scoped to their business). */
export async function createProduct(data: {
  name: string
  category?: string | null
  price: number
  quantity?: number
  description?: string | null
  image?: string | null
  images?: string[] | null
}): Promise<ProductDto> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create product')
  }
  return res.json()
}

/** Update product (owner/staff only; must belong to their business). */
export async function updateProduct(
  id: string,
  data: {
    name?: string
    category?: string | null
    price?: number
    quantity?: number
    description?: string | null
    image?: string | null
    images?: string[] | null
  }
): Promise<ProductDto> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update product')
  }
  return res.json()
}

/** Delete product (owner/staff only; must belong to their business). */
export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete product')
  }
}

/** Current user (id, name, email, role) for role-based UI. Backend: GET /users/me */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  return res.json()
}

// --- Orders (backend: create order, list, get one) ---

export interface OrderItemDto {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface OrderDto {
  id: string
  orderId?: string
  customerId: string
  customerName?: string
  customerEmail?: string
  businessId?: string
  items: OrderItemDto[]
  total: number
  status: string
  paymentStatus?: string
  paymentMethod?: string
  paymentId?: string
  createdAt: string
  updatedAt?: string
  shippingAddress?: string
}

export async function listOrders(): Promise<OrderDto[]> {
  const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function getOrder(id: string): Promise<OrderDto> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch order')
  return res.json()
}

/** Create order (auth required). Body: items (productId, quantity), optional shippingAddress. */
export async function createOrder(body: {
  items: { productId: string; quantity: number }[]
  shippingAddress?: string
}): Promise<OrderDto> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to create order')
  }
  return res.json()
}

/** Initiate M-Pesa payment for an order (STK Push). Phone: 254XXXXXXXXX or 07XXXXXXXX. */
export async function initiatePayment(orderId: string, body: { phoneNumber: string }): Promise<{
  paymentId: string
  checkoutRequestId: string
  status: string
  message: string
}> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/payments/initiate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to initiate payment')
  }
  return res.json()
}

/** Confirm payment (e.g. after M-Pesa callback or for testing when callback is not reachable). */
export async function confirmPayment(orderId: string, paymentId: string): Promise<{ status: string; paymentId: string }> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/payments/${paymentId}/confirm`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to confirm payment')
  }
  return res.json()
}

/** Upload product image to R2 (owner/staff only). Returns { url }. */
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('biashara_token') : null
  const headers: Record<string, string> = { 'X-Tenant-ID': DEFAULT_TENANT_ID }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/products/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Image upload failed')
  }
  return res.json()
}
