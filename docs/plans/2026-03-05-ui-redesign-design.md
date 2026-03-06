# UI Redesign Design Doc
Date: 2026-03-05

## Overview

Full visual overhaul of NomadMail (dearfriends). The design language is warm & personal — linen + terracotta palette, Playfair Display headings, DM Sans body. Every surface gets redesigned. Public pages (share, verify) get the most crafted treatment since friends see them; admin pages get equal warmth with functional structure preserved.

---

## Design Tokens

CSS custom properties defined in `globals.css`:

```css
--linen: #F5EFE4;        /* page backgrounds */
--surface: #FAF7F1;      /* cards, inputs */
--surface-raised: #FFFFFF; /* elevated elements */
--terra: #C05C2E;        /* primary accent, CTAs */
--terra-dark: #9E4A23;   /* hover states */
--ink: #231209;          /* primary text */
--ink-muted: #7A6352;    /* secondary text, labels */
--border: #DDD0BC;       /* dividers, input borders */
--sage: #5A7A5A;         /* success states */
--sidebar: #EDE6D6;      /* dashboard sidebar */
```

---

## Typography

- **Headings / display:** Playfair Display (Google Fonts, weights 400 + 700)
- **Body / UI:** DM Sans (Google Fonts, weights 400 + 500)
- Applied via `next/font/google`, injected as CSS variables into `layout.tsx`
- Tailwind `fontFamily` extended: `serif: ['Playfair Display']`, `sans: ['DM Sans']`

---

## Shared Components

### Postmark Motif
Pure CSS decorative element — a circle with dashed/wavy border in terracotta, used above headings on public pages and the login page. Signals "something in the mail."

### Input Style
- Background: `--surface`
- Border: 1px solid `--border`
- Border-radius: `rounded-lg`
- Focus: ring-2 in `--terra` at 40% opacity
- Label: DM Sans, small, `--ink-muted`, sits above field

### Button — Primary
- Background: `--terra`, hover: `--terra-dark`
- Text: white, DM Sans medium
- Border-radius: `rounded-full`
- Optional Lucide icon left of label

### Button — Outlined
- Border: 1px solid `--border`
- Background: transparent, hover: `--surface`
- Same radius and font

### Pill Badge
- `digital`: terracotta background, white text
- `print`: ink background, white text
- `handwrite`: sage background, white text
- Small, rounded-full, DM Sans xs

---

## Page Designs

### `/share/[adminId]` — Public Share Form

- Full `--linen` background, min-h-screen, centered column, max-w-md
- Top: postmark motif (terracotta)
- Heading: Playfair Display, large — "Share your address"
- Subtext: DM Sans, `--ink-muted` — "is putting together something special and would love to send it your way."
- Form fields with labels above, warm border/focus style
- Address line 2 visually de-emphasized (lighter label, optional note)
- Submit: full-width, terracotta, rounded-full, envelope icon (Lucide `Mail`)
- Success state: postmark motif, Playfair "Sealed & sent.", brief warm note

### `/verify/[token]` — Verification Page

- Same linen base, postmark motif, max-w-md centered
- Three stacked options:
  - "Yes, my address is correct" — terracotta filled button
  - "No, I need to update it" — outlined button
  - "Opt out of future mailings" — small text link, `--ink-muted`
- Update form slides in inline, same field style as share form
- Completion states: Playfair confirmation message, warm subtext

### `/login` — Admin Login

- Linen background, centered card (`--surface`, rounded-2xl, warm shadow)
- Wax seal icon above heading (Lucide `Stamp` or custom CSS circle)
- Playfair heading: "Welcome back"
- Email input + full-width terracotta button
- Sent state: Lucide `Mail` icon, Playfair "Check your inbox", DM Sans subtext

### `/dashboard` — Contacts

- Layout: left sidebar (220px, `--sidebar`) + main content area (`--linen` background)
- Sidebar: app wordmark in Playfair at top, nav links with terracotta dot for active state, user email at bottom
- Main: white-ish surface card floating on linen background
- Contact list: card-per-row layout — name in Playfair, address + tags in DM Sans, delivery method as pill badge
- Verification panel: inset surface card, clean separation from contact list

### `/dashboard/compose` — Letter Composer

- 50/50 split layout
- Left (editor): `--surface` background, monospace textarea for markdown, DM Sans labels
- Right (preview): styled as a letter — `--surface-raised` card, drop shadow, Playfair for rendered body, decorative horizontal rule at top

### `/dashboard/export` — Export & Send

- Three sections as warm surface cards
- Section icons from Lucide: `FileText` (CSV), `FileDown` (PDF), `Send` (digital)
- Terracotta icon color
- Buttons consistent with global outlined/primary style

---

## Implementation Notes

- Install `next/font/google` for Playfair Display + DM Sans; no external CDN
- Lucide React already available via shadcn; add `lucide-react` if not present
- Tailwind config extended with font families and color tokens
- CSS variables defined in `:root` in `globals.css`
- No new dependencies beyond fonts and possibly `lucide-react`
- All existing server actions and data flow preserved — this is purely a UI layer change
