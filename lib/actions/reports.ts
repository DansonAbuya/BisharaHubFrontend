'use server'

import { backendFetch } from '@/lib/server/backend'

/**
 * All reports are generated entirely on the backend.
 * Server actions fetch from backend and return content — no client-side report assembly.
 */

export async function getKraExportCsv(from: string, to: string): Promise<string> {
  const res = await backendFetch(
    `/accounting/kra-export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  )
  if (!res.ok) throw new Error('Failed to generate KRA export')
  return res.text()
}

export async function getExpensesExportCsv(from?: string, to?: string): Promise<string> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  const res = await backendFetch(`/expenses/export${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to generate expenses export')
  return res.text()
}

export async function getExpensesReportHtml(from?: string, to?: string): Promise<string> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  const res = await backendFetch(`/expenses/report${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to generate expenses report')
  return res.text()
}

export async function getAnalyticsExportCsv(): Promise<string> {
  const res = await backendFetch('/analytics/export')
  if (!res.ok) throw new Error('Failed to generate analytics export')
  return res.text()
}

export async function getInvoiceHtml(orderId: string): Promise<string> {
  const res = await backendFetch(`/orders/${orderId}/invoice`)
  if (!res.ok) throw new Error('Failed to generate invoice')
  return res.text()
}
