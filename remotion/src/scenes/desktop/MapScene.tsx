import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../../design'
import { AppPageHeader, AppWindow, ChromeNav, DashboardMain, DesktopBackground, PromoHeadline, enter } from './ui'

const contacts = [
  { city: 'Portland, OR', coordinates: [45.5152, -122.6784] as L.LatLngExpression, name: 'Avery' },
  { city: 'Los Angeles, CA', coordinates: [34.0522, -118.2437] as L.LatLngExpression, name: 'Maya' },
  { city: 'Austin, TX', coordinates: [30.2672, -97.7431] as L.LatLngExpression, name: 'Rowan' },
  { city: 'Chicago, IL', coordinates: [41.8781, -87.6298] as L.LatLngExpression, name: 'Noah' },
  { city: 'Brooklyn, NY', coordinates: [40.6782, -73.9442] as L.LatLngExpression, name: 'Hana' },
]

export const DesktopMapScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = mapRef.current
    if (!container) return

    const map = L.map(container, { attributionControl: false, dragging: false, zoomControl: false }).setView([39.8, -98.6], 3)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    contacts.forEach((contact) => L.circleMarker(contact.coordinates, { color: '#4A6CD4', fillColor: '#4A6CD4', fillOpacity: 0.82, radius: 7, weight: 1 }).addTo(map))
    let disposed = false
    const animationFrame = requestAnimationFrame(() => {
      if (!disposed && mapRef.current === container && container.isConnected) map.invalidateSize()
    })

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      map.remove()
    }
  }, [])

  return <DesktopBackground>
    <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
      <div style={{ textAlign: 'center', ...enter(frame, fps, 2) }}><PromoHeadline>See your people on a <em style={{ color: colors.periwinkle }}>map.</em></PromoHeadline><p style={{ color: colors.soft, fontSize: 20, lineHeight: 1.45, margin: '16px auto 28px', maxWidth: 560 }}>A living view of the cities your letters are headed toward.</p></div>
      <AppWindow camera="out" style={{ height: 570, maxWidth: 1500, width: '100%', ...enter(frame, fps, 14) }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <ChromeNav active="Map" />
          <DashboardMain>
            <div style={enter(frame, fps, 24)}><AppPageHeader eyebrow="Where your people live" title="Friend map" description="A living view of the cities your letters are headed toward. Select a dot or use the contact list below the map." /></div>
            <section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 20px 50px -30px rgba(35,41,64,0.2), 0 1px 0 rgba(255,255,255,0.72) inset', marginTop: 20, padding: 20, ...enter(frame, fps, 34) }}>
              <div aria-label="Map showing where your contacts live" role="img" style={{ border: `1px solid ${colors.line}`, borderRadius: 14, height: 222, overflow: 'hidden', position: 'relative' }}>
                <div ref={mapRef} style={{ height: '100%', scale: interpolate(frame, [34, 112], [1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), width: '100%' }} />
                {contacts.map((contact, index) => <div key={contact.name} style={{ backgroundColor: 'rgba(248,243,234,0.84)', inset: 0, opacity: interpolate(frame, [24 + index * 7, 38 + index * 7], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), pointerEvents: 'none', position: 'absolute' }} />)}
              </div>
              <div aria-label="Mapped contacts" style={{ marginTop: 12 }}>
                <p style={{ color: colors.muted, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px', textTransform: 'uppercase' }}>Mapped contacts</p>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  {contacts.map((contact, index) => <div key={contact.name} style={{ alignItems: 'center', backgroundColor: colors.porcelain, border: `1px solid ${colors.line}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', minHeight: 38, padding: '0 10px', ...enter(frame, fps, 56 + index * 7) }}><span style={{ fontSize: 13, fontWeight: 700 }}>{contact.name}</span><span style={{ color: colors.muted, fontSize: 11 }}>{contact.city}</span></div>)}
                </div>
              </div>
            </section>
          </DashboardMain>
        </div>
      </AppWindow>
    </div>
  </DesktopBackground>
}
