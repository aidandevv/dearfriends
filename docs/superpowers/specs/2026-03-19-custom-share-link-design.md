# Custom Share Link — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Admins currently share their address collection form via a UUID-based URL (`/share/[adminId]`). This feature adds a human-readable, customisable share slug so the link is memorable and shareable. The system auto-generates an 8-char alphanumeric code on first use; the admin can optionally override it with a custom slug at any time.

Both the UUID-based URL and the slug-based URL remain active indefinitely. Changing a slug immediately invalidates any previously shared slug links — no redirect is provided. The Settings UI helper text warns the admin of this before saving.

---

## Data

**Storage:** The slug lives in `raw_user_meta_data.share_slug` on the Supabase auth user record. No new table or migration is required.

**`getUserProfile` update:** The `getUserProfile(user)` helper in `lib/user-profile.ts` is extended to read `share_slug` and expose it as `shareSlug: string | null` on the returned `UserProfile` type.

**Auto-generated short code:** An 8-char lowercase alphanumeric string (e.g. `x4k9mw2p`). Collision is handled by retrying up to 3 times before surfacing an error.

**Custom slug rules:**
- Pattern: `/^[a-z0-9_-]{3,30}$/` — lowercase only (input is lowercased before validation and storage)
- Must be globally unique across all users
- Validated client-side (Zod) and server-side before write
- Reserved slugs that cannot be used: `login`, `dashboard`, `share`, `verify`, `about`, `onboarding`, `api`, `settings`, `s`

---

## Routing

**Single catch-all route:** Next.js does not allow two dynamic segment folders at the same level. The existing `app/(public)/share/[adminId]/page.tsx` is replaced by a single `app/(public)/share/[segment]/page.tsx` that discriminates at runtime:

```
is segment a UUID (matches /^[0-9a-f-]{36}$/)?
  → treat as adminId: call getUserById(segment)
  → 404 if user not found
else
  → treat as slug: call resolveSlugToAdminId(segment)
  → 404 if null returned
  → proceed with resolved adminId
```

Both paths render `<ShareForm adminId={...} />` and implement `generateMetadata` identically, passing the resolved `adminId` to `getUserById` for OG tag generation. The canonical OG `url` is the slug URL when the segment is a slug; the UUID URL when the segment is a UUID.

---

## Server Actions

All new server actions live in `lib/actions/user.ts` alongside `updateProfile` and `completeOnboarding`.

### `generateShareSlug(userId?: string): Promise<string>`

- Accepts an optional `userId` parameter. If omitted, resolves identity via `createClient()` (anon client) → `getUser()`. If provided (e.g. when called from `completeOnboarding` where the user id is already known), skips the `getUser()` round trip.
- Uses the **service-role** client (`createServiceClient`) for all admin operations
- Generates an 8-char random lowercase alphanumeric string
- Scans all users for collisions: calls `supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })`, increments `page` until `users.length < perPage`
- Retries up to 3 times on collision; throws if all retries fail
- Fetches the user's current metadata via `supabase.auth.admin.getUserById(userId)`, then merges: `supabase.auth.admin.updateUserById(userId, { data: { ...existingUserMetadata, share_slug } })`
- Called at the end of `completeOnboarding` as `generateShareSlug(userId)` (passing the already-known user id) **and** lazily from the dashboard server component when `shareSlug` is null (no-arg form)

**Lazy generation in the dashboard:** `DashboardPage` fetches the user profile by calling `createClient().auth.getUser()` and passing the result through `getUserProfile()` (the same helper used on the settings page). If `profile.shareSlug` is null, it calls `generateShareSlug()` (no-arg). If generation throws, the Share Link card renders a fallback state ("Your link is being set up — refresh to try again") instead of crashing the page.

### `updateShareSlug(slug: string): Promise<{ error?: string }>`

- Resolves the calling user's identity via `createClient()` (anon client) → `getUser()`
- Uses the **service-role** client for all admin operations
- Lowercases the input before validation
- Validates format with Zod (pattern + reserved slug list)
- Scans all users (paginating as above), excluding the calling user's own `id`, for an existing `share_slug` match; returns `{ error: 'slug_taken' }` if found
- Fetches the user's current metadata via `supabase.auth.admin.getUserById(userId)`, then merges: `supabase.auth.admin.updateUserById(userId, { data: { ...existingUserMetadata, share_slug } })`
- Calls `revalidatePath('/dashboard')` and `revalidatePath('/dashboard/settings')` on success

### `resolveSlugToAdminId(slug: string): Promise<string | null>`

- Uses the **service-role** client
- Lowercases the input before comparison
- Scans all users (paginating as above) for `raw_user_meta_data.share_slug === slug`
- Returns `user.id` or `null`
- Used by `app/(public)/share/[segment]/page.tsx` on non-UUID segments
- Note: called during both page render and `generateMetadata` — the cost (full user scan) is acceptable at current scale

---

## UI

### Dashboard — Share Link card (new)

**File:** `components/share-link-card.tsx`

The component is split at the server/client boundary:
- Outer server component: fetches/passes the slug URL as a prop
- Inner `<CopyButton url={...} />` client component: handles clipboard API

**Location:** Right sidebar of `app/dashboard/page.tsx`, as the first card (above "Delivery mix").

**Contents:**
- Section heading: "Your share link"
- Full URL (`https://.../share/[slug]`) displayed as styled text
- `<CopyButton>` for one-click clipboard copy
- Small "Edit" link → `/dashboard/settings`
- Fallback state if `shareSlug` is null after lazy generation fails: muted text "Your link is being set up — refresh to try again"

### Settings page — Share link field (extended)

**File:** `components/profile-form.tsx` — extend the existing component.

The slug field is a **separate mini-form** rendered below the existing profile form. It has its own "Save slug" submit button and calls `updateShareSlug` independently. It does not share the main profile form's submit handler.

- Label: "Share link slug"
- Helper text: "This is the link you share with people. Changing it will break any previously shared links."
- Input pre-filled with current slug; lowercased on change
- Inline Zod validation on blur (format + reserved slug check)
- On submit: calls `updateShareSlug`; shows `slug_taken` field error or success confirmation with the new full URL
- Submit button disabled when value matches the current slug (no change)

---

## Error Handling

| Scenario | Handling |
|---|---|
| Slug format invalid | Client-side Zod error before submit |
| Slug is a reserved word | Client-side Zod error before submit |
| Slug already taken | Server action returns `slug_taken`; field error shown inline |
| Slug generation collision (all 3 retries) | `generateShareSlug` throws; dashboard card shows fallback state |
| `/share/[segment]` not found (UUID or slug) | `notFound()` → Next.js 404 page |
| `listUsers()` pagination | All scanning functions loop incrementing `page` from 1 until `users.length < perPage` |

---

## Out of Scope

- QR code generation
- Redirect from old slug when slug is changed
- Per-campaign or multi-slug support
- Admin-facing analytics on share link visits
