'use server'

import type {
  OwnerVerificationDto,
  OwnerVerificationDocumentDto,
  ServiceProviderDocumentDto,
} from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function getMyVerificationStatus(): Promise<OwnerVerificationDto | null> {
  const res = await backendFetch('/verification/status')
  if (!res.ok) return null
  return res.json()
}

export async function getMyVerificationDocuments(): Promise<OwnerVerificationDocumentDto[]> {
  const res = await backendFetch('/verification/documents')
  if (!res.ok) return []
  return res.json()
}

export async function uploadVerificationDocument(documentType: string, fileUrl: string): Promise<OwnerVerificationDocumentDto> {
  const res = await backendFetch('/verification/documents', {
    method: 'POST',
    body: JSON.stringify({ documentType, fileUrl }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to upload document')
  }
  return res.json()
}

export async function uploadVerificationDocumentFile(formData: FormData): Promise<OwnerVerificationDocumentDto> {
  const res = await backendFetch('/verification/documents/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to upload document')
  }
  return res.json()
}

// ---------- Service provider verification (separate journey) ----------

export async function getServiceProviderStatus(): Promise<OwnerVerificationDto | null> {
  const res = await backendFetch('/verification/service-provider/status')
  if (!res.ok) return null
  return res.json()
}

export async function getServiceProviderDocuments(): Promise<ServiceProviderDocumentDto[]> {
  const res = await backendFetch('/verification/service-provider/documents')
  if (!res.ok) return []
  return res.json()
}

export async function applyServiceProvider(body: {
  serviceCategoryId: string
  serviceDeliveryType: 'ONLINE' | 'PHYSICAL' | 'BOTH'
  locationLat?: number
  locationLng?: number
  locationDescription?: string
  documents?: { documentType: string; fileUrl: string }[]
}): Promise<OwnerVerificationDto> {
  const res = await backendFetch('/verification/service-provider/apply', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to submit application')
  }
  return res.json()
}
