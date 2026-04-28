# App-wide Design System — dearfriends
_Spec date: 2026-04-24_

## Goal

Apply the landing page's design system (paper/ink palette, Newsreader serif, Caveat handwriting, blue-ink primary) consistently across every page and component in the app. The landing page is already done; this spec covers the rest.

## Decisions

| Area | Choice |
|---|---|
| Dashboard character | Crisp linen — slightly cooler off-white, white cards, Newsreader headings, blue-ink sidebar active state |
| Login / reset-password / onboarding | Split layout — ink-dark left panel with envelope art + tagline; form on right |
| Share form | Split layout — cream/paper left panel with sender name + Caveat handwriting; form on right |
| About page | Follows landing page aesthetic (paper background, blue-ink accents) via updated SiteShell |

---

## 1. Design tokens (globals.css + tailwind.config.ts)

This is the foundation. Every downstream change inherits from here.

### Color replacements

| Old token | Old value | New token | New value | Notes |
|---|---|---|---|---|
| `--terra` | `#C05C2E` | `--blue-ink` | `#3358ba` | Primary action color throughout |
| `--terra-dark` | `#9E4A23` | `--blue-mid` | `#3e5da0` | Hover state for primary |
| `--ink` | `#231209` | `--ink` | `#1d2442` | Deep navy, not brown |
| `--ink-muted` | `#7A6352` | `--ink-muted` | `#6b7290` | Muted text |
| `--linen` | `#F5EFE4` | `--linen` | `#F8F3EA` | Crisp linen (dashboard bg) |
| `--surface` | `#FAF7F1` | `--surface` | `#faf4e4` | Paper white (section bg) |
| `--surface-raised` | `#FFFFFF` | _(keep)_ | `#FFFFFF` | Card background stays white |
| `--border` | `#DDD0BC` | `--border` | `#d9cfb0` | Slightly warmer |
| `--sidebar` | `#EDE6D6` | `--sidebar` | `#EDE6D4` | Sidebar background |
| _(new)_ | — | `--cream` | `#E4CE95` | Accent highlight |
| _(new)_ | — | `--blue-slate` | `#516183` | Muted blue-grey |
| _(new)_ | — | `--stamp` | `#b8453b` | Red accent (overdue states) |
### CSS component class updates (globals.css)

- `.btn-primary` — `bg-terra` → `bg-blue-ink`; hover `bg-terra-dark` → `bg-blue-mid`
- `.input` — focus ring `terra` → `blue-ink`
- `.info-chip` — border/text update to blue-ink tones

### Tailwind config updates

- Rename token `terra` → `blue-ink: '#3358ba'` and `terra-dark` → `blue-mid: '#3e5da0'`. Because Tailwind bakes values at build time, all `bg-terra`, `text-terra`, `border-terra`, `hover:bg-terra`, `bg-terra/10`, etc. class names in component files must be search-replaced to `blue-ink` equivalents as part of the same change. A grep for `terra` across `app/` and `components/` will find every instance.
- `ink` value `#231209` → `#1d2442`
- `ink` value `#231209` → `#1d2442`
- `ink-muted` value `#7A6352` → `#6b7290`
- `linen` value `#F5EFE4` → `#F8F3EA`
- Add: `cream: '#E4CE95'`, `blue-slate: '#516183'`, `stamp: '#b8453b'`
- `fontFamily.serif` → `["var(--font-newsreader)", "Georgia", "serif"]` (swap Playfair for Newsreader — already loaded in layout.tsx)

---

## 2. Dashboard layout (app/dashboard/layout.tsx + components/nav-link.tsx)

### Sidebar
- Background: `--sidebar` (#EDE6D4) with right border `--border`
- Brand mark: italic "df" in Newsreader at 13px, color `--blue-ink`
- Active nav icon: `bg-blue-ink text-white` (was `bg-terra text-white`)
- Hover: `hover:bg-blue-ink/10 hover:text-blue-ink` (was terra)
- Avatar at bottom: gradient `from-blue-ink to-blue-slate`

### Main area
- Background: `--linen` (#F8F3EA) — the crisp linen
- `surface-panel` class: white cards, `--border` borders

### nav-link.tsx
- Active: `bg-blue-ink text-white`
- Hover: `hover:bg-blue-ink/10 hover:text-blue-ink`

---

## 3. Auth pages (login, reset-password, onboarding)

### Login + reset-password: split layout

Both pages get the same two-panel structure. On mobile (<768px) the left panel collapses to a slim top bar showing just the brand mark and tagline.

**Left panel (40% width, min-height: 100vh)**
- Background: `--ink` (#1d2442)
- Dot-grid texture: `radial-gradient(rgba(228,206,149,.06) 1px, transparent 1px)` at 4px
- Centered vertically: envelope art (same as landing hero — stripes, stamp, postmark) at ~120px wide, rotated slightly
- Tagline below in Newsreader italic: _"keep up with the people you love"_ in `--paper` color, 20px
- Brand mark: "dearfriends" in Newsreader at bottom of panel, cream color

**Right panel (60% width)**
- Background: `--linen`
- Centered form, max-width 360px
- Heading in Newsreader, 30px: "Welcome back" / "Create an account" / etc.
- Subtext in DM Sans 14px, `--ink-muted`
- Inputs: existing `.input` class (updated tokens)
- Primary button: existing `.btn-primary` (updated to blue-ink)
- Mode-switching links: same logic as current, styled in `--ink-muted`

**Success state (email sent):** full-screen paper background, centered envelope art, Newsreader heading "Check your inbox."

### Onboarding page
- No split needed — single focused question
- Background: `--linen`
- Replace `<Postmark />` icon (currently terra) with updated blue-ink postmark
- Heading in Newsreader

---

## 4. Share form (components/share-form.tsx)

### Split layout

**Left panel (38% width)**
- Background: `--surface` (#faf4e4) with grain texture
- Top third: envelope art at ~100px wide, same as login left panel but without the dark background
- Sender byline: small "from" label in DM Sans caps, then sender name in Newsreader italic at 24px, `--blue-ink`
- Below: a short Caveat handwritten note: _"Can't wait to send you something ✉"_ at 16px, `--ink-soft`
- If `senderBio` exists, show it in small DM Sans below
- Border-right: `1px solid --border`

**Right panel (62% width)**
- Background: white
- Centered form, max-width 420px, padding 32px
- Heading: "Share your address" in Newsreader 26px
- Subtext: personalized copy in DM Sans 14px
- All existing form fields preserved exactly — only styling updated
- Submit button: `.btn-primary` (blue-ink)

**Mobile (< 768px):** single column — left panel becomes a slim top card (cream background, sender name, no art), form stacks below.

**Success state:** centered on paper background, envelope art, Newsreader heading "Sealed & sent.", warm confirmation text. Note form (if shown) gets a paper card style.

---

## 5. About page + SiteShell + MarketingNav

### SiteShell (components/site-shell.tsx)
- Background: `--surface` (paper)
- Footer: `--border` top border, Newsreader brand mark, `--ink-muted` links
- Replaces `<MarketingNav />` with `<LandingNav />` (already built) so the about page gets the same nav as the landing page

### About page (app/about/page.tsx)
- `font-serif` headings now render in Newsreader (inherits from tailwind config change — no file edits needed beyond token updates)
- Replace all `terra` references with `blue-ink`: icon backgrounds (`bg-terra/10 text-terra` → `bg-blue-ink/10 text-blue-ink`), CTA section (`bg-ink` stays, links use paper/blue-ink)
- `<Postmark />` icon: updated to blue-ink (via postmark component change)
- `.info-chip` updates inherit from globals.css

---

## 6. UI components

### components/ui/postmark.tsx
- Border: `border-blue-ink` (was `border-terra`)
- Icon color: `text-blue-ink` (was `text-terra`)

### components/share-link-card.tsx
- Minor: any `terra` color refs update to `blue-ink`; inherits from token changes

---

## Files changed

| File | Change type |
|---|---|
| `app/globals.css` | Full token + component class overhaul |
| `tailwind.config.ts` | Color and font-family updates |
| `app/dashboard/layout.tsx` | Sidebar color updates |
| `components/nav-link.tsx` | Active/hover state terra → blue-ink |
| `app/(auth)/login/page.tsx` | Split layout rewrite |
| `app/(auth)/auth/reset-password/page.tsx` | Split layout rewrite |
| `app/onboarding/page.tsx` | Token updates, Postmark update |
| `components/share-form.tsx` | Split layout rewrite |
| `components/site-shell.tsx` | LandingNav swap, token updates |
| `components/ui/postmark.tsx` | terra → blue-ink |
| `app/about/page.tsx` | terra → blue-ink refs |

### Not changed
- Dashboard page/compose/export/groups/settings TSX — inherit from token changes automatically
- `components/contact-table.tsx`, `letter-composer.tsx`, etc. — inherit from token changes
- `app/page.tsx` (landing) — already done

---

## Out of scope
- Layout or information architecture changes (same nav, same sidebar structure)
- New features or functional changes
- Mobile responsiveness beyond what's noted in split layout sections
