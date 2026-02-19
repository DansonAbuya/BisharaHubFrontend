'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, AlertCircle, Package } from 'lucide-react'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listOrders } from '@/lib/actions/orders'
import { listShipments } from '@/lib/actions/shipments'
import type { OrderDto, ShipmentDto } from '@/lib/api'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'

export function StaffDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [shipments, setShipments] = useState<ShipmentDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ordersData, shipmentsData] = await Promise.all([
          listOrders().catch(() => [] as OrderDto[]),
          listShipments().catch(() => [] as ShipmentDto[]),
        ])
        if (cancelled) return
        setOrders(ordersData)
        setShipments(shipmentsData)
      } catch {
        if (!cancelled) {
          setOrders([])
          setShipments([])
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

  if (loading) {
    return <PageLoading message="Loading dashboard…" minHeight="280px" />
  }

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending'),
    [orders],
  )
  const processingOrders = useMemo(
    () => orders.filter((o) => o.status === 'processing'),
    [orders],
  )
  const activeShipments = useMemo(
    () =>
      shipments.filter((s) =>
        ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(
          s.status?.toUpperCase?.() ?? '',
        ),
      ),
    [shipments],
  )
  const welcomeTitle = user?.businessName
    ? `Welcome, ${user?.name ?? 'there'} – ${user.businessName} team`
    : `Welcome, ${user?.name ?? 'there'}`

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={welcomeTitle}
        description="Stay on top of orders and shipments that need your attention today."
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Refresh
          </Button>
        }
      />

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending Orders</CardTitle>
            <AlertCircle className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{pendingOrders.length}</div>
            <p className="text-xs text-accent mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">In Processing</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{processingOrders.length}</div>
            <p className="text-xs text-primary mt-1">Being prepared</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Shipments Ready</CardTitle>
            <Package className="w-4 h-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeShipments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to ship</p>
          </CardContent>
        </Card>
        </div>
      </PageSection>

      <PageSection>
        <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Pending Orders</CardTitle>
            <CardDescription>Orders awaiting confirmation and processing</CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pendingOrders.length > 0 ? (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.orderId}</p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">{order.items.length} items</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <p className="text-muted-foreground">Total:</p>
                      <p className="font-semibold text-foreground">KES {(order.total / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment:</p>
                      <Badge className="bg-primary/30 text-primary w-fit">
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                    Confirm & Process
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending orders</p>
          )}
        </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Active Shipments</CardTitle>
          <CardDescription>Orders in transit or ready to ship</CardDescription>
        </CardHeader>
        <CardContent>
          {activeShipments.length > 0 ? (
            <div className="space-y-3">
              {activeShipments.map((shipment) => {
                const order =
                  orders.find((o) => o.id === shipment.orderId) ??
                  orders.find((o) => o.orderId === shipment.orderId)
                if (!order) return null
                return (
                  <div key={shipment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.trackingNumber || `Shipment ${shipment.id}`}
                        </p>
                      </div>
                      <Badge
                        className={
                          shipment.status?.toUpperCase() === 'CREATED'
                            ? 'bg-accent/30 text-accent'
                            : 'bg-primary/30 text-primary'
                        }
                      >
                        {shipment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Carrier</p>
                        <p className="font-medium text-foreground">{shipment.carrier || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Status</p>
                        <p className="font-medium text-foreground">{shipment.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Destination</p>
                        <p className="font-medium text-foreground">{order.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No active shipments</p>
          )}
        </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}
