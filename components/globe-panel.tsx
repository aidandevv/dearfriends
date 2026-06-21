'use client'

import { useCallback, useEffect, useRef, useState, useMemo, useId } from 'react'
import { useRouter } from 'next/navigation'
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import { contactsWithCoordinates } from '@/lib/geocode'

type ContactGeo = {
  lat: number | null
  lng: number | null
  city: string
  state: string
  country?: string | null
  isInternational?: boolean | null
}

type Pin = {
  lat: number
  lng: number
  city: string
  state: string
  country?: string | null
  isInternational?: boolean | null
  count: number
}

// Cached at module level — fetched once per page load across all renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let topoCache: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let usTopoCache: any = null

const DIMENSIONS = {
  compact: { width: 260, height: 260, radius: 118 },
  feature: { width: 760, height: 460, radius: 180 },
}
const US_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
const BASE_DRAG_DEGREES_PER_PIXEL = 0.3

function dragDegreesPerPixel(zoom: number): number {
  return BASE_DRAG_DEGREES_PER_PIXEL / Math.max(1, zoom)
}

/** True if [lng, lat] is on the front hemisphere of the current rotation. */
function isOnFront(lng: number, lat: number, rot: [number, number, number]): boolean {
  const cLon = rot[0] * (Math.PI / 180)
  const cLat = rot[1] * (Math.PI / 180)
  const pLon = lng * (Math.PI / 180)
  const pLat = lat * (Math.PI / 180)
  return (
    Math.sin(cLat) * Math.sin(pLat) +
    Math.cos(cLat) * Math.cos(pLat) * Math.cos(pLon - cLon) > 0
  )
}

function mkCircle(
  parent: Element,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  opacity = '1',
): SVGCircleElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  el.setAttribute('cx', String(cx))
  el.setAttribute('cy', String(cy))
  el.setAttribute('r', String(r))
  el.setAttribute('fill', fill)
  el.setAttribute('opacity', opacity)
  parent.appendChild(el)
  return el
}

export function GlobePanel({
  contacts,
  variant = 'compact',
  autoRefresh = false,
}: {
  contacts: ContactGeo[]
  variant?: 'compact' | 'feature'
  autoRefresh?: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const { width: W, height: H, radius: RADIUS } = DIMENSIONS[variant]

  // Mutable rotation state — lives in a ref so the RAF loop reads current value
  const rot = useRef<[number, number, number]>([0, -20, 0])
  const paused = useRef(false)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const lastMove = useRef({ x: 0, y: 0, t: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coastRaf = useRef<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const translate = useRef({ x: W / 2, y: H / 2 })

  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    label: string
    count: number
  } | null>(null)

  const mappableContacts = useMemo(
    () => contactsWithCoordinates(contacts),
    [contacts],
  )

  const pins = useMemo<Pin[]>(() => {
    const map = new Map<string, Pin>()
    for (const c of mappableContacts) {
      const [lat, lng] = c.coordinates
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
      const ex = map.get(key)
      if (ex) { ex.count++; continue }
      map.set(key, {
        lat,
        lng,
        city: c.city,
        state: c.state,
        country: c.country,
        isInternational: c.isInternational,
        count: 1,
      })
    }
    return [...map.values()]
  }, [mappableContacts])

  const geocodedCount = useMemo(
    () => mappableContacts.length,
    [mappableContacts],
  )

  const uid = useId()

  const setClampedZoom = useCallback((
    next: number | ((current: number) => number),
  ) => {
    setZoom(current => {
      const resolved = typeof next === 'function' ? next(current) : next
      const clamped = Math.max(0.72, Math.min(4.4, resolved))
      zoomRef.current = clamped
      return clamped
    })
  }, [])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    if (!autoRefresh) return

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') router.refresh()
    }

    const intervalId = window.setInterval(refreshWhenVisible, 15000)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [autoRefresh, router])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const globeSvg = svg
    let alive = true
    let startTimer: ReturnType<typeof setTimeout> | null = null

    const gratEl = svg.querySelector<SVGPathElement>('.g-grat')!
    const landEl = svg.querySelector<SVGPathElement>('.g-land')!
    const countriesEl = svg.querySelector<SVGPathElement>('.g-countries')!
    const statesEl = svg.querySelector<SVGPathElement>('.g-states')!
    const pinsEl = svg.querySelector<SVGGElement>('.g-pins')!
    const oceanEl = svg.querySelector<SVGCircleElement>('.g-ocean')!
    const atmosphereEl = svg.querySelector<SVGCircleElement>('.g-atmosphere')!

    function makeProjection() {
      const scale = RADIUS * zoomRef.current
      return geoOrthographic()
        .scale(scale)
        .translate([translate.current.x, translate.current.y])
        .clipAngle(90)
        .rotate(rot.current)
    }

    const graticuleGeom = geoGraticule()()

    function draw() {
      const proj = makeProjection()
      const pathFn = geoPath(proj)
      const currentRadius = RADIUS * zoomRef.current

      oceanEl.setAttribute('cx', String(translate.current.x))
      oceanEl.setAttribute('cy', String(translate.current.y))
      oceanEl.setAttribute('r', String(currentRadius))
      atmosphereEl.setAttribute('cx', String(translate.current.x))
      atmosphereEl.setAttribute('cy', String(translate.current.y))
      atmosphereEl.setAttribute('r', String(currentRadius + 3))

      gratEl.setAttribute('d', pathFn(graticuleGeom) ?? '')

      if (topoCache) {
        landEl.setAttribute(
          'd',
          pathFn(feature(topoCache, topoCache.objects.land)) ?? '',
        )
        countriesEl.setAttribute(
          'd',
          pathFn(mesh(topoCache, topoCache.objects.countries, (a, b) => a !== b)) ?? '',
        )
      }
      if (usTopoCache) {
        statesEl.setAttribute(
          'd',
          pathFn(mesh(usTopoCache, usTopoCache.objects.states, (a, b) => a !== b)) ?? '',
        )
      }

      // Rebuild pins each frame — only visible hemisphere pins
      pinsEl.innerHTML = ''
      for (const pin of pins) {
        if (!isOnFront(pin.lng, pin.lat, rot.current)) continue
        const xy = proj([pin.lng, pin.lat])
        if (!xy) continue
        const [x, y] = xy
        if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue

        mkCircle(pinsEl, x, y, 15, 'var(--stamp)', '0.18')
        mkCircle(pinsEl, x, y, 8, 'var(--cream)', '0.32')
        mkCircle(pinsEl, x, y, 4.2, 'var(--stamp)', '1')
        mkCircle(pinsEl, x, y, 1.3, 'white', '0.9')

        // Transparent hit target for hover
        const hit = mkCircle(pinsEl, x, y, 13, 'transparent', '1')
        hit.style.cursor = 'pointer'
        const p = pin
        hit.addEventListener('mouseenter', () => {
          setTooltip({
            x,
            y,
            label: p.isInternational
              ? `${p.city}, ${p.country || 'International'}`
              : `${p.city}, ${p.state}`,
            count: p.count,
          })
        })
        hit.addEventListener('mouseleave', () => {
          setTooltip(null)
        })
      }
    }

    function tick() {
      if (!alive) return
      if (!paused.current) {
        rot.current = [rot.current[0] + 0.03, rot.current[1], rot.current[2]]
      }
      draw()
      rafId.current = requestAnimationFrame(tick)
    }

    function clearResume() {
      if (resumeTimer.current !== null) {
        clearTimeout(resumeTimer.current)
        resumeTimer.current = null
      }
    }

    function scheduleResume() {
      clearResume()
      resumeTimer.current = setTimeout(() => { paused.current = false }, 1400)
    }

    function cancelCoast() {
      if (coastRaf.current !== null) {
        cancelAnimationFrame(coastRaf.current)
        coastRaf.current = null
      }
    }

    // ─── Drag ────────────────────────────────────────────────────────────────
    function onDown(e: PointerEvent) {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      paused.current = true
      dragging.current = true
      clearResume()
      cancelCoast()
      velocity.current = { x: 0, y: 0 }
      const now = performance.now()
      lastPos.current = { x: e.clientX, y: e.clientY }
      lastMove.current = { x: e.clientX, y: e.clientY, t: now }
      globeSvg.setPointerCapture?.(e.pointerId)
      globeSvg.style.cursor = 'grabbing'
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      const now = performance.now()
      const dt = Math.max(16, now - lastMove.current.t)
      const dragSensitivity = dragDegreesPerPixel(zoomRef.current)
      velocity.current = {
        x: (e.clientX - lastMove.current.x) / dt,
        y: (e.clientY - lastMove.current.y) / dt,
      }
      rot.current = [
        rot.current[0] + dx * dragSensitivity,
        Math.max(-80, Math.min(80, rot.current[1] - dy * dragSensitivity)),
        rot.current[2],
      ]
      lastPos.current = { x: e.clientX, y: e.clientY }
      lastMove.current = { x: e.clientX, y: e.clientY, t: now }
      e.preventDefault()
    }

    function onUp(e: PointerEvent) {
      if (!dragging.current) return
      dragging.current = false
      globeSvg.releasePointerCapture?.(e.pointerId)
      globeSvg.style.cursor = 'grab'
      const coastSensitivity =
        dragDegreesPerPixel(zoomRef.current) / BASE_DRAG_DEGREES_PER_PIXEL
      let vx = velocity.current.x * 12 * coastSensitivity
      let vy = velocity.current.y * 12 * coastSensitivity

      if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) {
        scheduleResume()
        return
      }

      function coast() {
        vx *= 0.95
        vy *= 0.95
        if (Math.abs(vx) < 0.006 && Math.abs(vy) < 0.006) {
          coastRaf.current = null
          scheduleResume()
          return
        }
        rot.current = [
          rot.current[0] + vx,
          Math.max(-80, Math.min(80, rot.current[1] - vy)),
          rot.current[2],
        ]
        coastRaf.current = requestAnimationFrame(coast)
      }
      coastRaf.current = requestAnimationFrame(coast)
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      paused.current = true
      clearResume()
      setClampedZoom(current => current * (e.deltaY > 0 ? 0.88 : 1.14))
      scheduleResume()
    }

    svg.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    svg.addEventListener('wheel', onWheel, { passive: false })

    // ─── Init ────────────────────────────────────────────────────────────────
    ;(async () => {
      if (!topoCache) {
        try {
          const res = await fetch('/world-110m.json')
          topoCache = await res.json()
        } catch { /* globe renders without land on failure */ }
      }
      if (!usTopoCache) {
        try {
          const res = await fetch(US_ATLAS_URL)
          usTopoCache = await res.json()
        } catch { /* state borders are progressive enhancement */ }
      }
      if (!alive) return
      draw() // static frame before rotation starts
      startTimer = setTimeout(() => {
        if (!alive) return
        rafId.current = requestAnimationFrame(tick)
      }, 1500)
    })()

    return () => {
      alive = false
      svg.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      svg.removeEventListener('wheel', onWheel)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      if (startTimer !== null) clearTimeout(startTimer)
      clearResume()
      cancelCoast()
    }
  }, [H, RADIUS, W, pins, setClampedZoom])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--ink) 0%, #111a30 100%)',
      }}
    >
      {/* Starfield */}
      <Stars />

      <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', cursor: 'grab', touchAction: 'none', userSelect: 'none', aspectRatio: `${W} / ${H}` }}
        aria-label="Globe showing where your contacts live"
      >
        <defs>
          <radialGradient id={`df-ocean-${uid}`} cx="38%" cy="32%">
            <stop offset="0%" stopColor="var(--periwinkle)" />
            <stop offset="60%" stopColor="var(--blue-slate)" />
            <stop offset="100%" stopColor="var(--ink)" />
          </radialGradient>
        </defs>

        {/* Ocean sphere */}
        <circle className="g-ocean" cx={W / 2} cy={H / 2} r={RADIUS} fill={`url(#df-ocean-${uid})`} />

        {/* Atmosphere glow */}
        <circle
          className="g-atmosphere"
          cx={W / 2} cy={H / 2} r={RADIUS + 3}
          fill="none" stroke="var(--periwinkle)" strokeWidth={2} opacity={0.28}
        />

        {/* Graticule — filled by D3 on each frame */}
        <path
          className="g-grat"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={0.6}
          opacity={0.65}
        />

        {/* Landmasses — filled by D3 on each frame */}
        <path
          className="g-land"
          fill="var(--sage)"
          stroke="var(--cream-soft)"
          strokeWidth={0.7}
          opacity={0.85}
        />

        {/* Country borders — filled from the bundled world topology */}
        <path
          className="g-countries"
          fill="none"
          stroke="rgba(250,244,228,.42)"
          strokeWidth={zoom > 2 ? 0.5 : 0.34}
          opacity={zoom > 1.2 ? 0.72 : 0.48}
        />

        {/* US state borders — filled from us-atlas when available */}
        <path
          className="g-states"
          fill="none"
          stroke="rgba(250,244,228,.72)"
          strokeWidth={zoom > 2 ? 0.58 : 0.38}
          opacity={zoom > 1.35 ? 0.86 : 0.38}
        />

        {/* Contact pins — rebuilt each frame by the RAF loop */}
        <g className="g-pins" />
      </svg>

      <div
        aria-label="Globe zoom controls"
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          display: 'flex',
          gap: 6,
          zIndex: 12,
        }}
      >
        {[
          { label: 'Zoom out', text: '−', onClick: () => setClampedZoom(z => z - 0.14) },
          { label: 'Zoom in', text: '+', onClick: () => setClampedZoom(z => z * 1.22) },
        ].map(control => (
          <button
            key={control.label}
            type="button"
            aria-label={control.label}
            title={control.label}
            onClick={() => {
              paused.current = true
              clearTimeout(resumeTimer.current ?? undefined)
              control.onClick()
              resumeTimer.current = setTimeout(() => { paused.current = false }, 1400)
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(250,244,228,.28)',
              background: 'rgba(250,244,228,.12)',
              color: 'white',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {control.text}
          </button>
        ))}
      </div>

      {/* Tooltip — positioned within the W×H SVG wrapper div */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x > W / 2 ? Math.max(0, tooltip.x - 148) : tooltip.x + 20,
            top: tooltip.y - 14,
            background: 'var(--paper, #F8F9FB)',
            border: '1px solid var(--line, #DFE3EC)',
            borderRadius: 999,
            padding: '5px 12px 5px 10px',
            fontSize: 12,
            color: 'var(--ink, #232940)',
            boxShadow: '0 4px 12px rgba(0,0,0,.22)',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--periwinkle)', flexShrink: 0, display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600 }}>{tooltip.label}</span>
          {tooltip.count > 1 && (
            <span
              style={{
                borderLeft: '1px solid var(--line, #DFE3EC)',
                paddingLeft: 7, marginLeft: 2,
                fontStyle: 'italic',
                color: 'var(--blue-slate, #4a5f8a)',
              }}
            >
              {tooltip.count} friends
            </span>
          )}
        </div>
      )}
      </div> {/* end SVG wrapper */}

      {/* Graceful fallback note for pre-geocode contacts */}
      {contacts.length > 0 && geocodedCount < contacts.length && (
        <div
          style={{
            position: 'absolute', bottom: 28, left: 0, right: 0,
            textAlign: 'center', fontSize: 10,
            color: 'rgba(255,255,255,.22)',
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontStyle: 'italic', pointerEvents: 'none',
          }}
        >
          some addresses predate the globe
        </div>
      )}
    </div>
  )
}

const STARS = [
  { x: '8%',  y: '12%', r: 0.8, op: 0.6 },
  { x: '15%', y: '22%', r: 0.6, op: 0.4 },
  { x: '30%', y: '8%',  r: 1.0, op: 0.7 },
  { x: '72%', y: '30%', r: 0.6, op: 0.5 },
  { x: '85%', y: '15%', r: 0.8, op: 0.6 },
  { x: '55%', y: '5%',  r: 0.6, op: 0.4 },
  { x: '8%',  y: '75%', r: 1.0, op: 0.3 },
  { x: '20%', y: '80%', r: 0.6, op: 0.4 },
  { x: '82%', y: '70%', r: 0.8, op: 0.5 },
  { x: '65%', y: '85%', r: 0.6, op: 0.35 },
  { x: '90%', y: '55%', r: 0.7, op: 0.4 },
  { x: '45%', y: '88%', r: 0.5, op: 0.3 },
]

function Stars() {
  return (
    <>
      {STARS.map((s, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            left: s.x, top: s.y,
            width: s.r * 2, height: s.r * 2,
            borderRadius: '50%',
            background: 'white',
            opacity: s.op,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
