'use client'

/**
 * Admin: list disputes (open, seller_responded, resolved), view details, resolve with optional strike.
 * Trust & Safety: late_shipping=1 strike, wrong_item=2, fraud=3; 3 strikes=suspension, 5=ban.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { listDisputes, resolveDispute, type DisputeDto } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  late_shipping: 'Late shipping',
  wrong_item: 'Wrong item',
  fraud: 'Fraud',
  other: 'Other',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  seller_responded: 'Seller responded',
  under_review: 'Under review',
  resolved: 'Resolved',
}

export default function AdminDisputesPage() {
  const { user } = useAuth()
  const [disputes, setDisputes] = useState<DisputeDto[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [resolveResolution, setResolveResolution] = useState<Record<string, string>>({})
  const [resolveStrike, setResolveStrike] = useState<Record<string, string>>({})

  const canAccess = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const load = async () => {
    if (!canAccess) return
    setLoading(true)
    setError(null)
    try {
      const list = await listDisputes(statusFilter)
      setDisputes(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canAccess, statusFilter])

  const handleResolve = async (id: string) => {
    const resolution = resolveResolution[id] || 'seller_favor'
    const strikeReason = resolveStrike[id] || undefined
    setActingId(id)
    setError(null)
    try {
      await resolveDispute(id, { resolution, strikeReason })
      setDisputes((prev) => prev.filter((d) => d.id !== id))
      setResolveResolution((prev) => ({ ...prev, [id]: '' }))
      setResolveStrike((prev) => ({ ...prev, [id]: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve')
    } finally {
      setActingId(null)
    }
  }

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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Disputes</h1>
        <p className="text-muted-foreground">
          Review and resolve customer disputes. Resolving in customer&apos;s favor can apply a strike to the seller (late shipping=1, wrong item=2, fraud=3). 3 strikes=suspension, 5=permanent ban.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="seller_responded">Seller responded</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : disputes.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No disputes with status &quot;{STATUS_LABELS[statusFilter] ?? statusFilter}&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <Card key={d.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">Order #{d.orderNumber}</CardTitle>
                  <Badge variant="outline">{DISPUTE_TYPE_LABELS[d.disputeType] ?? d.disputeType}</Badge>
                  <Badge>{STATUS_LABELS[d.status] ?? d.status}</Badge>
                </div>
                <CardDescription>
                  Reported by {d.reporterName ?? 'Customer'} • {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.description && <p className="text-sm text-foreground">{d.description}</p>}
                {d.deliveryProofUrl && (
                  <p className="text-xs text-muted-foreground">
                    Delivery proof: <a href={d.deliveryProofUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  </p>
                )}
                {d.sellerResponse && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <span className="font-medium">Seller response:</span> {d.sellerResponse}
                    {d.sellerRespondedAt && (
                      <span className="text-muted-foreground text-xs block mt-1">
                        {new Date(d.sellerRespondedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                {d.status !== 'resolved' && (
                  <div className="flex flex-wrap gap-2 items-end pt-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Resolution</label>
                      <Select
                        value={resolveResolution[d.id] ?? 'seller_favor'}
                        onValueChange={(v) => setResolveResolution((prev) => ({ ...prev, [d.id]: v }))}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer_favor">Customer favor</SelectItem>
                          <SelectItem value="seller_favor">Seller favor</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(resolveResolution[d.id] ?? 'seller_favor') === 'customer_favor' && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Strike reason (if at fault)</label>
                        <Select
                          value={resolveStrike[d.id] ?? ''}
                          onValueChange={(v) => setResolveStrike((prev) => ({ ...prev, [d.id]: v }))}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="late_shipping">Late shipping (1)</SelectItem>
                            <SelectItem value="wrong_item">Wrong item (2)</SelectItem>
                            <SelectItem value="fraud">Fraud (3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleResolve(d.id)}
                      disabled={actingId === d.id}
                    >
                      {actingId === d.id ? <><Spinner className="w-4 h-4 mr-2" /> Resolving...</> : 'Resolve'}
                    </Button>
                  </div>
                )}
                {d.status === 'resolved' && d.resolution && (
                  <p className="text-sm text-muted-foreground">
                    Resolved as <strong>{d.resolution}</strong>
                    {d.strikeReason && ` • Strike: ${d.strikeReason}`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
