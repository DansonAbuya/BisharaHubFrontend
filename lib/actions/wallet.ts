'use server'

import type { WalletBalanceDto, DefaultPayoutDestinationDto, PayoutDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function getWalletBalance(): Promise<WalletBalanceDto> {
  const res = await backendFetch('/wallet/balance')
  if (!res.ok) throw new Error('Failed to fetch wallet balance')
  return res.json()
}

export async function getPayoutDestination(): Promise<DefaultPayoutDestinationDto | { method: null; destinationMasked: null }> {
  const res = await backendFetch('/wallet/payout-destination')
  if (!res.ok) throw new Error('Failed to fetch payout destination')
  return res.json()
}

export async function setPayoutDestination(method: string, destination: string): Promise<void> {
  const res = await backendFetch('/wallet/payout-destination', {
    method: 'PUT',
    body: JSON.stringify({ method, destination }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || (err as string) || 'Failed to update payout destination')
  }
}

export async function listPayouts(): Promise<PayoutDto[]> {
  const res = await backendFetch('/payouts')
  if (!res.ok) throw new Error('Failed to fetch payouts')
  return res.json()
}
