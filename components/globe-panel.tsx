'use client'

import { useEffect, useRef, useState, useMemo, useId } from 'react'
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo'
import { feature } from 'topojson-client'

type ContactGeo = {
  lat: number | null
  lng: number | null
  city: string
  state: string
}

type Pin = {
  lat: number
  lng: number
  city: string
  state: string
  count: number
}

// Cached at module level — fetched once per page load across all renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let topoCache: any = null

const W = 260
const H = 260
const RADIUS = 118

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

export function GlobePanel({ contacts }: { contacts: ContactGeo[] }) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Mutable rotation state — lives in a ref so the RAF loop reads current value
  const rot = useRef<[number, number, number]>([0, -20, 0])
  const interacting = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    label: string
    count: number
  } | null>(null)

  const pins = useMemo<Pin[]>(() => {
    const map = new Map<string, Pin>()
    for (const c of contacts) {
      if (c.lat == null || c.lng == null) continue
      const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`
      const ex = map.get(key)
      if (ex) { ex.count++; continue }
      map.set(key, { lat: c.lat, lng: c.lng, city: c.city, state: c.state, count: 1 })
    }
    return [...map.values()]
  }, [contacts])

  const geocodedCount = useMemo(
    () => contacts.filter(c => c.lat != null).length,
    [contacts],
  )

  const uid = useId()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let alive = true
    let coastRaf: number | null = null
    let startTimer: ReturnType<typeof setTimeout> | null = null

    const gratEl = svg.querySelector<SVGPathElement>('.g-grat')!
    const landEl = svg.querySelector<SVGPathElement>('.g-land')!
    const pinsEl = svg.querySelector<SVGGElement>('.g-pins')!

    function makeProjection() {
      return geoOrthographic()
        .scale(RADIUS)
        .translate([W / 2, H / 2])
        .clipAngle(90)
        .rotate(rot.current)
    }

    const graticuleGeom = geoGraticule()()

    function draw() {
      const proj = makeProjection()
      const pathFn = geoPath(proj)

      gratEl.setAttribute('d', pathFn(graticuleGeom) ?? '')

      if (topoCache) {
        landEl.setAttribute(
          'd',
          pathFn(feature(topoCache, topoCache.objects.land)) ?? '',
        )
      }

      // Skip pin rebuild while interacting — rotation is paused so positions are unchanged
      if (interacting.current) return
      // Rebuild pins each frame — only visible hemisphere pins
      pinsEl.innerHTML = ''
      for (const pin of pins) {
        if (!isOnFront(pin.lng, pin.lat, rot.current)) continue
        const xy = proj([pin.lng, pin.lat])
        if (!xy) continue
        const [x, y] = xy

        mkCircle(pinsEl, x, y, 13, '#b94a2c', '0.1')
        mkCircle(pinsEl, x, y, 7, '#b94a2c', '0.24')
        mkCircle(pinsEl, x, y, 3.5, '#b94a2c', '1')
        mkCircle(pinsEl, x, y, 1.3, 'white', '0.9')

        // Transparent hit target for hover
        const hit = mkCircle(pinsEl, x, y, 13, 'transparent', '1')
        hit.style.cursor = 'pointer'
        const p = pin
        hit.addEventListener('mouseenter', () => {
          interacting.current = true
          clearResume()
          setTooltip({ x, y, label: `${p.city}, ${p.state}`, count: p.count })
        })
        hit.addEventListener('mouseleave', () => {
          setTooltip(null)
          interacting.current = false
          scheduleResume()
        })
      }
    }

    function tick() {
      if (!alive) return
      if (!interacting.current) {
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
      resumeTimer.current = setTimeout(() => { interacting.current = false }, 2000)
    }

    function cancelCoast() {
      if (coastRaf !== null) { cancelAnimationFrame(coastRaf); coastRaf = null }
    }

    // ─── Drag ────────────────────────────────────────────────────────────────
    let velX = 0

    function onDown(e: MouseEvent) {
      interacting.current = true
      clearResume()
      cancelCoast()
      velX = 0
      lastPos.current = { x: e.clientX, y: e.clientY }
    }

    function onMove(e: MouseEvent) {
      if (!interacting.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      velX = dx * 0.3
      rot.current = [
        rot.current[0] + dx * 0.3,
        Math.max(-80, Math.min(80, rot.current[1] - dy * 0.3)),
        rot.current[2],
      ]
      lastPos.current = { x: e.clientX, y: e.clientY }
    }

    function onUp() {
      let v = velX
      function coast() {
        v *= 0.92
        if (Math.abs(v) < 0.006) { coastRaf = null; scheduleResume(); return }
        rot.current = [rot.current[0] + v, rot.current[1], rot.current[2]]
        coastRaf = requestAnimationFrame(coast)
      }
      coastRaf = requestAnimationFrame(coast)
    }

    svg.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    // ─── Init ────────────────────────────────────────────────────────────────
    ;(async () => {
      if (!topoCache) {
        try {
          const res = await fetch('/world-110m.json')
          topoCache = await res.json()
        } catch { /* globe renders without land on failure */ }
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
      svg.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      if (startTimer !== null) clearTimeout(startTimer)
      clearResume()
      cancelCoast()
    }
  }, [pins])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #1a2a4a 0%, #0d1829 100%)',
      }}
    >
      {/* Starfield */}
      <Stars />

      {/*
        Wrap SVG + tooltip in a W-wide div centered in the panel.
        This makes tooltip absolute positioning match SVG coordinate space.
      */}
      <div style={{ position: 'relative', width: W, margin: '0 auto' }}>
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', cursor: 'grab' }}
        aria-label="Globe showing where your contacts live"
      >
        <defs>
          <radialGradient id={`df-ocean-${uid}`} cx="38%" cy="32%">
            <stop offset="0%" stopColor="#2a4a8a" />
            <stop offset="60%" stopColor="#162d5e" />
            <stop offset="100%" stopColor="#0a1628" />
          </radialGradient>
          <clipPath id={`df-globe-clip-${uid}`}>
            <circle cx={W / 2} cy={H / 2} r={RADIUS} />
          </clipPath>
        </defs>

        {/* Ocean sphere */}
        <circle cx={W / 2} cy={H / 2} r={RADIUS} fill={`url(#df-ocean-${uid})`} />

        {/* Atmosphere glow */}
        <circle
          cx={W / 2} cy={H / 2} r={RADIUS + 3}
          fill="none" stroke="#4a7acc" strokeWidth={2} opacity={0.28}
        />

        {/* Graticule — filled by D3 on each frame */}
        <path
          className="g-grat"
          clipPath={`url(#df-globe-clip-${uid})`}
          fill="none"
          stroke="#1e3d70"
          strokeWidth={0.6}
          opacity={0.65}
        />

        {/* Landmasses — filled by D3 on each frame */}
        <path
          className="g-land"
          clipPath={`url(#df-globe-clip-${uid})`}
          fill="#3a5c2a"
          stroke="#4a7236"
          strokeWidth={0.7}
          opacity={0.85}
        />

        {/* Shine highlight */}
        <ellipse
          cx={W / 2 - 28} cy={H / 2 - 38}
          rx={22} ry={14}
          fill="white" opacity={0.06}
        />

        {/* Contact pins — rebuilt each frame by the RAF loop */}
        <g className="g-pins" />
      </svg>

      {/* Tooltip — positioned within the W×H SVG wrapper div */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x > W / 2 ? Math.max(0, tooltip.x - 148) : tooltip.x + 20,
            top: tooltip.y - 14,
            background: 'var(--paper, #faf4e4)',
            border: '1px solid var(--line, #d9cfb0)',
            borderRadius: 999,
            padding: '5px 12px 5px 10px',
            fontSize: 12,
            color: 'var(--ink, #1c1a14)',
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
              background: '#b94a2c', flexShrink: 0, display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600 }}>{tooltip.label}</span>
          {tooltip.count > 1 && (
            <span
              style={{
                borderLeft: '1px solid var(--line, #d9cfb0)',
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

      {/* Drag hint */}
      <div
        style={{
          position: 'absolute', bottom: 12, left: 0, right: 0,
          textAlign: 'center', fontSize: 10.5,
          color: 'rgba(255,255,255,.28)', letterSpacing: '0.06em',
          pointerEvents: 'none',
        }}
      >
        drag to rotate
      </div>

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
