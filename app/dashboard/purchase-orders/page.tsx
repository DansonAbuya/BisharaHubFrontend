'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import { listPurchaseOrders, createPurchaseOrder } from '@/lib/actions/purchaseOrders'
import { listSuppliers } from '@/lib/actions/suppliers'
import { listProducts } from '@/lib/actions/products'
import type { PurchaseOrderDto, SupplierDto, ProductDto } from '@/lib/api'
import { ClipboardList, Plus, Loader2 } from 'lucide-react'

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canManage = user?.role === 'owner' || user?.role === 'staff'

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([])
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; description: string; unitOfMeasure: string; requestedQuantity: string; expectedUnitCost: string }>>([
    { productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '' },
  ])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [poList, s, p] = await Promise.all([
        listPurchaseOrders(),
        listSuppliers(),
        listProducts().catch(() => []),
      ])
      setOrders(poList)
      setSuppliers(s)
      setProducts(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) {
      load()
    } else {
      setLoading(false)
    }
  }, [canManage])

  const supplierOptions = useMemo(() => suppliers, [suppliers])

  const resetForm = () => {
    setSupplierId('')
    setPoNumber('')
    setDeliveryNoteRef('')
    setExpectedDate('')
    setItems([{ productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '' }])
  }

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: '', description: '', unitOfMeasure: '', requestedQuantity: '1', expectedUnitCost: '' }])
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
          return {
            productId: row.productId || null,
            description: row.description.trim() || null,
            unitOfMeasure: row.unitOfMeasure.trim() || null,
            requestedQuantity: rq,
            expectedUnitCost: expectedCost,
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
        poNumber: poNumber.trim() || undefined,
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

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Purchase orders</h1>
        <p className="text-sm text-muted-foreground">Only the owner or staff can manage purchase orders.</p>
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
            Tell suppliers what you want (quantities, units, descriptions). Prices are optional – suppliers quote when dispatching.
          </p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New purchase order
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent purchase orders</CardTitle>
          <CardDescription>Use purchase orders to control what suppliers should deliver, then reconcile with receiving.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoading message="Loading purchase orders…" minHeight="180px" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No purchase orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((po) => {
                const totalQty = (po.items ?? []).reduce((sum, it) => sum + (it.requestedQuantity ?? 0), 0)
                return (
                  <div
                    key={po.id}
                    className="p-3 border border-border rounded-lg bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground truncate">
                        {po.poNumber || 'Purchase order'}{po.supplierName ? ` · ${po.supplierName}` : ''}{po.deliveryNoteRef ? ` · ${po.deliveryNoteRef}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Status: {po.status}{po.createdAt ? ` · Created: ${new Date(po.createdAt).toLocaleString()}` : ''}{` · Total qty: ${totalQty}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                <label className="text-sm font-medium text-foreground">PO number (optional)</label>
                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="mt-1 h-10" />
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

