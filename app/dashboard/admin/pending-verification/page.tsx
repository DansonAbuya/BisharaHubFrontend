'use client'

/**
 * Admin: list owners pending verification, view their documents, approve/reject with seller tier.
 * Each tier has different required documents; admin sees what the owner uploaded before verifying.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  listPendingOwners,
  getOwnerDocuments,
  setOwnerVerification,
  type OwnerVerificationDto,
  type OwnerVerificationDocumentDto,
} from '@/lib/api'
import {
  TIER_LABELS,
  DOC_TYPE_LABELS,
  hasRequiredDocsForTier,
  TIER_REQUIREMENTS_SUMMARY,
  type TierId,
} from '@/lib/verification-tiers'
import { ShieldCheck, ShieldX, Loader2, FileCheck, FileText, ExternalLink } from 'lucide-react'

const TIER_OPTIONS: { value: TierId; label: string }[] = [
  { value: 'tier1', label: TIER_LABELS.tier1 },
  { value: 'tier2', label: TIER_LABELS.tier2 },
  { value: 'tier3', label: TIER_LABELS.tier3 },
]

export default function PendingVerificationPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState<OwnerVerificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [selectedTier, setSelectedTier] = useState<Record<string, TierId>>({})
  const [ownerDocs, setOwnerDocs] = useState<Record<string, OwnerVerificationDocumentDto[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const canAccess = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const load = async () => {
    if (!canAccess) return
    setLoading(true)
    setError(null)
    try {
      const list = await listPendingOwners()
      setPending(list)
      const docsMap: Record<string, OwnerVerificationDocumentDto[]> = {}
      await Promise.all(
        list.map(async (o) => {
          try {
            const docs = await getOwnerDocuments(o.id)
            docsMap[o.id] = docs
          } catch {
            docsMap[o.id] = []
          }
        })
      )
      setOwnerDocs(docsMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending businesses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canAccess])

  const handleVerify = async (ownerId: string) => {
    const tier = selectedTier[ownerId] || 'tier1'
    setActingId(ownerId)
    setError(null)
    try {
      await setOwnerVerification(ownerId, {
        status: 'verified',
        sellerTier: tier,
        notes: notes[ownerId]?.trim() || undefined,
      })
      setPending((prev) => prev.filter((o) => o.id !== ownerId))
      setNotes((prev) => ({ ...prev, [ownerId]: '' }))
      setSelectedTier((prev) => ({ ...prev, [ownerId]: undefined }))
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
      await setOwnerVerification(ownerId, {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Verify Business</h1>
        <p className="text-muted-foreground">
          Businesses are onboarded by admin (Onboard Business). Once the business admin has submitted verification documents, approve or reject them here and assign a seller tier so their shop appears on the platform.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Pending verification
          </CardTitle>
          <CardDescription>
            Sellers are grouped by tier on the home and shop pages: Informal (Tier 1), Registered SME (Tier 2), Corporate (Tier 3). Choose the tier when you verify.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No businesses pending verification.</p>
          ) : (
            <ul className="space-y-4">
              {pending.map((owner) => {
                const docs = ownerDocs[owner.id] ?? []
                const uploadedTypes = [...new Set(docs.map((d) => d.documentType))]
                const tierCheck = (t: TierId) => hasRequiredDocsForTier(uploadedTypes, t)
                const t1 = tierCheck('tier1')
                const t2 = tierCheck('tier2')
                const t3 = tierCheck('tier3')
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
                        {owner.applyingForTier && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Applying for: {TIER_LABELS[owner.applyingForTier as TierId] ?? owner.applyingForTier}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Select
                          value={selectedTier[owner.id] ?? 'tier1'}
                          onValueChange={(v) => setSelectedTier((prev) => ({ ...prev, [owner.id]: v as TierId }))}
                        >
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIER_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={notes[owner.id] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [owner.id]: e.target.value }))}
                          className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm w-full sm:w-40"
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
                            Verify
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
                        <p className="font-medium text-foreground">Uploaded documents</p>
                        {docs.length === 0 ? (
                          <p className="text-muted-foreground">No documents uploaded yet.</p>
                        ) : (
                          <ul className="space-y-1">
                            {docs.map((d) => (
                              <li key={d.documentId} className="flex items-center gap-2">
                                <span>{DOC_TYPE_LABELS[d.documentType as keyof typeof DOC_TYPE_LABELS] ?? d.documentType}</span>
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
                        <p className="font-medium text-foreground mt-2">Documents required per tier</p>
                        <ul className="text-muted-foreground space-y-0.5">
                          <li>Tier 1: {t1.satisfied ? '✓ Has required docs' : `Missing: ${t1.missing.join(', ')}`}</li>
                          <li>Tier 2: {t2.satisfied ? '✓ Has required docs' : `Missing: ${t2.missing.join(', ')}`}</li>
                          <li>Tier 3: {t3.satisfied ? '✓ Has required docs' : `Missing: ${t3.missing.join(', ')}`}</li>
                        </ul>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Documents required per tier</CardTitle>
          <CardDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li><strong>{TIER_LABELS.tier1}:</strong> {TIER_REQUIREMENTS_SUMMARY.tier1}</li>
              <li><strong>{TIER_LABELS.tier2}:</strong> {TIER_REQUIREMENTS_SUMMARY.tier2}</li>
              <li><strong>{TIER_LABELS.tier3}:</strong> {TIER_REQUIREMENTS_SUMMARY.tier3}</li>
            </ul>
            Expand each business to see their uploaded documents and whether they meet the requirements for each tier. Only verified businesses appear as shops; their tier determines how they are grouped on the platform.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
