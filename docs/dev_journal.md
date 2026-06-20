# Engineering Development Journal & Project Post-Mortem
> This file serves as a chronological log of architecture decisions, implementation pivots, constraints, verification results, and engineering milestones.

---

## 2026-06-18 — SVG postal timeline for “Three small habits” section

**Context:** The How it works section (`HowItWorks` in `components/marketing/sections.tsx`) used raster PNG backgrounds (`postal-arc-desktop.png`, `postal-arc-mobile.png`) for the wavy timeline, wagon-wheel ornaments, and node markers. These scaled poorly and looked soft on high-DPI screens.

**Change:** Added `components/marketing/postal-timeline-bg.tsx` with `PostalTimelineDesktopBg` and `PostalTimelineMobileBg` React SVG components. Replaced `next/image` fills in the section with absolutely positioned SVGs using the original artboard viewBoxes (1663×946 desktop, 916×1717 mobile), `preserveAspectRatio="xMidYMid slice"`, `vectorEffect="nonScalingStroke"`, and design-token colors (`periwinkle`, `peach`).

**Elements preserved:** Sine-wave timeline with dashed end caps; three peach/white/periwinkle nodes; vertical (desktop) and horizontal (mobile) dotted guide lines; decorative wagon wheels with radiating spokes and arrowhead tips.

**Verification:** `npm run typecheck` and `npm run lint` pass. Text layout and copy in `sections.tsx` unchanged.

### [CP-MILESTONE] | 2026-06-19: App-Wide Postal Design System Rollout

**The Context & Problem:**
- The landing page had established a lighter postal design system with porcelain surfaces, periwinkle/peach accents, paper-card panels, and SVG route line art, but the rest of the app still mixed older admin panels, darker auth art, hard-coded blue accents, and isolated page treatments.

**Design Decisions & Trade-offs:**
- **Choice:** We created a reusable `PostalLineArt` SVG component and expanded the global surface/control classes so dashboard, auth, public, onboarding, utility, about, and quiet concept routes could share the same visual atmosphere.
- **Alternatives Considered:** We could have hand-styled each page independently or left the landing-only SVG art in `components/marketing/postal-timeline-bg.tsx`; we rejected both because the app needed one maintainable design language rather than one-off page treatments.
- **Why:** Centralizing the paper cards, airmail stripe, periwinkle focus/primary accents, porcelain background, and route-art overlays makes future screens inherit the landing system without copying bespoke inline styles.

**The Pivot/Revision:**
- The initial direction held, but we revised the CSS implementation after noticing that Tailwind can be brittle when `@apply` references custom component classes. We expanded the page-header, form-panel, and auth-card classes directly instead of composing them from `postal-card`.

**Implementation Notes:**
- **Files/Modules Affected:** `components/ui/postal-line-art.tsx`, `app/globals.css`, dashboard layout/pages, auth pages, public verify/share surfaces, onboarding, not-found, about, quiet concept CSS, and shared interactive widgets such as contact table, calendar, composer, export, groups, share-link editor, feature tour, and map/globe accents.
- **Core Pattern Introduced:** Full-page shells use a fixed, low-opacity SVG route layer plus grain; important page headers and forms use paper-card panels with a subtle airmail stripe; primary/active/focus states use the landing periwinkle token and peach stays as the postal secondary accent.

**Verification & Evidence:**
- `npm run typecheck` passed.
- `npm run lint` passed with no ESLint warnings or errors.
- `npm run build` completed successfully and generated all app routes.
- The local dev server started at `http://localhost:3003` after sandbox port binding required an elevated run. HTTP route probes returned `200 OK` for `/`, `/login`, `/about`, `/quiet`, `/auth/reset-password`, and `/verify/test-token`.
- Browser screenshot QA was not performed because the in-app browser control tool was not exposed in this thread, and the Product Design workflow requires an explicit browser preference before using Playwright CLI directly.

**Documentation & References Utilized:**
- [`~/.ai-rules/engineering-journal.md`](~/.ai-rules/engineering-journal.md) - Checkpoint format and append-only journal protocol.
- [`components/marketing/postal-timeline-bg.tsx`](components/marketing/postal-timeline-bg.tsx) - Existing landing SVG route-art language that informed the reusable app-wide line-art component.

**Code Snapshot/Diff Concept:**
```pseudo
PostalLineArt(variant)
  renders periwinkle route curves + peach dashed guides + route nodes + wheel ornaments

postal-page
  fixed grain background
  fixed/absolute PostalLineArt overlay
  postal-page-content above atmosphere

app surfaces
  app-page-header / form-panel / auth-form-card
  share the same paper-card border, shadow, and airmail stripe
```

**Open Questions / Follow-ups:**

* Run visual browser QA in the user's preferred browser and tune any route-art density, overlap, or contrast issues found on real desktop/mobile viewports.

---

## 2026-06-19 — Census Geocoder fallback for globe pins

**Context:** Globe pins depend on `lat`/`lng` written at contact submit time. Smoke testing found `GOOGLE_GEOCODING_API_KEY` unset locally and 0/5 contacts geocoded, so pins never appeared despite correct `GlobePanel` wiring.

**Change:** Extended `lib/geocode.ts` so `geocodeAddress` tries Google when a key is present, then falls back to the free US Census Geocoder (`geocoding.geo.census.gov`, structured `street`/`city`/`state`/`zip`, benchmark `Public_AR_Current`). Non-US international addresses skip Census when Google is unavailable. Exported `isUsMailableAddress` for country gating.

**Verification:** 11 geocode unit tests pass (including Census fallback and international skip). Live Census smoke for Austin TX 78701 returned coordinates. Full suite: 60/60 pass.

**Follow-up:** Existing contacts without coordinates are not backfilled automatically; new submissions and verification updates will geocode via Census without any API key.

---

## 2026-06-19 — Gap-analysis fixes batch

**Context:** Audit identified broken export group filters, missing reminder crons, invisible recipient notes, absent birthday UX, and other PRD drift.

**Changes:**
- Export: shared `getExportContacts` helper; CSV/PDF honor `group` param; Avery 5160 CSV for handwrite/print; PDF includes draft subject.
- Contacts: notes shown in table; birthday date input when contact is in a birthday-tracking group; duplicate share email returns `alreadyExists` with clearer thank-you copy.
- Reminders: `/api/cron/anniversary-reminders` and `/api/cron/birthday-reminders` (Mondays); settings toggle for birthday digests; `lib/reminders.ts` date logic.
- Types: `lib/database.types.ts`; removed dashboard globe casts.
- UX/infra: Map in sidebar; schedule verification on settings; dashboard loading/error boundaries; digital send failure counts; `scripts/backfill-geocodes.mjs`; `vercel.json` frozen lockfile + new crons; eslint-config-next aligned.

**Verification:** 69 unit tests pass; `tsc --noEmit` clean.

### [CP-TESTING] | 2026-06-19: Early Beta Go/No-Go Readiness Pass

**The Context & Problem:**
- We needed a final beta-readiness review that combined automated release gates with real browser inspection of marketing, auth, public share, and authenticated dashboard surfaces.

**Design Decisions & Trade-offs:**
- **Choice:** We treated visual polish and flow reliability as part of the release bar, then patched verified blockers during the audit instead of only reporting them.
- **Alternatives Considered:** We could have limited the pass to `npm test`/`next build`, but that would have missed the auth hydration overlay, stale marketing smoke assertions, map crash, and heavy mobile dashboard navigation.
- **Why:** Early testers need a product that feels trustworthy in the browser, not just a codebase that compiles.

**The Pivot/Revision:**
- The initial pass found multiple release issues: `app/globals.css` had an unclosed media-query block that broke production build, the marketing E2E asserted old landing copy, the auth page showed a React hydration dev overlay from nondeterministic SVG spoke coordinates, and `/dashboard/map` crashed with `Map container is already initialized`.
- We revised the map approach from React Leaflet's `MapContainer` wrapper to a client-only Leaflet island with explicit mount, marker redraw, and cleanup. We kept the `ssr:false` boundary around that island so Leaflet is never imported during server rendering.

**Implementation Notes:**
- **Files/Modules Affected:** `app/globals.css`, `app/layout.tsx`, `app/(auth)/login/page.tsx`, `components/ui/postal-line-art.tsx`, `components/contact-map.tsx`, `components/full-map-panel.tsx`, `components/map-widget.tsx`, `components/onboarding-form.tsx`, and `e2e/marketing.spec.ts`.
- **Core Pattern Introduced:** Browser-only mapping now lives behind a dynamic client boundary, while `ContactMap` owns a single Leaflet instance per DOM node, removes it on unmount, and shows a clear coordinate-missing state when contacts predate geocoding.

**Verification & Evidence:**
- `npm test` passed: 14 test files, 71 tests.
- `npm run typecheck` passed.
- `npm run build` passed with no warnings and generated all 23 routes.
- `npm run test:e2e` passed: 5 Playwright tests covering marketing navigation, login validation/reset UI, and security smoke routes.
- Browser QA covered landing, about, login, quiet, not-found, public share slugs, dashboard, groups, compose, calendar, map, export, settings, and mobile dashboard views. The public share pages for the primary, Family, and Book Club slugs resolved and displayed the saved invite message.
- We did not submit a new public contact because that would create persistent data in the connected Supabase project during a readiness audit.

**Documentation & References Utilized:**
- [`~/.ai-rules/engineering-journal.md`](~/.ai-rules/engineering-journal.md) - Checkpoint format and append-only journal protocol.
- [`/Users/aidan/.codex/memories/MEMORY.md`](/Users/aidan/.codex/memories/MEMORY.md) - Prior release-smoke focus areas for group slugs, custom invite copy, public share links, and accessibility.

**Code Snapshot/Diff Concept:**
```pseudo
ContactMap
  dynamic boundary: ssr false
  useEffect mount:
    L.map(container)
    tileLayer.addTo(map)
    layerGroup.addTo(map)
  useEffect markers:
    clear layer
    add circle markers
  cleanup:
    clear layers
    remove map
    delete _leaflet_id

beta readiness
  build + typecheck + unit + e2e
  browser inspect public + authenticated + mobile routes
  patch blockers before go/no-go
```

**Open Questions / Follow-ups:**

* Confirm the beta deployment sets `NEXT_PUBLIC_SITE_URL` to the deployed domain so dashboard share links do not copy `localhost:3000`.
* Run `npm run backfill:geocodes` or edit older contacts if existing address rows should appear on the map immediately.
* Perform one side-effecting public contact submission in a disposable/staging Supabase project before inviting broader beta testers.

### [CP-MILESTONE] | 2026-06-19: Beta polish — auth menu, verify errors, e2e expansion

**The Context & Problem:**
- Pre-beta review found dead dashboard affordances (Add contact, user card), missing sign-out, misleading “Drafts & outbox” map section, verify page false-success on errors, and footer links to non-existent About/Privacy/Changelog pages.

**Design Decisions & Trade-offs:**
- **Choice:** Moved account actions into a sidebar `DashboardUserMenu` (profile link → Settings, explicit Settings + Log out) and removed the duplicate Account nav item.
- **Choice:** Replaced dead “Add contact” with `DashboardInviteCta` that scrolls to `#invite` on the share-link card.
- **Choice:** Renamed map preview to “Where they live” with a link to full map; removed handwritten asides.
- **Choice:** Omitted About/Privacy/Changelog footer links; kept contact email only.

**Implementation Notes:**
- Added `signOut` server action in `lib/actions/user.ts`.
- Fixed verify page to surface `handleVerifyToken` errors with loading/disabled states.
- Expanded e2e: `public-flows.spec.ts` (verify errors, auth redirects), updated `marketing.spec.ts`, deduped security verify test.

**Verification:**
- `npm test` (71), `npm run test:e2e` (8), `npm run build` pass.

