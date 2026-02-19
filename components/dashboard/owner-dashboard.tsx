'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listProducts, getMySellerConfig } from '@/lib/actions/products'
import { listOrders } from '@/lib/actions/orders'
import { getAnalytics } from '@/lib/actions/analytics'
import { getAnalyticsExportCsv } from '@/lib/actions/reports'
import type { ProductDto, OrderDto, SellerConfigDto } from '@/lib/api'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { formatPrice } from '@/lib/utils'

function OwnerExportReportButton() {
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
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? 'Exporting…' : 'Export Report'}
    </Button>
  )
}

export function OwnerDashboard() {
  const { user } = useAuth()
  const [timeRange] = useState('month')
  const [products, setProducts] = useState<ProductDto[]>([])
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [summary, setSummary] = useState<{
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    averageOrderValue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sellerConfig, setSellerConfig] = useState<SellerConfigDto | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [productsData, ordersData, analyticsRes, configRes] = await Promise.all([
          listProducts().catch(() => [] as ProductDto[]),
          listOrders().catch(() => [] as OrderDto[]),
          getAnalytics().catch(() => null),
          getMySellerConfig().catch(() => null),
        ])
        if (cancelled) return
        setProducts(productsData)
        setOrders(ordersData)
        if (configRes) setSellerConfig(configRes)
        if (analyticsRes) {
          setSummary(analyticsRes)
        } else {
          const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total ?? 0), 0)
          const totalOrders = ordersData.length
          const pendingOrders = ordersData.filter((o) => o.status === 'pending').length
          setSummary({
            totalOrders,
            totalRevenue,
            pendingOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const lowStockProducts = products.filter((p) => (p.quantity ?? 0) <= 30)

  const revenueTrend = useMemo(() => {
    const byMonth = new Map<string, number>()
    orders.forEach((order) => {
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const prev = byMonth.get(key) ?? 0
      byMonth.set(key, prev + (order.total ?? 0))
    })
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([key, revenue]) => {
        const [yearStr, monthStr] = key.split('-')
        const d = new Date(Number(yearStr), Number(monthStr), 1)
        return {
          month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          revenue,
        }
      })
  }, [orders])

  const totalRevenue = summary?.totalRevenue ?? 0
  const averageOrderValue = summary?.averageOrderValue ?? 0
  const totalOrders = summary?.totalOrders ?? orders.length
  const pendingOrders = summary?.pendingOrders ?? orders.filter((o) => o.status === 'pending').length

  const topProductsByValue = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.price * (b.quantity ?? 0)) - (a.price * (a.quantity ?? 0)))
        .slice(0, 3),
    [products],
  )

  if (loading) {
    return <PageLoading message="Loading dashboard…" minHeight="280px" />
  }

  const welcomeTitle = user?.businessName
    ? `Welcome back, ${user?.name ?? 'there'} – ${user.businessName}`
    : `Welcome back, ${user?.name ?? 'there'}`

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={welcomeTitle}
        description={
          sellerConfig?.pricingPlan === 'growth' ? (
            <>
              Track your business performance. Current plan: Growth (KES 1,500 / month).
              {[sellerConfig?.growthInventoryAutomation, sellerConfig?.growthWhatsappEnabled, sellerConfig?.growthAnalyticsEnabled, sellerConfig?.growthDeliveryIntegrations].some(Boolean) && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Active for you:{' '}
                  {[
                    sellerConfig?.growthInventoryAutomation && 'Inventory automation',
                    sellerConfig?.growthWhatsappEnabled && 'WhatsApp',
                    sellerConfig?.growthAnalyticsEnabled && 'Analytics',
                    sellerConfig?.growthDeliveryIntegrations && 'Delivery integrations',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </>
          ) : sellerConfig?.pricingPlan === 'pro' ? (
            'Track your business performance. Current plan: Pro (KES 5,000 / month, includes white-label store).'
          ) : (
            'Track your business performance. Current plan: Starter (KES 0 / month).'
          )
        }
        actions={
          <OwnerExportReportButton />
        }
      />

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                KES {(totalRevenue / 1_000_000).toFixed(1)}M
              </div>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Lifetime revenue
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalOrders.toLocaleString()}
              </div>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Orders placed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(averageOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average per order</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatPrice(Number(value))}
                    contentStyle={{ backgroundColor: 'var(--background)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Low Stock Alert</CardTitle>
              <CardDescription>{lowStockProducts.length} products need restock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(product.quantity ?? 0)} units left
                        </p>
                      </div>
                      <Badge className="bg-accent text-accent-foreground">Reorder</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    All products well stocked
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.orderId ?? order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">
                        {formatPrice(order.total)}
                      </p>
                      <Badge
                        className={
                          order.status === 'pending'
                            ? 'bg-accent/30 text-accent'
                            : order.status === 'delivered'
                              ? 'bg-primary/30 text-primary'
                              : 'bg-secondary/30 text-foreground'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Products</CardTitle>
              <CardDescription>Best selling products this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProductsByValue.map((product, idx) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/50 to-accent/50 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-primary/10 rounded-full">
                      <p className="text-xs font-semibold text-primary">#{idx + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </div>
  )
}

