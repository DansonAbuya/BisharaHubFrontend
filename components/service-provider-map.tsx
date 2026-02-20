'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Loader2, LocateFixed, Search, X, Wrench, Globe, Phone, Mail } from 'lucide-react'
import type { ServiceProviderLocationDto } from '@/lib/api'
import Link from 'next/link'

interface ServiceProviderMapProps {
  providers: ServiceProviderLocationDto[]
  onProviderClick?: (provider: ServiceProviderLocationDto) => void
  selectedProviderId?: string | null
  onSearchChange?: (query: string) => void
  searchQuery?: string
}

interface MapComponentProps {
  providers: ServiceProviderLocationDto[]
  selectedProviderId?: string | null
  onProviderClick?: (provider: ServiceProviderLocationDto) => void
  centerLat: number
  centerLng: number
  zoom: number
}

function MapComponentInner({
  providers,
  selectedProviderId,
  onProviderClick,
  centerLat,
  centerLng,
  zoom,
}: MapComponentProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null)
  const markersRef = useRef<Map<string, ReturnType<typeof import('leaflet').marker>>>(new Map())

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  useEffect(() => {
    if (!L) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      document.head.appendChild(link)
    }

    const mapContainer = document.getElementById('service-provider-map')
    if (!mapContainer || mapRef.current) return

    const map = L.map(mapContainer).setView([centerLat, centerLng], zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [L, centerLat, centerLng, zoom])

  useEffect(() => {
    if (!L || !mapRef.current) return

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const selectedIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    providers.forEach((provider) => {
      if (provider.locationLat == null || provider.locationLng == null) return

      const isSelected = selectedProviderId === provider.ownerId
      const icon = isSelected ? selectedIcon : customIcon

      const marker = L.marker([provider.locationLat, provider.locationLng], { icon }).addTo(mapRef.current!)

      const popupContent = `
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${provider.businessName || provider.name}</strong>
          ${provider.serviceCategoryName ? `<br><span style="color: #666; font-size: 12px;">${provider.serviceCategoryName}</span>` : ''}
          <br><span style="color: #666; font-size: 12px;">${provider.serviceCount} service${provider.serviceCount !== 1 ? 's' : ''}</span>
          ${provider.locationDescription ? `<br><span style="color: #888; font-size: 11px;">${provider.locationDescription}</span>` : ''}
        </div>
      `

      marker.bindPopup(popupContent)

      marker.on('click', () => {
        if (onProviderClick) {
          onProviderClick(provider)
        }
      })

      markersRef.current.set(provider.ownerId, marker)
    })

    if (providers.length > 0) {
      const bounds = L.latLngBounds(
        providers
          .filter((p) => p.locationLat != null && p.locationLng != null)
          .map((p) => [p.locationLat, p.locationLng] as [number, number])
      )
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      }
    }
  }, [L, providers, selectedProviderId, onProviderClick])

  useEffect(() => {
    if (!L || !mapRef.current || !selectedProviderId) return

    const marker = markersRef.current.get(selectedProviderId)
    if (marker) {
      const latlng = marker.getLatLng()
      mapRef.current.setView(latlng, 15)
      marker.openPopup()
    }
  }, [L, selectedProviderId])

  if (!L) {
    return (
      <div className="h-[400px] w-full rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <div id="service-provider-map" className="h-[400px] w-full rounded-lg border border-border" />
}

const MapComponent = dynamic(() => Promise.resolve(MapComponentInner), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg border border-border bg-muted/30 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

export function ServiceProviderMap({
  providers,
  onProviderClick,
  selectedProviderId,
  onSearchChange,
  searchQuery = '',
}: ServiceProviderMapProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [centerLat, setCenterLat] = useState(-1.2921) // Default to Nairobi
  const [centerLng, setCenterLng] = useState(36.8219)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCenterLat(latitude)
        setCenterLng(longitude)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location access.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please try again.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('Failed to get your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(localSearch)
    }
  }

  const handleClearSearch = () => {
    setLocalSearch('')
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  const selectedProvider = providers.find((p) => p.ownerId === selectedProviderId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, location..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="gap-2 shrink-0"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4" />
              Near me
            </>
          )}
        </Button>
      </div>

      {locationError && <p className="text-sm text-destructive">{locationError}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapComponent
            providers={providers}
            selectedProviderId={selectedProviderId}
            onProviderClick={onProviderClick}
            centerLat={centerLat}
            centerLng={centerLng}
            zoom={12}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {providers.length} service provider{providers.length !== 1 ? 's' : ''} found
            {searchQuery ? ` matching "${searchQuery}"` : ''}.
            Click on a marker to view details.
          </p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {selectedProvider && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Wrench className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{selectedProvider.businessName || selectedProvider.name}</h3>
                    {selectedProvider.serviceCategoryName && (
                      <p className="text-sm text-muted-foreground">{selectedProvider.serviceCategoryName}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedProvider.serviceDeliveryType === 'BOTH' ? (
                          <>
                            <Globe className="size-3 mr-1" />
                            Online & In-person
                          </>
                        ) : (
                          <>
                            <MapPin className="size-3 mr-1" />
                            In-person
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedProvider.serviceCount} service{selectedProvider.serviceCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {selectedProvider.locationDescription && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                        <MapPin className="size-4 shrink-0 mt-0.5" />
                        {selectedProvider.locationDescription}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      {selectedProvider.phone && (
                        <a href={`tel:${selectedProvider.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="size-3" />
                          {selectedProvider.phone}
                        </a>
                      )}
                      {selectedProvider.email && (
                        <a href={`mailto:${selectedProvider.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="size-3" />
                          Contact
                        </a>
                      )}
                    </div>
                    <Button size="sm" className="w-full mt-3" asChild>
                      <Link href={`/services?businessId=${selectedProvider.businessId}`}>
                        View services
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {providers.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No service providers found in this area.</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or location.</p>
              </CardContent>
            </Card>
          )}

          {providers.length > 0 && !selectedProvider && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Select a provider on the map or from the list:</p>
              {providers.slice(0, 5).map((provider) => (
                <Card
                  key={provider.ownerId}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onProviderClick?.(provider)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="size-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{provider.businessName || provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.serviceCategoryName || 'Service provider'} · {provider.serviceCount} service{provider.serviceCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {providers.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{providers.length - 5} more provider{providers.length - 5 !== 1 ? 's' : ''} on the map
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
