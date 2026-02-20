'use server'

import type {
  ServiceOfferingDto,
  ServiceCategoryDto,
  ServiceAppointmentDto,
  ServiceProviderLocationDto,
} from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

/** Whether the current user's business can offer services (verified same as sellers). */
export async function canOfferServices(): Promise<{ canOffer: boolean; reason: string; verificationStatus?: string }> {
  const res = await backendFetch('/services/can-offer')
  if (!res.ok) return { canOffer: false, reason: 'not_authenticated' }
  return res.json()
}

export async function listServiceCategories(): Promise<ServiceCategoryDto[]> {
  const res = await backendFetch('/services/categories')
  if (!res.ok) throw new Error('Failed to fetch service categories')
  return res.json()
}

/** List verified service providers with their location info for map-based search. */
export async function listServiceProviders(params?: {
  categoryId?: string
  deliveryType?: 'PHYSICAL' | 'BOTH'
  search?: string
}): Promise<ServiceProviderLocationDto[]> {
  const searchParams = new URLSearchParams()
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
  if (params?.deliveryType) searchParams.set('deliveryType', params.deliveryType)
  if (params?.search) searchParams.set('search', params.search)
  const qs = searchParams.toString()
  const path = qs ? `/services/providers?${qs}` : '/services/providers'
  const res = await backendFetch(path)
  if (!res.ok) throw new Error('Failed to fetch service providers')
  return res.json()
}

export async function listServices(params?: {
  categoryId?: string
  category?: string
  deliveryType?: 'VIRTUAL' | 'PHYSICAL'
  businessId?: string
  ownerId?: string
}): Promise<ServiceOfferingDto[]> {
  const search = new URLSearchParams()
  if (params?.categoryId) search.set('categoryId', params.categoryId)
  if (params?.category) search.set('category', params.category)
  if (params?.deliveryType) search.set('deliveryType', params.deliveryType)
  if (params?.businessId) search.set('businessId', params.businessId)
  if (params?.ownerId) search.set('ownerId', params.ownerId)
  const qs = search.toString()
  const path = qs ? `/services?${qs}` : '/services'
  const res = await backendFetch(path)
  if (!res.ok) throw new Error('Failed to fetch services')
  return res.json()
}

export async function getService(id: string): Promise<ServiceOfferingDto> {
  const res = await backendFetch(`/services/${id}`)
  if (!res.ok) throw new Error('Failed to fetch service')
  return res.json()
}

export async function createService(data: {
  name: string
  categoryId: string
  category?: string | null
  description?: string | null
  price: number
  deliveryType: 'VIRTUAL' | 'PHYSICAL'
  /** Comma-separated online delivery methods for VIRTUAL services */
  onlineDeliveryMethods?: string | null
  durationMinutes?: number | null
  isActive?: boolean
}): Promise<ServiceOfferingDto> {
  const res = await backendFetch('/services', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      categoryId: data.categoryId,
      category: data.category ?? undefined,
      description: data.description ?? undefined,
      price: data.price,
      deliveryType: data.deliveryType,
      onlineDeliveryMethods: data.onlineDeliveryMethods ?? undefined,
      durationMinutes: data.durationMinutes ?? undefined,
      isActive: data.isActive ?? true,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create service')
  }
  return res.json()
}

export async function updateService(
  id: string,
  data: {
    name?: string
    categoryId?: string | null
    category?: string | null
    description?: string | null
    price?: number
    deliveryType?: 'VIRTUAL' | 'PHYSICAL'
    /** Comma-separated online delivery methods for VIRTUAL services */
    onlineDeliveryMethods?: string | null
    durationMinutes?: number | null
    isActive?: boolean
  }
): Promise<ServiceOfferingDto> {
  const res = await backendFetch(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update service')
  }
  return res.json()
}

export async function deleteService(id: string): Promise<void> {
  const res = await backendFetch(`/services/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete service')
}

// ---------- Appointments (physical services: book then attend) ----------

export async function listAppointments(serviceId?: string): Promise<ServiceAppointmentDto[]> {
  const path = serviceId ? `/services/appointments?serviceId=${serviceId}` : '/services/appointments'
  const res = await backendFetch(path)
  if (!res.ok) throw new Error('Failed to fetch appointments')
  return res.json()
}

export async function createAppointment(
  serviceId: string,
  data: { requestedDate: string; requestedTime?: string | null; notes?: string | null }
): Promise<ServiceAppointmentDto> {
  const res = await backendFetch(`/services/${serviceId}/appointments`, {
    method: 'POST',
    body: JSON.stringify({
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime ?? null,
      notes: data.notes ?? undefined,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to book appointment')
  }
  return res.json()
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
): Promise<ServiceAppointmentDto> {
  const res = await backendFetch(`/services/appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update appointment')
  return res.json()
}

/** Initiate M-Pesa payment for a service booking. Customer only; for their own appointment. */
export async function initiateServiceBookingPayment(
  appointmentId: string,
  phoneNumber: string
): Promise<{ paymentId: string; checkoutRequestId: string; status: string; message: string }> {
  const res = await backendFetch(`/services/appointments/${appointmentId}/payments/initiate`, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to initiate payment')
  }
  return res.json()
}
