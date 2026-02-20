'use server'

import type {
  ShipmentDto,
  CourierServiceDto,
  CourierShipmentDto,
  TrackingInfoDto,
} from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function listCourierServices(): Promise<CourierServiceDto[]> {
  const res = await backendFetch('/courier-services')
  if (!res.ok) return []
  return res.json()
}

export async function listShipments(): Promise<ShipmentDto[]> {
  const res = await backendFetch('/shipments')
  if (!res.ok) return []
  return res.json()
}

export async function listShipmentsByOrder(orderId: string): Promise<ShipmentDto[]> {
  const res = await backendFetch(`/shipments/order/${orderId}`)
  if (!res.ok) return []
  return res.json()
}

export async function createShipment(body: {
  orderId: string
  deliveryMode?: string
  carrier?: string | null
  trackingNumber?: string | null
  riderName?: string | null
  riderPhone?: string | null
  riderVehicle?: string | null
  riderJobId?: string | null
  pickupLocation?: string | null
}): Promise<ShipmentDto> {
  const res = await backendFetch('/shipments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create shipment')
  }
  return res.json()
}

export async function updateShipment(
  shipmentId: string,
  body: Partial<{
    status: string
    carrier: string | null
    trackingNumber: string | null
    riderName: string | null
    riderPhone: string | null
    riderVehicle: string | null
    riderJobId: string | null
    pickupLocation: string | null
    assignedCourierId: string | null
  }>
): Promise<ShipmentDto> {
  const res = await backendFetch(`/shipments/${shipmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update shipment')
  }
  return res.json()
}

export async function verifyShipmentOtp(shipmentId: string, code: string): Promise<ShipmentDto> {
  const res = await backendFetch(`/shipments/${shipmentId}/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Invalid or expired delivery code')
  }
  return res.json()
}

export async function createShipmentWithProvider(
  shipmentId: string,
  courierServiceCode: string
): Promise<{ shipment: ShipmentDto; trackingNumber?: string; labelUrl?: string }> {
  const res = await backendFetch(`/shipments/${shipmentId}/create-with-provider`, {
    method: 'POST',
    body: JSON.stringify({ courierServiceCode: courierServiceCode.trim() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create shipment with provider')
  }
  return res.json()
}

export async function getShipmentTracking(shipmentId: string): Promise<TrackingInfoDto> {
  const res = await backendFetch(`/shipments/${shipmentId}/tracking`)
  if (!res.ok) return {}
  return res.json()
}

/** Courier portal: list shipments assigned to the logged-in courier. */
export async function listCourierShipments(
  activeOnly = true
): Promise<CourierShipmentDto[]> {
  const res = await backendFetch(`/courier/shipments?activeOnly=${activeOnly}`)
  if (!res.ok) throw new Error('Failed to fetch your shipments')
  return res.json()
}

/** Courier portal: update shipment status (PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED). */
export async function updateCourierShipmentStatus(
  shipmentId: string,
  status: string
): Promise<ShipmentDto> {
  const res = await backendFetch(`/courier/shipments/${shipmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update status')
  }
  return res.json()
}
