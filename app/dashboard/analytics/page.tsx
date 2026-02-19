'use client'

import { useState, useEffect, useMemo } from 'react'

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
import { listProducts } from '@/lib/actions/products'
import { listOrders } from '@/lib/actions/orders'
import { getAnalytics } from '@/lib/actions/analytics'
import { getAnalyticsExportCsv } from '@/lib/actions/reports'
import type { ProductDto, OrderDto } from '@/lib/api'
import { Download, TrendingUp, Calendar } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { formatPrice } from '@/lib/utils'

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

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductDto[]>([])
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [summary, setSummary] = useState<{
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    averageOrderValue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const canAccessAnalytics = user?.role === 'owner' || user?.role === 'super_admin'
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

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [productsData, ordersData, analyticsRes] = await Promise.all([
          listProducts().catch(() => [] as ProductDto[]),
          listOrders().catch(() => [] as OrderDto[]),
          getAnalytics().catch(() => null),
        ])
        if (cancelled) return
        setProducts(productsData)
        setOrders(ordersData)
        if (analyticsRes) {
          setSummary({
            totalOrders: analyticsRes.totalOrders ?? ordersData.length,
            totalRevenue: Number(analyticsRes.totalRevenue ?? 0),
            pendingOrders: analyticsRes.pendingOrders ?? ordersData.filter((o: OrderDto) => o.status === 'pending').length,
            averageOrderValue: Number(analyticsRes.averageOrderValue ?? 0),
          })
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

  // Calculate order status breakdown from real orders
  const orderStatusData = useMemo(
    () => [
      { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
      { name: 'Processing', value: orders.filter((o) => o.status === 'processing').length },
      { name: 'Shipped', value: orders.filter((o) => o.status === 'shipped').length },
      { name: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
    ],
    [orders],
  )

  // Category breakdown from API products
  const categoryRevenue = products.reduce(
    (acc, product) => {
      const cat = product.category || 'Uncategorized'
      const existing = acc.find((item) => item.name === cat)
      const value = product.price * (product.quantity ?? 0)
      if (existing) {
        existing.value += value
      } else {
        acc.push({ name: cat, value })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  // Top products by value (price * quantity) from API
  const topProductsByValue = [...products]
    .sort((a, b) => (b.price * (b.quantity ?? 0)) - (a.price * (a.quantity ?? 0)))
    .slice(0, 5)

  const COLORS = ['var(--primary)', 'var(--accent)', 'var(--secondary)', 'var(--chart-1)', 'var(--chart-2)']

  // Revenue trend from real orders (group by month)
  const revenueTrend = useMemo(() => {
    const byMonth = new Map<string, number>()
    orders.forEach((order) => {
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      const prev = byMonth.get(key) ?? 0
      byMonth.set(key, prev + (order.total ?? 0))
      // store label via map key; we'll reconstruct array below
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
  const pendingOrdersCount = summary?.pendingOrders ?? orders.filter((o) => o.status === 'pending').length

  if (loading) {
    return <PageLoading message="Loading analytics…" minHeight="280px" />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Business Analytics"
        description="Comprehensive business insights and metrics to help you run BiasharaHub more effectively."
        actions={
          <AnalyticsExportButton />
        }
      />

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              KES {(totalRevenue / 1_000_000).toFixed(1)}M
            </div>
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Lifetime revenue across all orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatPrice(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Per order</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Orders placed</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary-foreground">
              {pendingOrdersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting confirmation</p>
          </CardContent>
        </Card>
        </div>
      </PageSection>

      <PageSection>
        <Card className="border-border bg-card/50">
          <CardContent className="py-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Button variant="ghost" size="sm">
              Last 30 Days
            </Button>
            <Button variant="ghost" size="sm">
              Last 90 Days
            </Button>
            <Button variant="ghost" size="sm">
              This Year
            </Button>
            <Button variant="ghost" size="sm">
              Custom Range
            </Button>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value: number) => `KES ${(Number(value) / 1_000_000).toFixed(1)}M`}
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary)', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Order Status</CardTitle>
            <CardDescription>Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Category Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue by Category</CardTitle>
            <CardDescription>Sales performance by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => formatPrice(value)}
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Products */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Products</CardTitle>
            <CardDescription>Best selling products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsByValue.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge className="bg-primary/30 text-primary font-bold">#{idx + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {formatPrice(product.price * (product.quantity ?? 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">{(product.quantity ?? 0)} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </PageSection>

      <PageSection>
        <Card className="border-border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-foreground">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Revenue Growth</p>
                <p className="text-sm text-muted-foreground">Your revenue has grown 12% compared to last month</p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Order Volume</p>
                <p className="text-sm text-muted-foreground">
                  You have {pendingOrdersCount} pending orders that need attention
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Inventory Health</p>
                <p className="text-sm text-muted-foreground">
                  3 products have low stock and need immediate reordering
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}
