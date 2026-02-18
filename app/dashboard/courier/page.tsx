'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { listCourierShipments, updateCourierShipmentStatus } from '@/lib/actions/shipments'
import type { ShipmentDto, CourierShipmentDto } from '@/lib/api'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

const getStatusColor = (status: string) => {
  const s = (status || '').toUpperCase()
  if (s === 'CREATED') return 'bg-accent/30 text-accent'
  if (s === 'PICKED_UP' || s === 'IN_TRANSIT' || s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY')
    return 'bg-secondary/30 text-foreground'
  if (s === 'DELIVERED' || s === 'COLLECTED') return 'bg-primary/30 text-primary'
  return 'bg-muted text-muted-foreground'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    CREATED: 'Awaiting pickup',
    PICKED_UP: 'Picked up',
    SHIPPED: 'Dispatched',
    IN_TRANSIT: 'In transit',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    COLLECTED: 'Collected',
  }
  return labels[(status || '').toUpperCase()] || status?.replace(/_/g, ' ') || '—'
}

const NEXT_STATUS: Record<string, string> = {
  CREATED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  SHIPPED: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export default function CourierPortalPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<CourierShipmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'courier') return
    setLoading(true)
    setError(null)
    listCourierShipments(!showCompleted)
      .then(setItems)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load shipments')
      })
      .finally(() => setLoading(false))
  }, [user, showCompleted])

  const handleUpdateStatus = async (
    item: CourierShipmentDto,
    newStatus: string
  ) => {
    const shipment = item.shipment
    setUpdatingId(shipment.id)
    try {
      const updated = await updateCourierShipmentStatus(shipment.id, newStatus)
      setItems((prev) =>
        prev.map((i) =>
          i.shipment.id === updated.id
            ? { ...i, shipment: updated }
            : i
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (user?.role !== 'courier') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courier Portal"
          description="This page is only available to courier accounts."
        />
        <PageSection>
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <p className="text-foreground font-medium">
                You need a courier account to access this page.
              </p>
            </CardContent>
          </Card>
        </PageSection>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="My Deliveries"
        description="View and update the status of deliveries assigned to you."
      />

      {error && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        </PageSection>
      )}

      {loading ? (
        <PageSection>
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading your deliveries…
          </div>
        </PageSection>
      ) : (
        <>
          <PageSection>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {items.length} delivery{items.length !== 1 ? 's' : ''} assigned to you
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted((v) => !v)}
              >
                {showCompleted ? 'Hide completed' : 'Show completed'}
              </Button>
            </div>
          </PageSection>

          <PageSection>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Deliveries</CardTitle>
                <CardDescription>
                  Update status as you progress through each delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => {
                    const shipment = item.shipment
                    const status = (shipment.status || '').toUpperCase()
                    const nextStatus = NEXT_STATUS[status]
                    const isDelivered =
                      status === 'DELIVERED' || status === 'COLLECTED'

                    return (
                      <div
                        key={shipment.id}
                        className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground text-lg">
                              {item.orderNumber || item.orderId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.customerName || '—'}
                            </p>
                          </div>
                          <Badge className={getStatusColor(shipment.status)}>
                            {getStatusLabel(shipment.status)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-3">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <p className="text-foreground">
                            {item.shippingAddress || 'No address provided'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Tracking
                            </p>
                            <p className="font-medium">
                              {shipment.trackingNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Carrier
                            </p>
                            <p className="font-medium">
                              {shipment.carrier || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              OTP (for delivery)
                            </p>
                            <p className="font-medium font-mono">
                              {shipment.otpCode || '—'}
                            </p>
                          </div>
                        </div>

                        {!isDelivered && nextStatus && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(item, nextStatus)}
                            disabled={updatingId === shipment.id}
                          >
                            {updatingId === shipment.id
                              ? 'Updating…'
                              : `Mark as ${getStatusLabel(nextStatus)}`}
                          </Button>
                        )}

                        {isDelivered && (
                          <p className="text-sm text-muted-foreground">
                            Delivered {formatDate(shipment.actualDelivery)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium">
                      No deliveries assigned
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Deliveries appear here when your phone number matches the
                      rider phone, or when a seller assigns you to a shipment.
                    </p>
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
