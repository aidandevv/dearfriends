# Design Refresh: Landing + Share Pages

**Date:** 2026-06-11
**Branch:** `feat/design-refresh` (off `feat/landing-overhaul`)
**Status:** Approved by Aidan

## Goal

Redesign the landing page and public share page with a cool, minimal,
mobile-first aesthetic (Wispr Flow / Anthropic direction). Move away from
the current yellow-cream palette. The share page is the priority surface —
it is served to friends/family from Instagram-story links on phones. The
landing page doubles as recruiter signal.

Voice: friendly and sincere, toned down from the current whimsy. No
marketing-heavy copy, no SaaS tropes.

## Scope

**In:** `app/page.tsx`, `components/marketing/*`, `components/share-form.tsx`,
`app/globals.css`, `tailwind.config.ts`.
**Out:** All of `lib/`, `app/api/`, auth, dashboard, onboarding, share-page
server logic (`app/(public)/share/[segment]/page.tsx` logic and metadata stay
as-is). No new dependencies. No form-logic changes.

## Design tokens

CSS variables in `globals.css`, mirrored into the Tailwind theme:

| Token | Value | Use |
|-------|-------|-----|
| `--porcelain` | `#F8F9FB` | Page background |
| `--surface` | `#EEF1F6` | Cards, alternate bands |
| `--ink` | `#232940` | Headlines, body text |
| `--ink-soft` | `#4A5168` | Secondary text |
| `--ink-muted` | `#8A91A6` | Captions, labels |
| `--periwinkle` | `#4A6CD4` | Primary actions, links, accents |
| `--periwinkle-deep` | `#3A55AC` | Hover, large-text headings |
| `--peach` | `#E8927C` | Sparing pops: pills, stamp mark |
| `--line` | `#DFE3EC` | Hairline borders, dividers |

- Texture: near-invisible cool dot-grain overlay (slate, ~4% opacity).
- Body text is always `--ink` on porcelain; periwinkle only for accents
  and large type where contrast holds.
- Type: PPWriter (local) for display headlines and pull quotes; DM Sans
  for everything else; Caveat exactly once on the landing, never on the
  share page.

## Landing page

`app/page.tsx` becomes metadata + composition of section components in
`components/marketing/`. Postal personality reduced to subtle nods: a
stamp-shaped wordmark (dashed border, peach) in the nav, dashed section
dividers, one handwritten annotation near the hero CTA. No envelope or
postcard illustration scenes.

Sections:

1. **Nav** — wordmark, "Sign in" ghost button, primary CTA. Sticky with
   backdrop blur on scroll.
2. **Hero** — large serif headline ("Real mail for the people you'd
   miss." direction), one plain sentence, single primary CTA. Below: a
   compact horizontal strip of three minimal UI vignettes connected by a
   dashed line (your link → friend's address card → mailed card).
3. **How it works** — three numbered steps as clean text blocks with thin
   rules, one sentence each.
4. **Your people** — friend-list mock kept but flattened and recolored:
   white card on surface band, simpler rows, periwinkle pills.
5. **Reminders** — soft surface band (dark-blue full-bleed removed), one
   reminder-card mock, two sentences of copy.
6. **Quote** — centered serif pull quote, shortened attribution.
7. **Closing CTA** — serif headline, one sentence, button. "Made by one
   person, for a few hundred friends." as the quiet sign-off line.
8. **Footer** — same structure, recolored.

Motion: fade-up on section entry via a small IntersectionObserver hook,
hover lifts on cards/buttons, all gated on `prefers-reduced-motion`.

Copy: keep the warm personal voice, trim the twee — shorter sentences,
plainer claims, fewer italicized asides.

## Share page

Mobile-first single screen, designed for the Instagram-tap context:

- One centered card (max-w-md) on porcelain. The desktop split-panel
  layout is removed; desktop gets the same card with more whitespace.
- Sender header (~3 lines): periwinkle initial-avatar, "<First> wants to
  mail you something", sender's custom message in italic serif.
- Same fields and logic, regrouped under two small section labels: "You"
  (name, email) and "Where to send it" (address). No per-field uppercase
  label shouting.
- Inputs: 16px font (prevents iOS auto-zoom), 48px touch targets,
  rounded-xl, white with `--line` borders, periwinkle focus rings.
- US/International stays a segmented pill control.
- Note field kept, restyled as a soft surface block.
- Submit: full-width periwinkle button, "Send my address". Success state
  gets a small peach stamp-mark animation and toned-down copy.
- Zero logic changes: `submitPublicContact`, validation, capability
  handling, and metadata generation untouched.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- Playwright screenshots of both pages at 390px and 1440px to confirm
  layout visually.
- Contrast: body text ink-on-porcelain; periwinkle text only at large
  sizes or on white; verify focus states visible.
