'use server'

import { backendFetch } from '@/lib/server/backend'

export interface AccountingSummary {
  from: string
  to: string
  totalSales: number
  totalExpenses: number
  netIncome: number
  dailyExpenses: Array<{ date: string; category: string; amount: number; description: string }>
  currency: string
}

/**
 * Fetch JSON summary for dashboard display (not a downloadable report).
 */
export async function getAccountingSummary(
  from: string,
  to: string
): Promise<AccountingSummary> {
  const res = await backendFetch(
    `/accounting/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  )
  if (!res.ok) throw new Error('Failed to load accounting summary')
  const data = await res.json()
  return {
    from: data.from ?? from,
    to: data.to ?? to,
    totalSales: Number(data.totalSales ?? 0),
    totalExpenses: Number(data.totalExpenses ?? 0),
    netIncome: Number(data.netIncome ?? 0),
    dailyExpenses: (data.dailyExpenses ?? []).map(
      (e: { date: string; category: string; amount: number; description: string }) => ({
        date: e.date,
        category: e.category,
        amount: Number(e.amount ?? 0),
        description: e.description ?? '',
      })
    ),
    currency: data.currency ?? 'KES',
  }
}
