'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, Package, Truck, CheckCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { listOrders, listShipments, verifyShipmentOtp, type OrderDto, type ShipmentDto } from '@/lib/api'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

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

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

export default function ShipmentsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [shipments, setShipments] = useState<ShipmentDto[]>([])
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [otpValues, setOtpValues] = useState<Record<string, string>>({})
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)

  const isCustomerView = user?.role === 'customer'

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    Promise.all([listShipments(), listOrders()])
      .then(([s, o]) => {
        setShipments(s)
        setOrders(o)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load shipments')
      })
      .finally(() => setLoading(false))
  }, [user])

  const ordersById = useMemo(() => {
    const map = new Map<string, OrderDto>()
    for (const order of orders) {
      map.set(order.id, order)
    }
    return map
  }, [orders])

  const roleScopedShipments = useMemo(() => {
    if (!user) return shipments
    return shipments.filter((shipment) => {
      const order = ordersById.get(shipment.orderId)
      if (!order) return false

      if (user.role === 'customer') {
        return order.customerId === user.id
      }
      if (user.role === 'owner' || user.role === 'staff') {
        return !!order.businessId && !!user.businessId && order.businessId === user.businessId
      }
      // super_admin / assistant_admin see all shipments for the tenant
      return true
    })
  }, [shipments, ordersById, user])

  const filteredShipments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return roleScopedShipments.filter((shipment) => {
      const order = ordersById.get(shipment.orderId)
      const matchSearch =
        !term ||
        (order?.orderId || '').toLowerCase().includes(term) ||
        (order?.customerName || '').toLowerCase().includes(term) ||
        (shipment.trackingNumber || '').toLowerCase().includes(term)
      const matchStatus = filterStatus === 'all' || shipment.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [roleScopedShipments, ordersById, searchTerm, filterStatus])

  const pendingShipments = roleScopedShipments.filter((s) => s.status === 'pending').length
  const inTransitShipments = roleScopedShipments.filter((s) => s.status === 'in_transit').length
  const deliveredShipments = roleScopedShipments.filter((s) => s.status === 'delivered').length

  const handleOtpChange = (shipmentId: string, value: string) => {
    setOtpValues((prev) => ({ ...prev, [shipmentId]: value }))
  }

  const handleVerifyOtp = async (shipment: ShipmentDto) => {
    const code = (otpValues[shipment.id] || '').trim()
    if (!code) {
      setOtpError('Enter the 6-digit delivery code.')
      return
    }
    setOtpError(null)
    setVerifyingId(shipment.id)
    try {
      const updated = await verifyShipmentOtp(shipment.id, code)
      setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setOtpValues((prev) => ({ ...prev, [shipment.id]: '' }))
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Invalid or expired delivery code')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={isCustomerView ? 'Track My Deliveries' : 'Shipment Management'}
        description={
          isCustomerView
            ? 'Track your orders and delivery status in one place.'
            : 'Monitor shipments in transit and delivered for your business.'
        }
      />

      {error && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        </PageSection>
      )}
      {otpError && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{otpError}</div>
        </PageSection>
      )}

      {loading ? (
        <PageSection>
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading shipments…
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Shipments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{roleScopedShipments.length}</div>
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
          </PageSection>

          <PageSection>
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
          </PageSection>

          <PageSection>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Shipments</CardTitle>
                <CardDescription>{filteredShipments.length} shipments found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShipments.map((shipment) => {
                    const order = ordersById.get(shipment.orderId)
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
                                  shipment.status === 'shipped' ||
                                  shipment.status === 'in_transit' ||
                                  shipment.status === 'delivered'
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
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>

                          {shipment.status !== 'pending' && (
                            <>
                              <div className="h-6 border-l-2 border-primary/30 ml-5" />
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
                                    Carrier: {shipment.carrier || '—'}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                          {shipment.status === 'delivered' && (
                            <>
                              <div className="h-6 border-l-2 border-primary/30 ml-5" />
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-primary text-primary-foreground">
                                  <CheckCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    Delivered
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {formatDate(shipment.actualDelivery)}
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
                            <p className="font-semibold text-foreground text-sm">
                              {shipment.trackingNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Carrier</p>
                            <p className="font-semibold text-foreground text-sm">
                              {shipment.carrier || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Est. Delivery</p>
                            <p className="font-semibold text-foreground text-sm">
                              {formatDate(shipment.estimatedDelivery)}
                            </p>
                          </div>
                        </div>

                        {/* Destination */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <p className="text-foreground">{order.shippingAddress || 'No address provided'}</p>
                        </div>

                        {/* OTP confirmation for delivery / pickup */}
                        {(shipment.deliveryMode === 'SELLER_SELF' ||
                          shipment.deliveryMode === 'CUSTOMER_PICKUP') &&
                          shipment.status !== 'DELIVERED' &&
                          shipment.status !== 'COLLECTED' && (
                            <div className="mt-4 border-t border-border pt-3 space-y-2">
                              <p className="text-sm font-medium text-foreground">
                                Delivery code confirmation
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Enter the 6-digit code provided at delivery or pickup to confirm you have received
                                this order. This will release payment to the seller.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                  placeholder="Enter 6-digit code"
                                  value={otpValues[shipment.id] ?? ''}
                                  onChange={(e) => handleOtpChange(shipment.id, e.target.value)}
                                  className="h-9 sm:flex-1 sm:max-w-xs"
                                />
                                <Button
                                  size="sm"
                                  className="sm:w-auto"
                                  onClick={() => handleVerifyOtp(shipment)}
                                  disabled={verifyingId === shipment.id}
                                >
                                  {verifyingId === shipment.id ? 'Confirming…' : 'Confirm delivery'}
                                </Button>
                              </div>
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
          </PageSection>
        </>
      )}
    </div>
  )
}
