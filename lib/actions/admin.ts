'use server'

import type {
  AuthUser,
  AddOwnerRequest,
  AddServiceProviderRequest,
  AddStaffRequest,
  AddCourierRequest,
  AddAssistantAdminRequest,
  OwnerVerificationDto,
  OwnerVerificationDocumentDto,
  ServiceProviderDocumentDto,
  SellerConfigDto,
  CourierServiceDto,
  DisputeDto,
} from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function addOwner(data: AddOwnerRequest): Promise<AuthUser> {
  const res = await backendFetch('/admin/owners', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { message?: string }).message || (err as { error?: string }).error
    if (res.status === 401) throw new Error(msg || 'Session expired. Please sign in again.')
    if (res.status === 403) throw new Error(msg || 'You do not have permission to onboard businesses. Only platform administrators can do this.')
    throw new Error(msg || 'Failed to add owner')
  }
  return res.json()
}

export async function addServiceProvider(data: AddServiceProviderRequest): Promise<AuthUser> {
  const res = await backendFetch('/admin/service-providers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { message?: string }).message || (err as { error?: string }).error
    if (res.status === 401) throw new Error(msg || 'Session expired. Please sign in again.')
    if (res.status === 403) throw new Error(msg || 'You do not have permission to onboard service providers.')
    throw new Error(msg || 'Failed to onboard service provider')
  }
  return res.json()
}

export async function addStaff(data: AddStaffRequest): Promise<AuthUser> {
  const res = await backendFetch('/users/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to add staff')
  }
  return res.json()
}

export async function addAssistantAdmin(data: AddAssistantAdminRequest): Promise<AuthUser> {
  const res = await backendFetch('/admin/assistant-admins', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to add assistant admin')
  }
  return res.json()
}

export async function listStaff(): Promise<AuthUser[]> {
  const res = await backendFetch('/users/staff')
  if (!res.ok) throw new Error('Failed to fetch staff')
  return res.json()
}

export async function addCourier(data: AddCourierRequest): Promise<AuthUser> {
  const res = await backendFetch('/users/couriers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to add courier')
  }
  return res.json()
}

export async function listCouriers(): Promise<AuthUser[]> {
  const res = await backendFetch('/users/couriers')
  if (!res.ok) throw new Error('Failed to fetch couriers')
  return res.json()
}

export async function listPendingOwners(): Promise<OwnerVerificationDto[]> {
  const res = await backendFetch('/verification/admin/pending-owners')
  if (!res.ok) throw new Error('Failed to fetch pending owners')
  return res.json()
}

export async function getOwnerDocuments(ownerId: string): Promise<OwnerVerificationDocumentDto[]> {
  const res = await backendFetch(`/verification/admin/owners/${ownerId}/documents`)
  if (!res.ok) throw new Error('Failed to fetch owner documents')
  return res.json()
}

export async function setOwnerVerification(
  ownerId: string,
  body: { status: 'verified' | 'rejected'; notes?: string; sellerTier?: 'tier1' | 'tier2' | 'tier3' }
): Promise<OwnerVerificationDto> {
  const res = await backendFetch(`/verification/admin/owners/${ownerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update verification')
  }
  return res.json()
}

export async function listPendingServiceProviders(): Promise<OwnerVerificationDto[]> {
  const res = await backendFetch('/verification/admin/pending-service-providers')
  if (!res.ok) throw new Error('Failed to fetch pending service providers')
  return res.json()
}

export async function getServiceProviderDocumentsForOwner(
  ownerId: string
): Promise<ServiceProviderDocumentDto[]> {
  const res = await backendFetch(`/verification/admin/service-providers/${ownerId}/documents`)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

export async function setServiceProviderVerification(
  ownerId: string,
  body: { status: 'verified' | 'rejected'; notes?: string }
): Promise<OwnerVerificationDto> {
  const res = await backendFetch(`/verification/admin/service-providers/${ownerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update')
  }
  return res.json()
}

export async function listSellerConfigs(): Promise<SellerConfigDto[]> {
  const res = await backendFetch('/admin/sellers/config')
  if (!res.ok) throw new Error('Failed to load seller configuration')
  return res.json()
}

export async function getSellerConfig(ownerId: string): Promise<SellerConfigDto | null> {
  const res = await backendFetch(`/admin/sellers/${ownerId}/config`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load seller configuration')
  return res.json()
}

export async function setSellerPricingPlan(ownerId: string, pricingPlan: string): Promise<SellerConfigDto> {
  const res = await backendFetch(`/admin/sellers/${ownerId}/pricing`, {
    method: 'PATCH',
    body: JSON.stringify({ pricingPlan }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update pricing plan')
  }
  return res.json()
}

export async function setSellerGrowthConfig(
  ownerId: string,
  body: { growthInventoryAutomation?: boolean; growthWhatsappEnabled?: boolean; growthAnalyticsEnabled?: boolean; growthDeliveryIntegrations?: boolean }
): Promise<SellerConfigDto> {
  const res = await backendFetch(`/admin/sellers/${ownerId}/growth-config`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update Growth config')
  }
  return res.json()
}

export async function setSellerBranding(
  ownerId: string,
  body: { brandingEnabled?: boolean; brandingName?: string | null; brandingLogoUrl?: string | null; brandingPrimaryColor?: string | null; brandingSecondaryColor?: string | null }
): Promise<SellerConfigDto> {
  const res = await backendFetch(`/admin/sellers/${ownerId}/branding`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update branding')
  }
  return res.json()
}

export async function listAdminCourierServices(): Promise<CourierServiceDto[]> {
  const res = await backendFetch('/admin/courier-services')
  if (!res.ok) throw new Error('Failed to fetch courier services')
  return res.json()
}

export async function createCourierService(body: {
  name: string; code: string; description?: string; trackingUrlTemplate?: string; providerType?: string; apiBaseUrl?: string; isActive?: boolean; baseRate: number; ratePerKg: number
}): Promise<CourierServiceDto> {
  const res = await backendFetch('/admin/courier-services', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create courier service')
  }
  return res.json()
}

export async function updateCourierService(
  courierId: string,
  body: { name?: string; description?: string; trackingUrlTemplate?: string; providerType?: string; apiBaseUrl?: string; isActive?: boolean; baseRate?: number; ratePerKg?: number }
): Promise<CourierServiceDto> {
  const res = await backendFetch(`/admin/courier-services/${courierId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update courier service')
  }
  return res.json()
}

export async function deleteCourierService(courierId: string): Promise<void> {
  const res = await backendFetch(`/admin/courier-services/${courierId}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to delete courier service')
  }
}
