'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/layout/page-loading'
import { listStockLedger } from '@/lib/actions/suppliers'
import type { StockLedgerEntryDto } from '@/lib/api'
import { History } from 'lucide-react'

function formatWhen(ts?: string) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleString()
}

export default function StockLedgerPage() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<StockLedgerEntryDto[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await listStockLedger()
        if (!cancelled) setEntries(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      (e.productName ?? '').toLowerCase().includes(q) ||
      (e.entryType ?? '').toLowerCase().includes(q) ||
      (e.performedByName ?? '').toLowerCase().includes(q) ||
      (e.supplierName ?? '').toLowerCase().includes(q) ||
      (e.note ?? '').toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Stock audit
        </h1>
        <p className="text-sm text-muted-foreground">
          Every stock increase/decrease is logged with who did it and why.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Stock ledger</CardTitle>
          <CardDescription>Filter by product, supplier, user, type, or note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />

          {loading ? (
            <PageLoading message="Loading stock ledger…" minHeight="180px" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No ledger entries yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => (
                <div key={e.id} className="p-3 border border-border rounded-lg bg-card/60">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {e.productName || 'Product'} · {e.entryType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatWhen(e.createdAt)} · By: {e.performedByName || '—'}
                        {e.supplierName ? ` · Supplier: ${e.supplierName}` : ''}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {e.changeQty > 0 ? `+${e.changeQty}` : `${e.changeQty}`}
                      {e.previousQty != null && e.newQty != null ? ` (${e.previousQty} → ${e.newQty})` : ''}
                    </div>
                  </div>
                  {e.note && (
                    <p className="text-xs text-muted-foreground mt-2">{e.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

