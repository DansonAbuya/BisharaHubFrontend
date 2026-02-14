'use server'

import type { AnalyticsSummaryDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function getAnalytics(): Promise<AnalyticsSummaryDto> {
  const res = await backendFetch('/analytics')
  if (res.status === 401 || res.status === 403) throw new Error('Not authorized to view analytics')
  if (!res.ok) throw new Error('Failed to load analytics')
  const data = await res.json()
  return {
    totalOrders: Number(data.totalOrders ?? 0),
    totalRevenue: Number(data.totalRevenue ?? 0),
    pendingOrders: Number(data.pendingOrders ?? 0),
    averageOrderValue: Number(data.averageOrderValue ?? 0),
  }
}
