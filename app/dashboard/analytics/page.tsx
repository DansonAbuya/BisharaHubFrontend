'use client'

import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { listOrders } from '@/lib/actions/orders'
import { getBusinessInsights } from '@/lib/actions/analytics'
import { getAnalyticsExportCsv } from '@/lib/actions/reports'
import { listProducts } from '@/lib/actions/products'
import type { BusinessInsightsDto } from '@/lib/actions/analytics'
import type { OrderDto } from '@/lib/api'
import type { ProductDto } from '@/lib/api'
import { Download, TrendingUp, TrendingDown, Calendar, Users, Package } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { formatPrice } from '@/lib/utils'

const PERIOD_OPTIONS = [
  { value: 'DAY', label: 'Today' },
  { value: 'WEEK', label: 'Last 7 Days' },
  { value: 'MONTH', label: 'Last 30 Days' },
  { value: 'QUARTER', label: 'Last 90 Days' },
  { value: 'YEAR', label: 'Last Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
]

function AnalyticsExportButton() {
  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await getAnalyticsExportCsv()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'biasharahub-analytics.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }
  return (
    <Button
      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
      onClick={handleExport}
      disabled={exporting}
    >
      <Download className="w-4 h-4" />
      {exporting ? 'Exporting…' : 'Export Report'}
    </Button>
  )
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('MONTH')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [productId, setProductId] = useState<string>('')
  const [products, setProducts] = useState<ProductDto[]>([])
  const [insights, setInsights] = useState<BusinessInsightsDto | null>(null)
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)

  const canAccessAnalytics = user?.role === 'owner' || user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const loadInsights = useCallback(async () => {
    const from = period === 'CUSTOM' && customFrom ? customFrom : undefined
    const to = period === 'CUSTOM' && customTo ? customTo : undefined
    const data = await getBusinessInsights(period, from, to, productId || undefined)
    setInsights(data)
  }, [period, customFrom, customTo, productId])

  useEffect(() => {
    if (!canAccessAnalytics) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [insightsData, ordersData, productsData] = await Promise.all([
          getBusinessInsights(
            period,
            period === 'CUSTOM' ? customFrom || undefined : undefined,
            period === 'CUSTOM' ? customTo || undefined : undefined,
            productId || undefined
          ),
          listOrders().catch(() => [] as OrderDto[]),
          listProducts().catch(() => [] as ProductDto[]),
        ])
        if (cancelled) return
        setInsights(insightsData ?? null)
        setOrders(ordersData)
        setProducts(productsData ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [canAccessAnalytics, period, customFrom, customTo, productId])

  const orderStatusData = [
    { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
    { name: 'Processing', value: orders.filter((o) => o.status === 'processing').length },
    { name: 'Shipped', value: orders.filter((o) => o.status === 'shipped').length },
    { name: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
  ].filter((d) => d.value > 0)

  const COLORS = ['var(--primary)', 'var(--accent)', 'var(--secondary)', 'var(--chart-1)', 'var(--chart-2)']

  const revenue = insights?.revenue ?? 0
  const expenses = insights?.expenses ?? 0
  const profitLoss = insights?.profitLoss ?? 0
  const orderCount = insights?.orderCount ?? 0
  const avgOrderValue = insights?.averageOrderValue ?? 0
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length

  if (!canAccessAnalytics) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Business Analytics"
          description="Only business owners and platform admins can access detailed analytics."
        />
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">
              This page is only available to business owners and platform admins.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && !insights) {
    return <PageLoading message="Loading business insights…" minHeight="280px" />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Business Analytics"
        description="Periodic profit/loss, product & staff performance, and business insights."
        actions={<AnalyticsExportButton />}
      />

      {/* Period filters */}
      <PageSection>
        <Card className="border-border bg-card/50">
          <CardContent className="py-4 flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (opt.value === 'CUSTOM') {
                    setShowCustomPicker(true)
                    setPeriod('CUSTOM')
                    const today = new Date()
                    const monthAgo = new Date(today)
                    monthAgo.setMonth(monthAgo.getMonth() - 1)
                    setCustomFrom(toISODate(monthAgo))
                    setCustomTo(toISODate(today))
                  } else {
                    setShowCustomPicker(false)
                    setPeriod(opt.value)
                  }
                }}
              >
                {opt.label}
              </Button>
            ))}
            {showCustomPicker && period === 'CUSTOM' && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 px-2 rounded-md border border-border bg-background text-sm"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 px-2 rounded-md border border-border bg-background text-sm"
                />
                <Button size="sm" onClick={loadInsights}>Apply</Button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap ml-2 border-l border-border pl-2">
              <label htmlFor="analytics-product" className="text-sm text-muted-foreground whitespace-nowrap">Product:</label>
              <select
                id="analytics-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-background text-sm min-w-[160px]"
              >
                <option value="">All products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {productId && (
                <Button size="sm" variant="ghost" onClick={() => setProductId('')}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PageSection>

      {/* Summary cards */}
      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatPrice(revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {insights?.from} – {insights?.to}
                {insights?.productId ? ' (by product)' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(expenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total for period</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Profit / Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold flex items-center gap-1 ${
                  profitLoss >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                }`}
              >
                {profitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatPrice(Math.abs(profitLoss))} {profitLoss >= 0 ? 'Profit' : 'Loss'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Orders Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{orderCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">In selected period</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary-foreground">{pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      {/* Period breakdown chart */}
      {insights?.periodBreakdown && insights.periodBreakdown.length > 0 && (
        <PageSection>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Period Performance</CardTitle>
              <CardDescription>
                Revenue vs expenses by {insights.periodBreakdown.length <= 31 ? 'day' : insights.periodBreakdown.length <= 14 ? 'week' : 'month'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={insights.periodBreakdown.map((p) => ({
                    label: p.label.length > 12 ? p.label.slice(0, 10) + '…' : p.label,
                    revenue: p.revenue,
                    expenses: p.expenses,
                    profitLoss: p.profitLoss,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </PageSection>
      )}

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product performance */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Performance
              </CardTitle>
              <CardDescription>Sales by product in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.productPerformance && insights.productPerformance.length > 0 ? (
                <div className="space-y-4 max-h-[320px] overflow-y-auto">
                  {insights.productPerformance.slice(0, 10).map((p, idx) => (
                    <div key={p.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge className="bg-primary/30 text-primary font-bold shrink-0">#{idx + 1}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.category} • {p.quantitySold} sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">{formatPrice(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No product sales in this period</p>
              )}
            </CardContent>
          </Card>

          {/* Category performance */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue by Category</CardTitle>
              <CardDescription>Sales performance by product category</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.categoryPerformance && insights.categoryPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={insights.categoryPerformance.map((c) => ({
                      name: c.category.length > 12 ? c.category.slice(0, 10) + '…' : c.category,
                      value: c.revenue,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      formatter={(v) => formatPrice(Number(v))}
                      contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No category data in this period</p>
              )}
            </CardContent>
          </Card>

          {/* Staff performance: expenses + deliveries received */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Performance
              </CardTitle>
              <CardDescription>
                Expenses logged, supplier deliveries received, and shipments created in the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.staffPerformance && insights.staffPerformance.length > 0 ? (
                <div className="space-y-4">
                  {insights.staffPerformance.map((s) => (
                    <div key={s.userId} className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.expenseCount} expense(s) · {formatPrice(s.totalExpensesLogged)} total · {s.deliveriesReceivedCount} delivery(ies) received · {s.shipmentsCreatedCount} shipment(s) created
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-muted-foreground">{s.deliveriesReceivedCount} received · {s.shipmentsCreatedCount} shipments</span>
                        <p className="font-bold text-foreground">{formatPrice(s.totalExpensesLogged)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No staff activity in this period</p>
              )}
            </CardContent>
          </Card>

          {/* Order status */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Order Status</CardTitle>
              <CardDescription>Distribution of orders by status</CardDescription>
            </CardHeader>
            <CardContent>
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No orders yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageSection>

      {/* Key insights */}
      <PageSection>
        <Card className="border-border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-foreground">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              {profitLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-foreground">Profit & Loss</p>
                <p className="text-sm text-muted-foreground">
                  {profitLoss >= 0
                    ? `Net profit of ${formatPrice(profitLoss)} for the selected period (${insights?.from ?? ''} – ${insights?.to ?? ''})`
                    : `Net loss of ${formatPrice(Math.abs(profitLoss))} for the selected period`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Order Volume</p>
                <p className="text-sm text-muted-foreground">
                  {pendingOrdersCount} pending orders need attention. Avg order value: {formatPrice(avgOrderValue)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Package className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Product Performance</p>
                <p className="text-sm text-muted-foreground">
                  {insights?.productPerformance?.length ?? 0} products sold in this period. Use filters above to compare different time ranges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}
