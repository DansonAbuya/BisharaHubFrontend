'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MOCK_SHIPMENTS, MOCK_ORDERS } from '@/lib/mock-data'
import { MapPin, Package, Calendar, Truck, CheckCircle } from 'lucide-react'

export default function ShipmentsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredShipments = MOCK_SHIPMENTS.filter((shipment) => {
    const order = MOCK_ORDERS.find((o) => o.id === shipment.orderId)
    const matchSearch =
      (order?.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order?.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || shipment.status === filterStatus
    return matchSearch && matchStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/30 text-accent'
      case 'shipped':
        return 'bg-primary/30 text-primary'
      case 'in_transit':
        return 'bg-secondary/30 text-foreground'
      case 'delivered':
        return 'bg-primary/30 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="w-5 h-5" />
      case 'shipped':
        return <Truck className="w-5 h-5" />
      case 'in_transit':
        return <Truck className="w-5 h-5" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  // Stats
  const pendingShipments = MOCK_SHIPMENTS.filter((s) => s.status === 'pending').length
  const inTransitShipments = MOCK_SHIPMENTS.filter((s) => s.status === 'in_transit').length
  const deliveredShipments = MOCK_SHIPMENTS.filter((s) => s.status === 'delivered').length

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {user?.role === 'customer' ? 'Track My Deliveries' : 'Shipment Management'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'customer'
              ? 'Track your orders and delivery status'
              : 'Manage shipments and track deliveries'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{MOCK_SHIPMENTS.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{pendingShipments}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary-foreground">{inTransitShipments}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{deliveredShipments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Search by order ID, tracking number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-border bg-background text-foreground whitespace-nowrap"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Shipments Timeline */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Shipments</CardTitle>
          <CardDescription>{filteredShipments.length} shipments found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredShipments.map((shipment) => {
              const order = MOCK_ORDERS.find((o) => o.id === shipment.orderId)
              if (!order) return null

              return (
                <div
                  key={shipment.id}
                  className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{order.orderId}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <Badge className={getStatusColor(shipment.status)}>
                      {getStatusLabel(shipment.status)}
                    </Badge>
                  </div>

                  {/* Timeline Status */}
                  <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div
                          className={`p-2 rounded-full ${
                            shipment.status === 'shipped' || shipment.status === 'in_transit' || shipment.status === 'delivered'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Order Received
                        </p>
                        <p className="text-sm text-foreground">
                          {order.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {shipment.status !== 'pending' && (
                      <>
                        <div className="h-6 border-l-2 border-primary/30 ml-5"></div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${
                              shipment.status === 'in_transit' || shipment.status === 'delivered'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Truck className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                              In Transit
                            </p>
                            <p className="text-sm text-foreground">
                              Carrier: {shipment.carrier}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {shipment.status === 'delivered' && (
                      <>
                        <div className="h-6 border-l-2 border-primary/30 ml-5"></div>
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary text-primary-foreground">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                              Delivered
                            </p>
                            <p className="text-sm text-foreground">
                              {shipment.actualDelivery?.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3 border-y border-border mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="font-semibold text-foreground text-sm">{shipment.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carrier</p>
                      <p className="font-semibold text-foreground text-sm">{shipment.carrier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Delivery</p>
                      <p className="font-semibold text-foreground text-sm">
                        {shipment.estimatedDelivery?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="text-foreground">{order.shippingAddress || 'No address provided'}</p>
                  </div>

                  {/* Actions */}
                  {shipment.status !== 'delivered' && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Contact Support
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredShipments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-foreground font-medium">No shipments found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
