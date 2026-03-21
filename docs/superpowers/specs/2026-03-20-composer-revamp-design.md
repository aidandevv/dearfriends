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
- `@uiw/codemirror-theme-*` or a custom warm theme matching the linen palette (`#F5EFE4` background, `#231209` ink)

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

Toolbar buttons are `40×32px`, rounded, use the existing linen/terra palette. Active state (when cursor is inside bold/italic) highlights the corresponding button.

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

## Section 2: Styling panel

### LetterStyle type

A new `LetterStyle` type is added to `lib/letter-templates.ts`:

```ts
export type LetterStyle = {
  font: 'serif' | 'sans' | 'mono'
  accentColor: string        // hex string
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

`LetterTemplate` gains an optional `style?: LetterStyle` field so built-in templates can ship with opinionated defaults (e.g. Birthday template: purple accent, relaxed spacing).

### Tab UI

The left composer panel gains a two-tab row: **Write** | **Style**.

- **Write tab** (default): existing subject input + template picker + `<MarkdownEditor>`
- **Style tab**: the styling controls panel

### Style controls

| Control | Options |
|---------|---------|
| Font | Serif (Playfair Display) · Sans (DM Sans) · Mono |
| Accent color | 8 preset swatches + hex input |
| Line spacing | Compact · Normal · Relaxed |
| Font size | Small · Medium · Large |

Changes apply to the live preview in real time. Style state is stored in `LetterComposer` alongside `body` and `subject`.

### Preview application

The preview panel applies `LetterStyle` values via inline styles and conditional class names on the letter card:
- `font` → swap `font-serif` / `font-sans` / `font-mono` on the prose container
- `accentColor` → used for the top accent stripe (already exists) and heading color in prose
- `lineSpacing` → maps to `leading-6` / `leading-7` / `leading-8`
- `fontSize` → maps to `text-sm` / `text-base` / `text-lg`

### Export passthrough

`LetterStyle` is passed to `lib/pdf.ts` and the Resend email renderer so exported output matches the preview.

---

## Section 3: Custom template persistence

### Database

New migration `supabase/migrations/003_letter_templates.sql`:

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

### Server actions

Three new actions added to `lib/actions/letter.ts`:

- `saveTemplate({ name, body, style })` — inserts a new row; returns the created template
- `deleteTemplate(id)` — deletes by id (RLS enforces ownership)
- `listTemplates()` — returns all templates for the current user

### Save as template UI

A **"Save as template"** button sits at the bottom of the Style tab. Clicking it opens a small inline form (name field + Save / Cancel). On save, calls `saveTemplate` with the current body and style.

### Template picker

The existing `<TemplatePicker>` is extended to accept user templates alongside the static built-ins. Built-in templates appear first in the picker; user templates appear below with a small muted "yours" label. A delete icon on user template cards calls `deleteTemplate`.

`listTemplates()` is called server-side in `app/dashboard/compose/page.tsx` and passed as a prop.

---

## Error handling

| Scenario | Handling |
|----------|---------|
| CodeMirror fails to mount | Fallback to plain `<textarea>` |
| `saveTemplate` DB error | Inline error message below the name field |
| `deleteTemplate` error | Toast notification |
| Invalid hex color input | Revert to previous valid color on blur |

---

## Out of scope

- Real-time collaboration
- Template sharing between users
- Image insertion in the editor
- Undo/redo history persistence across sessions (CodeMirror handles in-session undo natively)
- Mobile editor (compose is desktop-first for now)

---

## Files summary

| File | Action |
|------|--------|
| `components/editor/markdown-editor.tsx` | Create |
| `components/editor/editor-toolbar.tsx` | Create |
| `components/editor/warm-theme.ts` | Create |
| `components/letter-composer.tsx` | Modify |
| `components/template-picker.tsx` | Modify |
| `lib/letter-templates.ts` | Modify (add `LetterStyle`, extend `LetterTemplate`) |
| `lib/actions/letter.ts` | Modify (add `saveTemplate`, `deleteTemplate`, `listTemplates`) |
| `lib/pdf.ts` | Modify (accept `LetterStyle`) |
| `lib/resend.ts` | Modify (accept `LetterStyle`) |
| `app/dashboard/compose/page.tsx` | Modify (fetch user templates server-side) |
| `supabase/migrations/003_letter_templates.sql` | Create |
