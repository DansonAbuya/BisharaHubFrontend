'use client'

/**
 * Public services: first show list of verified service providers (by business).
 * Click a provider to see their services. No sign-in required to browse.
 * Wrapped in Suspense so useSearchParams() does not break static prerender.
 * Includes map view for location-based search of physical service providers.
 */
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { listServices, listServiceCategories, listServiceProviders } from '@/lib/actions/services'
import { listBusinesses } from '@/lib/actions/products'
import type { ServiceOfferingDto, ServiceCategoryDto, ServiceProviderLocationDto, OnlineDeliveryMethod } from '@/lib/api'
import { ONLINE_DELIVERY_METHOD_LABELS } from '@/lib/api'
import type { BusinessDto } from '@/lib/api'
import { Wrench, Loader2, Globe, MapPin, Package, ArrowLeft, Store, Menu, List, Map as MapIcon } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { ServiceProviderMap } from '@/components/service-provider-map'

const DELIVERY_LABELS: Record<string, string> = {
  VIRTUAL: 'Online',
  PHYSICAL: 'In-person',
}

/** Group services by businessId; optionally resolve business names from listBusinesses. */
function groupByProvider(
  services: ServiceOfferingDto[],
  businesses: BusinessDto[]
): { businessId: string; name: string; count: number; categories: string[] }[] {
  const byId: Record<string, ServiceOfferingDto[]> = {}
  for (const s of services) {
    const id = s.businessId ?? 'unknown'
    if (!byId[id]) byId[id] = []
    byId[id].push(s)
  }
  const nameById = new Map(businesses.map((b) => [b.id, b.name]))
  return Object.entries(byId)
    .filter(([id]) => id !== 'unknown')
    .map(([businessId, list]) => {
      const name = nameById.get(businessId) ?? 'Service provider'
      const categories = [...new Set(list.map((s) => s.category).filter(Boolean))] as string[]
      return { businessId, name, count: list.length, categories }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function ServicesPageContent() {
  const searchParams = useSearchParams()
  const businessIdParam = searchParams.get('businessId')

  const [services, setServices] = useState<ServiceOfferingDto[]>([])
  const [businesses, setBusinesses] = useState<BusinessDto[]>([])
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderLocationDto[]>([])
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [loadingProviders, setLoadingProviders] = useState(false)

  useEffect(() => {
    let cancelled = false
    const params = businessIdParam ? { businessId: businessIdParam } : undefined
    Promise.all([
      listServices({ ...params, categoryId: categoryId ?? undefined }),
      listBusinesses(),
      listServiceCategories(),
    ])
      .then(([list, biz, cats]) => {
        if (!cancelled) {
          setServices(list)
          setBusinesses(biz)
          setCategories(cats)
        }
      })
      .catch(() => {
        if (!cancelled) setServices([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [businessIdParam, categoryId])

  // Load verified service providers for both list and map view (not just map)
  useEffect(() => {
    if (businessIdParam) return
    let cancelled = false
    setLoadingProviders(true)
    listServiceProviders({
      categoryId: categoryId ?? undefined,
      search: mapSearchQuery || undefined,
    })
      .then((list) => {
        if (!cancelled) {
          setServiceProviders(list)
          setSelectedProviderId(null)
        }
      })
      .catch(() => {
        if (!cancelled) setServiceProviders([])
      })
      .finally(() => {
        if (!cancelled) setLoadingProviders(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryId, mapSearchQuery, businessIdParam])

  const handleProviderClick = (provider: ServiceProviderLocationDto) => {
    setSelectedProviderId(provider.ownerId)
  }

  const handleMapSearchChange = (query: string) => {
    setMapSearchQuery(query)
  }

  const providers = useMemo(() => groupByProvider(services, businesses), [services, businesses])
  const servicesForProvider = useMemo(() => {
    if (!businessIdParam) return []
    return services
  }, [businessIdParam, services])

  const showProviderList = !businessIdParam

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 z-10 safe-area-pt bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo-favicon.png" alt="BiasharaHub" width={28} height={28} className="sm:w-8 sm:h-8" />
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-3 shrink-0">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
            <Link href="/shop" className="text-sm text-muted-foreground hover:text-foreground">Product shops</Link>
            <Link href="/services" className="text-sm font-medium text-primary">Services</Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,320px)] flex flex-col">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 pt-6">
                <Link href="/" className="text-base font-medium" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link href="/shop" className="text-base font-medium" onClick={() => setMenuOpen(false)}>Product shops</Link>
                <Link href="/services" className="text-base font-medium text-primary" onClick={() => setMenuOpen(false)}>Services</Link>
                <div className="border-t border-border pt-4 flex flex-col gap-2">
                  <Button className="w-full" asChild>
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {showProviderList ? (
          <>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                    <Wrench className="size-8 text-primary" />
                    Verified service providers
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    Choose a provider to see their services. All are verified for expertise and qualifications.
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30 shrink-0">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                  >
                    <List className="size-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="gap-2"
                  >
                    <MapIcon className="size-4" />
                    <span className="hidden sm:inline">Map</span>
                  </Button>
                </div>
              </div>
            </div>

            {viewMode === 'map' ? (
              <>
                {loadingProviders ? (
                  <div className="flex justify-center py-12 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading service providers…</span>
                  </div>
                ) : (
                  <ServiceProviderMap
                    providers={serviceProviders}
                    onProviderClick={handleProviderClick}
                    selectedProviderId={selectedProviderId}
                    onSearchChange={handleMapSearchChange}
                    searchQuery={mapSearchQuery}
                  />
                )}
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Search for service providers by location, name, or browse the map. Click a marker to see their details and services.
                </p>
              </>
            ) : (loading || loadingProviders) ? (
              <div className="flex justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : serviceProviders.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No verified service providers yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later or{' '}
                    <Link href="/" className="text-primary hover:underline">
                      go to home
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {serviceProviders.map((p) => (
                  <Link
                    key={p.ownerId}
                    href={`/services?businessId=${encodeURIComponent(p.ownerId)}`}
                    className="block"
                  >
                    <Card className="border-border overflow-hidden hover:border-primary/40 hover:bg-muted/20 transition-colors h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                            <Wrench className="size-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-foreground line-clamp-2">{p.businessName || p.name || 'Service Provider'}</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {p.serviceCategoryName && <span>{p.serviceCategoryName}</span>}
                              {p.serviceDeliveryType && (
                                <span className="ml-1">
                                  · {p.serviceDeliveryType === 'ONLINE' ? 'Online' : p.serviceDeliveryType === 'PHYSICAL' ? 'In-person' : 'Online & In-person'}
                                </span>
                              )}
                            </p>
                            {p.locationDescription && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="size-3" />
                                <span className="line-clamp-1">{p.locationDescription}</span>
                              </p>
                            )}
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2">
                              View services <Store className="size-4" />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/shop" className="inline-flex items-center gap-2">
                  <Package className="size-4" />
                  Browse product shops
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <Button variant="ghost" size="sm" className="gap-1 -ml-2" asChild>
                <Link href="/services" className="inline-flex items-center gap-1">
                  <ArrowLeft className="size-4" />
                  All service providers
                </Link>
              </Button>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={categoryId === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryId(null)}
                >
                  All
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    variant={categoryId === c.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryId(c.id)}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading services…</span>
              </div>
            ) : servicesForProvider.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No services from this provider.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/services">Back to providers</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servicesForProvider.map((s) => (
                  <Card key={s.id} className="border-border overflow-hidden hover:border-primary/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-semibold text-foreground line-clamp-2">{s.name}</h2>
                          <Badge variant="secondary" className="shrink-0">
                            {s.deliveryType === 'VIRTUAL' ? (
                              <Globe className="size-3 mr-0.5 inline" />
                            ) : (
                              <MapPin className="size-3 mr-0.5 inline" />
                            )}
                            {DELIVERY_LABELS[s.deliveryType] ?? s.deliveryType}
                          </Badge>
                        </div>
                        {s.category && (
                          <p className="text-xs text-muted-foreground mt-1">{s.category}</p>
                        )}
                        {s.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
                        )}
                        <p className="mt-2 font-medium text-foreground">{formatPrice(s.price)}</p>
                        {s.durationMinutes != null && s.durationMinutes > 0 && (
                          <p className="text-xs text-muted-foreground">~{s.durationMinutes} min</p>
                        )}
                        {s.deliveryType === 'VIRTUAL' && s.onlineDeliveryMethods && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.onlineDeliveryMethods.split(',').slice(0, 3).map((method) => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {ONLINE_DELIVERY_METHOD_LABELS[method.trim() as OnlineDeliveryMethod] || method.trim()}
                              </Badge>
                            ))}
                            {s.onlineDeliveryMethods.split(',').length > 3 && (
                              <Badge variant="outline" className="text-xs">+{s.onlineDeliveryMethods.split(',').length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="px-4 pb-4">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={s.businessId ? `/shop?businessId=${encodeURIComponent(s.businessId)}&services=1` : '#'}>
                            View & book
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/services" className="inline-flex items-center gap-2">
                  <Wrench className="size-4" />
                  All service providers
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function ServicesPageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 z-10 safe-area-pt bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-foreground text-sm sm:text-base">BiasharaHub</span>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-center">
        <div className="flex gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </main>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesPageFallback />}>
      <ServicesPageContent />
    </Suspense>
  )
}
