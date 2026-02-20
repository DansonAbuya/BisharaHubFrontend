'use server'

import type { AnalyticsSummaryDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function getAnalytics(): Promise<AnalyticsSummaryDto> {
  const res = await backendFetch('/analytics')
  if (!res.ok) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      averageOrderValue: 0,
    }
  }
  const data = await res.json()
  return {
    totalOrders: Number(data.totalOrders ?? 0),
    totalRevenue: Number(data.totalRevenue ?? 0),
    pendingOrders: Number(data.pendingOrders ?? 0),
    averageOrderValue: Number(data.averageOrderValue ?? 0),
  }
}
