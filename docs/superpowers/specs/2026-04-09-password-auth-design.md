# Password Authentication Design

## Overview

Add email/password sign-up and sign-in alongside the existing magic link flow on the `/login` page, plus a forgot/reset password flow. No database migrations needed — Supabase Auth handles user credential storage natively.

## Login Page (`/login`)

The existing magic-link-only login page becomes a multi-mode form with three states managed via client-side state (no separate routes for sign-in vs sign-up):

### Sign-In Mode (default)

- Email input
- Password input
- "Sign in" primary button — calls `supabase.auth.signInWithPassword({ email, password })`
- "Forgot password?" link below the form — switches to forgot-password mode
- "Send magic link instead" secondary link — switches to magic-link mode
- "Don't have an account? Sign up" link — switches to sign-up mode

### Sign-Up Mode

- Email input
- Password input (minimum 8 characters)
- Confirm password input (must match)
- "Create account" primary button — calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
- "Send magic link instead" secondary link — switches to magic-link mode
- "Already have an account? Sign in" link — switches back to sign-in mode

After signup, Supabase sends a confirmation email. The user clicks the link, hits `/auth/callback`, and is redirected to `/onboarding` (same flow as magic link).

### Magic Link Mode

- Email input
- "Send magic link" primary button — calls `supabase.auth.signInWithOtp()` (existing behavior)
- "Sign in with password" link — switches back to sign-in mode

### Sent Confirmation State

After sending a magic link or signup confirmation, show the existing "Check your inbox" confirmation UI.

## Forgot Password Flow

### Forgot Password Mode (on `/login`)

Not a separate route — another state on the login page:

- Email input
- "Send reset link" primary button — calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/reset-password' })`
- "Back to sign in" link
- After submit, show confirmation: "Check your inbox for a password reset link"

### Reset Password Page (`/auth/reset-password`)

New page at `app/(auth)/auth/reset-password/page.tsx`:

- New password input (minimum 8 characters)
- Confirm new password input
- "Update password" primary button — calls `supabase.auth.updateUser({ password })`
- On success, redirect to `/dashboard`
- On error, display error message

The user arrives here after clicking the reset link in their email. Supabase handles the token exchange via the URL hash — the `@supabase/ssr` client picks up the session automatically.

## Callback Route Changes

Modify `app/(auth)/auth/callback/route.ts`:

- After exchanging the code for a session, check `searchParams.get('type')`
- If `type === 'recovery'`, redirect to `/auth/reset-password` instead of dashboard/onboarding
- All other flows (magic link, signup confirmation) continue to route based on onboarding status as today

## Validation Rules

- Password minimum length: 8 characters (enforced client-side; Supabase also enforces server-side with its configured minimum)
- Confirm password must match password
- Email must be valid (HTML `type="email"` + `required`)
- Display Supabase error messages as-is for: invalid credentials, email already registered, rate limiting, etc.

## Error Handling

- `signInWithPassword` failure: show "Invalid email or password"
- `signUp` with existing email: show Supabase's error (typically "User already registered")
- `resetPasswordForEmail`: always show success message (don't leak whether email exists)
- `updateUser` failure on reset page: show error message, keep form active

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/(auth)/login/page.tsx` | Modify | Add password sign-in/sign-up forms, mode switching, forgot password mode |
| `app/(auth)/auth/reset-password/page.tsx` | Create | New password entry after clicking reset email link |
| `app/(auth)/auth/callback/route.ts` | Modify | Handle `type=recovery` redirect to reset-password page |

## What Stays the Same

- `middleware.ts` — no changes needed, auth redirect logic is unchanged
- `lib/supabase/client.ts` and `lib/supabase/server.ts` — no changes needed
- `lib/user-profile.ts` — no changes needed
- Database schema — no migrations needed
- Onboarding flow — password-registered users go through the same onboarding as magic link users
