'use client'

/**
 * Owner: verification status, required documents per tier, and upload verification documents.
 * Requirements differ by tier: Tier 1 (ID/passport), Tier 2 (business reg + location), Tier 3 (KRA PIN + compliance).
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getMyVerificationStatus,
  getMyVerificationDocuments,
  uploadVerificationDocument,
  uploadVerificationDocumentFile,
  type OwnerVerificationDto,
  type OwnerVerificationDocumentDto,
} from '@/lib/api'
import {
  TIER_LABELS,
  DOC_TYPE_LABELS,
  DOC_TYPE_IDS,
  TIER_REQUIREMENTS_SUMMARY,
  hasRequiredDocsForTier,
  type TierId,
  type DocumentTypeId,
} from '@/lib/verification-tiers'
import { FileCheck, Loader2, Upload, ExternalLink } from 'lucide-react'

export default function VerificationPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<OwnerVerificationDto | null>(null)
  const [documents, setDocuments] = useState<OwnerVerificationDocumentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<DocumentTypeId>('national_id')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const isOwner = user?.role === 'owner'

  const load = async () => {
    if (!isOwner) return
    setLoading(true)
    setError(null)
    try {
      const [s, docs] = await Promise.all([
        getMyVerificationStatus(),
        getMyVerificationDocuments(),
      ])
      setStatus(s ?? null)
      setDocuments(docs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isOwner])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return
    const urlTrimmed = uploadUrl.trim()
    if (uploadFile) {
      setUploading(true)
      setError(null)
      try {
        await uploadVerificationDocumentFile(uploadType, uploadFile)
        setUploadFile(null)
        setUploadUrl('')
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload document')
      } finally {
        setUploading(false)
      }
      return
    }
    if (!urlTrimmed) {
      setError('Upload a file or paste a document URL')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadVerificationDocument(uploadType, urlTrimmed)
      setUploadUrl('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setUploading(false)
    }
  }

  if (!isOwner) {
    return (
      <div>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <p className="text-foreground font-medium">Verification is only for business owners.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const uploadedTypes = [...new Set(documents.map((d) => d.documentType))]
  const applyingTier = (status?.applyingForTier as TierId) || null

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Business verification</h1>
        <p className="text-muted-foreground">
          Submit the documents required for your tier so an administrator can verify your business. Your shop will appear on the platform after verification.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {status && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      status.verificationStatus === 'verified'
                        ? 'default'
                        : status.verificationStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {status.verificationStatus === 'verified'
                      ? 'Verified'
                      : status.verificationStatus === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                  </Badge>
                  {applyingTier && (
                    <span className="text-sm text-muted-foreground">
                      Applying for: {TIER_LABELS[applyingTier]}
                    </span>
                  )}
                </div>
                {status.verificationNotes && (
                  <p className="text-sm text-muted-foreground mt-2">{status.verificationNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Documents required by tier</CardTitle>
              <CardDescription>
                Submit documents for the tier you are applying for. Admin will verify and assign your tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['tier1', 'tier2', 'tier3'] as TierId[]).map((tier) => {
                const check = hasRequiredDocsForTier(uploadedTypes, tier)
                return (
                  <div key={tier} className="rounded-lg border border-border p-3">
                    <p className="font-medium text-foreground">{TIER_LABELS[tier]}</p>
                    <p className="text-sm text-muted-foreground">{TIER_REQUIREMENTS_SUMMARY[tier]}</p>
                    <p className="text-xs mt-1">
                      {check.satisfied ? (
                        <span className="text-green-600 dark:text-green-400">You have uploaded the required documents for this tier.</span>
                      ) : (
                        <span className="text-muted-foreground">Missing: {check.missing.join(', ')}</span>
                      )}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">My documents</CardTitle>
              <CardDescription>Uploaded verification documents. Admin will review them.</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((d) => (
                    <li key={d.documentId} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                      <span>{DOC_TYPE_LABELS[d.documentType as DocumentTypeId] ?? d.documentType}</span>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {status?.verificationStatus === 'pending' && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload document
                </CardTitle>
                <CardDescription>
                  Choose document type and either upload a file or paste a URL to the document.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Document type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as DocumentTypeId)}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    >
                      {DOC_TYPE_IDS.map((id) => (
                        <option key={id} value={id}>
                          {DOC_TYPE_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">File (optional if URL provided)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full text-sm text-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Or document URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </div>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Submit document'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
