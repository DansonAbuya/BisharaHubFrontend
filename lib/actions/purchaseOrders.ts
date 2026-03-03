'use server'

import type { PurchaseOrderDto } from '@/lib/api'
import { backendFetch } from '@/lib/server/backend'

export async function listPurchaseOrders(): Promise<PurchaseOrderDto[]> {
  const res = await backendFetch('/purchase-orders')
  if (!res.ok) return []
  return res.json()
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderDto> {
  const res = await backendFetch(`/purchase-orders/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load purchase order')
  }
  return res.json()
}

export async function createPurchaseOrder(body: {
  supplierId: string
  poNumber?: string
  deliveryNoteRef?: string
  expectedDeliveryDate?: string | null
  items: {
    productId?: string | null
    description?: string | null
    unitOfMeasure?: string | null
    requestedQuantity: number
    expectedUnitCost?: number | null
  }[]
}): Promise<PurchaseOrderDto> {
  const res = await backendFetch('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify({
      supplierId: body.supplierId,
      poNumber: body.poNumber ?? undefined,
      deliveryNoteRef: body.deliveryNoteRef ?? undefined,
      expectedDeliveryDate: body.expectedDeliveryDate ?? undefined,
      items: body.items.map((it) => ({
        productId: it.productId ?? undefined,
        description: it.description ?? undefined,
        unitOfMeasure: it.unitOfMeasure ?? undefined,
        requestedQuantity: it.requestedQuantity,
        expectedUnitCost: it.expectedUnitCost ?? undefined,
      })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create purchase order')
  }
  return res.json()
}

export async function listMyPurchaseOrdersAsSupplier(): Promise<PurchaseOrderDto[]> {
  const res = await backendFetch('/purchase-orders/my')
  if (!res.ok) return []
  return res.json()
}

