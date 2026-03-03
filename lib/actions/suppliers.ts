'use server'

import { backendFetch } from '@/lib/server/backend'
import type { SupplierDto, SupplierDeliveryDto, StockLedgerEntryDto } from '@/lib/api'

export async function listSuppliers(): Promise<SupplierDto[]> {
  const res = await backendFetch('/suppliers')
  if (!res.ok) return []
  return res.json()
}

export async function createSupplier(body: { name: string; phone?: string; email?: string }): Promise<SupplierDto> {
  const res = await backendFetch('/suppliers', { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create supplier')
  }
  return res.json()
}

export async function deleteSupplier(id: string): Promise<void> {
  const res = await backendFetch(`/suppliers/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to delete supplier')
  }
}

export async function listSupplierDeliveries(): Promise<SupplierDeliveryDto[]> {
  const res = await backendFetch('/supplier-deliveries')
  if (!res.ok) return []
  return res.json()
}

export async function getSupplierDelivery(id: string): Promise<SupplierDeliveryDto> {
  const res = await backendFetch(`/supplier-deliveries/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load delivery')
  }
  return res.json()
}

export async function createSupplierDelivery(body: { supplierId?: string | null; deliveryNoteRef?: string; deliveredAt?: string | null }): Promise<SupplierDeliveryDto> {
  const res = await backendFetch('/supplier-deliveries', {
    method: 'POST',
    body: JSON.stringify({
      supplierId: body.supplierId ?? undefined,
      deliveryNoteRef: body.deliveryNoteRef ?? undefined,
      deliveredAt: body.deliveredAt ?? undefined,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create delivery')
  }
  return res.json()
}

export async function addSupplierDeliveryItem(deliveryId: string, body: { productId: string; quantity: number; unitCost?: number | null }): Promise<SupplierDeliveryDto> {
  const res = await backendFetch(`/supplier-deliveries/${deliveryId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      productId: body.productId,
      quantity: body.quantity,
      unitCost: body.unitCost ?? undefined,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to add item')
  }
  return res.json()
}

export async function confirmSupplierDeliveryReceipt(
  deliveryId: string,
  receivedQuantities?: Record<string, number>,
): Promise<SupplierDeliveryDto> {
  const hasBody = receivedQuantities && Object.keys(receivedQuantities).length > 0
  const res = await backendFetch(`/supplier-deliveries/${deliveryId}/confirm-receipt`, {
    method: 'PATCH',
    body: hasBody ? JSON.stringify({ receivedQuantities }) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to confirm receipt')
  }
  return res.json()
}

export async function listMySupplierDispatches(): Promise<SupplierDeliveryDto[]> {
  const res = await backendFetch('/supplier-deliveries/my-dispatches')
  if (!res.ok) return []
  return res.json()
}

export async function submitSupplierDispatch(body: {
  purchaseOrderId: string
  deliveryNoteRef?: string
  items: { productId: string; quantity: number; unitCost?: number | null }[]
}): Promise<SupplierDeliveryDto> {
  const res = await backendFetch('/supplier-deliveries/dispatch', {
    method: 'POST',
    body: JSON.stringify({
      purchaseOrderId: body.purchaseOrderId,
      deliveryNoteRef: body.deliveryNoteRef ?? undefined,
      items: body.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost ?? undefined,
      })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to submit dispatch')
  }
  return res.json()
}

export async function listStockLedger(productId?: string): Promise<StockLedgerEntryDto[]> {
  const qs = productId ? `?productId=${encodeURIComponent(productId)}` : ''
  const res = await backendFetch(`/stock-ledger${qs}`)
  if (!res.ok) return []
  return res.json()
}

