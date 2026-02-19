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
import { PageLoading } from '@/components/layout/page-loading'
import { listOrders } from '@/lib/actions/orders'
import { listCouriers } from '@/lib/actions/admin'
import { listShipments, listShipmentsByOrder, listCourierServices, verifyShipmentOtp, createShipmentWithProvider, getShipmentTracking, updateShipment } from '@/lib/actions/shipments'
import type { OrderDto, ShipmentDto, CourierServiceDto, TrackingInfoDto } from '@/lib/api'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

const getStatusColor = (status: string) => {
  const s = (status || '').toUpperCase()
  if (s === 'CREATED') return 'bg-accent/30 text-accent'
  if (s === 'SHIPPED' || s === 'IN_TRANSIT' || s === 'OUT_FOR_DELIVERY') return 'bg-secondary/30 text-foreground'
  if (s === 'DELIVERED' || s === 'COLLECTED') return 'bg-primary/30 text-primary'
  return 'bg-muted text-muted-foreground'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    CREATED: 'Awaiting dispatch',
    SHIPPED: 'Dispatched',
    IN_TRANSIT: 'In transit',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    COLLECTED: 'Collected',
  }
  return labels[(status || '').toUpperCase()] || status?.replace(/_/g, ' ') || '—'
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
  const [courierServices, setCourierServices] = useState<CourierServiceDto[]>([])
  const [couriers, setCouriers] = useState<{ id: string; name: string; phone?: string }[]>([])
  const [createWithProviderShipmentId, setCreateWithProviderShipmentId] = useState<string | null>(null)
  const [createWithProviderCode, setCreateWithProviderCode] = useState('')
  const [createWithProviderLoading, setCreateWithProviderLoading] = useState(false)
  const [createWithProviderError, setCreateWithProviderError] = useState<string | null>(null)
  const [trackingByShipmentId, setTrackingByShipmentId] = useState<Record<string, TrackingInfoDto>>({})
  const [trackingLoadingId, setTrackingLoadingId] = useState<string | null>(null)
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null)
  const [dispatchForm, setDispatchForm] = useState<Record<string, { carrier: string; trackingNumber: string; riderName: string; riderPhone: string; riderVehicle: string; assignedCourierId: string }>>({})
  const [dispatchSaving, setDispatchSaving] = useState<string | null>(null)
  const [dispatchError, setDispatchError] = useState<string | null>(null)

  const isCustomerView = user?.role === 'customer'
  const canManageShipments = !isCustomerView && (user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin' || user?.role === 'assistant_admin')
  const canCreateWithProvider = !isCustomerView && (user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin' || user?.role === 'assistant_admin')
  const integratedCouriers = courierServices.filter((c) => c.providerType && c.providerType !== 'MANUAL')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    Promise.all([
      listShipments(),
      listOrders(),
      listCourierServices().catch(() => []),
      listCouriers().catch(() => []),
    ])
      .then(async ([s, o, svcs, cour]) => {
        setOrders(o)
        setCourierServices(svcs)
        setCouriers(cour.map((u) => ({ id: u.id, name: u.name, phone: u.phone })))
        const orderIdsWithShipment = new Set(s.map((ship) => ship.orderId))
        const confirmedNoShipment = o.filter((order) => {
          if (order.orderStatus !== 'confirmed' || orderIdsWithShipment.has(order.id)) return false
          if (user.role === 'customer') return order.customerId === user.id
          if (user.role === 'owner' || user.role === 'staff') return !!order.businessId && !!user.businessId && order.businessId === user.businessId
          return true
        })
        const extra = await Promise.all(confirmedNoShipment.map((ord) => listShipmentsByOrder(ord.id)))
        const extraFlat = extra.flat()
        setShipments([...s, ...extraFlat])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load shipments')
      })
      .finally(() => setLoading(false))
  }, [user])

  const getTrackingUrl = (carrier: string | null | undefined, trackingNumber: string | null | undefined): string | null => {
    if (!carrier || !trackingNumber?.trim()) return null
    const car = carrier.trim().toLowerCase()
    const courier = courierServices.find(
      (c) => (c.name || '').toLowerCase() === car || (c.code || '').toLowerCase() === car
    )
    if (!courier?.trackingUrlTemplate) return null
    return courier.trackingUrlTemplate.replace('{trackingNumber}', trackingNumber.trim())
  }

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
      const matchStatus = filterStatus === 'all' || (shipment.status || '').toUpperCase() === filterStatus
      return matchSearch && matchStatus
    })
  }, [roleScopedShipments, ordersById, searchTerm, filterStatus])

  const pendingShipments = roleScopedShipments.filter((s) => (s.status || '').toUpperCase() === 'CREATED').length
  const inTransitShipments = roleScopedShipments.filter((s) => ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes((s.status || '').toUpperCase())).length
  const deliveredShipments = roleScopedShipments.filter((s) => ['DELIVERED', 'COLLECTED'].includes((s.status || '').toUpperCase())).length

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

  const handleCreateWithProvider = async (shipmentId: string) => {
    if (!createWithProviderCode.trim()) return
    setCreateWithProviderLoading(true)
    setCreateWithProviderError(null)
    try {
      await createShipmentWithProvider(shipmentId, createWithProviderCode.trim())
      const [updatedList] = await Promise.all([listShipments()])
      setShipments(updatedList)
      setCreateWithProviderShipmentId(null)
      setCreateWithProviderCode('')
    } catch (e) {
      setCreateWithProviderError(e instanceof Error ? e.message : 'Failed to create with provider')
    } finally {
      setCreateWithProviderLoading(false)
    }
  }

  const handleLoadTracking = async (shipmentId: string) => {
    setTrackingLoadingId(shipmentId)
    try {
      const info = await getShipmentTracking(shipmentId)
      setTrackingByShipmentId((prev) => ({ ...prev, [shipmentId]: info }))
    } finally {
      setTrackingLoadingId(null)
    }
  }

  const getDispatchForm = (s: ShipmentDto) =>
    dispatchForm[s.id] ?? {
      carrier: s.carrier ?? '',
      trackingNumber: s.trackingNumber ?? '',
      riderName: s.riderName ?? '',
      riderPhone: s.riderPhone ?? '',
      riderVehicle: s.riderVehicle ?? '',
      assignedCourierId: s.assignedCourierId ?? '',
    }

  const handleMarkDispatched = async (shipment: ShipmentDto) => {
    const form = getDispatchForm(shipment)
    setDispatchSaving(shipment.id)
    setDispatchError(null)
    try {
      const updated = await updateShipment(shipment.id, {
        status: 'IN_TRANSIT',
        carrier: form.carrier || null,
        trackingNumber: form.trackingNumber || null,
        riderName: form.riderName || null,
        riderPhone: form.riderPhone || null,
        riderVehicle: form.riderVehicle || null,
        assignedCourierId: form.assignedCourierId || null,
      })
      setShipments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setEditingShipmentId(null)
      setDispatchForm((prev) => {
        const next = { ...prev }
        delete next[shipment.id]
        return next
      })
    } catch (e) {
      setDispatchError(e instanceof Error ? e.message : 'Failed to mark as dispatched')
    } finally {
      setDispatchSaving(null)
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
          <PageLoading message="Loading shipments…" minHeight="200px" />
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
                <option value="CREATED">Awaiting dispatch</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
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

                          {['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COLLECTED'].includes((shipment.status || '').toUpperCase()) && (
                            <>
                              <div className="h-6 border-l-2 border-primary/30 ml-5" />
                              <div className="flex items-center gap-4">
                                <div
                                  className={`p-2 rounded-full ${
                                    ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COLLECTED'].includes((shipment.status || '').toUpperCase())
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
                                    {shipment.carrier ? `Courier: ${shipment.carrier}` : shipment.riderVehicle ? `Vehicle reg: ${shipment.riderVehicle}` : '—'}
                                    {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ''}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                          {['DELIVERED', 'COLLECTED'].includes((shipment.status || '').toUpperCase()) && (
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
                              {shipment.deliveryMode === 'COURIER' && shipment.trackingNumber && (() => {
                                const trackUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber)
                                return trackUrl ? (
                                  <a
                                    href={trackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-primary hover:underline text-xs"
                                  >
                                    Track
                                  </a>
                                ) : null
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Carrier / Courier service</p>
                            <p className="font-semibold text-foreground text-sm">
                              {shipment.carrier || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Vehicle / Bike reg</p>
                            <p className="font-semibold text-foreground text-sm">
                              {shipment.riderVehicle || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Est. Delivery</p>
                            <p className="font-semibold text-foreground text-sm">
                              {formatDate(shipment.estimatedDelivery)}
                            </p>
                          </div>
                        </div>

                        {/* Seller: add dispatch details and mark as dispatched */}
                        {canManageShipments && (shipment.status || '').toUpperCase() === 'CREATED' && (
                          <div className="mt-3 py-3 border-t border-border space-y-3">
                            <p className="text-sm font-medium text-foreground">Add dispatch details and notify customer</p>
                            {dispatchError && <p className="text-xs text-destructive">{dispatchError}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">Courier service (if using courier)</label>
                                <Input
                                  placeholder="e.g. DHL, Sendy"
                                  value={getDispatchForm(shipment).carrier}
                                  onChange={(e) =>
                                    setDispatchForm((prev) => ({
                                      ...prev,
                                      [shipment.id]: { ...getDispatchForm(shipment), carrier: e.target.value },
                                    }))
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">Tracking number</label>
                                <Input
                                  placeholder="Optional"
                                  value={getDispatchForm(shipment).trackingNumber}
                                  onChange={(e) =>
                                    setDispatchForm((prev) => ({
                                      ...prev,
                                      [shipment.id]: { ...getDispatchForm(shipment), trackingNumber: e.target.value },
                                    }))
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">Driver name (if seller/rider delivery)</label>
                                <Input
                                  placeholder="Optional"
                                  value={getDispatchForm(shipment).riderName}
                                  onChange={(e) =>
                                    setDispatchForm((prev) => ({
                                      ...prev,
                                      [shipment.id]: { ...getDispatchForm(shipment), riderName: e.target.value },
                                    }))
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">Vehicle / bike registration</label>
                                <Input
                                  placeholder="e.g. KCA 123A, KBZ 456B"
                                  value={getDispatchForm(shipment).riderVehicle}
                                  onChange={(e) =>
                                    setDispatchForm((prev) => ({
                                      ...prev,
                                      [shipment.id]: { ...getDispatchForm(shipment), riderVehicle: e.target.value },
                                    }))
                                  }
                                  className="h-9"
                                />
                              </div>
                              {couriers.length > 0 && (
                                <div className="sm:col-span-2">
                                  <label className="text-xs text-muted-foreground block mb-1">Assign courier (optional)</label>
                                  <select
                                    value={getDispatchForm(shipment).assignedCourierId}
                                    onChange={(e) =>
                                      setDispatchForm((prev) => ({
                                        ...prev,
                                        [shipment.id]: { ...getDispatchForm(shipment), assignedCourierId: e.target.value },
                                      }))
                                    }
                                    className="h-9 px-3 rounded-md border border-input bg-background w-full text-sm"
                                  >
                                    <option value="">— None —</option>
                                    {couriers.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} {c.phone ? `(${c.phone})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Assigned couriers see this delivery in their Courier Portal.
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleMarkDispatched(shipment)}
                              disabled={dispatchSaving === shipment.id}
                            >
                              {dispatchSaving === shipment.id ? 'Saving…' : 'Save & Mark as dispatched'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Customer will be notified (in-app and WhatsApp) with courier and vehicle details.
                            </p>
                          </div>
                        )}

                        {/* Create with integrated provider (owner/staff/admin, COURIER, no tracking yet) */}
                        {canCreateWithProvider &&
                          shipment.deliveryMode === 'COURIER' &&
                          !shipment.trackingNumber &&
                          integratedCouriers.length > 0 && (
                            <div className="mt-3 py-3 border-t border-border space-y-2">
                              <p className="text-sm font-medium text-foreground">Create with courier provider</p>
                              <div className="flex flex-wrap gap-2 items-center">
                                <select
                                  value={createWithProviderShipmentId === shipment.id ? createWithProviderCode : ''}
                                  onChange={(e) => {
                                    setCreateWithProviderShipmentId(shipment.id)
                                    setCreateWithProviderCode(e.target.value)
                                  }}
                                  className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                  <option value="">Select provider</option>
                                  {integratedCouriers.map((c) => (
                                    <option key={c.courierId} value={c.code}>
                                      {c.name} ({c.providerType})
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  disabled={
                                    createWithProviderLoading ||
                                    (createWithProviderShipmentId === shipment.id && !createWithProviderCode.trim())
                                  }
                                  onClick={() => handleCreateWithProvider(shipment.id)}
                                >
                                  {createWithProviderLoading && createWithProviderShipmentId === shipment.id
                                    ? 'Creating…'
                                    : 'Create shipment'}
                                </Button>
                              </div>
                              {createWithProviderError && createWithProviderShipmentId === shipment.id && (
                                <p className="text-xs text-destructive">{createWithProviderError}</p>
                              )}
                            </div>
                          )}

                        {/* API tracking (when integrated provider returns events) */}
                        {shipment.deliveryMode === 'COURIER' &&
                          shipment.trackingNumber &&
                          (trackingByShipmentId[shipment.id]?.events?.length || trackingLoadingId === shipment.id) && (
                            <div className="mt-3 py-3 border-t border-border space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">Provider tracking</p>
                                {!trackingByShipmentId[shipment.id]?.events?.length && trackingLoadingId !== shipment.id && (
                                  <Button size="sm" variant="outline" onClick={() => handleLoadTracking(shipment.id)}>
                                    Load tracking
                                  </Button>
                                )}
                              </div>
                              {trackingLoadingId === shipment.id && (
                                <p className="text-xs text-muted-foreground">Loading…</p>
                              )}
                              {trackingByShipmentId[shipment.id]?.status && (
                                <p className="text-xs text-muted-foreground">
                                  Status: {trackingByShipmentId[shipment.id].status}
                                  {trackingByShipmentId[shipment.id].statusDescription &&
                                    ` — ${trackingByShipmentId[shipment.id].statusDescription}`}
                                </p>
                              )}
                              {trackingByShipmentId[shipment.id]?.events?.length ? (
                                <ul className="text-xs space-y-1">
                                  {trackingByShipmentId[shipment.id].events!.map((ev, i) => (
                                    <li key={i}>
                                      {ev.timestamp ? formatDate(ev.timestamp) : ''} — {ev.description || ev.status || ''}
                                      {ev.location ? ` @ ${ev.location}` : ''}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          )}
                        {shipment.deliveryMode === 'COURIER' &&
                          shipment.trackingNumber &&
                          !trackingByShipmentId[shipment.id]?.events?.length &&
                          trackingLoadingId !== shipment.id && (
                            <div className="mt-2">
                              <Button size="sm" variant="ghost" onClick={() => handleLoadTracking(shipment.id)}>
                                Load tracking from provider
                              </Button>
                            </div>
                          )}

                        {/* Destination */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <p className="text-foreground">{order.shippingAddress || 'No address provided'}</p>
                        </div>

                        {/* OTP confirmation for delivery / pickup */}
                        {(shipment.deliveryMode === 'SELLER_SELF' ||
                          shipment.deliveryMode === 'CUSTOMER_PICKUP') &&
                          !['DELIVERED', 'COLLECTED'].includes((shipment.status || '').toUpperCase()) && (
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
