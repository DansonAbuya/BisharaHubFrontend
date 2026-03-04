'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import { listPurchaseOrders, listMyPurchaseOrdersAsSupplier, getPurchaseOrder, createPurchaseOrder } from '@/lib/actions/purchaseOrders'
import { listSuppliers } from '@/lib/actions/suppliers'
import { listProducts } from '@/lib/actions/products'
import type { PurchaseOrderDto, PurchaseOrderItemDto, SupplierDto, ProductDto } from '@/lib/api'
import { ClipboardList, Plus, Loader2, Eye } from 'lucide-react'

function getStatusColor(status: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'DRAFT') return 'bg-gray-500 hover:bg-gray-500'
  if (s === 'SENT') return 'bg-blue-500 hover:bg-blue-500'
  if (s === 'PARTIALLY_FULFILLED') return 'bg-amber-500 hover:bg-amber-500'
  if (s === 'FULFILLED') return 'bg-green-600 hover:bg-green-600'
  if (s === 'CANCELLED') return 'bg-red-600 hover:bg-red-600'
  return 'bg-gray-500 hover:bg-gray-500'
}

function formatDate(iso?: string | null) {
  if (!iso) return '–'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' })
  } catch {
    return iso
  }
}

function formatMoney(n?: number | null) {
  if (n == null) return '–'
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n)
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role = user?.role?.toLowerCase()
  const canManage = role === 'owner' || role === 'staff'
  const isSupplier = role === 'supplier'
  const canView = canManage || isSupplier

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([])
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; description: string; unitOfMeasure: string; requestedQuantity: string; expectedUnitCost: string; customerName: string; customerPrice: string }>>([
    { productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '', customerName: '', customerPrice: '' },
  ])
  const [saving, setSaving] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPo, setDetailPo] = useState<PurchaseOrderDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async () => {
    if (!canView) return
    setLoading(true)
    setError(null)
    try {
      if (isSupplier) {
        const poList = await listMyPurchaseOrdersAsSupplier()
        setOrders(poList)
      } else {
        const [poList, s, p] = await Promise.all([
          listPurchaseOrders(),
          listSuppliers(),
          listProducts().catch(() => []),
        ])
        setOrders(poList)
        setSuppliers(s)
        setProducts(p)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canView) {
      load()
    } else {
      setLoading(false)
    }
  }, [canView, isSupplier])

  const supplierOptions = useMemo(() => suppliers, [suppliers])

  const resetForm = () => {
    setSupplierId('')
    setDeliveryNoteRef('')
    setExpectedDate('')
    setItems([{ productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '', customerName: '', customerPrice: '' }])
  }

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '', customerName: '', customerPrice: '' }])
  }

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      setError('Select a supplier')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const cleanedItems = items
        .map((row) => {
          const rq = parseInt(row.requestedQuantity, 10)
          const expectedCost = row.expectedUnitCost.trim() ? Number(row.expectedUnitCost) : null
          const customerPrice = row.customerPrice.trim() ? Number(row.customerPrice) : null
          return {
            productId: row.productId || null,
            description: row.description.trim() || null,
            unitOfMeasure: row.unitOfMeasure.trim() || null,
            requestedQuantity: rq,
            expectedUnitCost: expectedCost,
            customerName: row.customerName.trim() || null,
            customerPrice,
          }
        })
        .filter((row) => !Number.isNaN(row.requestedQuantity) && row.requestedQuantity > 0)

      if (cleanedItems.length === 0) {
        setError('Add at least one line with a requested quantity')
        setSaving(false)
        return
      }

      await createPurchaseOrder({
        supplierId,
        deliveryNoteRef: deliveryNoteRef.trim() || undefined,
        expectedDeliveryDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
        items: cleanedItems,
      })
      toast({ title: 'Purchase order created', description: 'Suppliers can now dispatch against this PO.' })
      setCreateOpen(false)
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order')
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetailPo(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const po = await getPurchaseOrder(id)
      setDetailPo(po)
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  if (!canView) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Purchase orders</h1>
        <p className="text-sm text-muted-foreground">Only the owner, staff, or supplier can view purchase orders.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Purchase orders
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSupplier
              ? 'Purchase orders the seller has placed with you. Dispatch against these when you send goods.'
              : 'Tell suppliers what you want (quantities, units, descriptions). Prices are optional – suppliers quote when dispatching.'}
          </p>
        </div>
        {canManage && (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            New purchase order
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            {isSupplier ? 'Purchase orders assigned to you' : 'Recent purchase orders'}
          </CardTitle>
          <CardDescription>
            {isSupplier
              ? 'View what the seller has requested. Use My dispatches to send goods against these POs.'
              : 'Use purchase orders to control what suppliers should deliver, then reconcile with receiving.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoading message="Loading purchase orders…" minHeight="180px" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isSupplier ? 'No purchase orders assigned to you yet.' : 'No purchase orders yet.'}
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((po) => (
                <div
                  key={po.id}
                  className="p-4 border border-border rounded-lg bg-card/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {po.poNumber || `PO ${String(po.id).slice(0, 8)}`}
                        {po.supplierName && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">· {po.supplierName}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Expected: {formatDate(po.expectedDeliveryDate)}</span>
                        <span>Created: {formatDate(po.createdAt)}</span>
                        {po.createdByName && <span>By: {po.createdByName}</span>}
                      </div>
                    </div>
                    <Badge className={getStatusColor(po.status)}>
                      {(po.status || 'Unknown').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-foreground">Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-foreground">Unit</TableHead>
                          <TableHead className="text-right">Expected cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(po.items ?? []).map((item: PurchaseOrderItemDto) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-foreground">
                              {item.productName || item.description || '–'}
                            </TableCell>
                            <TableCell className="text-right">{item.requestedQuantity ?? '–'}</TableCell>
                            <TableCell className="text-foreground">{item.unitOfMeasure || '–'}</TableCell>
                            <TableCell className="text-right">{formatMoney(item.expectedUnitCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openDetail(po.id)}>
                    <Eye className="w-4 h-4" />
                    View full details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal with full breakdown */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailPo(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {detailPo?.poNumber || `PO ${detailPo?.id?.slice(0, 8) ?? ''}`} – Full breakdown
            </DialogTitle>
            {detailPo && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {detailPo.supplierName && <span>Supplier: {detailPo.supplierName}</span>}
                <Badge className={getStatusColor(detailPo.status)}>
                  {(detailPo.status || '').replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </DialogHeader>
          {detailLoading && !detailPo ? (
            <PageLoading message="Loading…" minHeight="80px" />
          ) : detailPo ? (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Product / Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-foreground">Unit</TableHead>
                    <TableHead className="text-right">Expected unit cost</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detailPo.items ?? []).map((item: PurchaseOrderItemDto) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-foreground">
                        {item.productName || item.description || '–'}
                      </TableCell>
                      <TableCell className="text-right">{item.requestedQuantity ?? '–'}</TableCell>
                      <TableCell className="text-foreground">{item.unitOfMeasure || '–'}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.expectedUnitCost)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(
                          item.requestedQuantity != null && item.expectedUnitCost != null
                            ? item.requestedQuantity * Number(item.expectedUnitCost)
                            : null
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">New purchase order</DialogTitle>
            <DialogDescription>
              Specify what you want from the supplier. You can use descriptions and units (e.g. kg). Prices are optional – suppliers will quote on dispatch.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Supplier</label>
                <select
                  className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">Select supplier</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Delivery note / reference (optional)</label>
                <Input value={deliveryNoteRef} onChange={(e) => setDeliveryNoteRef(e.target.value)} className="mt-1 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expected delivery date (optional)</label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Items</p>
              <p className="text-xs text-muted-foreground">
                For each line, you can either choose a product or just describe what you want (e.g. fish size category, packaging). Prices are optional.
              </p>
              <div className="space-y-2">
                {items.map((row, index) => (
                  <div key={index} className="space-y-1 border border-border rounded-md p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <select
                        className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-xs"
                        value={row.productId}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, productId: v } : r)))
                        }}
                      >
                        <option value="">(Optional) Link to product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="Description (e.g. Tilapia – large 600–800g)"
                        className="h-9 text-xs sm:col-span-3"
                        value={row.description}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, description: v } : r)))
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-1">
                      <Input
                        placeholder="Unit (e.g. kg, piece, box)"
                        className="h-9 text-xs"
                        value={row.unitOfMeasure}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, unitOfMeasure: v } : r)))
                        }}
                      />
                      <Input
                        type="number"
                        min={1}
                        placeholder="Requested qty"
                        className="h-9 text-xs"
                        value={row.requestedQuantity}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, requestedQuantity: v } : r)))
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Expected unit cost (optional)"
                        className="h-9 text-xs"
                        value={row.expectedUnitCost}
                        onChange={(e) => {
                          const v = e.target.value
                          setItems((prev) => prev.map((r, i) => (i === index ? { ...r, expectedUnitCost: v } : r)))
                        }}
                      />
                      <div className="flex justify-end items-center">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItemRow(index)}
                            className="h-8 text-xs"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow}>
                Add another line
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create purchase order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

