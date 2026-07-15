# User Flow Reliability and Quality-of-Life Implementation Plan

**Status:** Proposed

**Goal:** Make every core Dear Friends workflow honest about persistence, safer around bulk actions, easier to use with keyboard/touch/assistive technology, and better covered by authenticated end-to-end tests before adding lower-priority delight.

**Primary outcome:** A user can collect an address, organize it, compose a letter, plan a date, export or send, and verify an address without silent failures, ambiguous audiences, inaccessible controls, or mobile dead ends.

**Tech stack:** Next.js App Router, React server actions, Supabase, Zod, Vitest, Playwright, Tailwind CSS.

---

## Scope and sequencing

This plan is intentionally ordered by product risk:

1. Persistence and mutation truthfulness.
2. Bulk-send and verification guardrails.
3. Recipient verification correctness.
4. Accessibility and mobile resilience.
5. Quality-of-life improvements.
6. Authenticated flow coverage and final release verification.

The reliability phases are release-blocking. The quality-of-life phase can ship separately after the first four phases are stable.

### In scope

- Honest pending, saved, dirty, success, and error states.
- Error handling and rollback for contact and group mutations.
- Audience previews for digital sends and verification batches.
- Timezone-correct scheduled verification.
- Prefilled and international-capable public address verification.
- Persistent labels, linked errors, live status announcements, keyboard access, and touch targets.
- A usable mobile calendar experience and local-date correctness.
- Contact search/filtering, direct invite copying, group counts, deterministic composer preview, and export counts.
- Authenticated Playwright coverage using a dedicated test account.

### Out of scope

- A visual redesign or new design system.
- New delivery channels or a physical-mail fulfillment service.
- Analytics, billing, or multi-user/team accounts.
- Full draft version history; this plan adds recovery and truthful save state, not collaborative editing.
- Automatic sending from E2E tests.
- Replacing Supabase, Resend, or the current App Router architecture.

---

## Product and engineering principles

1. **Never show success without checking the server result.** Every client mutation consumes the returned `error` or `success` value.
2. **Prefer confirmed state over fragile optimistic state.** Use optimistic UI only when a rollback path exists and is tested.
3. **Preview high-consequence actions.** Bulk sends show audience, count, subject, group, and failure behavior before execution.
4. **Keep capability boundaries intact.** The verification token may reveal only the contact and sender context required by that public flow.
5. **Use date-only values as date-only values.** Calendar display code must not derive local calendar dates through UTC ISO conversion.
6. **Accessibility is part of completion.** A visible control is incomplete until it has a usable keyboard path, accessible name, error relationship, and appropriate target size.
7. **Keep fast actions near the task; keep configuration in Settings.** Dashboard cards expose copy/view actions, while durable share-link and message editing lives in one settings section.

---

## Shared interaction contract

Do not standardize every historical action in one large refactor. Introduce a small shared contract for the flows touched by this plan and migrate only those actions.

```ts
export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type ActionState = 'idle' | 'dirty' | 'pending' | 'saved' | 'error'
```

Client behavior:

- `pending`: disable only controls participating in the current action.
- `saved`: announce success with `role="status"` or `aria-live="polite"`.
- `error`: preserve user input, show a retry path, and announce with `role="alert"`.
- destructive failures: leave the item visible and unchanged.
- optimistic changes: restore the previous value on failure.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `lib/action-result.ts` | Create | Shared result and action-state types for touched flows |
| `components/ui/action-feedback.tsx` | Create | Accessible saved/error/pending feedback |
| `components/ui/confirm-dialog.tsx` | Create | Reusable, focus-managed review/confirmation dialog |
| `components/letter-composer.tsx` | Modify | Truthful autosave, explicit save, dirty/error recovery, labeled fields |
| `lib/actions/letter.ts` | Modify | Consistent result contract and delivery audience summary |
| `lib/actions/contacts.ts` | Modify | Consistent mutation results where required |
| `components/contact-table.tsx` | Modify | Per-row feedback, larger named actions, failure handling |
| `components/contact-group-select.tsx` | Modify | Controlled accessible picker with rollback and preloaded membership |
| `lib/actions/groups.ts` | Modify | Batch membership data, counts, consistent mutation results |
| `components/groups-manager.tsx` | Modify | Error-safe group actions, labels, copy/view actions, counts |
| `app/dashboard/page.tsx` | Modify | Pass membership map, invite URL, and verification audience count |
| `components/share-link-card.tsx` | Modify | Quick copy/view card without advanced editing |
| `components/share-link-actions.tsx` | Modify | Clipboard failure handling and live feedback |
| `components/dashboard-invite-cta.tsx` | Modify | Direct invite copy instead of scroll-only behavior |
| `components/profile-form.tsx` | Modify | Consolidated share slug/message configuration and accessible status |
| `components/onboarding-form.tsx` | Modify | Capture the user timezone during first-run setup |
| `components/time-zone-sync.tsx` | Create | Sync an existing user’s browser timezone into metadata and refresh date surfaces |
| `lib/user-profile.ts` | Modify | Expose the saved IANA timezone from user metadata |
| `lib/actions/user.ts` | Modify | Validate and persist timezone metadata |
| `components/send-verification-button.tsx` | Modify | Audience review dialog and partial-failure details |
| `components/schedule-verification-form.tsx` | Modify | Future-date validation, loading state, timezone conversion/display |
| `lib/actions/verification.ts` | Modify | Verification context loader, normalized results, international updates |
| `lib/schemas.ts` | Modify | International verification and absolute scheduled-time schemas |
| `lib/schemas.test.ts` | Modify | Schema regression coverage |
| `app/(public)/verify/[token]/page.tsx` | Rewrite as server wrapper | Validate token and provide minimal recipient context |
| `components/verification-form.tsx` | Create | Prefilled accessible verification client flow |
| `components/calendar-manager.tsx` | Modify | Local dates, agenda mode, day details, labels, edit/delete safety |
| `lib/calendar-date.ts` | Create | Date-only and local-calendar helpers |
| `lib/calendar-date.test.ts` | Create | Timezone-boundary regression tests |
| `components/contact-map.tsx` | Modify | Tap/click popups and accessible list fallback |
| `app/dashboard/compose/page.tsx` | Modify | Deterministic preview-recipient list |
| `app/dashboard/export/page.tsx` | Modify | Fetch export/send summary server-side |
| `components/export-panel.tsx` | Modify | Counts, empty states, audience review, partial-failure recovery |
| `components/contact-filters.tsx` | Create | Search, status, delivery, and group filters |
| `e2e/fixtures/auth.ts` | Create | Dedicated authenticated test fixture |
| `e2e/authenticated-flows.spec.ts` | Create | Core authenticated workflow coverage |
| `e2e/accessibility-flows.spec.ts` | Create | Keyboard, labels, focus, and status coverage |
| `README.md` | Modify | Document E2E account variables and safe test behavior |

---

## Phase 1: Truthful persistence and mutation recovery

### Task 1: Add the shared result and feedback primitives

**Files:**

- Create `lib/action-result.ts`
- Create `components/ui/action-feedback.tsx`
- Create `components/ui/confirm-dialog.tsx`
- Add focused component tests if the repository introduces a component-test pattern; otherwise cover behavior in Playwright.

**Steps:**

- [ ] Define `ActionResult<T>` and `ActionState`.
- [ ] Build `ActionFeedback` with polite success/pending announcements and assertive error announcements.
- [ ] Build a native `<dialog>`-based confirmation component with:
  - focus moved to the dialog on open;
  - Escape and Cancel support;
  - focus returned to the trigger;
  - explicit confirm/cancel labels;
  - optional destructive styling;
  - a pending state that prevents duplicate confirmation.
- [ ] Keep visual styling within existing `surface-panel`, `btn-primary`, and `btn-outline` patterns.

**Acceptance criteria:**

- Success and errors are announced without moving focus unexpectedly.
- Confirmation dialogs are fully keyboard-operable.
- No existing visual token or layout system is replaced.

**Checkpoint commit:** `feat: add accessible action feedback primitives`

---

### Task 2: Make composer autosave truthful and recoverable

**Files:**

- Modify `components/letter-composer.tsx`
- Modify `lib/actions/letter.ts`
- Add `components/letter-composer.test.tsx` only if the current Vitest setup supports client component interaction without new infrastructure; otherwise cover via E2E.

**Steps:**

- [ ] Make `saveDraft` return the shared result contract.
- [ ] Track the last successfully persisted `{subject, body}` snapshot.
- [ ] Derive `dirty` by comparing the current draft with that snapshot.
- [ ] Replace the unconditional “Saved” state with `dirty`, `pending`, `saved`, and `error` states.
- [ ] When subject is empty, show “Add a subject to save” and never imply persistence.
- [ ] Add an explicit `Save now` button that remains available when autosave fails.
- [ ] Preserve the draft contents after an error and provide Retry.
- [ ] Add a navigation/unload warning while the draft is dirty; clear it immediately after a confirmed save.
- [ ] Label the subject field, template picker, formatting toolbar, and body editor persistently.
- [ ] Give the save status a polite live region.
- [ ] Do not change markdown, email, or PDF rendering behavior.

**Acceptance criteria:**

- A failed save never displays “Saved.”
- A blank-subject draft visibly explains why it has not persisted.
- A user can retry without losing content.
- A successful explicit or automatic save clears the dirty state.
- Existing merge tags and formatting actions remain intact.

**Tests:**

- Saving succeeds and clears dirty state.
- Saving fails and preserves content with Retry visible.
- Blank subject never emits a success state.
- Navigating with a dirty draft triggers the unsaved warning.

**Checkpoint commit:** `fix: make composer persistence truthful and recoverable`

---

### Task 3: Repair contact and group mutation behavior

**Files:**

- Modify `components/contact-table.tsx`
- Modify `components/contact-group-select.tsx`
- Modify `components/groups-manager.tsx`
- Modify `lib/actions/contacts.ts`
- Modify `lib/actions/groups.ts`
- Modify `app/dashboard/page.tsx`

**Steps:**

- [ ] Inspect every touched server action and normalize its result contract.
- [ ] Delivery method and birthday changes update the visible value only after success, or roll back to the prior value after failure.
- [ ] Contact deletion keeps the row present when deletion fails and identifies the contact in the confirmation dialog.
- [ ] Nudge feedback identifies the recipient and reports success as well as failure.
- [ ] Group create, birthday tracking, slug clearing, and deletion all display inline action feedback.
- [ ] Group deletion keeps the card present when the server rejects it.
- [ ] Preload contact-to-group membership in the dashboard server component instead of calling `getContactGroups` once per row after render.
- [ ] Make the group picker a controlled disclosure with `aria-expanded`, Escape, outside-click close, named controls, and focus return.
- [ ] Preserve previous membership if saving fails.
- [ ] Show group membership counts on group cards.

**Acceptance criteria:**

- UI and server state cannot visibly diverge after a rejected mutation.
- Repeated contact and group actions have unique accessible names.
- Opening and closing the group picker works with keyboard alone.
- The dashboard no longer triggers one membership request per contact after hydration.

**Tests:**

- Unit tests for any new membership aggregation helper.
- E2E coverage for group creation, assignment, unassignment, and deletion.
- E2E coverage for a simulated failed mutation where practical.

**Checkpoint commit:** `fix: add recovery to contact and group mutations`

---

## Phase 2: Safer bulk actions and delivery previews

### Task 4: Add a single source of truth for export and digital audiences

**Files:**

- Modify `lib/actions/letter.ts`
- Modify `app/dashboard/export/page.tsx`
- Modify `components/export-panel.tsx`
- Add or extend `lib/actions/letter.test.ts`

**Architecture:**

Extract one server-side audience selector used by both preview and execution. It should return the selected group label, delivery counts, eligible digital recipients, draft subject, and whether a complete draft exists. The UI must not independently reproduce selection rules.

**Steps:**

- [ ] Add `getDeliverySummary(groupId)`.
- [ ] Reuse the same private selection helper inside `sendDigitalLetters`.
- [ ] Pass the summary from the export server page into `ExportPanel`.
- [ ] Show counts on Handwrite, Print, All, PDF, and Digital actions.
- [ ] Disable empty exports with explanatory copy.
- [ ] Replace the native confirm with a review dialog showing:
  - audience/group;
  - exact eligible count;
  - interpolated or raw subject preview;
  - partial-failure behavior;
  - explicit Send and Cancel actions.
- [ ] Report sent and failed counts in a live region.
- [ ] When failures occur, show the failed recipient list returned by the server and offer a Retry failed action without resending successful recipients.

**Acceptance criteria:**

- The displayed count and send selection use the same query rules.
- Empty exports cannot produce confusing blank files.
- A bulk send requires an explicit review step.
- Partial failures are recoverable without duplicate sends.

**Checkpoint commit:** `feat: add delivery audience previews and send recovery`

---

### Task 5: Add verification audience and scheduling guardrails

**Files:**

- Modify `components/send-verification-button.tsx`
- Modify `components/schedule-verification-form.tsx`
- Modify `lib/actions/verification.ts`
- Modify `lib/schemas.ts`
- Modify `lib/schemas.test.ts`
- Modify `app/dashboard/page.tsx`

**Steps:**

- [ ] Pass the eligible non-opted-out contact count to `SendVerificationButton`.
- [ ] Review the count and sender identity in the confirmation dialog before sending.
- [ ] Display both sent and failed counts after completion.
- [ ] Prevent double submission for manual and scheduled sends.
- [ ] Convert `datetime-local` to an absolute ISO timestamp in the browser before submission.
- [ ] Include the browser IANA timezone for display and diagnostics.
- [ ] Persist the validated IANA timezone in user metadata so calendar recurrence and “today” calculations use the owner’s calendar day.
- [ ] Validate that the scheduled time is in the future.
- [ ] Confirm the stored time back to the user in their local timezone.
- [ ] Keep scheduled records stored as absolute timestamps; do not add a migration unless current database behavior proves this impossible.

**Acceptance criteria:**

- The user sees exactly how many contacts will receive verification.
- Scheduling the same local time in Pacific and Eastern zones stores different correct instants.
- Past dates are rejected before insertion.
- Buttons cannot be submitted twice while pending.

**Tests:**

- Unit tests for future-date and absolute-timestamp validation.
- Existing verification security tests remain green.
- E2E verifies the local confirmation text without triggering a real email batch.

**Checkpoint commit:** `fix: add verification audience and timezone guardrails`

---

## Phase 3: Recipient verification correctness

### Task 6: Split the public verification route into server context and client interaction

**Files:**

- Rewrite `app/(public)/verify/[token]/page.tsx`
- Create `components/verification-form.tsx`
- Modify `lib/actions/verification.ts`
- Modify `lib/schemas.ts`
- Modify `lib/schemas.test.ts`
- Extend `lib/actions/verification.test.ts`
- Extend `e2e/public-flows.spec.ts`

**Architecture:**

The route becomes a server component that validates the capability token and fetches only the recipient context required to render the page. The interactive form remains a client component. Invalid or expired tokens render the existing branded invalid state without exposing whether a contact exists.

Minimal context:

```ts
type VerificationContext = {
  senderName: string | null
  recipientFirstName: string
  address: {
    address_line_1: string
    address_line_2: string
    city: string
    state: string
    zip: string
    is_international: boolean
    country: string
  }
}
```

**Steps:**

- [ ] Extract shared token validation so context loading and mutation use the same TTL rule.
- [ ] Fetch the contact address and sender display name only after the token passes validation.
- [ ] Render sender identity in the heading and explanation.
- [ ] Prefill the current address in the update form.
- [ ] Extend `verifySchema` with `is_international` and `country`, reusing the contact state/region refinement.
- [ ] Support U.S. and international verification updates.
- [ ] Preserve coordinates when geocoding fails, but make the address update itself succeed as today.
- [ ] Associate every label with an input.
- [ ] Add `aria-invalid`, `aria-describedby`, field-level errors, and an error summary that focuses after invalid submission.
- [ ] Keep confirmation and opt-out single-use token behavior unchanged.

**Acceptance criteria:**

- A valid recipient can review the current address before deciding.
- Updating an address does not require retyping unchanged fields.
- International contacts can update without being forced into a U.S. state.
- Invalid/expired responses do not reveal contact data.
- City, state/region, ZIP/postal, and country errors are visible and announced.

**Tests:**

- Token context rejects invalid, expired, and consumed tokens.
- Context returns only the intended contact for a valid token.
- U.S. and international verification schemas pass and fail correctly.
- Public E2E covers confirm, update form prefill, error recovery, and opt-out using disposable fixtures where available.

**Checkpoint commit:** `feat: make recipient verification prefilled and international`

---

## Phase 4: Accessibility and mobile resilience

### Task 7: Complete the control-label and status pass

**Files:**

- Modify `app/(auth)/login/page.tsx`
- Modify `components/letter-composer.tsx`
- Modify `components/groups-manager.tsx`
- Modify `components/share-link-editor.tsx`
- Modify `components/share-link-actions.tsx`
- Modify `components/contact-table.tsx`
- Modify `components/profile-form.tsx`
- Modify `components/calendar-manager.tsx`
- Modify `components/export-panel.tsx`

**Steps:**

- [ ] Remove `tabIndex={-1}` from password visibility buttons.
- [ ] Give icon-only actions at least a 44 by 44 CSS-pixel target or an equivalent padded hit area.
- [ ] Make every repeated action name include its contact or group.
- [ ] Replace placeholder-only identification with persistent labels.
- [ ] Connect errors and helper text with `aria-describedby`.
- [ ] Announce async results through the shared feedback component.
- [ ] Preserve visible focus indicators; add `focus-visible` styling where inline styles currently suppress it.
- [ ] Ensure disclosure controls expose expanded/collapsed state.
- [ ] Replace tab semantics on the U.S./International segmented control with radio-group semantics unless a true tabpanel is introduced.

**Acceptance criteria:**

- Every form field has a programmatic and visible label.
- Every async result is announced.
- Keyboard focus remains visible and follows dialogs/disclosures predictably.
- Repeated row actions are distinguishable to screen readers.

**Checkpoint commit:** `fix: complete core flow accessibility semantics`

---

### Task 8: Make calendar dates and mobile behavior reliable

**Files:**

- Create `lib/calendar-date.ts`
- Create `lib/calendar-date.test.ts`
- Modify `components/calendar-manager.tsx`
- Modify `lib/actions/calendar.ts` only where shared helpers improve consistency
- Modify `components/onboarding-form.tsx`
- Modify `components/profile-form.tsx`
- Create `components/time-zone-sync.tsx`
- Modify `lib/user-profile.ts`
- Modify `lib/actions/user.ts`
- Modify `app/dashboard/layout.tsx`
- Modify `app/globals.css`

**Steps:**

- [ ] Capture the browser IANA timezone during onboarding and sync it for existing users through the profile flow.
- [ ] Mount a small dashboard-level timezone sync that saves only when the detected zone differs, then refreshes server-rendered date surfaces once.
- [ ] Validate submitted timezone identifiers on the server before storing them in user metadata.
- [ ] Replace `toISOString().slice(0, 10)` for “today” with a helper that formats the calendar date in the saved IANA timezone.
- [ ] Change recurrence helpers to accept a date-only `todayKey` derived from that timezone instead of reading the server’s UTC day directly.
- [ ] Keep stored event values date-only; timezone affects which date is “today,” not the stored birthday or anniversary.
- [ ] Add regression tests for Pacific evening, daylight-saving transitions, and month boundaries.
- [ ] Add a `Today` button.
- [ ] Make “+N more” actionable and open a focused day-detail panel.
- [ ] Keep the month grid on medium/large screens.
- [ ] Add a chronological agenda view for small screens instead of compressing seven 132px columns.
- [ ] Add persistent labels to event, recurrence, date, contact, source, and URL fields.
- [ ] Confirm event and imported-source deletion with the exact item name.
- [ ] Add editing for manually created events; imported events remain source-managed.

**Acceptance criteria:**

- “Today” is correct in America/Los_Angeles throughout the day.
- No horizontal or unreadably compressed seven-column calendar is required on mobile.
- Hidden events are reachable by touch and keyboard.
- Manual dates can be corrected without delete/recreate.

**Checkpoint commit:** `feat: add timezone-safe responsive calendar flows`

---

### Task 9: Add an accessible map fallback

**Files:**

- Modify `components/contact-map.tsx`
- Modify `app/dashboard/map/page.tsx`

**Steps:**

- [ ] Replace hover-only marker details with click/tap popups while preserving hover tooltips.
- [ ] Add a sibling textual list of mapped contacts and locations.
- [ ] Let selecting a list item focus/open the corresponding marker when the map is available.
- [ ] Update page copy from “Hover over a dot” to input-neutral guidance.
- [ ] Keep the map’s visual styling and coordinate behavior unchanged.

**Acceptance criteria:**

- Contact location information is available without hover or map manipulation.
- Touch users can open marker details.
- The textual list remains useful if map tiles fail to load.

**Checkpoint commit:** `feat: add accessible friend map interactions`

---

## Phase 5: Quality-of-life upgrades

### Task 10: Add contact search and combined filters

**Files:**

- Create `components/contact-filters.tsx`
- Modify `app/dashboard/page.tsx`
- Modify `components/contact-table.tsx`
- Modify `lib/actions/contacts.ts` if filtering moves to the query layer

**Steps:**

- [ ] Support query parameters for `q`, `status`, `delivery`, and `group`.
- [ ] Search first name, last name, email, city, and state.
- [ ] Preserve active filters when changing one filter.
- [ ] Show a clear-all action and result count.
- [ ] Distinguish “no contacts yet” from “no contacts match these filters.”
- [ ] Keep filter state linkable and back-button friendly.

**Acceptance criteria:**

- Users can find a contact without scanning the full table.
- Empty search results never tell the user to invite their first contact.
- Filtering remains usable on mobile and by keyboard.

**Checkpoint commit:** `feat: add searchable contact filters`

---

### Task 11: Put invite actions and share configuration in the right places

**Files:**

- Modify `components/dashboard-invite-cta.tsx`
- Modify `components/share-link-card.tsx`
- Modify `components/share-link-actions.tsx`
- Modify `components/groups-manager.tsx`
- Modify `components/profile-form.tsx`
- Modify `app/dashboard/settings/page.tsx`

**Steps:**

- [ ] Make the empty-state CTA copy the personal invite link directly, with View as a secondary action.
- [ ] Add copy/view actions to each group share-link card.
- [ ] Handle clipboard failure with selectable fallback text.
- [ ] Keep dashboard share content focused on preview, copy, and view.
- [ ] Consolidate personal slug and invite-message editing into a Settings “Sharing” panel.
- [ ] Preserve the warning that changing a slug breaks previously shared links.
- [ ] Show group contact counts and explain that submissions through a group link are auto-assigned.

**Acceptance criteria:**

- A new user can copy an invite link from the empty state in one action.
- Clipboard failure never falsely reports success.
- Durable sharing configuration has one predictable home.

**Checkpoint commit:** `feat: streamline invite and sharing controls`

---

### Task 12: Make composer preview deterministic

**Files:**

- Modify `app/dashboard/compose/page.tsx`
- Modify `components/letter-composer.tsx`
- Remove or stop using `getRandomContact` from `lib/actions/letter.ts`

**Steps:**

- [ ] Pass a stable list of eligible preview contacts for the active group.
- [ ] Default to the first deterministic contact, or the existing Jane Smith placeholder when empty.
- [ ] Add a labeled preview-recipient selector.
- [ ] Keep preview selection client-only; it must not alter the eventual send audience.
- [ ] Add one-click insertion for supported merge tags.

**Acceptance criteria:**

- Refreshing the same composer URL does not randomly change the preview recipient.
- Users can inspect personalization against more than one contact.
- Preview selection cannot change export or send scope.

**Checkpoint commit:** `feat: add deterministic composer recipient previews`

---

## Phase 6: Authenticated flow coverage and release gates

### Task 13: Add a dedicated authenticated Playwright fixture

**Files:**

- Create `e2e/fixtures/auth.ts`
- Create `e2e/authenticated-flows.spec.ts`
- Create `e2e/accessibility-flows.spec.ts`
- Modify `playwright.config.ts` only if required
- Modify `.env.example`
- Modify `README.md`

**Test account contract:**

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- A dedicated non-production Supabase project or explicitly disposable account.
- Tests skip with a clear reason when credentials are absent.
- Tests generate unique names/slugs and clean up records they create.
- Tests never trigger real digital letters or verification batches in the default suite.

**Authenticated scenarios:**

- [ ] Password sign-in reaches the fully authenticated dashboard.
- [ ] Composer save shows dirty, pending, and saved states.
- [ ] Group create, slug save, contact assignment, and delete work end to end.
- [ ] Contact delivery and birthday changes persist after reload.
- [ ] Calendar manual event create, edit, day detail, and delete work.
- [ ] Export counts match the current selected group.
- [ ] Bulk send and verification dialogs show the correct review details but cancel before external delivery.
- [ ] Settings sharing configuration persists after reload.

**Accessibility scenarios:**

- [ ] Login password reveal is keyboard reachable.
- [ ] Contact actions have unique accessible names.
- [ ] Group picker opens, operates, and closes with keyboard.
- [ ] Confirmation dialogs trap/restore focus.
- [ ] Error and success states expose alert/status semantics.
- [ ] Public verification form associates every invalid field with its message.
- [ ] Mobile calendar exposes agenda content without horizontal page overflow.

**Checkpoint commit:** `test: cover authenticated user flows and accessibility`

---

### Task 14: Final verification and release checklist

Run sequentially so generated Next.js types are stable before typechecking:

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/eslint . --max-warnings=0 --ignore-pattern next-env.d.ts
./node_modules/.bin/next build
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/playwright test
git diff --check
```

**Manual verification matrix:**

| Flow | Desktop | Mobile | Keyboard | Failure path |
|---|---:|---:|---:|---:|
| Login and onboarding | Required | Required | Required | Invalid credentials/save failure |
| Personal share form | Required | Required | Required | Validation/server failure |
| Group share submission | Required | Required | Required | Invalid/removed slug |
| Contacts and groups | Required | Required | Required | Mutation rollback |
| Composer | Required | Required | Required | Autosave failure/dirty navigation |
| Calendar | Required | Required | Required | Invalid import/delete cancellation |
| Map | Required | Required | Required | Tiles/geocoding unavailable |
| Export and send review | Required | Required | Required | Empty audience/partial failure |
| Recipient verification | Required | Required | Required | Expired token/invalid fields |
| Settings and scheduling | Required | Required | Required | Past time/server failure |

**Final acceptance criteria:**

- No touched client handler ignores an action error.
- No bulk action can execute without an audience review.
- No success message is emitted before persistence is confirmed.
- Public verification supports existing U.S. and international contacts.
- All touched form controls have visible/programmatic labels and linked errors.
- Core authenticated flows have automated coverage.
- All release gates pass.
- Any disposable test data or account residue is explicitly reported.

**Checkpoint commit:** `test: verify user flow quality release gates`

---

## Recommended delivery slices

### Slice A: Reliability release

Tasks 1–6. This is the minimum recommended pre-release scope.

### Slice B: Accessibility and responsive release

Tasks 7–9. Ship immediately after Slice A unless a verified blocker requires combining them.

### Slice C: Quality-of-life release

Tasks 10–12. These improvements are valuable but should not delay persistence and safety fixes.

### Slice D: Coverage and release proof

Tasks 13–14. Start the fixture work during Slice A, but treat the final green matrix as the release gate for the combined work.

---

## Open decisions and plan defaults

1. **Autosave navigation behavior:** Default to an unsaved-change warning plus explicit Save now. Do not add a new API/beacon persistence path unless testing proves soft navigation still loses drafts.
2. **Optimistic UI:** Default to confirmed updates for destructive or relationship-changing actions; use rollback-capable optimism only for low-risk toggles.
3. **Share configuration location:** Default to quick actions on Dashboard and configuration in Settings.
4. **Calendar mobile presentation:** Default to agenda view below the medium breakpoint; retain the month grid above it.
5. **E2E environment:** Default to a dedicated non-production Supabase account. Never run email-delivery actions in the ordinary suite.
6. **Database changes:** Default to none. Add a migration only if implementation proves the current verification address fields or scheduled timestamp type cannot support the required behavior.
7. **Timezone fallback:** Default to UTC only until the browser timezone has been captured; immediately refresh calendar data after a successful first sync.

---

## Definition of done

The work is done when the product’s visible state matches persisted state, recipients can verify any supported address without retyping it, bulk actions state exactly what they will do, mobile and keyboard users can complete every core task, and authenticated E2E tests prove the flows without sending real external email.
