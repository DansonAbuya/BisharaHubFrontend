'use client'

/**
 * Admin: list, add, edit, and toggle courier services. Used in shipment form when delivery mode is COURIER.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import {
  listAdminCourierServices,
  createCourierService,
  updateCourierService,
  deleteCourierService,
  type CourierServiceDto,
} from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react'

export default function AdminCourierServicesPage() {
  const { user } = useAuth()
  const [list, setList] = useState<CourierServiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const canAccess = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const load = async () => {
    if (!canAccess) return
    setLoading(true)
    setError(null)
    try {
      const data = await listAdminCourierServices()
      setList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load courier services. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canAccess])

  if (!canAccess) {
    return (
      <div>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">This page is only available to platform administrators.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Courier Services</h1>
          <p className="text-muted-foreground">
            Manage the list of courier providers. Sellers choose from active services when creating shipments with COURIER delivery mode.
          </p>
        </div>
        <CreateCourierDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(c) => { setList((prev) => [...prev, c]); setCreateOpen(false) }}
          onError={setError}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : list.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No courier services yet. Add one to enable COURIER delivery option in shipments.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <CourierRow
              key={c.courierId}
              courier={c}
              onUpdated={(updated) => setList((prev) => prev.map((x) => (x.courierId === updated.courierId ? updated : x)))}
              onDeleted={() => setList((prev) => prev.filter((x) => x.courierId !== c.courierId))}
              onError={setError}
              actingId={actingId}
              setActingId={setActingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateCourierDialog({
  open,
  onOpenChange,
  onCreated,
  onError,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (c: CourierServiceDto) => void
  onError: (s: string | null) => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState('')
  const [providerType, setProviderType] = useState('MANUAL')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [baseRate, setBaseRate] = useState('0')
  const [ratePerKg, setRatePerKg] = useState('0')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onError(null)
    setSaving(true)
    try {
      const created = await createCourierService({
        name: name.trim(),
        code: code.trim().toLowerCase(),
        description: description.trim() || undefined,
        trackingUrlTemplate: trackingUrlTemplate.trim() || undefined,
        providerType: providerType || 'MANUAL',
        apiBaseUrl: apiBaseUrl.trim() || undefined,
        isActive,
        baseRate: parseFloat(baseRate) || 0,
        ratePerKg: parseFloat(ratePerKg) || 0,
      })
      onCreated(created)
      setName('')
      setCode('')
      setDescription('')
      setTrackingUrlTemplate('')
      setProviderType('MANUAL')
      setApiBaseUrl('')
      setIsActive(true)
      setBaseRate('0')
      setRatePerKg('0')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong. Please check your entries and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add courier service
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add courier service</DialogTitle>
          <DialogDescription>
            Add a courier that sellers can use for deliveries. Choose &quot;Manual&quot; if sellers will enter tracking numbers themselves, or pick an integrated provider (e.g. DHL, FedEx) if your team has connected the API.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DHL Kenya"
              required
            />
          </div>
          <div>
            <Label htmlFor="create-code">Code (slug)</Label>
            <Input
              id="create-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. dhl-kenya"
              required
            />
          </div>
          <div>
            <Label htmlFor="create-desc">Description (optional)</Label>
            <Textarea
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="create-tracking">Tracking URL template (optional)</Label>
            <Input
              id="create-tracking"
              value={trackingUrlTemplate}
              onChange={(e) => setTrackingUrlTemplate(e.target.value)}
              placeholder="https://track.example.com/{trackingNumber}"
            />
          </div>
          <div>
            <Label htmlFor="create-provider">Provider type</Label>
            <select
              id="create-provider"
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="MANUAL">Manual (seller enters tracking)</option>
              <option value="REST">REST API (generic)</option>
              <option value="DHL">DHL</option>
              <option value="FEDEX">FedEx</option>
              <option value="SENDY">Sendy</option>
            </select>
          </div>
          {(providerType === 'REST' || providerType === 'DHL' || providerType === 'FEDEX' || providerType === 'SENDY') && (
            <div>
              <Label htmlFor="create-apiurl">API base URL</Label>
              <Input
                id="create-apiurl"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch id="create-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="create-active">Active (show in dropdown)</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-base">Base rate (KES)</Label>
              <Input
                id="create-base"
                type="number"
                min="0"
                step="0.01"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-rate">Rate per kg (KES)</Label>
              <Input
                id="create-rate"
                type="number"
                min="0"
                step="0.01"
                value={ratePerKg}
                onChange={(e) => setRatePerKg(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Spinner className="w-4 h-4 mr-2" /> Saving...</> : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CourierRow({
  courier,
  onUpdated,
  onDeleted,
  onError,
  actingId,
  setActingId,
}: {
  courier: CourierServiceDto
  onUpdated: (c: CourierServiceDto) => void
  onDeleted: () => void
  onError: (s: string | null) => void
  actingId: string | null
  setActingId: (id: string | null) => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(courier.name)
  const [description, setDescription] = useState(courier.description ?? '')
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState(courier.trackingUrlTemplate ?? '')
  const [providerType, setProviderType] = useState(courier.providerType ?? 'MANUAL')
  const [apiBaseUrl, setApiBaseUrl] = useState(courier.apiBaseUrl ?? '')
  const [isActive, setIsActive] = useState(courier.isActive)
  const [baseRate, setBaseRate] = useState(String(courier.baseRate ?? 0))
  const [ratePerKg, setRatePerKg] = useState(String(courier.ratePerKg ?? 0))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(courier.name)
    setDescription(courier.description ?? '')
    setTrackingUrlTemplate(courier.trackingUrlTemplate ?? '')
    setProviderType(courier.providerType ?? 'MANUAL')
    setApiBaseUrl(courier.apiBaseUrl ?? '')
    setIsActive(courier.isActive)
    setBaseRate(String(courier.baseRate ?? 0))
    setRatePerKg(String(courier.ratePerKg ?? 0))
  }, [courier])

  const handleToggleActive = async () => {
    setActingId(courier.courierId)
    onError(null)
    try {
      const updated = await updateCourierService(courier.courierId, { isActive: !courier.isActive })
      onUpdated(updated)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setActingId(null)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    onError(null)
    try {
      const updated = await updateCourierService(courier.courierId, {
        name: name.trim(),
        description: description.trim() || undefined,
        trackingUrlTemplate: trackingUrlTemplate.trim() || undefined,
        providerType: providerType || 'MANUAL',
        apiBaseUrl: apiBaseUrl.trim() || undefined,
        isActive,
        baseRate: parseFloat(baseRate) || 0,
        ratePerKg: parseFloat(ratePerKg) || 0,
      })
      onUpdated(updated)
      setEditOpen(false)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${courier.name}"? This cannot be undone.`)) return
    setActingId(courier.courierId)
    onError(null)
    try {
      await deleteCourierService(courier.courierId)
      onDeleted()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not delete. Please try again.')
    } finally {
      setActingId(null)
    }
  }

  const busy = actingId === courier.courierId

  return (
    <Card className="border-border">
      <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{courier.name}</span>
          <Badge variant="outline">{courier.code}</Badge>
          <Badge variant="outline" className="text-xs">{courier.providerType ?? 'MANUAL'}</Badge>
          {!courier.isActive && <Badge variant="secondary">Inactive</Badge>}
          <span className="text-sm text-muted-foreground">
            KES {Number(courier.baseRate)} + {Number(courier.ratePerKg)}/kg
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={courier.isActive}
            onCheckedChange={handleToggleActive}
            disabled={busy}
          />
          <span className="text-sm text-muted-foreground">Active</span>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Edit {courier.name}</DialogTitle>
                <DialogDescription>
                  Update the courier details below. The code cannot be changed once created.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Tracking URL template</Label>
                  <Input
                    value={trackingUrlTemplate}
                    onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                    placeholder="https://track.example.com/{trackingNumber}"
                  />
                </div>
                <div>
                  <Label>Provider type</Label>
                  <select
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="REST">REST API</option>
                    <option value="DHL">DHL</option>
                    <option value="FEDEX">FedEx</option>
                    <option value="SENDY">Sendy</option>
                  </select>
                </div>
                <div>
                  <Label>API base URL</Label>
                  <Input
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Base rate (KES)</Label>
                    <Input type="number" min="0" step="0.01" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Rate per kg (KES)</Label>
                    <Input type="number" min="0" step="0.01" value={ratePerKg} onChange={(e) => setRatePerKg(e.target.value)} />
                  </div>
                </div>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? <><Spinner className="w-4 h-4 mr-2" /> Saving...</> : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={busy}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
