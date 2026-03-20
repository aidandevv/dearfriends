# Custom Share Link — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Admins currently share their address collection form via a UUID-based URL (`/share/[adminId]`). This feature adds a human-readable, customisable share slug so the link is memorable and shareable. The system auto-generates an 8-char alphanumeric code on first use; the admin can optionally override it with a custom slug at any time.

Both the UUID-based URL and the slug-based URL remain active indefinitely.

---

## Data

**Storage:** The slug lives in `raw_user_meta_data.share_slug` on the Supabase auth user record. No new table or migration is required. The existing `getUserProfile` helper is extended to read and expose `share_slug`.

**Auto-generated short code:** An 8-char alphanumeric string (e.g. `x4k9mw2p`). Generated during onboarding or lazily on first dashboard render if `share_slug` is absent. Collision is handled by retrying up to 3 times before surfacing an error.

**Custom slug rules:**
- Pattern: `/^[a-zA-Z0-9_-]{3,30}$/`
- Must be globally unique across all users
- Validated client-side (Zod) and server-side before write

---

## Routing

**New route:** `app/(public)/share/[slug]/page.tsx`
- Resolves the slug to an `adminId` via `resolveSlugToAdminId(slug)`
- Renders `<ShareForm adminId={...} />` identically to the UUID route
- Returns 404 if slug not found

**Existing route:** `app/(public)/share/[adminId]/page.tsx` — unchanged. Both routes coexist; the UUID route is never removed.

**Slug resolution must not clash with UUID route.** Since UUIDs are 36 chars and slugs are max 30 chars (and follow a different character set), there is no ambiguity. They are separate route segments.

---

## Server Actions

### `generateShareSlug(): Promise<string>`
- Generates an 8-char random alphanumeric string
- Calls `supabase.auth.admin.listUsers()` to check for collision on `raw_user_meta_data.share_slug`
- Retries up to 3 times on collision; throws if all retries fail
- Writes the slug to the current user via `supabase.auth.admin.updateUserById`
- Called from onboarding flow or lazily in a dashboard server component

### `updateShareSlug(slug: string): Promise<{ error?: string }>`
- Validates format with Zod (`/^[a-zA-Z0-9_-]{3,30}$/`)
- Checks uniqueness via `listUsers()` scan; returns `{ error: 'slug_taken' }` if already in use
- Writes to `raw_user_meta_data.share_slug` via `updateUserById`
- Used by the Settings form

### `resolveSlugToAdminId(slug: string): Promise<string | null>`
- Calls `auth.admin.listUsers()` and finds user where `raw_user_meta_data.share_slug === slug`
- Returns `user.id` or `null` (→ 404)
- Used by the `/share/[slug]` route

---

## UI

### Dashboard — Share Link card (new)
Location: right sidebar, above or below "Delivery mix" section.

Contents:
- Section heading: "Your share link"
- The full URL (`https://.../share/[slug]`) displayed as styled text
- One-click copy button
- Small "Edit" link → navigates to Settings page

### Settings page — Share link field (extended)
Added below the existing bio field in `<ProfileForm>`:
- Label: "Share link slug"
- Input pre-filled with current slug
- Inline validation: format error shown immediately; uniqueness error returned from server action on submit
- On success: display the new full URL as confirmation

---

## Error Handling

| Scenario | Handling |
|---|---|
| Slug format invalid | Client-side Zod error before submit |
| Slug already taken | Server action returns `slug_taken`; field error shown |
| Slug generation collision (all 3 retries) | Server action throws; dashboard shows a generic error toast |
| `/share/[slug]` not found | Next.js `notFound()` → 404 page |

---

## Out of Scope

- QR code generation
- Slug history / redirect from old slugs when changed
- Per-campaign or multi-slug support
- Admin-facing analytics on share link visits
