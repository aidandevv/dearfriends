'use client'

import { useEffect, useRef, useState } from 'react'
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet'
import { geocodeContacts, type GeocodedContact } from '@/lib/geocode'

type ContactMapProps = {
  contacts: Array<{
    id: string
    first_name: string
    city: string | null
    state: string | null
    lat?: number | null
    lng?: number | null
  }>
  interactive: boolean
  heightClassName?: string
}

const DEFAULT_CENTER: [number, number] = [39.8, -98.6]
const DEFAULT_ZOOM = 3

export function ContactMap({ contacts, interactive, heightClassName = 'h-[320px]' }: ContactMapProps) {
  const [markers, setMarkers] = useState<GeocodedContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerLayerRef = useRef<LayerGroup | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadMarkers() {
      setIsLoading(true)
      const geocoded = await geocodeContacts(contacts)
      if (!isActive) return
      setMarkers(geocoded)
      setIsLoading(false)
    }

    void loadMarkers()

    return () => {
      isActive = false
    }
  }, [contacts])

  useEffect(() => {
    let isDisposed = false
    const container = containerRef.current

    function mountMap() {
      if (!container || mapRef.current) return

      if (isDisposed || !container) return

      const map = L.map(container, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        attributionControl: interactive,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      markerLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
      setMapReady(true)

      requestAnimationFrame(() => {
        map.invalidateSize()
      })
    }

    mountMap()

    return () => {
      isDisposed = true
      markerLayerRef.current?.clearLayers()
      markerLayerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)

      if (container && '_leaflet_id' in container) {
        delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
      }
    }
  }, [interactive])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerLayerRef.current) return

    let isDisposed = false

    function renderMarkers() {
      if (isDisposed || !mapRef.current || !markerLayerRef.current) return

      markerLayerRef.current.clearLayers()

      markers.forEach(marker => {
        L.circleMarker(marker.coordinates, {
          radius: interactive ? 7 : 5,
          color: '#4A6CD4',
          fillColor: '#4A6CD4',
          fillOpacity: 0.82,
          weight: 1,
        })
          .bindTooltip(`${marker.first_name} · ${marker.city}`, {
            direction: 'top',
            offset: [0, -6],
          })
          .addTo(markerLayerRef.current!)
      })

      if (interactive && markers.length > 1) {
        const bounds = L.latLngBounds(markers.map(marker => marker.coordinates))
        mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 5 })
      } else {
        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      }
    }

    renderMarkers()

    return () => {
      isDisposed = true
    }
  }, [interactive, mapReady, markers])

  return (
    <div className={`relative overflow-hidden rounded-[1.2rem] border border-border/80 bg-sidebar/35 ${heightClassName}`}>
      <div
        ref={containerRef}
        aria-label="Map showing where your contacts live"
        className="h-full w-full"
        role="img"
      />

      {contacts.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,243,234,0.84)_0%,rgba(248,243,234,0.58)_100%)] px-6 text-center text-sm text-ink-muted">
          Add a few friends with city and state details to see the map fill in.
        </div>
      ) : null}

      {contacts.length > 0 && markers.length === 0 && isLoading ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] rounded-full border border-border/70 bg-surface-raised/92 px-4 py-2 text-center text-xs text-ink-muted shadow-sm">
          Locating your friends...
        </div>
      ) : null}

      {contacts.length > 0 && markers.length === 0 && !isLoading ? (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,243,234,0.72)_0%,rgba(248,243,234,0.48)_100%)] px-6 text-center text-sm leading-6 text-ink-muted">
          These addresses need map coordinates before they can appear here. New and edited addresses are mapped automatically.
        </div>
      ) : null}
    </div>
  )
}
