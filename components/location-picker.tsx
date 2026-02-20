'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, LocateFixed } from 'lucide-react'

interface LocationPickerProps {
  lat?: number
  lng?: number
  onLocationChange: (lat: number, lng: number) => void
  disabled?: boolean
}

interface MapComponentProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
  disabled?: boolean
}

function MapComponentInner({ lat, lng, onLocationChange, disabled }: MapComponentProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null)
  const [cssLoaded, setCssLoaded] = useState(false)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const mapIdRef = useRef(`location-picker-map-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  useEffect(() => {
    if (cssLoaded) return
    const existingLink = document.querySelector('link[href*="leaflet.css"]')
    if (existingLink) {
      setCssLoaded(true)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    link.onload = () => setCssLoaded(true)
    document.head.appendChild(link)
  }, [cssLoaded])

  useEffect(() => {
    if (!L || !cssLoaded) return

    const mapContainer = document.getElementById(mapIdRef.current)
    if (!mapContainer) return

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom())
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      }
      return
    }

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const map = L.map(mapContainer).setView([lat, lng], 13)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker([lat, lng], { icon: customIcon, draggable: !disabled }).addTo(map)
    markerRef.current = marker

    if (!disabled) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })

      map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        onLocationChange(e.latlng.lat, e.latlng.lng)
      })
    }

    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [L, cssLoaded, lat, lng, onLocationChange, disabled])

  if (!L || !cssLoaded) {
    return (
      <div className="h-[300px] w-full rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <div id={mapIdRef.current} className="h-[300px] w-full rounded-lg border border-border" style={{ zIndex: 0 }} />
}

const MapComponent = dynamic(() => Promise.resolve(MapComponentInner), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-lg border border-border bg-muted/30 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

export function LocationPicker({ lat, lng, onLocationChange, disabled }: LocationPickerProps) {
  const [currentLat, setCurrentLat] = useState(lat ?? -1.2921)
  const [currentLng, setCurrentLng] = useState(lng ?? 36.8219)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleLocationChange = useCallback(
    (newLat: number, newLng: number) => {
      setCurrentLat(newLat)
      setCurrentLng(newLng)
      onLocationChange(newLat, newLng)
    },
    [onLocationChange]
  )

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
        handleLocationChange(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location access in your browser settings.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please try again.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.')
            break
          default:
            setLocationError('Failed to get your location. Please select manually on the map.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
          </span>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="gap-2"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <LocateFixed className="w-4 h-4" />
                Use my location
              </>
            )}
          </Button>
        )}
      </div>

      {locationError && <p className="text-sm text-destructive">{locationError}</p>}

      <MapComponent lat={currentLat} lng={currentLng} onLocationChange={handleLocationChange} disabled={disabled} />

      {!disabled && (
        <p className="text-xs text-muted-foreground">
          Click on the map or drag the marker to set your service location. You can also use the &quot;Use my
          location&quot; button to automatically detect your current location.
        </p>
      )}
    </div>
  )
}
