'use client'

/**
 * Owner: two verification journeys.
 * 1) Business verification (sell products): tier, documents, admin approval.
 * 2) Service provider verification (offer services): category, delivery type, qualification docs, admin approval.
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
  getMyVerificationStatus,
  getMyVerificationDocuments,
  uploadVerificationDocument,
  uploadVerificationDocumentFile,
  getServiceProviderStatus,
  getServiceProviderDocuments,
  uploadServiceProviderDocumentFile,
  applyServiceProvider,
} from '@/lib/actions/verification'
import { listServiceCategories } from '@/lib/actions/services'
import type {
  OwnerVerificationDto,
  OwnerVerificationDocumentDto,
  ServiceProviderDocumentDto,
} from '@/lib/api'
import { PageLoading } from '@/components/layout/page-loading'
import {
  TIER_LABELS,
  DOC_TYPE_LABELS,
  DOC_TYPE_IDS,
  TIER_REQUIREMENTS_SUMMARY,
  hasRequiredDocsForTier,
  type TierId,
  type DocumentTypeId,
} from '@/lib/verification-tiers'
import { FileCheck, Loader2, Upload, ExternalLink, Package, Wrench, MapPin } from 'lucide-react'
import { LocationPicker } from '@/components/location-picker'
import { Textarea } from '@/components/ui/textarea'

type VerificationTab = 'products' | 'services'

const DELIVERY_OPTIONS: { value: 'ONLINE' | 'PHYSICAL' | 'BOTH'; label: string }[] = [
  { value: 'ONLINE', label: 'Online only' },
  { value: 'PHYSICAL', label: 'In-person only' },
  { value: 'BOTH', label: 'Both online and in-person' },
]

export default function VerificationPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<VerificationTab>('products')
  const [status, setStatus] = useState<OwnerVerificationDto | null>(null)
  const [documents, setDocuments] = useState<OwnerVerificationDocumentDto[]>([])
  const [spStatus, setSpStatus] = useState<OwnerVerificationDto | null>(null)
  const [spDocuments, setSpDocuments] = useState<ServiceProviderDocumentDto[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<DocumentTypeId>('national_id')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [spCategoryId, setSpCategoryId] = useState('')
  const [spDeliveryType, setSpDeliveryType] = useState<'ONLINE' | 'PHYSICAL' | 'BOTH'>('BOTH')
  const [spLocationLat, setSpLocationLat] = useState<number | undefined>(undefined)
  const [spLocationLng, setSpLocationLng] = useState<number | undefined>(undefined)
  const [spLocationDesc, setSpLocationDesc] = useState('')
  // Verification documents (ID, proof of identity)
  const [spVerifFile, setSpVerifFile] = useState<File | null>(null)
  const [spVerifUrl, setSpVerifUrl] = useState('')
  const [spVerifDocs, setSpVerifDocs] = useState<{ documentType: string; fileUrl: string }[]>([])
  // Qualification/expertise documents (certificates, licenses)
  const [spQualFile, setSpQualFile] = useState<File | null>(null)
  const [spQualUrl, setSpQualUrl] = useState('')
  const [spQualDocs, setSpQualDocs] = useState<{ documentType: string; fileUrl: string }[]>([])
  const [spSubmitting, setSpSubmitting] = useState(false)

  const needsLocation = spDeliveryType === 'PHYSICAL' || spDeliveryType === 'BOTH'

  const isOwner = user?.role === 'owner'

  // Determine what type of owner this is based on BOTH user context AND fetched status
  // User context has serviceProviderStatus, sellerTier, etc. from /me endpoint
  // Status objects come from verification endpoints
  // NOTE: verificationStatus defaults to 'pending' for all owners, so we can't use it alone to detect product sellers
  // We need sellerTier or applyingForTier to be set, OR verificationStatus to be 'verified' (meaning they completed product verification)
  const isSetUpForProducts = !!(
    user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified' ||
    status?.sellerTier || status?.applyingForTier || status?.verificationStatus === 'verified'
  )
  const isSetUpForServices = !!(
    user?.serviceProviderStatus ||
    spStatus?.serviceProviderStatus
  )
  
  // If only set up for services, only show services tab. If only products, only show products tab. If both or neither, show both.
  const showProductsTab = isSetUpForProducts || (!isSetUpForProducts && !isSetUpForServices)
  const showServicesTab = isSetUpForServices || (!isSetUpForProducts && !isSetUpForServices)

  const load = async () => {
    if (!isOwner) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [s, docs, spS, spDocs, cats] = await Promise.all([
        getMyVerificationStatus(),
        getMyVerificationDocuments(),
        getServiceProviderStatus(),
        getServiceProviderDocuments(),
        listServiceCategories(),
      ])
      setStatus(s ?? null)
      setDocuments(docs)
      setSpStatus(spS ?? null)
      setSpDocuments(spDocs)
      setCategories(cats)
      setSpCategoryId((prev) => (prev && cats.some((c) => c.id === prev) ? prev : cats[0]?.id ?? ''))
      
      // Auto-select the appropriate tab based on what the user is set up for
      // Check BOTH user context and fetched status
      // NOTE: verificationStatus defaults to 'pending' for all owners, so only count 'verified' as product setup
      const hasProductSetup = !!(
        user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified' ||
        s?.sellerTier || s?.applyingForTier || s?.verificationStatus === 'verified'
      )
      const hasServiceSetup = !!(user?.serviceProviderStatus || spS?.serviceProviderStatus)
      
      // If only set up for services, auto-select services tab
      if (hasServiceSetup && !hasProductSetup) {
        setTab('services')
      }
      // If only set up for products, auto-select products tab (already default)
      // If both or neither, keep default (products)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isOwner])

  // Immediately set tab based on user context (before data loads)
  useEffect(() => {
    // NOTE: verificationStatus defaults to 'pending' for all owners, so only count 'verified' as product setup
    const hasProductSetup = !!(user?.sellerTier || user?.applyingForTier || user?.verificationStatus === 'verified')
    const hasServiceSetup = !!(user?.serviceProviderStatus)
    if (hasServiceSetup && !hasProductSetup) {
      setTab('services')
    }
  }, [user])

  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

  const addVerificationDoc = async () => {
    if (!spVerifFile && !spVerifUrl.trim()) {
      setError('Upload a file or enter a document URL')
      return
    }
    setError(null)
    if (spVerifFile) {
      if (spVerifFile.size > MAX_FILE_SIZE_BYTES) {
        setError('File must be 20 MB or smaller')
        return
      }
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('documentType', 'verification')
        formData.append('file', spVerifFile)
        // Use service provider upload endpoint (not product seller)
        const doc = await uploadServiceProviderDocumentFile(formData)
        setSpVerifDocs((prev) => [...prev, { documentType: 'verification', fileUrl: doc.fileUrl }])
        setSpVerifFile(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        if (msg.includes('R2 disabled') || msg.includes('not configured')) {
          setError('File upload is currently unavailable. Please paste a document URL instead (e.g. Google Drive, Dropbox, or any public link).')
          setSpVerifFile(null)
        } else {
          setError(msg)
        }
      } finally {
        setUploading(false)
      }
      return
    }
    const url = spVerifUrl.trim()
    setSpVerifDocs((prev) => [...prev, { documentType: 'verification', fileUrl: url }])
    setSpVerifUrl('')
  }

  const removeVerificationDoc = (index: number) => {
    setSpVerifDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const addQualificationDoc = async () => {
    if (!spQualFile && !spQualUrl.trim()) {
      setError('Upload a file or enter a document URL')
      return
    }
    setError(null)
    if (spQualFile) {
      if (spQualFile.size > MAX_FILE_SIZE_BYTES) {
        setError('File must be 20 MB or smaller')
        return
      }
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('documentType', 'qualification')
        formData.append('file', spQualFile)
        // Use service provider upload endpoint (not product seller)
        const doc = await uploadServiceProviderDocumentFile(formData)
        setSpQualDocs((prev) => [...prev, { documentType: 'qualification', fileUrl: doc.fileUrl }])
        setSpQualFile(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        if (msg.includes('R2 disabled') || msg.includes('not configured')) {
          setError('File upload is currently unavailable. Please paste a document URL instead (e.g. Google Drive, Dropbox, or any public link).')
          setSpQualFile(null)
        } else {
          setError(msg)
        }
      } finally {
        setUploading(false)
      }
      return
    }
    const url = spQualUrl.trim()
    setSpQualDocs((prev) => [...prev, { documentType: 'qualification', fileUrl: url }])
    setSpQualUrl('')
  }

  const removeQualificationDoc = (index: number) => {
    setSpQualDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  const handleServiceProviderApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spCategoryId) {
      setError('Select a service category.')
      return
    }
    if (spVerifDocs.length === 0) {
      setError('Add at least one verification document (ID, proof of identity).')
      return
    }
    if (spQualDocs.length === 0) {
      setError('Add at least one qualification/expertise document (certificate, license, portfolio).')
      return
    }
    if (needsLocation) {
      if (spLocationLat === undefined || spLocationLng === undefined) {
        setError('Please select your service location on the map for in-person services.')
        return
      }
      if (!spLocationDesc.trim()) {
        setError('Please describe your service location (address, landmark, directions).')
        return
      }
    }
    setSpSubmitting(true)
    setError(null)
    try {
      const allDocuments = [...spVerifDocs, ...spQualDocs]
      await applyServiceProvider({
        serviceCategoryId: spCategoryId,
        serviceDeliveryType: spDeliveryType,
        locationLat: needsLocation ? spLocationLat : undefined,
        locationLng: needsLocation ? spLocationLng : undefined,
        locationDescription: needsLocation ? spLocationDesc.trim() : undefined,
        documents: allDocuments,
      })
      setSpVerifDocs([])
      setSpQualDocs([])
      setSpLocationLat(undefined)
      setSpLocationLng(undefined)
      setSpLocationDesc('')
      setSubmissionSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSpSubmitting(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return
    const urlTrimmed = uploadUrl.trim()
    if (uploadFile) {
      if (uploadFile.size > MAX_FILE_SIZE_BYTES) {
        setError('File must be 20 MB or smaller')
        return
      }
      setUploading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('documentType', uploadType)
        formData.append('file', uploadFile)
        await uploadVerificationDocumentFile(formData)
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Verification</h1>
        <p className="text-muted-foreground">
          {showProductsTab && showServicesTab
            ? 'Complete verification for what you want to do on the platform. You can sell products, offer services, or both — each has its own verification process.'
            : showServicesTab
              ? 'Complete your service provider verification to offer services on the platform.'
              : 'Complete your business verification to sell products on the platform.'}
        </p>
      </div>

      {/* Only show tabs if user is set up for both, or if we can't determine (show both as fallback) */}
      {(showProductsTab && showServicesTab) && (
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={tab === 'products' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('products')}
            className="gap-2"
          >
            <Package className="size-4" />
            Sell products
          </Button>
          <Button
            variant={tab === 'services' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('services')}
            className="gap-2"
          >
            <Wrench className="size-4" />
            Offer services
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <PageLoading message="Loading verification status…" minHeight="200px" />
      ) : submissionSuccess ? (
        /* ---------- Submission success screen ---------- */
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Thank you for submitting your verification details. Our team will review your documents and qualifications.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto mb-6">
              <p className="text-sm text-foreground font-medium mb-1">What happens next?</p>
              <p className="text-sm text-muted-foreground">
                You will receive an email notification within 1-3 business days informing you whether your application has been <span className="text-green-600 font-medium">approved</span> or <span className="text-red-600 font-medium">rejected</span>, along with instructions on how to proceed.
              </p>
            </div>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (tab === 'services' || (showServicesTab && !showProductsTab)) ? (
        /* ---------- Service provider verification ---------- */
        <>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Service provider status
              </CardTitle>
              <CardDescription>
                Add your service category and how you deliver (online, in-person, or both). Upload verification and qualification/expertise documents. After submitting here, add your service offerings in Dashboard → Services. An admin will verify your documents; once approved, your services are listed on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spStatus && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        spStatus.serviceProviderStatus === 'verified'
                          ? 'default'
                          : spStatus.serviceProviderStatus === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {spStatus.serviceProviderStatus === 'verified'
                        ? 'Verified'
                        : spStatus.serviceProviderStatus === 'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                    </Badge>
                    {spStatus.serviceDeliveryType && (
                      <Badge variant="outline">
                        {spStatus.serviceDeliveryType === 'ONLINE'
                          ? 'Online only'
                          : spStatus.serviceDeliveryType === 'PHYSICAL'
                            ? 'In-person only'
                            : 'Online & In-person'}
                      </Badge>
                    )}
                  </div>
                  {spStatus.serviceProviderNotes && (
                    <p className="text-sm text-muted-foreground">{spStatus.serviceProviderNotes}</p>
                  )}
                  {spStatus.serviceLocationDescription && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4" />
                        Service location
                      </p>
                      <p className="text-sm text-muted-foreground">{spStatus.serviceLocationDescription}</p>
                      {spStatus.serviceLocationLat && spStatus.serviceLocationLng && (
                        <a
                          href={`https://www.google.com/maps?q=${spStatus.serviceLocationLat},${spStatus.serviceLocationLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          View on Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show form if: status is pending (need to submit details), rejected (can resubmit), or no status yet. Hide only if verified. */}
          {spStatus?.serviceProviderStatus !== 'verified' && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {spStatus?.serviceProviderStatus === 'rejected' ? 'Resubmit verification' : 'Complete verification'}
                </CardTitle>
                <CardDescription>
                  Choose your service category and how you deliver (online, in-person, or both). Upload verification documents and qualification/expertise documents (e.g. certificates, licenses). Then add your service offerings in Dashboard → Services. An admin will verify and approve so your services are listed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleServiceProviderApply} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Service category</label>
                    <Select value={spCategoryId} onValueChange={setSpCategoryId} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">How do you offer services?</label>
                    <Select
                      value={spDeliveryType}
                      onValueChange={(v) => setSpDeliveryType(v as 'ONLINE' | 'PHYSICAL' | 'BOTH')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {needsLocation && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Service location
                        </label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Since you offer in-person services, please select your service location on the map. This helps customers find you.
                        </p>
                        <LocationPicker
                          lat={spLocationLat}
                          lng={spLocationLng}
                          onLocationChange={(lat, lng) => {
                            setSpLocationLat(lat)
                            setSpLocationLng(lng)
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Location description</label>
                        <p className="text-xs text-muted-foreground mb-1">
                          Describe your service location — include address, building name, floor, landmark, or directions to help customers find you.
                        </p>
                        <Textarea
                          placeholder="e.g. Westlands Business Centre, 3rd Floor, Room 305. Near Sarit Centre, opposite Total petrol station."
                          value={spLocationDesc}
                          onChange={(e) => setSpLocationDesc(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {/* Section 1: Verification Documents (ID, proof of identity) */}
                  <div className="pt-3 border-t border-border">
                    <label className="text-sm font-medium text-foreground">Verification documents (ID, proof of identity)</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload your National ID, Passport, or other government-issued ID for identity verification. You can upload a file directly or paste a URL.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setSpVerifFile(e.target.files?.[0] ?? null)}
                        className="text-sm text-foreground file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                      />
                      <input
                        type="url"
                        placeholder="Or paste document URL"
                        value={spVerifUrl}
                        onChange={(e) => setSpVerifUrl(e.target.value)}
                        className="flex-1 min-w-[180px] h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addVerificationDoc} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                    {spVerifDocs.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {spVerifDocs.map((d, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                              ID Document {i + 1}
                            </a>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removeVerificationDoc(i)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Section 2: Qualification/Expertise Documents */}
                  <div className="pt-3 border-t border-border">
                    <label className="text-sm font-medium text-foreground">Qualification / expertise documents</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload certificates, licenses, degrees, portfolio samples, or other documents proving your expertise. You can upload a file directly or paste a URL.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setSpQualFile(e.target.files?.[0] ?? null)}
                        className="text-sm text-foreground file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                      />
                      <input
                        type="url"
                        placeholder="Or paste document URL"
                        value={spQualUrl}
                        onChange={(e) => setSpQualUrl(e.target.value)}
                        className="flex-1 min-w-[180px] h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addQualificationDoc} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                    {spQualDocs.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {spQualDocs.map((d, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                              Qualification {i + 1}
                            </a>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removeQualificationDoc(i)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button type="submit" disabled={spSubmitting || spVerifDocs.length === 0 || spQualDocs.length === 0}>
                    {spSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit application'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {spDocuments.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">My uploaded documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verification documents */}
                {spDocuments.filter(d => d.documentType === 'verification').length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Verification documents (ID)</p>
                    <ul className="space-y-1">
                      {spDocuments.filter(d => d.documentType === 'verification').map((d) => (
                        <li key={d.documentId} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">ID Document</span>
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Qualification documents */}
                {spDocuments.filter(d => d.documentType !== 'verification').length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Qualification / expertise documents</p>
                    <ul className="space-y-1">
                      {spDocuments.filter(d => d.documentType !== 'verification').map((d) => (
                        <li key={d.documentId} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground capitalize">{d.documentType || 'Certificate'}</span>
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* ---------- Business (product seller) verification ---------- */
        <>
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-foreground">Product seller verification</h2>
            <p className="text-sm text-muted-foreground">
              Submit documents for your tier so an administrator can verify your business. Your shop will appear in the product shops list after verification.
            </p>
          </div>
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
                    <p className="text-xs text-muted-foreground mt-1">Image or PDF. Max 20 MB.</p>
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
