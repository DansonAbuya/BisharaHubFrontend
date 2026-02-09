'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_ORDERS, MOCK_SHIPMENTS } from '@/lib/mock-data'
import { Clock, CheckCircle, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'

export function StaffDashboard() {
  const { user } = useAuth()
  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === 'pending')
  const processingOrders = MOCK_ORDERS.filter((o) => o.status === 'processing')
  const pendingShipments = MOCK_SHIPMENTS.filter((s) => s.status === 'pending' || s.status === 'in_transit')
  const welcomeTitle = user?.businessName
    ? `Welcome, ${user?.name ?? 'there'} – ${user.businessName} team`
    : `Welcome, ${user?.name ?? 'there'}`

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{welcomeTitle}</h1>
          <p className="text-muted-foreground">Manage orders and shipments for today</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
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
            <div className="text-3xl font-bold text-foreground">{pendingShipments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to ship</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders */}
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

      {/* Shipments */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Active Shipments</CardTitle>
          <CardDescription>Orders in transit or ready to ship</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingShipments.length > 0 ? (
            <div className="space-y-3">
              {pendingShipments.map((shipment) => {
                const order = MOCK_ORDERS.find((o) => o.id === shipment.orderId)
                if (!order) return null
                return (
                  <div key={shipment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{shipment.trackingNumber}</p>
                      </div>
                      <Badge
                        className={
                          shipment.status === 'pending'
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
                        <p className="font-medium text-foreground">{shipment.carrier}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Est. Delivery</p>
                        <p className="font-medium text-foreground">
                          {shipment.estimatedDelivery?.toLocaleDateString()}
                        </p>
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
    </div>
  )
}
