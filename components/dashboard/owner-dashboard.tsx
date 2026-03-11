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
import { listServices, listAppointments, listServiceProviders } from '@/lib/actions/services'
import type {
  ProductDto,
  OrderDto,
  SellerConfigDto,
  ServiceOfferingDto,
  ServiceAppointmentDto,
  BusinessDto,
  ServiceProviderLocationDto,
} from '@/lib/api'
import { listBusinesses } from '@/lib/api'
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
import { DollarSign, Package, ShoppingCart, TrendingUp, Wrench, CalendarCheck, Calendar, Clock, Copy } from 'lucide-react'

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
  const [services, setServices] = useState<ServiceOfferingDto[]>([])
  const [appointments, setAppointments] = useState<ServiceAppointmentDto[]>([])
  const [summary, setSummary] = useState<{
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    averageOrderValue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sellerConfig, setSellerConfig] = useState<SellerConfigDto | null>(null)
  const [shopLink, setShopLink] = useState<string | null>(null)
  const [servicesLink, setServicesLink] = useState<string | null>(null)
  const [copied, setCopied] = useState<{ shop: boolean; services: boolean }>({ shop: false, services: false })

  // Same logic as sidebar: product seller vs service provider
  const isProductSeller = !!(user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified')
  const isServiceProvider = !!(user?.serviceProviderStatus)
  const isVerifiedServiceProvider = user?.serviceProviderStatus === 'verified'
  const isUnverifiedOwner = user?.role === 'owner' && (
    (isServiceProvider && !isVerifiedServiceProvider && !isProductSeller) ||
    (isProductSeller && user?.verificationStatus !== 'verified' && !isServiceProvider) ||
    (isServiceProvider && isProductSeller && !isVerifiedServiceProvider && user?.verificationStatus !== 'verified') ||
    (!isServiceProvider && !isProductSeller)
  )
  const showProducts = !isUnverifiedOwner && (isProductSeller || (!isProductSeller && !isServiceProvider))
  // Only show service provider cards when verified for services (product-seller-only owners must not see service cards)
  const showServices = !isUnverifiedOwner && isVerifiedServiceProvider
  const serviceProviderOnly = showServices && !showProducts

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const promises: [
          Promise<ProductDto[]>,
          Promise<OrderDto[]>,
          Promise<typeof summary>,
          Promise<SellerConfigDto | null>,
          Promise<ServiceOfferingDto[]>,
          Promise<ServiceAppointmentDto[]>,
        ] = [
          showProducts ? listProducts().catch(() => []) : Promise.resolve([]),
          showProducts ? listOrders().catch(() => []) : Promise.resolve([]),
          showProducts ? getAnalytics().catch(() => null) : Promise.resolve(null),
          showProducts ? getMySellerConfig().catch(() => null) : Promise.resolve(null),
          showServices ? listServices().catch(() => []) : Promise.resolve([]),
          showServices ? listAppointments().catch(() => []) : Promise.resolve([]),
        ]
        const [productsData, ordersData, analyticsRes, configRes, servicesData, appointmentsData] = await Promise.all(promises)
        if (cancelled) return
        setProducts(productsData)
        setOrders(ordersData)
        setServices(servicesData)
        setAppointments(appointmentsData)
        if (configRes) setSellerConfig(configRes)
        if (analyticsRes) {
          setSummary(analyticsRes)
        } else if (showProducts) {
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
  }, [showProducts, showServices])
  // Load shareable links for this seller (shop + services) using backend-provided URLs
  useEffect(() => {
    let cancelled = false
    async function loadLinks() {
      if (!user?.businessId) return
      try {
        const [businesses, providers]: [BusinessDto[], ServiceProviderLocationDto[]] = await Promise.all([
          listBusinesses().catch(() => []),
          isVerifiedServiceProvider ? listServiceProviders().catch(() => []) : Promise.resolve([]),
        ])
        if (cancelled) return
        const myBusiness = businesses.find((b) => b.id === user.businessId)
        if (myBusiness?.shopUrl) {
          setShopLink(myBusiness.shopUrl)
        } else if (typeof window !== 'undefined') {
          // Fallback when backend has not yet provided shopUrl
          setShopLink(`${window.location.origin}/shop?businessId=${encodeURIComponent(user.businessId)}`)
        }
        if (isVerifiedServiceProvider) {
          const myProvider = providers.find((p) => p.businessId === user.businessId)
          if (myProvider?.publicProfileUrl) {
            setServicesLink(myProvider.publicProfileUrl)
          } else if (typeof window !== 'undefined') {
            setServicesLink(`${window.location.origin}/services?businessId=${encodeURIComponent(user.businessId)}`)
          }
        }
      } catch {
        // Ignore link loading errors; dashboard still works without share links.
      }
    }
    loadLinks()
    return () => {
      cancelled = true
    }
  }, [user?.businessId, isVerifiedServiceProvider])

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

  const activeServices = services.filter((s) => s.isActive !== false)
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING' || a.status === 'pending')
  const recentAppointments = [...appointments].sort(
    (a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
  ).slice(0, 5)

  const copyToClipboard = async (value: string | null, type: 'shop' | 'services') => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied((prev) => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }))
      }, 2000)
    } catch {
      // ignore clipboard errors
    }
  }

  // Service provider overview (when they only offer services, or as a section when they do both)
  const serviceOverviewSection = showServices && (
    <PageSection>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Wrench className="size-5 text-primary" />
        Your services at a glance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active services</CardTitle>
            <Wrench className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeServices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Listed and bookable</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total appointments</CardTitle>
            <CalendarCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{appointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
            <Clock className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your action</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Quick actions</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/services">My services</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/appointments">Appointments</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/schedule">Schedule</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Recent appointments</CardTitle>
              <CardDescription>Latest booking requests</CardDescription>
            </div>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No appointments yet</p>
              ) : (
                recentAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{apt.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.userName} · {apt.requestedDate}
                        {apt.requestedTime ? ` ${apt.requestedTime}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        apt.status === 'PENDING' || apt.status === 'pending'
                          ? 'bg-accent/30 text-accent'
                          : apt.status === 'COMPLETED' || apt.status === 'completed'
                            ? 'bg-primary/30 text-primary'
                            : ''
                      }
                    >
                      {apt.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Your active services</CardTitle>
            <CardDescription>Services customers can book</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeServices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No active services yet</p>
              ) : (
                activeServices.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(s.price)}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/services">Edit</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageSection>
  )

  // Product seller overview (only when they sell products)
  const productOverviewSection = showProducts && (
    <>
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
              <div className="text-2xl font-bold text-foreground">{totalOrders.toLocaleString()}</div>
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
              <div className="text-2xl font-bold text-foreground">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(averageOrderValue)}</div>
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
                        <p className="text-xs text-muted-foreground">{(product.quantity ?? 0)} units left</p>
                      </div>
                      <Badge className="bg-accent text-accent-foreground">Reorder</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">All products well stocked</p>
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
                <Button variant="ghost" size="sm">View All</Button>
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
                      <p className="font-semibold text-foreground text-sm">{formatPrice(order.total)}</p>
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
                        <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
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
    </>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={welcomeTitle}
        description={
          serviceProviderOnly
            ? 'Manage your services, appointments, and schedule.'
            : sellerConfig?.pricingPlan === 'growth'
              ? (
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
                )
              : sellerConfig?.pricingPlan === 'pro'
                ? 'Track your business performance. Current plan: Pro (KES 5,000 / month, includes white-label store).'
                : 'Track your business performance. Current plan: Starter (KES 0 / month).'
        }
        actions={showProducts ? <OwnerExportReportButton /> : undefined}
      />

      {(shopLink || servicesLink) && (
        <PageSection>
          <div className="grid gap-4 md:grid-cols-2">
            {shopLink && showProducts && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Share your shop</CardTitle>
                  <CardDescription>
                    Copy this link and send it to customers to open your products shop directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shopLink}
                      className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-xs sm:text-sm text-foreground truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => copyToClipboard(shopLink, 'shop')}
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">{copied.shop ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {servicesLink && showServices && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Share your services page</CardTitle>
                  <CardDescription>
                    Copy this link so customers land on your services on BiasharaHub.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={servicesLink}
                      className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-xs sm:text-sm text-foreground truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => copyToClipboard(servicesLink, 'services')}
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">{copied.services ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </PageSection>
      )}

      {serviceProviderOnly ? serviceOverviewSection : (
        <>
          {serviceOverviewSection}
          {productOverviewSection}
        </>
      )}
    </div>
  )
}

