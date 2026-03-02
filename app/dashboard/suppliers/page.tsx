'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoading } from '@/components/layout/page-loading'
import { useToast } from '@/hooks/use-toast'
import { listSuppliers, createSupplier, deleteSupplier } from '@/lib/actions/suppliers'
import type { SupplierDto } from '@/lib/api'
import { Factory, Plus, Trash2, Loader2 } from 'lucide-react'

export default function SuppliersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listSuppliers()
      setSuppliers(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((s) =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.phone ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createSupplier({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined })
      toast({ title: 'Supplier created', description: 'You can now use it in receiving.' })
      setOpen(false)
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteSupplier(id)
      toast({ title: 'Supplier deleted' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Factory className="w-6 h-6 text-primary" />
            Suppliers
          </h1>
          <p className="text-sm text-muted-foreground">
            Track where inventory comes from to reduce mismanagement and improve accountability.
          </p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add supplier
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-foreground">Your suppliers</CardTitle>
          <CardDescription>Used in receiving to record what was delivered and received</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />

          {loading ? (
            <PageLoading message="Loading suppliers…" minHeight="160px" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No suppliers yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg bg-card/60">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.phone ? s.phone : '—'}{s.email ? ` · ${s.email}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive gap-1"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                  >
                    {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add supplier</DialogTitle>
            <DialogDescription>Suppliers help you trace inventory sources.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-10" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone (optional)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email (optional)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

