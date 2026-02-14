'use server'

import type { DisputeDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function createDispute(body: {
  orderId: string
  disputeType: string
  description?: string
  deliveryProofUrl?: string
}): Promise<DisputeDto> {
  const res = await backendFetch('/disputes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create dispute')
  }
  return res.json()
}

export async function listDisputesForOrder(orderId: string): Promise<DisputeDto[]> {
  const res = await backendFetch(`/disputes/order/${orderId}`)
  if (!res.ok) throw new Error('Failed to fetch disputes for order')
  return res.json()
}

export async function listDisputes(status?: string): Promise<DisputeDto[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '?status=open'
  const res = await backendFetch(`/disputes${qs}`)
  if (!res.ok) throw new Error('Failed to fetch disputes')
  return res.json()
}

export async function getDispute(id: string): Promise<DisputeDto> {
  const res = await backendFetch(`/disputes/${id}`)
  if (!res.ok) throw new Error('Failed to fetch dispute')
  return res.json()
}

export async function sellerRespondDispute(id: string, response: string): Promise<DisputeDto> {
  const res = await backendFetch(`/disputes/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to submit response')
  }
  return res.json()
}

export async function resolveDispute(id: string, body: { resolution: string; strikeReason?: string }): Promise<DisputeDto> {
  const res = await backendFetch(`/disputes/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to resolve dispute')
  }
  return res.json()
}
