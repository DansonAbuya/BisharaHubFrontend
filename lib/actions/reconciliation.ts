'use server'

import { backendFetch } from '@/lib/server/backend'

export interface PendingPayment {
  paymentId: string
  orderId: string
  orderNumber: string
  amount: number
  customerName: string
  paymentMethod: string
  createdAt: string
}

export async function listPendingPayments(): Promise<PendingPayment[]> {
  const res = await backendFetch('/reconciliation/pending-payments')
  if (!res.ok) throw new Error('Failed to fetch pending payments')
  const data = await res.json()
  return (data ?? []).map((p: {
    paymentId: string
    orderId: string
    orderNumber: string
    amount: number
    customerName: string
    paymentMethod: string
    createdAt: string
  }) => ({
    paymentId: p.paymentId,
    orderId: p.orderId,
    orderNumber: p.orderNumber,
    amount: Number(p.amount ?? 0),
    customerName: p.customerName ?? '—',
    paymentMethod: p.paymentMethod ?? 'M-Pesa',
    createdAt: p.createdAt ?? '',
  }))
}

export async function matchReceipt(
  paymentId: string,
  receiptNumber: string
): Promise<void> {
  const res = await backendFetch('/reconciliation/match-receipt', {
    method: 'POST',
    body: JSON.stringify({ paymentId, receiptNumber }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to match receipt')
  }
}

/**
 * Download reconciliation report CSV — generated entirely by the backend.
 */
export async function downloadReconciliationReport(): Promise<string> {
  const res = await backendFetch('/reconciliation/export')
  if (!res.ok) throw new Error('Failed to generate reconciliation report')
  return res.text()
}

export async function printReconciliationReport(): Promise<string> {
  const res = await backendFetch('/reconciliation/report')
  if (!res.ok) throw new Error('Failed to generate reconciliation report')
  return res.text()
}
