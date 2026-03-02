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

export interface BusinessInsightsDto {
  period: string
  from: string
  to: string
  revenue: number
  expenses: number
  profitLoss: number
  orderCount: number
  averageOrderValue: number
  productPerformance: Array<{
    productId: string
    productName: string
    category: string
    quantitySold: number
    revenue: number
  }>
  categoryPerformance: Array<{ category: string; revenue: number }>
  staffActivity: Array<{
    userId: string
    name: string
    expenseCount: number
    totalExpensesLogged: number
  }>
  periodBreakdown: Array<{
    label: string
    revenue: number
    expenses: number
    profitLoss: number
  }>
  currency: string
}

export async function getBusinessInsights(
  period: string = 'MONTH',
  from?: string | null,
  to?: string | null
): Promise<BusinessInsightsDto | null> {
  const params = new URLSearchParams()
  params.set('period', period)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await backendFetch(`/analytics/insights?${params.toString()}`)
  if (!res.ok) return null
  const data = await res.json()
  return {
    period: data.period ?? period,
    from: data.from ?? '',
    to: data.to ?? '',
    revenue: Number(data.revenue ?? 0),
    expenses: Number(data.expenses ?? 0),
    profitLoss: Number(data.profitLoss ?? 0),
    orderCount: Number(data.orderCount ?? 0),
    averageOrderValue: Number(data.averageOrderValue ?? 0),
    productPerformance: (data.productPerformance ?? []).map((p: Record<string, unknown>) => ({
      productId: String(p.productId ?? ''),
      productName: String(p.productName ?? ''),
      category: String(p.category ?? ''),
      quantitySold: Number(p.quantitySold ?? 0),
      revenue: Number(p.revenue ?? 0),
    })),
    categoryPerformance: (data.categoryPerformance ?? []).map((c: Record<string, unknown>) => ({
      category: String(c.category ?? ''),
      revenue: Number(c.revenue ?? 0),
    })),
    staffActivity: (data.staffActivity ?? []).map((s: Record<string, unknown>) => ({
      userId: String(s.userId ?? ''),
      name: String(s.name ?? ''),
      expenseCount: Number(s.expenseCount ?? 0),
      totalExpensesLogged: Number(s.totalExpensesLogged ?? 0),
    })),
    periodBreakdown: (data.periodBreakdown ?? []).map((p: Record<string, unknown>) => ({
      label: String(p.label ?? ''),
      revenue: Number(p.revenue ?? 0),
      expenses: Number(p.expenses ?? 0),
      profitLoss: Number(p.profitLoss ?? 0),
    })),
    currency: data.currency ?? 'KES',
  }
}
