# Dear Friends — Product Requirements

## Product overview

Dear Friends is a private correspondence workspace for people who want to keep a personal address book, remember meaningful dates, and send physical or digital letters without adopting a sales-oriented CRM.

The product connects two experiences:

1. A recipient shares or verifies their address through a trusted public link without creating an account.
2. An authenticated list owner organizes contacts, prepares a reusable letter, and exports or sends it through the appropriate delivery channel.

## Intended users

- People maintaining a personal holiday-card or life-update list.
- Families, newlyweds, frequent movers, and community organizers collecting current mailing details.
- Recipients who should be able to share an address quickly and understand who requested it.

## Product principles

- **Personal, not transactional.** The product should feel closer to stationery than enterprise CRM software.
- **Trust must be visible.** Public links, saves, exports, and sends should explain their scope and report failures honestly.
- **Physical mail stays user-controlled.** Dear Friends prepares labels and letters but does not claim to mail physical items.
- **Recipient effort stays low.** Public collection and verification require no recipient account.
- **Privacy is a system boundary.** Tenant isolation and public mutations are enforced server-side, not entrusted to client inputs.

## Core journeys

### 1. Collect an address

- The owner shares a personal or group-specific slug.
- The server resolves the slug and issues a short-lived signed capability.
- The recipient submits contact and address details through the public form.
- The server derives ownership from the capability and inserts a new contact.
- Existing contacts are never silently overwritten from the public collection form.

### 2. Maintain the address book

- The owner searches and filters contacts by status, delivery method, and group.
- Contact edits, birthday changes, group assignment, and deletion report pending, saved, and error states.
- Groups may track birthdays and expose their own optional share slugs.
- Mappable contacts appear on the globe and accessible map list.

### 3. Verify recipient details

- The owner previews the eligible audience before sending verification emails.
- Every recipient receives a single-use token that expires after 14 days.
- A valid verification page identifies the sender and preloads the current address.
- The recipient can confirm, update a U.S. or international address, or opt out.
- Invalid, expired, reused, and opted-out tokens fail closed.

### 4. Compose and deliver correspondence

- The owner writes Markdown with `{{first_name}}` and `{{last_name}}` merge tags.
- Draft changes are serialized, autosaved, and recoverable after errors.
- Preview recipients are deterministic and selectable.
- CSV and PDF exports show the selected audience and disable empty actions.
- Digital sends require confirmation, report partial failures, and support retrying only failed recipients.

### 5. Plan around meaningful dates

- The owner adds dates or imports Google, Outlook, or ICS subscriptions.
- Mail-by dates are estimated from destination and mailing origin.
- Calendar day boundaries use the owner’s saved timezone.
- Desktop month and mobile agenda views expose the same underlying reminders.

## Functional scope

| Area | Primary routes | Responsibility |
| --- | --- | --- |
| Marketing and explanation | `/`, `/about` | Explain the product and lead into authentication |
| Authentication and setup | `/login`, `/onboarding` | Supabase password or magic-link entry and initial profile |
| Address collection | `/share/[segment]` | Capability-backed public contact submission |
| Verification | `/verify/[token]` | Single-use address confirmation, correction, or opt-out |
| Contact workspace | `/dashboard` | Contact management, filtering, groups, invite link, and summary |
| Writing | `/dashboard/compose` | Draft persistence, formatting, merge tags, and preview |
| Delivery | `/dashboard/export` | Audience-aware CSV/PDF export and digital email send |
| Planning | `/dashboard/calendar` | Events, subscriptions, mail-by dates, and reminders |
| Geography | `/dashboard/map` | Visual and textual views of mapped contacts |
| Configuration | `/dashboard/settings` | Profile, share slug, reminders, and verification scheduling |

## Architecture and trust requirements

- Supabase Row Level Security scopes authenticated reads and writes to `auth.uid()`.
- Public share submissions use signed server capabilities; anonymous direct contact writes are disabled.
- Verification mutations use service-role access only after UUID format, token existence, expiry, and single-use checks.
- Cross-table contact/group/calendar relationships must belong to the same administrator.
- Calendar subscription imports reject private-network and unsafe URLs.
- CSV exports neutralize spreadsheet-formula payloads.
- Cron endpoints fail closed unless a non-empty bearer secret is configured.
- Server-only credentials never use the `NEXT_PUBLIC_` prefix.

## Quality and release requirements

A release candidate must pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Authenticated browser coverage uses an isolated, completed-onboarding test account provided through `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`. Tests may inspect confirmation dialogs but must not execute real bulk email sends.

## Current non-goals

- Printing or mailing physical correspondence on the user’s behalf.
- Recipient accounts or recipient-facing contact management.
- Sales pipeline, lead scoring, or commercial CRM workflows.
- Rich document collaboration or arbitrary HTML email authoring.
- Claiming full postal-delivery guarantees from estimated mail-by dates.
