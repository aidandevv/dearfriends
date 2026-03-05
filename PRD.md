# Product Requirements Document: NomadMail 

## 1. Project Overview
**Description:** A lightweight, open-source hybrid CRM for collecting mailing addresses via a frictionless public link, managing contacts, and generating personalized holiday letters/labels.
**Target Audience:** Solo utility for the repo owner (e.g., github.com/aidandevv/nomadmail), with architecture supporting future multi-tenant SaaS expansion.
**Primary Flow:** Admin generates a link -> Recipient submits address -> Admin drafts a markdown letter with `{{first_name}}` variables -> Admin exports to PDF/CSV for printing or triggers digital email sends.

## 2. Tech Stack Definition
* **Framework:** Next.js (App Router, TypeScript)
* **Hosting:** Vercel (Hobby Tier)
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security enabled)
* **UI/Styling:** Tailwind CSS + shadcn/ui (minimalist, utilitarian design system)
* **Forms:** React Hook Form + Zod (for validation)
* **Address Validation:** Google Places API (or similar lightweight autocomplete)
* **Email Dispatch:** Resend (Free Tier)

## 3. Core Epics & Feature Requirements

### Epic 1: Public Collection Flow (Unauthenticated)
**Objective:** A mobile-first, zero-friction form for recipients to provide their information.
* **Route:** `/share/[admin_uuid]`
* **UI:** Clean, single-column card layout. (Reference standard Figma UI kits for minimal form design).
* **Fields Required:** * First Name (String)
  * Last Name (String)
  * Email (String, Validated)
  * Address Line 1 (String, Autocompleted)
  * Address Line 2 (String, Optional)
  * City, State, Zip (Strings)
* **Logic:** Form submission writes directly to the `contacts` table in Supabase. Must handle duplicate emails gracefully (upsert/update existing record for that admin).

### Epic 2: Admin Dashboard (Authenticated)
**Objective:** Centralized contact management.
* **Route:** `/dashboard`
* **UI:** Data table view (using shadcn/ui data-table).
* **Features:**
  * View, Edit, Delete operations for all contacts.
  * Filter/Sort by recent updates or delivery preference.
  * Quick-toggle for "Delivery Method": `Handwrite`, `Print`, `Digital`.
  * Grouping/Tagging: Assign contacts to categories (e.g., "College", "Internship", "Family").

### Epic 3: The Hybrid Composer
**Objective:** Draft and preview the holiday update.
* **Route:** `/dashboard/compose`
* **Features:**
  * Markdown text area for drafting the letter.
  * Variable Interpolation: Must support `{{first_name}}` and `{{last_name}}` tags.
  * Live Preview side-by-side: Renders the markdown and injects the variables of a randomly selected contact from the database to verify formatting.

### Epic 4: Export & Dispatch
**Objective:** Get the data out for physical mailing or send digitally.
* **Route:** `/dashboard/export`
* **Features:**
  * **CSV Export:** Download all contacts marked `Handwrite` or `Print` formatted for standard Avery label mail-merge.
  * **PDF Generation:** Render the composed letter for all `Print` contacts into a single paginated PDF (one letter per page, variables injected).
  * **Digital Send:** Trigger batch emails via Resend API to all contacts marked `Digital`, injecting their specific variables into the email body.

## 4. Supabase Database Schema (Draft)

**Table: `users` (Managed by Supabase Auth)**
* `id` (uuid, PK)
* `email` (text)

**Table: `contacts`**
* `id` (uuid, PK)
* `admin_id` (uuid, FK to users.id)
* `first_name` (text)
* `last_name` (text)
* `email` (text)
* `address_line_1` (text)
* `address_line_2` (text, nullable)
* `city` (text)
* `state` (text)
* `zip` (text)
* `tags` (text[])
* `delivery_method` (enum: 'handwrite', 'print', 'digital')
* `created_at` (timestamp)
* `updated_at` (timestamp)

**Row Level Security (RLS) Requirements:**
* `contacts` table MUST enforce RLS where `admin_id = auth.uid()` for all SELECT, UPDATE, DELETE operations.
* Public insert access allowed ONLY if `admin_id` matches a valid user.

## 5. Instructions for AI Coding Agent
1. **Scaffold First:** Initialize the Next.js app, configure Tailwind/shadcn, and set up the Supabase client before building features.
2. **Schema Execution:** Apply the SQL schema and RLS policies provided above to the Supabase instance.
3. **Iterative Build:** Build Epic 1 (Public Collection) first to ensure data can flow into the DB, then build Epic 2 (Admin Dashboard) to read it.
4. **TypeScript Strictness:** Ensure all interfaces for Supabase returns and component props are strictly typed.