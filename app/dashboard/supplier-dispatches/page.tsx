'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import { listMySupplierDispatches, submitSupplierDispatch } from '@/lib/actions/suppliers'
import { listProducts } from '@/lib/actions/products'
import type { SupplierDeliveryDto, ProductDto } from '@/lib/api'
import { ClipboardList, Plus, Loader2, CheckCircle2 } from 'lucide-react'

export default function SupplierDispatchesPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [dispatches, setDispatches] = useState<SupplierDeliveryDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; quantity: string; unitCost: string }>>([
    { productId: '', quantity: '1', unitCost: '' },
  ])
  const [saving, setSaving] = useState(false)

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

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: '1', unitCost: '' }])
  }

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const cleanedItems = items
        .map((row) => ({
          productId: row.productId,
          quantity: parseInt(row.quantity, 10),
          unitCost: row.unitCost.trim() ? Number(row.unitCost) : null,
        }))
        .filter((row) => row.productId && !Number.isNaN(row.quantity) && row.quantity > 0)

      if (cleanedItems.length === 0) {
        setError('Add at least one valid line item')
        setSaving(false)
        return
      }

      await submitSupplierDispatch({
        deliveryNoteRef: deliveryNoteRef.trim() || undefined,
        items: cleanedItems,
      })
      toast({ title: 'Dispatch submitted', description: 'The seller will see it in Receiving to confirm what was received.' })
      setCreateOpen(false)
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
                          {d.deliveryNoteRef || 'Dispatch'}{d.deliveredAt ? ` · ${new Date(d.deliveredAt).toLocaleString()}` : ''}
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

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setDeliveryNoteRef(''); setItems([{ productId: '', quantity: '1', unitCost: '' }]) } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">New dispatch</DialogTitle>
            <DialogDescription>
              Select the seller&apos;s products you are dispatching, with quantities and unit costs. The seller will confirm what was actually received.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-sm font-medium text-foreground">Delivery note / reference (optional)</label>
              <Input
                value={deliveryNoteRef}
                onChange={(e) => setDeliveryNoteRef(e.target.value)}
                className="mt-1 h-10"
                placeholder="e.g. DN-001, Invoice #, etc."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Items</p>
              <p className="text-xs text-muted-foreground">
                Choose the seller&apos;s products and enter the quantities you are sending. The seller will later confirm received quantities per line.
              </p>
              <div className="space-y-2">
                {items.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <select
                      className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                      value={row.productId}
                      onChange={(e) => {
                        const v = e.target.value
                        setItems((prev) => prev.map((r, i) => (i === index ? { ...r, productId: v } : r)))
                      }}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => {
                        const v = e.target.value
                        setItems((prev) => prev.map((r, i) => (i === index ? { ...r, quantity: v } : r)))
                      }}
                      className="h-10"
                      placeholder="Qty"
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
                      className="h-10"
                      placeholder="Unit cost (optional)"
                    />
                    <div className="flex justify-end">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItemRow(index)}
                        >
                          Remove
                        </Button>
                      )}
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit dispatch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

