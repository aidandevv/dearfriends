# Composer Revamp — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Overview

Revamp the letter composer at `/dashboard/compose` from a raw markdown textarea into a hybrid editing experience: a CodeMirror 6 editor with markdown syntax highlighting and a formatting toolbar (Overleaf-style), paired with a styling panel for per-letter customization and a user-created template system backed by Supabase.

**Goals:**
- Non-technical users can write without knowing markdown (toolbar inserts syntax for them)
- Power users retain full markdown control
- Authors can control the visual look of their letter (font, accent color, spacing, size)
- Custom styled templates can be saved and reused

---

## Section 1: Editor

### CodeMirror 6 integration

The `<textarea>` in `components/letter-composer.tsx` is replaced with a new `<MarkdownEditor>` client component wrapping CodeMirror 6. It exposes the same `value`/`onChange` interface so `LetterComposer` requires minimal changes.

**New packages:**
- `@codemirror/view`
- `@codemirror/state`
- `@codemirror/lang-markdown`
- `@uiw/react-codemirror` (React wrapper) or a custom warm theme matching the linen palette (`#F5EFE4` background, `#231209` ink)

### Formatting toolbar

A sticky toolbar renders above the editor. Each button uses CodeMirror's `EditorView` dispatch API for clean cursor/selection management — no textarea hacks.

| Button | Markdown action |
|--------|----------------|
| **B** | Wrap selection in `**...**` |
| *I* | Wrap selection in `*...*` |
| H1 | Prefix current line with `# ` |
| H2 | Prefix current line with `## ` |
| List | Prefix current line with `- ` |
| `{{first_name}}` chip | Insert `{{first_name}}` at cursor |
| `{{last_name}}` chip | Insert `{{last_name}}` at cursor |

Toolbar buttons are `40×32px`, rounded, use the existing linen/terra palette. Active-state highlighting (e.g. **B** lights up when cursor is inside bold) is a **stretch goal** — it requires querying the Lezer syntax tree at cursor position and is deferred to a follow-up if time permits.

### Syntax highlighting theme

A custom warm CodeMirror theme maps markdown tokens to the existing design tokens:
- Headings: `font-serif`, `ink`, slightly larger
- Bold/italic markers: `terra` tint
- Variable chips (`{{...}}`): `terra` background highlight
- Body text: `ink`, `DM Sans`, `leading-7`

### Files

| File | Change |
|------|--------|
| `components/editor/markdown-editor.tsx` | New — CodeMirror wrapper component |
| `components/editor/editor-toolbar.tsx` | New — formatting toolbar |
| `components/editor/warm-theme.ts` | New — custom CodeMirror theme |
| `components/letter-composer.tsx` | Swap textarea → `<MarkdownEditor>`, add Style tab |

---

## Section 2: Styling system

### LetterStyle type

A new `LetterStyle` type is added to `lib/letter-templates.ts`. The `mono` font option is **not included** — the project only defines Playfair Display (serif) and DM Sans (sans) in `tailwind.config`; adding a third font is out of scope.

```ts
export type LetterStyle = {
  font: 'serif' | 'sans'
  accentColor: string        // 6-char hex string, e.g. "#C05C2E"
  lineSpacing: 'compact' | 'normal' | 'relaxed'
  fontSize: 'small' | 'medium' | 'large'
}

export const DEFAULT_STYLE: LetterStyle = {
  font: 'serif',
  accentColor: '#C05C2E',
  lineSpacing: 'normal',
  fontSize: 'medium',
}
```

**`LetterTemplate` update:** The existing top-level `accentColor: string` field is **removed** from `LetterTemplate` and replaced by the optional `style?: LetterStyle` field. All existing built-in template objects are updated to carry a `style` with their former `accentColor` moved into `style.accentColor`. The preview code in `letter-composer.tsx` that reads `selectedTemplate.accentColor` is updated to read `selectedTemplate.style?.accentColor ?? DEFAULT_STYLE.accentColor`.

### Zod validation

A `letterStyleSchema` Zod object is defined in `lib/schemas.ts` alongside existing schemas:

```ts
export const letterStyleSchema = z.object({
  font: z.enum(['serif', 'sans']),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lineSpacing: z.enum(['compact', 'normal', 'relaxed']),
  fontSize: z.enum(['small', 'medium', 'large']),
})
```

This schema is used server-side in all new actions that accept a `style` parameter.

### Draft persistence

`LetterStyle` is persisted in the existing `letter_drafts` table via a new migration (`006_add_style_to_letter_drafts.sql`) that adds a `style jsonb` column with a default matching `DEFAULT_STYLE`. The `saveDraft` action and `letterDraftSchema` in `lib/actions/letter.ts` are updated to include the `style` field. The compose page server component reads `style` from the draft and passes it as `initialStyle` to `LetterComposer`.

This means style is always available at export time: `lib/pdf.ts` and the send flow both read `style` from the draft record in the DB.

### Tab UI

The left composer panel gains a two-tab row: **Write** | **Style**.

- **Write tab** (default): existing subject input + template picker + `<MarkdownEditor>`
- **Style tab**: the styling controls panel

### Style controls

| Control | Options |
|---------|---------|
| Font | Serif (Playfair Display) · Sans (DM Sans) |
| Accent color | 8 preset swatches + hex input (6-char, validated on blur; invalid values revert to last valid color and show a red ring) |
| Line spacing | Compact · Normal · Relaxed |
| Font size | Small · Medium · Large |

Changes apply to the live preview in real time. Style state is stored in `LetterComposer` alongside `body` and `subject`, and debounce-saved via `saveDraft` the same way body/subject are.

### Preview application

The preview panel applies `LetterStyle` values via inline styles and conditional class names on the letter card:
- `font` → swap `font-serif` / `font-sans` on the prose container
- `accentColor` → used for the top accent stripe and heading color in prose
- `lineSpacing` → maps to `leading-6` / `leading-7` / `leading-8`
- `fontSize` → maps to `text-sm` / `text-base` / `text-lg`

### Export passthrough

At PDF generation time, `lib/pdf.ts` reads the draft's `style` column and applies font/spacing/color to the rendered HTML. For email (`lib/resend.ts`), style is applied via **inline CSS only** (no class names — email clients strip `<style>` blocks). Supported email mappings: `accentColor` → heading `color`, `lineSpacing` → paragraph `line-height`, `fontSize` → `font-size`. Font family is applied via `font-family` inline style. This is called out explicitly so implementers don't rely on Tailwind classes in email HTML.

---

## Section 3: Custom template persistence

### Unified template type

To avoid the `defaultBody` vs `body` mismatch between static and DB templates, a normalized `ComposerTemplate` type is introduced in `lib/letter-templates.ts`:

```ts
export type ComposerTemplate = {
  id: string
  name: string
  body: string                    // normalized from defaultBody for built-ins
  style: LetterStyle
  source: 'builtin' | 'user'     // discriminant; only 'user' templates show delete icon
}
```

A `normalizeTemplate(t: LetterTemplate): ComposerTemplate` helper converts built-in templates. DB templates map directly to this shape. `TemplatePicker` and `LetterComposer` work exclusively with `ComposerTemplate`.

### Component boundary

`listTemplates()` is called server-side in `app/dashboard/compose/page.tsx` and the result (a `ComposerTemplate[]`) is passed as a prop to `LetterComposer` (a Client Component). `LetterComposer` merges the user templates with `LETTER_TEMPLATES.map(normalizeTemplate)` (built-ins first, user templates below) and passes the combined array to `TemplatePicker`. No additional data fetching happens client-side — this is a pure prop-drill from the server page.

### Database

New migration `supabase/migrations/007_letter_templates.sql`:

```sql
create table letter_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  body text not null,
  style jsonb not null,
  created_at timestamptz default now()
);

alter table letter_templates enable row level security;

create policy "Users manage own templates"
  on letter_templates
  for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());
```

A separate migration (`006_add_style_to_letter_drafts.sql`) adds `style jsonb` to `letter_drafts`. **This migration must run before `007_letter_templates.sql`** because the updated `saveDraft` action writes the `style` field and will fail if the column is not yet present:

```sql
alter table letter_drafts
  add column style jsonb not null default '{"font":"serif","accentColor":"#C05C2E","lineSpacing":"normal","fontSize":"medium"}';
```

### Server actions

Three new actions added to `lib/actions/letter.ts`:

- `saveTemplate({ name, body, style })` — validates `style` with `letterStyleSchema`, inserts a new row; returns the created `ComposerTemplate`
- `deleteTemplate(id)` — deletes by id (RLS enforces ownership)
- `listTemplates()` — returns all templates for the current user as `ComposerTemplate[]`

### Save as template UI

A **"Save as template"** button sits at the bottom of the Style tab. Clicking it opens a small inline form (name field + Save / Cancel). On save, calls `saveTemplate` with the current body and style.

### Template picker

The existing `<TemplatePicker>` is updated to accept `templates: ComposerTemplate[]` as a prop. Built-in templates (source `'builtin'`) appear first; user templates (source `'user'`) appear below with a small muted "yours" label and a delete icon. Clicking delete calls `deleteTemplate(id)`. The card is removed optimistically on click. If the server action returns an error, the card is restored to its original position in the list and a toast notification is shown. No page refresh required to recover.

---

## Error handling

| Scenario | Handling |
|----------|---------|
| CodeMirror fails to mount | Fallback to plain `<textarea>` |
| `saveTemplate` DB error | Inline error message below the name field |
| `deleteTemplate` error | Toast notification |
| Invalid hex color input | Red ring on input; revert to last valid color on blur |
| `style` Zod validation fails in server action | Returns `{ error: string }`, shown inline |
| Draft `style` column missing (old draft row) | DB default (`DEFAULT_STYLE` JSON) ensures backfill; no code change needed |

---

## Out of scope

- Real-time collaboration
- Template sharing between users
- Image insertion in the editor
- Undo/redo history persistence across sessions (CodeMirror handles in-session undo natively)
- Mobile editor (compose is desktop-first for now)
- Monospace font option (no mono font configured in tailwind.config)
- Toolbar active-state (bold/italic button highlights when cursor inside formatted text) — deferred stretch goal

---

## Files summary

| File | Action |
|------|--------|
| `components/editor/markdown-editor.tsx` | Create |
| `components/editor/editor-toolbar.tsx` | Create |
| `components/editor/warm-theme.ts` | Create |
| `components/letter-composer.tsx` | Modify |
| `components/template-picker.tsx` | Modify |
| `lib/letter-templates.ts` | Modify (add `LetterStyle`, `ComposerTemplate`, `normalizeTemplate`; remove top-level `accentColor` from `LetterTemplate`) |
| `lib/schemas.ts` | Modify (add `letterStyleSchema`) |
| `lib/actions/letter.ts` | Modify (update `saveDraft`; add `saveTemplate`, `deleteTemplate`, `listTemplates`) |
| `lib/pdf.ts` | Modify (accept and apply `LetterStyle` via inline styles) |
| `lib/resend.ts` | Modify (apply `LetterStyle` via inline CSS only) |
| `app/dashboard/compose/page.tsx` | Modify (fetch user templates + draft style server-side; pass as props) |
| `supabase/migrations/006_add_style_to_letter_drafts.sql` | Create |
| `supabase/migrations/007_letter_templates.sql` | Create |
