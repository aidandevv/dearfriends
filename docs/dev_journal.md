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

---

<!-- SESSION: 2026-06-20 02:36 | Vercel pnpm lockfile deployment fix -->

### [CP-DEBUG] | 2026-06-20: Vercel frozen pnpm lockfile mismatch

**Summary:** Vercel deployment failed before build because `package.json` had gained map/geography/testing packages and `eslint-config-next@15.0.7`, while `pnpm-lock.yaml` still reflected the older dependency specifier set. Regenerated the pnpm lockfile with the repo-declared `pnpm@9.15.0`, scoped to this package so the parent workspace did not interfere.

**Files/Modules Affected:** `pnpm-lock.yaml`.

**Key Trade-off:** Kept the fix to the pnpm lockfile that Vercel actually uses instead of changing package specs or package-manager configuration during a deployment repair.

**Evidence:** `corepack pnpm install --frozen-lockfile --lockfile-only --ignore-workspace`, `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/vitest run`, `./node_modules/.bin/next build`, and `git diff --check` all passed.

**Follow-ups:** Commit and push the lockfile change so Vercel rebuilds from a package/lockfile pair that satisfies frozen install.

---

### [CP-DEBUG] | 2026-06-20: Redesign merge-readiness dashboard auth guard

**Summary:** Merge readiness against refreshed `origin/main` passed conflict, frozen-install, unit, build, typecheck, and browser smoke checks, but Playwright exposed a dashboard server error during the unauthenticated redirect path. Added a page-level `/dashboard` auth guard so the route redirects before loading dashboard data.

**Files/Modules Affected:** `app/dashboard/page.tsx`, `docs/dev_journal.md`.

**Key Trade-off:** Kept the fix narrowly scoped to the route that emitted the error instead of broadening auth changes across every dashboard action during a merge-readiness pass.

**Evidence:** `git merge-tree --write-tree origin/main HEAD`, `corepack pnpm install --frozen-lockfile --lockfile-only --ignore-workspace`, `./node_modules/.bin/next build`, `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/playwright test`, and `./node_modules/.bin/vitest run` passed after the guard. The first parallel `tsc` rerun failed only because `next build` was regenerating `.next/types`; rerunning after build passed.

**Follow-ups:** Commit and push the dashboard guard before merging the redesign branch into `main`; leave `.playwright-cli/` untracked local scratch out of the merge.

---

### [CP-FEATURE] | 2026-06-20: Mail-by bars on calendar grid

**Summary:** Restyled mail-by reminders on `/dashboard/calendar` from stacked card chips to full-width horizontal event bars (Google/Apple calendar all-day style). Stamp-colored bars span edge-to-edge within each day cell; occasion dates use matching periwinkle bars.

**Files/Modules Affected:** `components/calendar-manager.tsx`.

**Key Trade-off:** Kept single-day bars on the mail-by date rather than spanning mail-by → occurrence as a multi-day range, since the feature is anchored to one deadline date.

**Evidence:** `next build` passed after the change.

---

<!-- SESSION: 2026-06-20 17:19 | globe city pins -->

### [CP-REFACTOR] | 2026-06-20: Shared coordinate normalization for globe city pins

**Summary:** Started the globe pin work at the city level by extracting the existing map coordinate filtering into `contactsWithCoordinates()`. The dashboard globe now groups city pins from the same persisted `lat`/`lng` normalization path the map uses, keeping the later friend-name tooltip pass focused on presentation rather than coordinate plumbing.

**Files/Modules Affected:** `lib/geocode.ts`, `components/globe-panel.tsx`, `lib/geocode.test.ts`.

**Key Trade-off:** Reused persisted coordinates instead of introducing client-side geocoding or changing the dashboard contact query. Friend names remain deferred until the city-pin rendering path is verified.

**Evidence:** `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/vitest run lib/geocode.test.ts`, and `./node_modules/.bin/vitest run` passed.

**Follow-ups:** Verify the globe visually with real/staging contact coordinates, then pass friend identity data into `GlobePanel` for name-level tooltip pins.

---

<!-- SESSION: 2026-06-20 17:29 | globe drag sensitivity -->

### [CP-DEBUG] | 2026-06-20: Zoom-aware globe drag sensitivity

**Summary:** Tuned the dashboard globe so drag rotation and release momentum scale down when the user zooms in. This keeps close-up navigation from feeling like the same wide-view drag force is being applied to a magnified globe.

**Files/Modules Affected:** `components/globe-panel.tsx`.

**Key Trade-off:** Preserved the existing base drag feel at default and zoomed-out levels, then reduced degrees-per-pixel only once zoom exceeds 1x instead of rewriting the interaction model.

**Evidence:** `./node_modules/.bin/tsc --noEmit` passed.

**Follow-ups:** Manually feel-test the globe with real/staging contacts at high zoom to tune the sensitivity curve if it still feels too fast or too slow.

> **[CROSS-LOG]** Product impact logged in `./docs/product_insights.md` - see [PI-UX-FRICTION] | 2026-06-20: Zoomed globe dragging felt overpowered.

---

### [CP-REFACTOR] | 2026-06-21: Restore handwrite delivery with clearer DIY copy

**Summary:** Reverted the mistaken removal of the `handwrite` delivery method. UI now labels it **Write by hand** (vs **Print at home** and **Digital**) with hints that physical mail is always user-handled. Handwrite contacts regain Avery CSV export and letter PDF export (reference while penning cards). Deleted unapplied migration `011_remove_handwrite_delivery.sql`. Centralized labels in `lib/delivery-methods.ts` and tightened marketing/export copy so Dear Friends is framed as address book + composer, not a mailing SaaS.

**Files/Modules Affected:** `lib/delivery-methods.ts`, `lib/schemas.ts`, `lib/export-contacts.ts`, `components/contact-table.tsx`, `components/export-panel.tsx`, `components/ui/pill-badge.tsx`, `app/dashboard/page.tsx`, `app/api/export/csv/route.ts`, `app/api/export/pdf/route.ts`, marketing pages, `CLAUDE.md`.

**Key Trade-off:** Kept DB value `handwrite` for compatibility while changing all user-facing strings; PDF export now includes both physical-mail methods in one download rather than separate flows.

**Evidence:** `npm test` (77 passed) and `npm run typecheck` passed.

---

<!-- SESSION: 2026-06-21 17:50 | Supabase security remediation -->

### [CP-CONSTRAINT] | 2026-06-21: Harden Supabase cross-tenant relationship boundaries

**Summary:** Fixed all four Supabase audit findings by enforcing same-admin relationship checks for contact groups and calendar events, moving privileged share-slug helpers out of the exported server-action module, and pinning calendar subscription HTTPS requests to the address that passed SSRF validation.

**Files/Modules Affected:** `lib/actions/groups.ts`, `lib/actions/calendar.ts`, `lib/actions/user.ts`, `lib/share-slugs.ts`, `lib/calendar-subscription.ts`, `supabase/migrations/011_harden_cross_tenant_relationships.sql`, and focused security regression tests.

**Key Trade-off:** Added both application-level checks and database triggers/policies because service-role reminder jobs can bypass RLS and should not trust relationship rows that only UI code validated.

**Evidence:** `./node_modules/.bin/vitest run lib/actions/groups-security.test.ts lib/actions/calendar-security.test.ts lib/actions/user-security.test.ts lib/calendar-subscription.test.ts supabase/migrations/security-policies.test.ts`, `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/vitest run`, and `./node_modules/.bin/next build` passed.

**Follow-ups:** Apply the new migration to Supabase and confirm live migration history with `select * from supabase_migrations.schema_migrations order by version;`.

---

<!-- SESSION: 2026-06-22 18:43 | resend email branding -->

### [CP-REFACTOR] | 2026-06-22: Shared branded shell for Resend emails

**Summary:** Centralized Resend email branding in `lib/resend.ts` with a table-based Dear Friends wrapper, shared button styling, and branded footer treatment. Verification, digital letter, note notification, address refresh, calendar reminder, anniversary reminder, and birthday digest builders now share the same transactional email frame.

**Files/Modules Affected:** `lib/resend.ts`, `lib/resend.test.ts`.

**Key Trade-off:** Wrapped even user-composed digital letters with a minimal "Sent with Dear Friends" footer so every Resend delivery has consistent product provenance, while leaving the letter body content rendered from the existing markdown path.

**Evidence:** `./node_modules/.bin/vitest run lib/resend.test.ts` passed. `./node_modules/.bin/tsc --noEmit` and a full `./node_modules/.bin/vitest run` were attempted but are currently blocked by unrelated dirty-worktree state-validation work: `lib/us-states.ts(62,29)` fails typecheck, and the full suite has fixture drift in `lib/actions/contacts.test.ts` and `lib/actions/verification.test.ts`.

**Follow-ups:** Re-run the full suite after the in-progress state-schema changes are reconciled.

> **[CROSS-LOG]** Product impact logged in `./docs/product_insights.md` - see [PI-TRUST] | 2026-06-22: Branded lifecycle emails reinforce recipient trust.

---

<!-- SESSION: 2026-06-22 18:43 | dashboard globe and calendar cleanup -->

### [CP-MILESTONE] | 2026-06-22: Dashboard globe hover, state validation, and calendar deletion

**Summary:** Tightened three dashboard/address workflows in one pass: globe tooltips now use stable projected-pin hit testing instead of transient per-frame SVG hover targets, U.S. state entry is constrained by shared select options plus server-side normalization, and calendar dates/sources can be deleted while the dashboard widget only surfaces relevant upcoming mail-by nudges.

**Files/Modules Affected:** `components/globe-panel.tsx`, `components/calendar-manager.tsx`, `components/calendar-widget.tsx`, `components/share-form.tsx`, `components/contact-edit-form.tsx`, `app/(public)/verify/[token]/page.tsx`, `lib/actions/calendar.ts`, `lib/schemas.ts`, `lib/us-states.ts`, and focused tests.

**Key Trade-off:** Kept international regions freeform while making domestic U.S. state data strict; calendar source deletion explicitly removes imported events before deleting the source because the current FK would otherwise orphan events.

**Evidence:** `./node_modules/.bin/vitest run lib/schemas.test.ts lib/actions/contacts.test.ts lib/actions/calendar-security.test.ts`, full `./node_modules/.bin/vitest run`, `./node_modules/.bin/tsc --noEmit`, and `./node_modules/.bin/next build` passed.

**Follow-ups:** Consider a small confirmation affordance for destructive calendar deletes if users start managing larger imported calendars.

> **[CROSS-LOG]** Product impact logged in `./docs/product_insights.md` - see [PI-UX-FRICTION] | 2026-06-22: Dashboard utility controls need direct cleanup paths.

---
