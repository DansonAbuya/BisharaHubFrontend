'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import { listMySupplierDispatches, submitSupplierDispatch } from '@/lib/actions/suppliers'
import { listMyPurchaseOrdersAsSupplier } from '@/lib/actions/purchaseOrders'
import { listProducts } from '@/lib/actions/products'
import type { SupplierDeliveryDto, ProductDto, PurchaseOrderDto } from '@/lib/api'
import { ClipboardList, Plus, Loader2, CheckCircle2 } from 'lucide-react'

export default function SupplierDispatchesPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [dispatches, setDispatches] = useState<SupplierDeliveryDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; quantity: string; unitCost: string }>>([
    { productId: '', quantity: '1', unitCost: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [loadingPo, setLoadingPo] = useState(false)

  const selectedPurchaseOrder = useMemo(
    () => (purchaseOrderId ? purchaseOrders.find((po) => po.id === purchaseOrderId) ?? null : null),
    [purchaseOrderId, purchaseOrders],
  )

  // Only PO lines that are linked to a concrete product can be dispatched,
  // because dispatch items must reference actual products for stock updates.
  const dispatchablePoItems = useMemo(
    () => (selectedPurchaseOrder?.items ?? []).filter((item) => item.productId),
    [selectedPurchaseOrder],
  )

  const totalDispatchCost = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = parseFloat(row.quantity || '0')
      const unit = parseFloat(row.unitCost || '0')
      if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum
      return sum + qty * unit
    }, 0)
  }, [items])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, p] = await Promise.all([
        listMySupplierDispatches(),
        listProducts().catch(() => []),
      ])
      setDispatches(d)
      setProducts(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dispatches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const loadPurchaseOrders = async () => {
    setLoadingPo(true)
    try {
      const list = await listMyPurchaseOrdersAsSupplier()
      setPurchaseOrders(list)
      if (list.length > 0 && !purchaseOrderId) setPurchaseOrderId(list[0].id)
    } catch {
      setPurchaseOrders([])
    } finally {
      setLoadingPo(false)
    }
  }

  useEffect(() => {
    if (createOpen) loadPurchaseOrders()
  }, [createOpen])

  // When a PO is selected, initialise one row per dispatchable PO item so the supplier can
  // enter dispatched quantities and unit prices against each order line.
  useEffect(() => {
    if (dispatchablePoItems.length > 0) {
      setItems(
        dispatchablePoItems.map((item) => ({
          productId: item.productId || '',
          quantity: item.requestedQuantity != null ? String(item.requestedQuantity) : '',
          unitCost: '',
        })),
      )
    } else {
      setItems([{ productId: '', quantity: '1', unitCost: '' }])
    }
  }, [selectedPurchaseOrder])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseOrderId) {
      setError('Select a purchase order')
      return
    }
    if (!selectedPurchaseOrder) {
      setError('Purchase order details could not be loaded')
      return
    }
    if (dispatchablePoItems.length === 0) {
      setError('This purchase order has no product-backed items to dispatch. Ask the seller to create a PO with products.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const cleanedItems = dispatchablePoItems
        .map((poItem, index) => {
          const row = items[index] || { quantity: '0', unitCost: '' }
          const qty = parseInt(row.quantity, 10)
          const unitCost = row.unitCost.trim() ? Number(row.unitCost) : null
          return {
            productId: poItem.productId || null,
            quantity: qty,
            unitCost,
          }
        })
        .filter(
          (row) =>
            row.productId &&
            !Number.isNaN(row.quantity) &&
            row.quantity > 0,
        ) as { productId: string; quantity: number; unitCost?: number | null }[]

      if (cleanedItems.length === 0) {
        setError('Add at least one valid line item')
        setSaving(false)
        return
      }

      await submitSupplierDispatch({
        purchaseOrderId,
        deliveryNoteRef: deliveryNoteRef.trim() || undefined,
        items: cleanedItems,
      })
      toast({ title: 'Dispatch submitted', description: 'The seller will see it in Receiving to confirm what was received.' })
      setCreateOpen(false)
      setPurchaseOrderId('')
      setDeliveryNoteRef('')
      setItems([{ productId: '', quantity: '1', unitCost: '' }])
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispatch')
    } finally {
      setSaving(false)
    }
  }

  const hasDispatches = useMemo(() => dispatches.length > 0, [dispatches])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            My dispatches
          </h1>
          <p className="text-sm text-muted-foreground">
            Record what you have dispatched to the seller and see what they confirmed as received.
          </p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New dispatch
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Dispatches</CardTitle>
          <CardDescription>Each dispatch shows your stated quantities vs what the seller confirmed as received.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoading message="Loading dispatches…" minHeight="180px" />
          ) : !hasDispatches ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No dispatches yet.</p>
          ) : (
            <div className="space-y-2">
              {dispatches.map((d) => {
                const totalQty = d.totalQuantity ?? (d.items ?? []).reduce((sum, it) => sum + (it.quantity ?? 0), 0)
                const totalCost = d.totalCost != null ? Number(d.totalCost) : null
                const totalReceivedCost = d.totalReceivedCost != null ? Number(d.totalReceivedCost) : null
                return (
                  <div
                    key={d.id}
                    className="p-3 border border-border rounded-lg bg-card/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {[d.poNumber && `PO: ${d.poNumber}`, d.deliveryNoteRef || 'Dispatch', d.deliveredAt && new Date(d.deliveredAt).toLocaleString()]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Status: {d.status}
                          {d.receivedAt ? ` · Seller confirmed: ${new Date(d.receivedAt).toLocaleString()}` : ' · Waiting for seller confirmation'}
                        </p>
                      </div>
                      {d.status === 'RECEIVED' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Reconciled
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <p className="uppercase tracking-wide">Total qty (you)</p>
                        <p className="font-medium text-foreground text-sm">{totalQty}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide">Supplier cost</p>
                        <p className="font-medium text-foreground text-sm">
                          {totalCost != null ? `KES ${totalCost.toLocaleString()}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide">Received cost (seller)</p>
                        <p className="font-medium text-foreground text-sm">
                          {totalReceivedCost != null ? `KES ${totalReceivedCost.toLocaleString()}` : '—'}
                        </p>
                      </div>
                    </div>
                    {(d.items ?? []).length > 0 && (
                      <div className="mt-2 border-t border-border pt-2 space-y-1">
                        {(d.items ?? []).map((it) => (
                          <div key={it.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{it.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                You sent: {it.quantity}
                                {it.receivedQuantity != null && (
                                  <> · Seller confirmed: {it.receivedQuantity}</>
                                )}
                                {it.unitCost != null && <> · Unit cost: KES {it.unitCost}</>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setPurchaseOrderId(''); setDeliveryNoteRef(''); setItems([{ productId: '', quantity: '1', unitCost: '' }]) } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">New dispatch</DialogTitle>
            <DialogDescription>
              Choose the purchase order this dispatch fulfills, then add the products and quantities you are sending. The seller will confirm what was received.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-sm font-medium text-foreground">Purchase order (required)</label>
              <select
                className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                required
                disabled={loadingPo}
              >
                <option value="">{loadingPo ? 'Loading…' : 'Select purchase order'}</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber || `PO ${String(po.id).slice(0, 8)}`}{po.supplierName ? ` · ${po.supplierName}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Delivery note / reference (optional)</label>
              <Input
                value={deliveryNoteRef}
                onChange={(e) => setDeliveryNoteRef(e.target.value)}
                className="mt-1 h-10"
                placeholder="e.g. DN-001, Invoice #, etc."
              />
            </div>
            {selectedPurchaseOrder && (
              <div className="mt-2 rounded-md border border-border overflow-hidden">
                <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
                  Order details (what the seller requested)
                </div>
                <div className="max-h-48 overflow-y-auto text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-3 py-1">Item</th>
                        <th className="text-right px-3 py-1">Requested qty</th>
                        <th className="text-left px-3 py-1">Unit</th>
                        <th className="text-right px-3 py-1">Expected cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPurchaseOrder.items ?? []).map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-1">
                            {item.productName || item.description || '—'}
                          </td>
                          <td className="px-3 py-1 text-right">{item.requestedQuantity ?? '—'}</td>
                          <td className="px-3 py-1">{item.unitOfMeasure || '—'}</td>
                          <td className="px-3 py-1 text-right">
                            {item.expectedUnitCost != null ? `KES ${item.expectedUnitCost}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Dispatch against order lines</p>
              <p className="text-xs text-muted-foreground">
                For each item in the purchase order, enter the quantity you are dispatching and the agreed unit price.
              </p>
              <div className="space-y-2">
                {(selectedPurchaseOrder?.items ?? []).map((poItem, index) => {
                  const row = items[index] || { quantity: '', unitCost: '' }
                  return (
                    <div key={poItem.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="text-xs text-left">
                        <div className="font-medium text-foreground truncate">
                          {poItem.productName || poItem.description || '—'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Requested: {poItem.requestedQuantity ?? '—'} {poItem.unitOfMeasure || ''}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={row.quantity}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, quantity: v } : r)))
                        }}
                        className="h-10 text-xs"
                        placeholder="Qty dispatched"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.unitCost}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, unitCost: v } : r)))
                        }}
                        className="h-10 text-xs"
                        placeholder="Unit price"
                      />
                      <div className="text-right text-[11px] text-muted-foreground pr-1">
                        {row.quantity && row.unitCost
                          ? `Line total: KES ${(
                              parseFloat(row.quantity || '0') * parseFloat(row.unitCost || '0')
                            ).toLocaleString()}`
                          : 'Line total: —'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end text-xs text-muted-foreground">
              <span>
                Total dispatch cost:{' '}
                <span className="font-medium text-foreground">
                  {totalDispatchCost > 0 ? `KES ${totalDispatchCost.toLocaleString()}` : '—'}
                </span>
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm dispatch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

