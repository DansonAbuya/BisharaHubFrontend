'use client'

/**
 * BiasharaHub Services: provider picks a service category, then offers online (virtual) or in-person (physical).
 * Virtual = online meeting or other means; Physical = customer books appointment then attends.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import { PageLoading } from '@/components/layout/page-loading'
import Link from 'next/link'
import {
  listServices,
  listServiceCategories,
  canOfferServices,
  createService,
  updateService,
  deleteService,
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  initiateServiceBookingPayment,
  uploadServiceMedia,
} from '@/lib/actions/services'
import type {
  ServiceOfferingDto,
  ServiceCategoryDto,
  ServiceAppointmentDto,
  OnlineDeliveryMethod,
} from '@/lib/api'
import { ONLINE_DELIVERY_METHOD_LABELS, ONLINE_DELIVERY_METHOD_DESCRIPTIONS } from '@/lib/api'
import { Wrench, Plus, Edit2, Trash2, Loader2, Monitor, MapPin, Calendar, ShieldCheck, Smartphone, Upload, Image, Video, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatPrice } from '@/lib/utils'

const DELIVERY_OPTIONS = [
  { value: 'VIRTUAL', label: 'Online / Virtual (e.g. online meeting)' },
  { value: 'PHYSICAL', label: 'In-person / Physical (customer books appointment then attends)' },
] as const

const ALL_ONLINE_DELIVERY_METHODS: OnlineDeliveryMethod[] = [
  'VIDEO_CALL',
  'PHONE_CALL',
  'WHATSAPP',
  'LIVE_CHAT',
  'EMAIL',
  'SCREEN_SHARE',
  'FILE_DELIVERY',
  'RECORDED_CONTENT',
  'SOCIAL_MEDIA',
]

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceOfferingDto[]>([])
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([])
  const [appointments, setAppointments] = useState<ServiceAppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceOfferingDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const [formName, setFormName] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDeliveryType, setFormDeliveryType] = useState<'VIRTUAL' | 'PHYSICAL'>('PHYSICAL')
  const [formOnlineDeliveryMethods, setFormOnlineDeliveryMethods] = useState<OnlineDeliveryMethod[]>([])
  const [formDurationMinutes, setFormDurationMinutes] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formGalleryUrls, setFormGalleryUrls] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const [bookService, setBookService] = useState<ServiceOfferingDto | null>(null)
  const [bookDate, setBookDate] = useState('')
  const [bookTime, setBookTime] = useState('')
  const [bookNotes, setBookNotes] = useState('')
  const [bookSubmitting, setBookSubmitting] = useState(false)

  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null)
  const [canOffer, setCanOffer] = useState<boolean | null>(null)

  const [payAppointment, setPayAppointment] = useState<ServiceAppointmentDto | null>(null)
  const [payPhone, setPayPhone] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)
  const [payInitiated, setPayInitiated] = useState(false)

  const canManage = user?.role === 'owner' || user?.role === 'staff'

  const loadCanOffer = async () => {
    if (!canManage) return
    try {
      const result = await canOfferServices()
      setCanOffer(result.canOffer)
    } catch {
      setCanOffer(false)
    }
  }

  const loadServices = async () => {
    try {
      setError(null)
      const params: { categoryId?: string; deliveryType?: 'VIRTUAL' | 'PHYSICAL' } = {}
      if (filterCategoryId) params.categoryId = filterCategoryId
      if (filterDeliveryType === 'VIRTUAL' || filterDeliveryType === 'PHYSICAL') params.deliveryType = filterDeliveryType
      const data = await listServices(params)
      setServices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await listServiceCategories()
      setCategories(data)
    } catch {
      setCategories([])
    }
  }

  const loadAppointments = async () => {
    if (!user) return
    try {
      const data = await listAppointments()
      setAppointments(data)
    } catch {
      setAppointments([])
    }
  }

  useEffect(() => {
    loadServices()
  }, [filterCategoryId, filterDeliveryType])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadCanOffer()
  }, [canManage])

  useEffect(() => {
    if (user) loadAppointments()
  }, [user])

  const resetForm = () => {
    setFormName('')
    setFormCategoryId('')
    setFormDescription('')
    setFormPrice('')
    setFormDeliveryType('PHYSICAL')
    setFormOnlineDeliveryMethods([])
    setFormDurationMinutes('')
    setFormIsActive(true)
    setFormImageUrl('')
    setFormVideoUrl('')
    setFormGalleryUrls('')
    setEditingService(null)
  }

  const openAdd = () => {
    resetForm()
    if (categories.length > 0) setFormCategoryId(categories[0].id)
    setIsDialogOpen(true)
  }

  const openEdit = (s: ServiceOfferingDto) => {
    setEditingService(s)
    setFormName(s.name)
    setFormCategoryId(s.categoryId ?? (categories[0]?.id ?? ''))
    setFormDescription(s.description ?? '')
    setFormPrice(String(s.price))
    setFormDeliveryType(s.deliveryType)
    setFormOnlineDeliveryMethods(
      s.onlineDeliveryMethods
        ? (s.onlineDeliveryMethods.split(',').map((m) => m.trim()).filter(Boolean) as OnlineDeliveryMethod[])
        : []
    )
    setFormDurationMinutes(s.durationMinutes != null ? String(s.durationMinutes) : '')
    setFormIsActive(s.isActive)
    setFormImageUrl(s.imageUrl ?? '')
    setFormVideoUrl(s.videoUrl ?? '')
    setFormGalleryUrls(s.galleryUrls ?? '')
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(formPrice)
    if (!formName.trim() || isNaN(price) || price < 0 || !formCategoryId) return
    setFormSubmitting(true)
    try {
      const onlineDeliveryMethods =
        formDeliveryType === 'VIRTUAL' && formOnlineDeliveryMethods.length > 0
          ? formOnlineDeliveryMethods.join(',')
          : undefined
      if (editingService) {
        const updated = await updateService(editingService.id, {
          name: formName.trim(),
          categoryId: formCategoryId,
          description: formDescription.trim() || undefined,
          price,
          deliveryType: formDeliveryType,
          onlineDeliveryMethods,
          durationMinutes: formDurationMinutes ? parseInt(formDurationMinutes, 10) : undefined,
          isActive: formIsActive,
          imageUrl: formImageUrl.trim() || undefined,
          videoUrl: formVideoUrl.trim() || undefined,
          galleryUrls: formGalleryUrls.trim() || undefined,
        })
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      } else {
        const created = await createService({
          name: formName.trim(),
          categoryId: formCategoryId,
          description: formDescription.trim() || undefined,
          price,
          deliveryType: formDeliveryType,
          onlineDeliveryMethods,
          durationMinutes: formDurationMinutes ? parseInt(formDurationMinutes, 10) : undefined,
          isActive: formIsActive,
          imageUrl: formImageUrl.trim() || undefined,
          videoUrl: formVideoUrl.trim() || undefined,
          galleryUrls: formGalleryUrls.trim() || undefined,
        })
        setServices((prev) => [created, ...prev])
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteService(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const openBookAppointment = (s: ServiceOfferingDto) => {
    setBookService(s)
    setBookDate('')
    setBookTime('')
    setBookNotes('')
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookService || !bookDate) return
    setBookSubmitting(true)
    try {
      const created = await createAppointment(bookService.id, {
        requestedDate: bookDate,
        requestedTime: bookTime || undefined,
        notes: bookNotes || undefined,
      })
      setAppointments((prev) => [created, ...prev])
      setBookService(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to book appointment')
    } finally {
      setBookSubmitting(false)
    }
  }

  const handleUpdateAppointmentStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') => {
    setUpdatingAppointmentId(id)
    try {
      const updated = await updateAppointmentStatus(id, status)
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setUpdatingAppointmentId(null)
    }
  }

  const openPayDialog = (a: ServiceAppointmentDto) => {
    setPayAppointment(a)
    setPayPhone('')
    setPayInitiated(false)
  }

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payAppointment || !payPhone.trim()) return
    setPaySubmitting(true)
    try {
      await initiateServiceBookingPayment(payAppointment.id, payPhone.trim())
      setPayInitiated(true)
      setTimeout(() => {
        setPayAppointment(null)
        loadAppointments()
      }, 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initiate payment')
    } finally {
      setPaySubmitting(false)
    }
  }

  const handleMediaUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void,
    append?: boolean
  ) => {
    const maxSizeMB = 20
    const warnSizeMB = 15
    const fileSizeMB = file.size / (1024 * 1024)
    
    if (fileSizeMB > maxSizeMB) {
      setError(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.`)
      return
    }
    
    if (fileSizeMB > warnSizeMB && file.type.startsWith('video/')) {
      const proceed = window.confirm(
        `This video is ${fileSizeMB.toFixed(1)}MB. For best results, we recommend videos under 15MB (about 30 sec - 1 min).\n\nContinue uploading?`
      )
      if (!proceed) return
    }
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadServiceMedia(formData)
      if (append) {
        setUrl((prev: string) => (prev ? `${prev}, ${result.url}` : result.url))
      } else {
        setUrl(result.url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-8">
      <PageHeader
        title="BiasharaHub Services"
        description="Pick a service category and offer it online (virtual) or in-person (physical). Physical services: customers book an appointment then attend."
        actions={
          canManage && canOffer === true ? (
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add service
            </Button>
          ) : null
        }
      />

      {/* Service provider onboarding: same verification as sellers */}
      {canManage && canOffer === false && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Only verified service providers can offer services.</span>
            <span className="block mt-1 text-sm">
              Complete business verification (same process as for sellers) to list your services. Submit your documents in Verification and wait for admin approval.
            </span>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/dashboard/verification">Go to Verification</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterCategoryId || 'all'} onValueChange={(v) => setFilterCategoryId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDeliveryType || 'all'} onValueChange={(v) => setFilterDeliveryType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Delivery type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DELIVERY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              {canManage
                ? 'No services yet. Add a service: choose a category, then offer it online or in-person.'
                : 'No services available to browse right now.'}
            </p>
            {canManage && canOffer === true && (
              <div className="flex justify-center">
                <Button onClick={openAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add service
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className={s.isActive ? '' : 'opacity-75'}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {s.deliveryType === 'VIRTUAL' ? (
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {s.category && <Badge variant="secondary" className="mr-1">{s.category}</Badge>}
                  <Badge variant="outline">{s.deliveryType === 'VIRTUAL' ? 'Online' : 'In-person'}</Badge>
                  {!s.isActive && (
                    <Badge variant="destructive" className="ml-1">Inactive</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                )}
                <p className="font-semibold">{formatPrice(s.price)}</p>
                {s.durationMinutes != null && s.durationMinutes > 0 && (
                  <p className="text-xs text-muted-foreground">Duration: {s.durationMinutes} min</p>
                )}
                {s.deliveryType === 'VIRTUAL' && s.onlineDeliveryMethods && (
                  <div className="flex flex-wrap gap-1">
                    {s.onlineDeliveryMethods.split(',').map((method) => (
                      <Badge key={method} variant="outline" className="text-xs">
                        {ONLINE_DELIVERY_METHOD_LABELS[method.trim() as OnlineDeliveryMethod] || method.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                {!canManage && s.deliveryType === 'PHYSICAL' && s.isActive && (
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => openBookAppointment(s)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Appointments section */}
      {user && appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {canManage ? 'Appointments (for your services)' : 'My appointments'}
            </CardTitle>
            <CardDescription>
              {canManage
                ? 'Confirm, complete, or cancel bookings.'
                : 'Your booked physical service appointments.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{a.serviceName}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.requestedDate}
                      {a.requestedTime ? ` at ${a.requestedTime}` : ''}
                      {canManage && ` · ${a.userName}`}
                    </p>
                    {(a.amount != null && a.amount > 0) && (
                      <p className="text-sm font-medium mt-0.5">{formatPrice(a.amount)}</p>
                    )}
                    {a.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant={a.status === 'COMPLETED' ? 'default' : a.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {a.status}
                      </Badge>
                      {a.paymentStatus === 'completed' && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>
                      )}
                    </div>
                  </div>
                  {!canManage && a.paymentStatus !== 'completed' && a.amount != null && a.amount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPayDialog(a)}
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      Pay with M-Pesa
                    </Button>
                  )}
                  {a.status === 'PENDING' && (
                    <div className="flex gap-1">
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingAppointmentId === a.id}
                            onClick={() => handleUpdateAppointmentStatus(a.id, 'CONFIRMED')}
                          >
                            {updatingAppointmentId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingAppointmentId === a.id}
                            onClick={() => handleUpdateAppointmentStatus(a.id, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={updatingAppointmentId === a.id}
                        onClick={() => handleUpdateAppointmentStatus(a.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {a.status === 'CONFIRMED' && canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingAppointmentId === a.id}
                      onClick={() => handleUpdateAppointmentStatus(a.id, 'COMPLETED')}
                    >
                      {updatingAppointmentId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark complete'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit service dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit service' : 'Add service'}</DialogTitle>
            <DialogDescription>
              Choose a service category, then whether to provide it online (virtual) or in-person (physical). Physical: customers book an appointment then attend.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Service category *</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId} required>
                <SelectTrigger>
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
              <Label htmlFor="name">Service name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. 1-on-1 Consultation, Equipment Repair"
                required
              />
            </div>
            <div>
              <Label>Delivery type *</Label>
              <Select value={formDeliveryType} onValueChange={(v) => setFormDeliveryType(v as 'VIRTUAL' | 'PHYSICAL')}>
                <SelectTrigger>
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
            {formDeliveryType === 'VIRTUAL' && (
              <div>
                <Label className="mb-2 block">How will you deliver this service? (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_ONLINE_DELIVERY_METHODS.map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                        formOnlineDeliveryMethods.includes(method)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formOnlineDeliveryMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormOnlineDeliveryMethods((prev) => [...prev, method])
                          } else {
                            setFormOnlineDeliveryMethods((prev) => prev.filter((m) => m !== method))
                          }
                        }}
                        className="shrink-0"
                      />
                      <span className="text-sm">{ONLINE_DELIVERY_METHOD_LABELS[method]}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Let customers know how you&apos;ll provide this service online.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes, optional)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formDurationMinutes}
                onChange={(e) => setFormDurationMinutes(e.target.value)}
                placeholder="e.g. 60"
              />
            </div>

            {/* Media section */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Showcase Your Service (optional)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Help customers understand your service with images and videos. Visual content increases bookings by up to 40%!
              </p>
              <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs">
                <p className="font-medium text-foreground mb-1">📹 Video Recommendations:</p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li><strong>Length:</strong> 30 seconds to 2 minutes (ideal for demos)</li>
                  <li><strong>Format:</strong> MP4 or WebM for best compatibility</li>
                  <li><strong>Size:</strong> Under 15MB recommended (max 20MB)</li>
                  <li><strong>Content:</strong> Show your work process, finished results, or customer testimonials</li>
                </ul>
              </div>
              <div className="space-y-4">
                {/* Main Image */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="size-4" /> Main Image
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleMediaUpload(file, setFormImageUrl, setUploadingImage)
                          e.target.value = ''
                        }}
                        disabled={uploadingImage}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingImage} asChild>
                        <span>
                          {uploadingImage ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        </span>
                      </Button>
                    </label>
                    {formImageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormImageUrl('')}>
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  {formImageUrl && (
                    <div className="mt-2">
                      <img src={formImageUrl} alt="Preview" className="max-h-24 rounded border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Main cover image for your service (recommended: 1200x800px or similar)</p>
                </div>

                {/* Video */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video className="size-4" /> Demo Video
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="videoUrl"
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      placeholder="Upload or paste YouTube/Vimeo URL"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleMediaUpload(file, setFormVideoUrl, setUploadingVideo)
                          e.target.value = ''
                        }}
                        disabled={uploadingVideo}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingVideo} asChild>
                        <span>
                          {uploadingVideo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        </span>
                      </Button>
                    </label>
                    {formVideoUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormVideoUrl('')}>
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Best: 30 sec - 1 min demo video. Upload MP4/WebM (max 20MB) or paste YouTube/Vimeo link.
                  </p>
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="size-4" /> Gallery Images
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="galleryUrls"
                      value={formGalleryUrls}
                      onChange={(e) => setFormGalleryUrls(e.target.value)}
                      placeholder="Add images to showcase your work"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleMediaUpload(file, (url) => setFormGalleryUrls(prev => prev ? `${prev}, ${url}` : url), setUploadingGallery)
                          e.target.value = ''
                        }}
                        disabled={uploadingGallery}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingGallery} asChild>
                        <span>
                          {uploadingGallery ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        </span>
                      </Button>
                    </label>
                    {formGalleryUrls && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormGalleryUrls('')}>
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  {formGalleryUrls && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formGalleryUrls.split(',').map((url, i) => (
                        <img key={i} src={url.trim()} alt={`Gallery ${i + 1}`} className="h-16 rounded border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add 3-5 images showing your work: before/after, process, or finished results
                  </p>
                </div>
              </div>
            </div>

            {editingService && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                <Label htmlFor="isActive">Active (visible to customers)</Label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting || !formName.trim() || !formCategoryId}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay for booking (M-Pesa) dialog */}
      <Dialog open={!!payAppointment} onOpenChange={(open) => { if (!open) { setPayAppointment(null); setPayInitiated(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay for booking</DialogTitle>
            <DialogDescription>
              {payAppointment?.serviceName} — {payAppointment != null && payAppointment.amount != null && formatPrice(payAppointment.amount)}. Enter your M-Pesa phone number to receive the STK push.
            </DialogDescription>
          </DialogHeader>
          {payInitiated ? (
            <p className="text-sm text-muted-foreground py-2">Complete the payment on your phone. This dialog will close shortly and the list will refresh.</p>
          ) : (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div>
                <Label htmlFor="payPhone">M-Pesa phone number *</Label>
                <Input
                  id="payPhone"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setPayAppointment(null); setPayInitiated(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={paySubmitting || !payPhone.trim()}>
                  {paySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send M-Pesa prompt
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Book appointment dialog */}
      <Dialog open={!!bookService} onOpenChange={(open) => { if (!open) setBookService(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book appointment</DialogTitle>
            <DialogDescription>
              {bookService?.name} — choose date and time, then attend in person.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <Label htmlFor="bookDate">Date *</Label>
              <Input
                id="bookDate"
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="bookTime">Time (optional)</Label>
              <Input
                id="bookTime"
                type="time"
                value={bookTime}
                onChange={(e) => setBookTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bookNotes">Notes</Label>
              <Input
                id="bookNotes"
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                placeholder="Any special requests"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBookService(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={bookSubmitting || !bookDate}>
                {bookSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Book
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
