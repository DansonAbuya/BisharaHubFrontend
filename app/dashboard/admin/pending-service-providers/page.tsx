'use client'

/**
 * Admin: list owners pending service provider verification, view qualification documents, approve/reject.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  listPendingServiceProviders,
  getServiceProviderDocumentsForOwner,
  setServiceProviderVerification,
} from '@/lib/actions/admin'
import type { OwnerVerificationDto, ServiceProviderDocumentDto } from '@/lib/api'
import { PageLoading } from '@/components/layout/page-loading'
import { ShieldCheck, ShieldX, Loader2, FileText, ExternalLink, Wrench } from 'lucide-react'

const DELIVERY_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  PHYSICAL: 'In-person',
  BOTH: 'Both',
}

export default function PendingServiceProvidersPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState<OwnerVerificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ownerDocs, setOwnerDocs] = useState<Record<string, ServiceProviderDocumentDto[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const canAccess = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const load = async () => {
    if (!canAccess) return
    setLoading(true)
    setError(null)
    try {
      const list = await listPendingServiceProviders()
      setPending(list)
      const docsMap: Record<string, ServiceProviderDocumentDto[]> = {}
      await Promise.all(
        list.map(async (o) => {
          try {
            const docs = await getServiceProviderDocumentsForOwner(o.id)
            docsMap[o.id] = docs
          } catch {
            docsMap[o.id] = []
          }
        })
      )
      setOwnerDocs(docsMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending service providers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canAccess])

  const handleVerify = async (ownerId: string) => {
    setActingId(ownerId)
    setError(null)
    try {
      await setServiceProviderVerification(ownerId, {
        status: 'verified',
        notes: notes[ownerId]?.trim() || undefined,
      })
      setPending((prev) => prev.filter((o) => o.id !== ownerId))
      setNotes((prev) => ({ ...prev, [ownerId]: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (ownerId: string) => {
    setActingId(ownerId)
    setError(null)
    try {
      await setServiceProviderVerification(ownerId, {
        status: 'rejected',
        notes: notes[ownerId]?.trim() || undefined,
      })
      setPending((prev) => prev.filter((o) => o.id !== ownerId))
      setNotes((prev) => ({ ...prev, [ownerId]: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject')
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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Wrench className="w-8 h-8 text-primary" />
          Verify Service Providers
        </h1>
        <p className="text-muted-foreground">
          Owners who applied to offer services appear here. Review their qualification documents, then approve or reject. Verified service providers can list services on the platform.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pending service provider applications
          </CardTitle>
          <CardDescription>
            Each applicant has chosen a service category and delivery type (online, in-person, or both) and uploaded qualification documents. Expand to view documents before verifying or rejecting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <PageLoading message="Loading pending applications…" minHeight="160px" />
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No service provider applications pending.</p>
          ) : (
            <ul className="space-y-4">
              {pending.map((owner) => {
                const docs = ownerDocs[owner.id] ?? []
                const isExpanded = expandedId === owner.id
                return (
                  <li
                    key={owner.id}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{owner.name}</p>
                        <p className="text-sm text-muted-foreground">{owner.email}</p>
                        {owner.businessName && (
                          <p className="text-sm text-muted-foreground">Business: {owner.businessName}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {owner.serviceDeliveryType && (
                            <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                              Delivery: {DELIVERY_LABELS[owner.serviceDeliveryType] ?? owner.serviceDeliveryType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={notes[owner.id] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [owner.id]: e.target.value }))}
                          className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm w-full sm:w-48"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => setExpandedId(isExpanded ? null : owner.id)}
                          >
                            <FileText className="w-4 h-4" />
                            {docs.length} doc{docs.length !== 1 ? 's' : ''}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground gap-1"
                            disabled={!!actingId}
                            onClick={() => handleVerify(owner.id)}
                          >
                            {actingId === owner.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={!!actingId}
                            onClick={() => handleReject(owner.id)}
                          >
                            {actingId === owner.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShieldX className="w-4 h-4" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm space-y-2">
                        <p className="font-medium text-foreground">Qualification documents</p>
                        {docs.length === 0 ? (
                          <p className="text-muted-foreground">No documents uploaded.</p>
                        ) : (
                          <ul className="space-y-1">
                            {docs.map((d) => (
                              <li key={d.documentId} className="flex items-center gap-2">
                                <span>{d.documentType}</span>
                                <a
                                  href={d.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
