# Globe Design Spec
**Date:** 2026-04-27
**Feature:** D3 Orthographic Globe for Dashboard Map Panel

---

## Overview

Replace the static SVG blob map on the dashboard with a D3 orthographic globe. The globe shows real-geography contact pins placed from geocoded coordinates, auto-rotates slowly when idle, and responds to drag interaction.

---

## Visual Design

The map panel keeps its existing card shell (paper background, dashed border, eyebrow label, city/friend count) but its interior switches to a **dark starfield** background (`#0d1829` → `#1a2a4a` gradient). This is a deliberate contrast to the warm paper dashboard — the globe reads as a window into the world.

Globe rendering:
- Ocean: dark blue radial gradient (`#2a4a8a` → `#0a1628`)
- Landmasses: muted warm green (`#3a5c2a`) with slightly lighter stroke — simplified TopoJSON world-110m outlines
- Graticule: subtle latitude/longitude grid lines in dark navy (`#1e3d70`)
- Atmosphere: faint outer glow ring around the sphere edge
- Shine: soft white ellipse highlight at top-left of sphere

Contact pins:
- Stamp-red (`#b94a2c`) filled dot with white center pixel
- Three concentric rings at decreasing opacity (pulsing halo effect via CSS animation)
- Pins only render on the visible hemisphere (dot product check against projection direction)
- On hover: paper-background tooltip pill showing `City, ST` + friend count

Bottom of globe panel: subtle `drag to rotate` hint text in low-opacity white.

---

## Data Layer

### Schema change

Add two nullable float columns to the `contacts` table:

```sql
ALTER TABLE contacts ADD COLUMN lat double precision;
ALTER TABLE contacts ADD COLUMN lng double precision;
```

Nullable — existing contacts won't have values. No backfill required at launch.

### Geocoding on submit

The share form is a plain text form (no Places autocomplete currently). After `upsertContact` saves the address, the server action makes a single **Google Geocoding API** request using the submitted `address_line_1 + city + state + zip`. The response returns `geometry.location.lat` and `geometry.location.lng`, which are written back to the contact row.

Environment variable required: `GOOGLE_GEOCODING_API_KEY` (can reuse the same key as Places if one is configured, or create a new restricted server-side key).

Geocoding is fire-and-forget from the user's perspective — address submit succeeds regardless of geocoding result. If the geocoding call fails or returns no results, `lat` and `lng` remain `null` and the globe simply omits that pin.

### Graceful fallback

The globe renders pins only for contacts where `lat IS NOT NULL AND lng IS NOT NULL`. If some contacts predate the globe, the globe simply shows fewer pins — no error state. An italic note ("some addresses predate the globe") is shown below the city/friend count only when the pin count is less than the total contact count.

---

## Component Architecture

### `GlobePanel` (client component)

`components/globe-panel.tsx` — receives `contacts: { lat: number | null, lng: number | null, city: string, state: string }[]` as a prop. Renders the full dark panel interior including the D3 canvas/SVG globe.

Uses `useRef` for the canvas element and `useEffect` for D3 setup. D3 is imported dynamically (`dynamic(() => import('./globe-panel'), { ssr: false })`) to avoid SSR issues with canvas/requestAnimationFrame.

### Rendering approach

Pure SVG via D3's `geoOrthographic` projection + `geoPath`. No canvas — SVG makes hover detection and pin interactivity straightforward.

D3 dependencies: `d3-geo`, `d3-selection`, `d3-drag`, `d3-timer`. TopoJSON: `topojson-client` + `world-110m.json` (fetched once, cached in module scope).

### State managed inside the component

- `rotation: [λ, φ, γ]` — current D3 projection rotation
- `isDragging: boolean` — pauses auto-rotation
- `hoveredCity: string | null` — drives tooltip visibility
- Auto-rotation via `d3.timer`, cancelled/restarted on drag start/end with a 2s debounce

---

## Behaviour

| Trigger | Behaviour |
|---|---|
| Component mount | 1.5s delay, then auto-rotate begins at ~0.03°/frame (~8s/revolution) |
| Mousedown on globe | Auto-rotation pauses immediately |
| Drag | Globe spins freely tracking pointer delta |
| Mouseup | Momentum coast: rotation velocity decays over ~600ms |
| 2s after last interaction | Auto-rotation resumes |
| Hover over pin | Tooltip appears; auto-rotation pauses while hovering |
| Mouse leave globe | Tooltip hides; 2s timer to resume auto-rotation starts |

---

## Integration

In `app/dashboard/page.tsx`:
- Import `GlobePanel` dynamically (SSR disabled)
- Pass `contacts.map(c => ({ lat: c.lat, lng: c.lng, city: c.city, state: c.state }))` as prop
- Replace the existing SVG map block (lines ~392–448 in current `page.tsx`) with `<GlobePanel contacts={...} />`
- The outer card shell (border, borderRadius, padding, eyebrow header) stays in `page.tsx`; only the inner content becomes `GlobePanel`

---

## Out of Scope

- Zooming / scroll-to-zoom
- Clicking a pin to navigate to a contact
- Backfilling lat/lng for existing contacts
- Mobile touch events (can be added later; drag handles mouse only at launch)

---

## Dependencies to Add

```
d3-geo d3-selection d3-drag d3-timer @types/d3-geo topojson-client @types/topojson-client
```

World topology data: `public/world-110m.json` (fetched from `cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`, checked into repo).
