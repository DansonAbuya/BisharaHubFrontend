'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import {
  addSupplierDeliveryItem,
  createSupplierDelivery,
  getSupplierDelivery,
  listSupplierDeliveries,
  listSuppliers,
  confirmSupplierDeliveryReceipt,
  convertDeliveryItem,
} from '@/lib/actions/suppliers'
import { listProducts, setPriceFromCost } from '@/lib/actions/products'
import type { SupplierDeliveryDto, SupplierDto, ProductDto } from '@/lib/api'
import { ClipboardList, Plus, Loader2, CheckCircle2 } from 'lucide-react'

export default function DeliveriesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canReceive = user?.role === 'owner' || user?.role === 'staff'

  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<SupplierDeliveryDto[]>([])
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState<string>('')
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('')
  const [creating, setCreating] = useState(false)

  const [viewOpen, setViewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SupplierDeliveryDto | null>(null)
  const [loadingSelected, setLoadingSelected] = useState(false)

  const [addProductId, setAddProductId] = useState<string>('')
  const [addQty, setAddQty] = useState<string>('1')
  const [addCost, setAddCost] = useState<string>('')
  const [addingItem, setAddingItem] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [receivedByItem, setReceivedByItem] = useState<Record<string, string>>({})
  const [settingPriceProductId, setSettingPriceProductId] = useState<string | null>(null)
  const [marginPercent, setMarginPercent] = useState<string>('20')

  // Conversion (subdivide received stock into sale units)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertItemId, setConvertItemId] = useState<string | null>(null)
  const [convertName, setConvertName] = useState('')
  const [convertPiecesPerUnit, setConvertPiecesPerUnit] = useState('')
  const [convertSourceQty, setConvertSourceQty] = useState('')
  const [converting, setConverting] = useState(false)

  // Dialog when receipt is blocked because products still have stock from a previous dispatch
  const [existingStockMessage, setExistingStockMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, s, p] = await Promise.all([
        listSupplierDeliveries(),
        listSuppliers(),
        listProducts().catch(() => []),
      ])
      setDeliveries(d)
      setSuppliers(s)
      setProducts(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const supplierOptions = useMemo(() => suppliers, [suppliers])

  const openDetails = async (id: string) => {
    setSelectedId(id)
    setViewOpen(true)
    setLoadingSelected(true)
    setError(null)
    try {
      const d = await getSupplierDelivery(id)
      setSelected(d)
      setAddProductId(products[0]?.id ?? '')
      setAddQty('1')
      setAddCost('')
      const initialReceived: Record<string, string> = {}
      ;(d.items ?? []).forEach((it) => {
        const base = it.receivedQuantity ?? it.quantity ?? 0
        initialReceived[it.id] = String(base)
      })
      setReceivedByItem(initialReceived)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load delivery')
      setSelected(null)
    } finally {
      setLoadingSelected(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const d = await createSupplierDelivery({
        supplierId: supplierId || null,
        deliveryNoteRef: deliveryNoteRef.trim() || undefined,
        deliveredAt: null,
      })
      toast({ title: 'Delivery created', description: 'Add items, then confirm receipt when goods arrive.' })
      setCreateOpen(false)
      setSupplierId('')
      setDeliveryNoteRef('')
      await load()
      await openDetails(d.id)
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Failed to create delivery')
    } finally {
      setCreating(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedId) return
    const qty = parseInt(addQty, 10)
    const cost = addCost.trim() ? Number(addCost) : null
    if (!addProductId) {
      setError('Select a product')
      return
    }
    if (Number.isNaN(qty) || qty <= 0) {
      setError('Enter a valid quantity')
      return
    }
    setAddingItem(true)
    setError(null)
    try {
      const updated = await addSupplierDeliveryItem(selectedId, {
        productId: addProductId,
        quantity: qty,
        unitCost: cost,
      })
      setSelected(updated)
      toast({ title: 'Item added' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setAddingItem(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!selectedId) return
    setConfirming(true)
    setError(null)
    try {
      const current = selected
      const overrides: Record<string, number> = {}
      if (current?.items) {
        for (const it of current.items) {
          const raw = receivedByItem[it.id]
          const parsed = raw != null && raw !== '' ? parseInt(raw, 10) : (it.receivedQuantity ?? it.quantity ?? 0)
          if (Number.isNaN(parsed) || parsed < 0) {
            setError('Received quantities must be zero or positive numbers')
            setConfirming(false)
            return
          }
          // Only send when it differs from supplier-stated quantity to keep payload small
          const supplierQty = it.quantity ?? 0
          if (parsed !== supplierQty) {
            overrides[it.id] = parsed
          }
        }
      }
      const updated = await confirmSupplierDeliveryReceipt(selectedId, overrides)
      setSelected(updated)
      toast({
        title: 'Receipt confirmed',
        description: 'Stock updated. Set selling prices for this dispatch (e.g. "Set price from cost" below) if they differ from the previous supply.',
      })
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to confirm receipt'
      if (msg.includes('dispatch whose products are still on sale') || msg.includes('still have stock')) {
        setExistingStockMessage(msg)
      } else {
        setError(msg)
      }
    } finally {
      setConfirming(false)
    }
  }

  const handleSetPriceFromCost = async (productId: string, unitCost: number) => {
    const cost = typeof unitCost === 'number' ? unitCost : Number(unitCost)
    const margin = parseFloat(marginPercent)
    if (Number.isNaN(margin) || margin < 0) {
      setError('Enter a valid margin %')
      return
    }
    setSettingPriceProductId(productId)
    setError(null)
    try {
      await setPriceFromCost(productId, { unitCost: cost, marginPercent: margin })
      toast({ title: 'Price updated', description: `Applied ${margin}% margin to supplier cost.` })
      const d = selectedId ? await getSupplierDelivery(selectedId) : null
      if (d) setSelected(d)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set price')
    } finally {
      setSettingPriceProductId(null)
    }
  }

  const startConvert = (item: SupplierDeliveryDto['items'][number]) => {
    if (!selected) return
    setConvertItemId(item.id)
    const baseQty = item.receivedQuantity ?? item.quantity ?? 0
    setConvertName(item.productName || selected.supplierName || '')
    setConvertPiecesPerUnit('1')
    setConvertSourceQty(baseQty > 0 ? String(baseQty) : '1')
    setConvertOpen(true)
  }

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !convertItemId) return
    const sourceUsed = convertSourceQty.trim() ? parseInt(convertSourceQty, 10) : undefined
    const piecesPerUnit = convertPiecesPerUnit.trim() ? parseInt(convertPiecesPerUnit, 10) : NaN
    if (!convertName.trim()) {
      setError('Enter a name for the sale product')
      return
    }
    if (Number.isNaN(piecesPerUnit) || piecesPerUnit <= 0) {
      setError('Enter how many sale pieces you get from one source unit')
      return
    }
    setConverting(true)
    setError(null)
    try {
      const updated = await convertDeliveryItem(selectedId, convertItemId, {
        targetName: convertName.trim(),
        piecesPerUnit,
        sourceQuantityUsed: sourceUsed,
      })
      setSelected(updated)
      toast({ title: 'Conversion recorded', description: 'Stock was moved into the new sale units.' })
      await load()
      setConvertOpen(false)
      setConvertItemId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert item')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Receiving
          </h1>
          <p className="text-sm text-muted-foreground">
            Record supplier deliveries and who received them. This creates an audit trail for stock increases.
          </p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New delivery
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Deliveries</CardTitle>
          <CardDescription>Suppliers dispatch, then you confirm receipt to move quantities into stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoading message="Loading deliveries…" minHeight="180px" />
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No deliveries yet.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => {
                const totalCost = d.totalCost != null ? Number(d.totalCost) : null
                const totalReceivedCost = d.totalReceivedCost != null ? Number(d.totalReceivedCost) : null
                const profitLoss = d.profitLoss != null ? Number(d.profitLoss) : null
                return (
                  <button
                    key={d.id}
                    onClick={() => openDetails(d.id)}
                    className="w-full text-left p-3 border border-border rounded-lg bg-card/60 hover:bg-secondary/30 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground truncate">
                        {d.supplierName || 'Supplier'}{d.deliveryNoteRef ? ` · ${d.deliveryNoteRef}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Status: {d.status} {d.receivedAt ? `· Received: ${new Date(d.receivedAt).toLocaleString()}` : ''}
                      </p>
                      {(totalCost != null || totalReceivedCost != null || profitLoss != null) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {totalCost != null && <>Supplier cost: KES {totalCost.toLocaleString()} · </>}
                          {totalReceivedCost != null && <>Received cost: KES {totalReceivedCost.toLocaleString()} · </>}
                          {profitLoss != null && (
                            <span className={profitLoss >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                              P&amp;L: {profitLoss >= 0 ? '+' : ''}KES {profitLoss.toLocaleString()}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {d.status === 'RECEIVED' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> In stock
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending receipt</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">New delivery</DialogTitle>
            <DialogDescription>Create a delivery, add items, start processing, then move to stock when ready.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div>
              <label className="text-sm font-medium text-foreground">Supplier (optional)</label>
              <select
                className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">—</option>
                {supplierOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Delivery note / reference (optional)</label>
              <Input value={deliveryNoteRef} onChange={(e) => setDeliveryNoteRef(e.target.value)} className="mt-1 h-10" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) { setSelected(null); setSelectedId(null) } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delivery details</DialogTitle>
            <DialogDescription>Add items (draft only). Confirm receipt to add quantities to stock.</DialogDescription>
          </DialogHeader>

          {loadingSelected ? (
            <PageLoading message="Loading delivery…" minHeight="160px" />
          ) : !selected ? (
            <p className="text-sm text-muted-foreground">No delivery selected.</p>
          ) : (
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground">
                    {selected.supplierName || 'Supplier'}{selected.deliveryNoteRef ? ` · ${selected.deliveryNoteRef}` : ''}
                  </CardTitle>
                  <CardDescription>
                    Status: {selected.status}
                    {selected.receivedAt ? ` · Received at: ${new Date(selected.receivedAt).toLocaleString()}` : ''}
                    {selected.receivedByName ? ` · By: ${selected.receivedByName}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(selected.totalQuantity != null || selected.totalCost != null || selected.totalReceivedCost != null || selected.potentialRevenue != null || selected.profitLoss != null) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-muted/50 rounded-md">
                      {selected.totalQuantity != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Total qty</p>
                          <p className="text-sm font-medium text-foreground">{selected.totalQuantity}</p>
                        </div>
                      )}
                      {selected.totalCost != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Supplier cost</p>
                          <p className="text-sm font-medium text-foreground">KES {Number(selected.totalCost).toLocaleString()}</p>
                        </div>
                      )}
                      {selected.totalReceivedCost != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Received cost</p>
                          <p className="text-sm font-medium text-foreground">KES {Number(selected.totalReceivedCost).toLocaleString()}</p>
                        </div>
                      )}
                      {selected.potentialRevenue != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Potential revenue</p>
                          <p className="text-sm font-medium text-foreground">KES {Number(selected.potentialRevenue).toLocaleString()}</p>
                        </div>
                      )}
                      {selected.profitLoss != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Profit / Loss</p>
                          <p className={`text-sm font-medium ${Number(selected.profitLoss) >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {Number(selected.profitLoss) >= 0 ? '+' : ''}KES {Number(selected.profitLoss).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Items</p>
                    {(selected.items ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {canReceive && (selected.items ?? []).some((it) => it.unitCost != null && it.unitCost > 0) && (
                          <div className="flex items-center gap-2 pb-1">
                            <label className="text-xs text-muted-foreground">Margin % for “Set price from cost”:</label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={marginPercent}
                              onChange={(e) => setMarginPercent(e.target.value)}
                              className="w-16 h-7 text-sm"
                            />
                          </div>
                        )}
                        {(selected.items ?? []).map((it) => {
                          const receivedValue = receivedByItem[it.id] ?? String(it.receivedQuantity ?? it.quantity ?? 0)
                          return (
                            <div key={it.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border border-border rounded-md">
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-medium text-foreground truncate">{it.productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Supplier qty: {it.quantity}
                                  {it.unitCost != null && <> · Unit cost: KES {it.unitCost}</>}
                                  {it.lineTotal != null && <> · Line: KES {it.lineTotal}</>}
                                </p>
                                {it.productPrice != null && (
                                  <p className="text-xs text-muted-foreground">Selling price: KES {it.productPrice}</p>
                                )}
                                {canReceive && selected.status !== 'RECEIVED' && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">Received qty:</span>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={receivedValue}
                                      onChange={(e) =>
                                        setReceivedByItem((prev) => ({
                                          ...prev,
                                          [it.id]: e.target.value,
                                        }))
                                      }
                                      className="h-8 w-24 text-xs"
                                    />
                                  </div>
                                )}
                                {canReceive && selected.status === 'RECEIVED' && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="xs"
                                      onClick={() => startConvert(it)}
                                    >
                                      Subdivide into sale units
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {canReceive && it.unitCost != null && it.unitCost > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetPriceFromCost(it.productId, Number(it.unitCost))}
                                  disabled={!!settingPriceProductId}
                                >
                                  {settingPriceProductId === it.productId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Set price from cost'
                                  )}
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {selected.status !== 'RECEIVED' && (
                      <div className="pt-3 border-t border-border space-y-2">
                        {selected.status === 'DRAFT' && (
                          <>
                            <p className="text-sm font-medium text-foreground">Add item</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <select
                                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                                value={addProductId}
                                onChange={(e) => setAddProductId(e.target.value)}
                              >
                                <option value="">Select product</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <Input
                                type="number"
                                min={1}
                                value={addQty}
                                onChange={(e) => setAddQty(e.target.value)}
                                className="h-10"
                                placeholder="Qty"
                              />
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={addCost}
                                onChange={(e) => setAddCost(e.target.value)}
                                className="h-10"
                                placeholder="Unit cost (optional)"
                              />
                            </div>
                          </>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {selected.status === 'DRAFT' && (
                            <Button variant="outline" onClick={handleAddItem} disabled={addingItem}>
                              {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add item'}
                            </Button>
                          )}
                          {canReceive && (selected.items ?? []).length > 0 && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Stock is per dispatch—do not mix. If there is a dispatch whose products are still on sale, sell or clear that stock first, then confirm receipt and set prices for this dispatch.
                              </p>
                              <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={handleConfirmReceipt}
                                disabled={confirming}
                              >
                                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm receipt & update stock'}
                              </Button>
                            </>
                          )}
                        </div>
                        {!canReceive && selected.status !== 'RECEIVED' && (
                          <p className="text-xs text-muted-foreground">
                            Only the business owner or staff can confirm receipt.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conversion dialog: subdivide received stock into sale units */}
      <Dialog open={convertOpen} onOpenChange={(o) => { setConvertOpen(o); if (!o) { setConvertItemId(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Subdivide into sale units</DialogTitle>
            <DialogDescription>
              Create smaller units of sale from the received stock. This will reduce the bulk stock and increase stock on the new sale product.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleConvertSubmit}>
            <div>
              <label className="text-sm font-medium text-foreground">Sale product name</label>
              <Input
                value={convertName}
                onChange={(e) => setConvertName(e.target.value)}
                className="mt-1 h-9"
                placeholder="Customer-facing name e.g. Tilapia fillet 500g"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Pieces per original unit</label>
              <Input
                type="number"
                min={1}
                value={convertPiecesPerUnit}
                onChange={(e) => setConvertPiecesPerUnit(e.target.value)}
                className="mt-1 h-9"
                placeholder="e.g. 3 (fillets per whole fish)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Source qty to consume (optional)</label>
              <Input
                type="number"
                min={1}
                value={convertSourceQty}
                onChange={(e) => setConvertSourceQty(e.target.value)}
                className="mt-1 h-9"
                placeholder="Defaults to received qty"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setConvertOpen(false)}
                disabled={converting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={converting}
              >
                {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save conversion'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shown when receipt is blocked because products still have stock from a previous dispatch */}
      <Dialog open={!!existingStockMessage} onOpenChange={(open) => { if (!open) setExistingStockMessage(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Dispatch still on sale</DialogTitle>
            <DialogDescription asChild>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingStockMessage ?? ''}</p>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            There is a dispatch whose products are still on sale. Stock is kept per dispatch—do not mix. Sell or adjust that stock to zero in Products or Inventory, then you can receive this dispatch.
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setExistingStockMessage(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

