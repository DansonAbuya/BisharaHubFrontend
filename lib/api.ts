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
  phone?: string
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
  /** Optional phone for WhatsApp (e.g. +254712345678 or 0712345678). */
  phone?: string
}

/** Add owner: name, email, business name, applyingForTier, and payout details (used for auto-payout on delivery). */
export interface AddOwnerRequest {
  name: string
  email: string
  businessName: string
  applyingForTier: string
  /** Payout method: MPESA or BANK_TRANSFER. Used to release seller payments on order delivery. */
  payoutMethod: string
  /** For MPESA: M-Pesa phone (2547XXXXXXXX or 07XXXXXXXX). For BANK_TRANSFER: bank name and account. */
  payoutDestination: string
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

/** Add courier: name + email + phone; owner only */
export interface AddCourierRequest {
  name: string
  email: string
  phone: string
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
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.message || err.error
    if (res.status === 401) {
      throw new Error(msg || 'Session expired. Please sign in again.')
    }
    if (res.status === 403) {
      throw new Error(msg || 'You do not have permission to onboard businesses. Only platform administrators can do this.')
    }
    throw new Error(msg || 'Failed to add owner')
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

// --- Seller pricing & white-label config (admin + owner dashboard) ---

export interface SellerConfigDto {
  userId: string
  email: string
  name: string | null
  role: string
  businessId?: string | null
  businessName?: string | null
  sellerTier?: string | null
  verificationStatus?: string | null
  pricingPlan?: string | null
  /** Growth plan feature flags (only when pricingPlan is "growth"). */
  growthInventoryAutomation?: boolean | null
  growthWhatsappEnabled?: boolean | null
  growthAnalyticsEnabled?: boolean | null
  growthDeliveryIntegrations?: boolean | null
  brandingEnabled?: boolean | null
  brandingName?: string | null
  brandingLogoUrl?: string | null
  brandingPrimaryColor?: string | null
  brandingSecondaryColor?: string | null
}

/** Admin: list all sellers (owners) with their pricing and branding config. */
export async function listSellerConfigs(): Promise<SellerConfigDto[]> {
  const res = await fetch(`${API_BASE}/admin/sellers/config`, { headers: getAuthHeaders() })
  if (!res.ok) {
    throw new Error('Failed to load seller configuration')
  }
  return res.json()
}

/** Admin: get a single seller's config (for setup screens). */
export async function getSellerConfig(ownerId: string): Promise<SellerConfigDto | null> {
  const res = await fetch(`${API_BASE}/admin/sellers/${ownerId}/config`, { headers: getAuthHeaders() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load seller configuration')
  return res.json()
}

/** Admin: set pricing plan for an owner (e.g. basic/growth/enterprise). */
export async function setSellerPricingPlan(ownerId: string, pricingPlan: string): Promise<SellerConfigDto> {
  const res = await fetch(`${API_BASE}/admin/sellers/${ownerId}/pricing`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pricingPlan }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update pricing plan')
  }
  return res.json()
}

/** Admin: configure Growth plan features for an owner (only when plan is growth). */
export async function setSellerGrowthConfig(
  ownerId: string,
  body: {
    growthInventoryAutomation?: boolean
    growthWhatsappEnabled?: boolean
    growthAnalyticsEnabled?: boolean
    growthDeliveryIntegrations?: boolean
  }
): Promise<SellerConfigDto> {
  const res = await fetch(`${API_BASE}/admin/sellers/${ownerId}/growth-config`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update Growth config')
  }
  return res.json()
}

/** Admin: configure white-label branding for an owner. */
export async function setSellerBranding(
  ownerId: string,
  body: {
    brandingEnabled?: boolean
    brandingName?: string | null
    brandingLogoUrl?: string | null
    brandingPrimaryColor?: string | null
    brandingSecondaryColor?: string | null
  }
): Promise<SellerConfigDto> {
  const res = await fetch(`${API_BASE}/admin/sellers/${ownerId}/branding`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update branding')
  }
  return res.json()
}

/** Seller (owner): read own pricing and branding configuration. */
export async function getMySellerConfig(): Promise<SellerConfigDto | null> {
  const res = await fetch(`${API_BASE}/sellers/me/config`, { headers: getAuthHeaders() })
  if (res.status === 401 || res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load seller config')
  }
  return res.json()
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

/** Current user (id, name, email, phone, role) for role-based UI. Backend: GET /users/me */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  return res.json()
}

/** Update current user profile (name, phone). Backend: PATCH /users/me. Use so customers can add phone for WhatsApp. */
export async function updateMyProfile(body: { name?: string; phone?: string | null }): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update profile')
  }
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
  deliveryMode?: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP' | string
  shippingFee?: number
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

/** Create order (auth required). Body: items, optional shippingAddress, deliveryMode & optional shippingFee. */
export async function createOrder(body: {
  items: { productId: string; quantity: number }[]
  shippingAddress?: string
  deliveryMode: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP'
  shippingFee?: number
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

/** Cancel an order as long as it has not been confirmed yet (pending only). */
export async function cancelOrder(orderId: string): Promise<OrderDto> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to cancel order')
  }
  return res.json()
}

// --- Analytics (owner/staff/super_admin dashboards) ---

export interface AnalyticsSummaryDto {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  averageOrderValue: number
}

export async function getAnalytics(): Promise<AnalyticsSummaryDto> {
  const res = await fetch(`${API_BASE}/analytics`, { headers: getAuthHeaders() })
  if (res.status === 401 || res.status === 403) {
    throw new Error('Not authorized to view analytics')
  }
  if (!res.ok) {
    throw new Error('Failed to load analytics')
  }
  const data = await res.json()
  return {
    totalOrders: Number(data.totalOrders ?? 0),
    totalRevenue: Number(data.totalRevenue ?? 0),
    pendingOrders: Number(data.pendingOrders ?? 0),
    averageOrderValue: Number(data.averageOrderValue ?? 0),
  }
}

// --- Shipments (backend: auto-created after payment, track delivery) ---

/** Courier portal: shipment with order summary */
export interface CourierShipmentDto {
  shipment: ShipmentDto
  orderId: string
  orderNumber: string
  customerName: string | null
  shippingAddress: string | null
}

/** Courier portal: shipment with order summary */
export interface CourierShipmentDto {
  shipment: ShipmentDto
  orderId: string
  orderNumber: string
  customerName: string
  shippingAddress: string
}

export interface ShipmentDto {
  id: string
  orderId: string
  assignedCourierId?: string | null
  deliveryMode: 'SELLER_SELF' | 'COURIER' | 'RIDER_MARKETPLACE' | 'CUSTOMER_PICKUP' | string
  status: string
  carrier?: string | null
  trackingNumber?: string | null
  riderName?: string | null
  riderPhone?: string | null
  riderVehicle?: string | null
  riderJobId?: string | null
  pickupLocation?: string | null
  shippedAt?: string | null
  estimatedDelivery?: string | null
  actualDelivery?: string | null
  escrowReleasedAt?: string | null
  otpCode?: string | null
}

// --- Reviews & feedback ---

export interface OrderReviewDto {
  reviewId: string
  orderId: string
  reviewerUserId: string
  reviewerName: string
  rating: number
  comment?: string
  createdAt: string
}

export async function getReviewForOrder(orderId: string): Promise<OrderReviewDto | null> {
  const res = await fetch(`${API_BASE}/reviews/order/${orderId}`, { headers: getAuthHeaders() })
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load review')
  }
  return res.json()
}

export async function createReview(orderId: string, rating: number, comment?: string): Promise<OrderReviewDto> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId, rating, comment }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Failed to submit review')
  }
  return res.json()
}

export async function getBusinessRating(businessId: string): Promise<number> {
  const res = await fetch(`${API_BASE}/reviews/business/${businessId}/rating`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load rating')
  }
  const value = await res.json()
  return typeof value === 'number' ? value : 0
}

// --- Courier services (platform catalog for COURIER delivery mode) ---

export interface CourierServiceDto {
  courierId: string
  name: string
  code: string
  description?: string | null
  trackingUrlTemplate?: string | null
  /** MANUAL, DHL, FEDEX, SENDY, REST - integrated provider type */
  providerType?: string | null
  apiBaseUrl?: string | null
  isActive: boolean
  baseRate: number
  ratePerKg: number
  createdAt?: string | null
  updatedAt?: string | null
}

/** List active courier services (for dropdown when creating/editing shipments). Public GET; no auth required. */
export async function listCourierServices(): Promise<CourierServiceDto[]> {
  const res = await fetch(`${API_BASE}/courier-services`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch courier services')
  return res.json()
}

/** Admin: list all courier services (including inactive). */
export async function listAdminCourierServices(): Promise<CourierServiceDto[]> {
  const res = await fetch(`${API_BASE}/admin/courier-services`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch courier services')
  return res.json()
}

/** Admin: create courier service. */
export async function createCourierService(body: {
  name: string
  code: string
  description?: string
  trackingUrlTemplate?: string
  providerType?: string
  apiBaseUrl?: string
  isActive?: boolean
  baseRate: number
  ratePerKg: number
}): Promise<CourierServiceDto> {
  const res = await fetch(`${API_BASE}/admin/courier-services`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create courier service')
  }
  return res.json()
}

/** Admin: update courier service. */
export async function updateCourierService(
  courierId: string,
  body: {
    name?: string
    description?: string
    trackingUrlTemplate?: string
    providerType?: string
    apiBaseUrl?: string
    isActive?: boolean
    baseRate?: number
    ratePerKg?: number
  }
): Promise<CourierServiceDto> {
  const res = await fetch(`${API_BASE}/admin/courier-services/${courierId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update courier service')
  }
  return res.json()
}

/** Admin: delete courier service. */
export async function deleteCourierService(courierId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/courier-services/${courierId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to delete courier service')
  }
}

/** Create a shipment for an order (owner/staff). Use carrier from courier service name/code when delivery mode is COURIER. */
export async function createShipment(body: {
  orderId: string
  deliveryMode?: string
  carrier?: string | null
  trackingNumber?: string | null
  riderName?: string | null
  riderPhone?: string | null
  riderVehicle?: string | null
  riderJobId?: string | null
  pickupLocation?: string | null
}): Promise<ShipmentDto> {
  const res = await fetch(`${API_BASE}/shipments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create shipment')
  }
  return res.json()
}

/** Update shipment (status, carrier, tracking number, assigned courier, etc.). */
export async function updateShipment(
  shipmentId: string,
  body: Partial<{
    status: string
    carrier: string | null
    trackingNumber: string | null
    riderName: string | null
    riderPhone: string | null
    riderVehicle: string | null
    riderJobId: string | null
    pickupLocation: string | null
    assignedCourierId: string | null
  }>
): Promise<ShipmentDto> {
  const res = await fetch(`${API_BASE}/shipments/${shipmentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update shipment')
  }
  return res.json()
}

/** List shipments for the current tenant. Owner/staff: their business; customer: their orders only (backend-scoped). */
export async function listShipments(): Promise<ShipmentDto[]> {
  const res = await fetch(`${API_BASE}/shipments`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch shipments')
  return res.json()
}

/** List shipments for a specific order (owner/staff or customer, scoped by backend). */
export async function listShipmentsByOrder(orderId: string): Promise<ShipmentDto[]> {
  const res = await fetch(`${API_BASE}/shipments/order/${orderId}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch shipments for order')
  return res.json()
}

/** Verify a shipment using OTP code (seller self-delivery or pickup). */
export async function verifyShipmentOtp(shipmentId: string, code: string): Promise<ShipmentDto> {
  const res = await fetch(`${API_BASE}/shipments/${shipmentId}/verify-otp`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Invalid or expired delivery code')
  }
  return res.json()
}

/** Create shipment with integrated courier provider (DHL, FedEx, Sendy, REST). Updates shipment with tracking number. */
export async function createShipmentWithProvider(
  shipmentId: string,
  courierServiceCode: string
): Promise<{ shipment: ShipmentDto; trackingNumber?: string; labelUrl?: string }> {
  const res = await fetch(`${API_BASE}/shipments/${shipmentId}/create-with-provider`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ courierServiceCode: courierServiceCode.trim() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create shipment with provider')
  }
  return res.json()
}

export interface TrackingEventDto {
  timestamp: string
  status?: string
  description?: string
  location?: string
}

export interface TrackingInfoDto {
  trackingNumber?: string
  status?: string
  statusDescription?: string
  estimatedDelivery?: string
  events?: TrackingEventDto[]
}

/** Get tracking info from courier provider (if integrated). */
export async function getShipmentTracking(shipmentId: string): Promise<TrackingInfoDto> {
  const res = await fetch(`${API_BASE}/shipments/${shipmentId}/tracking`, { headers: getAuthHeaders() })
  if (!res.ok) return {}
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

// --- In-app notifications ---

export type NotificationType = 'order' | 'shipment' | 'payment' | 'system' | 'alert' | string

export interface NotificationDto {
  id: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string | null
  data?: string | null
  read: boolean
  createdAt: string
}

export async function listNotifications(options?: { unreadOnly?: boolean }): Promise<NotificationDto[]> {
  const params = new URLSearchParams()
  if (options?.unreadOnly) params.set('unreadOnly', 'true')
  const qs = params.toString()
  const url = qs ? `${API_BASE}/notifications?${qs}` : `${API_BASE}/notifications`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (res.status === 401) return []
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error('Failed to mark notification as read')
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    throw new Error('Failed to mark notifications as read')
  }
}

// --- Wallet & Payouts (owner/staff/super_admin/assistant_admin; requires X-Tenant-ID) ---

export interface WalletBalanceDto {
  balance: number
}

export interface DefaultPayoutDestinationDto {
  method: string
  destinationMasked: string | null
}

export interface PayoutDto {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
  processedAt?: string | null
  failureReason?: string | null
}

export async function getWalletBalance(): Promise<WalletBalanceDto> {
  const res = await fetch(`${API_BASE}/wallet/balance`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch wallet balance')
  return res.json()
}

export async function getPayoutDestination(): Promise<DefaultPayoutDestinationDto | { method: null; destinationMasked: null }> {
  const res = await fetch(`${API_BASE}/wallet/payout-destination`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch payout destination')
  return res.json()
}

export async function setPayoutDestination(method: string, destination: string): Promise<void> {
  const res = await fetch(`${API_BASE}/wallet/payout-destination`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ method, destination }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as string) || 'Failed to update payout destination')
  }
}

export async function listPayouts(): Promise<PayoutDto[]> {
  const res = await fetch(`${API_BASE}/payouts`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch payouts')
  return res.json()
}

// --- Trust & Safety: Disputes ---

export interface DisputeDto {
  id: string
  orderId: string
  orderNumber: string
  reporterUserId: string
  reporterName: string
  disputeType: string
  status: string
  description: string | null
  deliveryProofUrl: string | null
  sellerResponse: string | null
  sellerRespondedAt: string | null
  resolvedAt: string | null
  resolvedByUserId: string | null
  resolution: string | null
  strikeReason: string | null
  createdAt: string
  updatedAt: string
}

export async function createDispute(body: {
  orderId: string
  disputeType: string
  description?: string
  deliveryProofUrl?: string
}): Promise<DisputeDto> {
  const res = await fetch(`${API_BASE}/disputes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create dispute')
  }
  return res.json()
}

export async function listDisputesForOrder(orderId: string): Promise<DisputeDto[]> {
  const res = await fetch(`${API_BASE}/disputes/order/${orderId}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch disputes for order')
  return res.json()
}

export async function listDisputes(status?: string): Promise<DisputeDto[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '?status=open'
  const res = await fetch(`${API_BASE}/disputes${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch disputes')
  return res.json()
}

export async function getDispute(id: string): Promise<DisputeDto> {
  const res = await fetch(`${API_BASE}/disputes/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch dispute')
  return res.json()
}

export async function sellerRespondDispute(id: string, response: string): Promise<DisputeDto> {
  const res = await fetch(`${API_BASE}/disputes/${id}/respond`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ response }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to submit response')
  }
  return res.json()
}

export async function resolveDispute(
  id: string,
  body: { resolution: string; strikeReason?: string }
): Promise<DisputeDto> {
  const res = await fetch(`${API_BASE}/disputes/${id}/resolve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to resolve dispute')
  }
  return res.json()
}
