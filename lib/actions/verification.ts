'use server'

import type { OwnerVerificationDto, OwnerVerificationDocumentDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function getMyVerificationStatus(): Promise<OwnerVerificationDto | null> {
  const res = await backendFetch('/verification/status')
  if (!res.ok) return null
  return res.json()
}

export async function getMyVerificationDocuments(): Promise<OwnerVerificationDocumentDto[]> {
  const res = await backendFetch('/verification/documents')
  if (!res.ok) throw new Error('Failed to fetch documents')
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
