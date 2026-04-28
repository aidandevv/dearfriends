'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
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

  return (
    <div className={`relative overflow-hidden rounded-[1.2rem] border border-border/80 bg-sidebar/35 ${heightClassName}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        attributionControl={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map(marker => (
          <CircleMarker
            key={marker.id}
            center={marker.coordinates}
            radius={interactive ? 7 : 5}
            pathOptions={{
              color: '#3358ba',
              fillColor: '#3358ba',
              fillOpacity: 0.82,
              weight: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {marker.first_name} · {marker.city}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {contacts.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,243,234,0.84)_0%,rgba(248,243,234,0.58)_100%)] px-6 text-center text-sm text-ink-muted">
          Add a few friends with city and state details to see the map fill in.
        </div>
      ) : null}

      {contacts.length > 0 && markers.length === 0 && isLoading ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-full border border-border/70 bg-surface-raised/92 px-4 py-2 text-center text-xs text-ink-muted shadow-sm">
          Locating your friends...
        </div>
      ) : null}
    </div>
  )
}
