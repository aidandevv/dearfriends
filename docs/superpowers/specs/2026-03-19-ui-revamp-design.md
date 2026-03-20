# Dear Friends UI Revamp — Design Spec

**Date:** 2026-03-19
**Status:** Approved

## Overview

Revamp the share form, admin dashboard, and compose/template experience to feel minimalist, modern, cozy, and friendly — not like SaaS. The audience is close friends interacting with a personal tool.

**Constraints:** Keep Playfair Display + DM Sans, keep linen/terra color palette. No new dependencies.

---

## Surface 1: Dashboard

**Direction: Notebook (B)**

### Sidebar
- Collapse to 68px icon-only sidebar
- Replace nav links (text + icon) with icon-only buttons (40×40px, rounded-xl)
- Active state: solid `terra` background, white icon
- Vertical "DF" wordmark at top in terra, uppercase, letter-spaced
- User avatar circle at bottom
- Remove the share link panel from the sidebar entirely

### Top bar (replaces the current header section)
- Page title in Playfair serif ("Your friends") + subtitle line (e.g. "12 contacts")
- Share link pill (copy icon + green dot + "Share link") on the right
- Primary action button ("Send verifications") on the right
- Subtle bottom border separating from content

### Stats strip (replaces the three big stat cards)
- Single horizontal strip below the top bar
- Stats displayed inline: number in Playfair 26px + small label below
- Separated by 1px vertical dividers
- Stats: Total · Verified · Print · Digital · Handwrite
- No card borders, no raised backgrounds — flat on the page surface

### Contact list (replaces ContactTable)
- Column headers: Name / Location / Delivery / Group / Status — small uppercase, 10px
- Each row: initials bubble (26px circle, warm tinted bg) + name + city/state + delivery badge + group + verified status
- Row hover: very subtle terra tint background
- Delivery badges: pill shapes — Print (terra tint), Digital (sage tint), Handwrite (sidebar tint)
- No heavy table borders — only thin bottom dividers between rows

### Removal
- Remove the "Dashboard" uppercase eyebrow label
- Remove the separate right-column sidebar with delivery mix cards and schedule form
- Move schedule verification into a settings panel or modal

---

## Surface 2: Share Form

**Mobile-first, clean with personality**

### Header (above the form card)
- Small postmark circle icon (envelope SVG, terra stroke)
- "from [FirstName]" in 11px uppercase tracked text (ink-muted)
- Sender's name in Playfair 26px ("Jamie wants to send you something")
- Tagline in 13px ink-muted, centered, max-width 280px
- No info-chip, no Mail icon, no "Address request" label

### Form card
- White card, rounded-2xl, border + soft shadow on linen background
- Inputs use linen background (`#F5EFE4`) rather than white — warmer feel
- Labels: 10px uppercase, tracked (same as today but without the heavy weight)
- Layout: first/last name row → email → address line 1 → address line 2 (optional) → city/state/zip row
- Submit button: full-width, rounded-full, terra, text "Send my address →"

### Footer
- "Powered by Dear Friends · your address stays private" in 11px ink-muted, centered, below card

### Success state
- Keep existing Postmark + "Sealed & sent." — just ensure it inherits the same warm header style

---

## Surface 3: Compose + Template Picker

### Template picker (replaces color swatch row)
- Each template is a mini card (90×~70px)
- Card shows a small paper-tinted preview area: accent-colored title line + 3–4 gray body lines
- Paper tint background: template's `accentColor` at 6% opacity
- Template name below in 9px centered text
- Selected state: terra border + subtle glow ring
- Horizontally scrollable row (same as today)

### Compose panel
- Remove uppercase "SUBJECT" / "TEMPLATES" / "BODY" labels — replace with inline placeholder text that guides without labeling
- Subject input: clean, no label above it (placeholder: "Subject line")
- Body textarea: same, placeholder guides the user
- Hint row at bottom: `{{first_name}}` and `{{last_name}}` — keep, just de-emphasize

### Preview panel
- Top accent stripe: 3px, gradient from template's `accentColor` to transparent, across the top of the letter card
- "Live preview" badge: sage-tinted pill (not gray border)
- Otherwise unchanged

---

## Color tokens (no changes)

```
linen:          #F5EFE4
surface:        #FAF7F1
surface-raised: #FFFFFF
terra:          #C05C2E
terra-dark:     #9E4A23
ink:            #231209
ink-muted:      #7A6352
border:         #DDD0BC
sage:           #5A7A5A
sidebar:        #EDE6D6
```

---

## Files to change

| File | Change |
|------|--------|
| `app/dashboard/layout.tsx` | Collapse sidebar to icons, remove share link panel, update nav |
| `app/dashboard/page.tsx` | Replace header + stat cards with topbar + stats strip + contact rows |
| `components/contact-table.tsx` | Restyle as address-book rows (initials, lighter columns) |
| `components/share-form.tsx` | New header section, warmer inputs, friendlier CTA |
| `components/letter-composer.tsx` | Remove labels from subject/body, integrate new template picker |
| `components/template-picker.tsx` | Replace swatches with mini letter-preview cards |
| `app/globals.css` | Add any new utility classes needed (stats strip, db-row, etc.) |
