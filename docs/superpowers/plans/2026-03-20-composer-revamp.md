# Composer Revamp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw markdown textarea in `/dashboard/compose` with a CodeMirror 6 editor + formatting toolbar, a per-letter styling panel, and a Supabase-backed custom template system.

**Architecture:** A new `components/editor/` directory holds the CodeMirror wrapper, toolbar, and warm theme — all `'use client'`. The `LetterComposer` parent gains a Style tab alongside the editor tab and merges built-in + user templates before passing them to `TemplatePicker`. Style is persisted in the `letter_drafts` table so PDF/email export always uses the author's chosen look.

**Tech Stack:** CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@lezer/highlight`), Zod, Supabase PostgreSQL, React Hook Form, Tailwind CSS, `@react-pdf/renderer`, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-03-20-composer-revamp-design.md`

---

## Chunk 1: Data layer

### Task 1: Add LetterStyle, ComposerTemplate and normalizeTemplate to letter-templates.ts

**Files:**
- Modify: `lib/letter-templates.ts`
- Create: `lib/letter-templates.test.ts`

- [ ] **Step 1: Write failing tests for normalizeTemplate and DEFAULT_STYLE**

Create `lib/letter-templates.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_STYLE,
  normalizeTemplate,
  LETTER_TEMPLATES,
  type LetterStyle,
  type ComposerTemplate,
} from './letter-templates'

describe('DEFAULT_STYLE', () => {
  it('has all required fields', () => {
    expect(DEFAULT_STYLE).toMatchObject({
      font: 'serif',
      accentColor: '#C05C2E',
      lineSpacing: 'normal',
      fontSize: 'medium',
    })
  })
})

describe('normalizeTemplate', () => {
  it('maps defaultBody → body', () => {
    const t = normalizeTemplate(LETTER_TEMPLATES[0])
    expect(t.body).toBe(LETTER_TEMPLATES[0].defaultBody)
  })

  it('sets source to builtin', () => {
    expect(normalizeTemplate(LETTER_TEMPLATES[0]).source).toBe('builtin')
  })

  it('uses DEFAULT_STYLE when template has no style', () => {
    const t = normalizeTemplate({ id: 'x', name: 'X', defaultBody: 'hi' })
    expect(t.style).toEqual(DEFAULT_STYLE)
  })

  it('uses template style when present', () => {
    const style: LetterStyle = { font: 'sans', accentColor: '#9B59B6', lineSpacing: 'relaxed', fontSize: 'large' }
    const t = normalizeTemplate({ id: 'x', name: 'X', defaultBody: 'hi', style })
    expect(t.style).toEqual(style)
  })

  it('produces a valid ComposerTemplate', () => {
    const t = normalizeTemplate(LETTER_TEMPLATES[0])
    const keys: (keyof ComposerTemplate)[] = ['id', 'name', 'body', 'style', 'source']
    keys.forEach(k => expect(t).toHaveProperty(k))
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run lib/letter-templates.test.ts
```

Expected: error — `normalizeTemplate` not found.

- [ ] **Step 3: Replace lib/letter-templates.ts with the new types and helpers**

```ts
export type LetterStyle = {
  font: 'serif' | 'sans'
  accentColor: string
  lineSpacing: 'compact' | 'normal' | 'relaxed'
  fontSize: 'small' | 'medium' | 'large'
}

export const DEFAULT_STYLE: LetterStyle = {
  font: 'serif',
  accentColor: '#C05C2E',
  lineSpacing: 'normal',
  fontSize: 'medium',
}

export type LetterTemplate = {
  id: string
  name: string
  defaultBody: string
  style?: LetterStyle
}

export type ComposerTemplate = {
  id: string
  name: string
  body: string
  style: LetterStyle
  source: 'builtin' | 'user'
}

export function normalizeTemplate(t: LetterTemplate): ComposerTemplate {
  return {
    id: t.id,
    name: t.name,
    body: t.defaultBody,
    style: t.style ?? DEFAULT_STYLE,
    source: 'builtin',
  }
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'holiday',
    name: 'Holiday',
    style: { font: 'serif', accentColor: '#8B4513', lineSpacing: 'normal', fontSize: 'medium' },
    defaultBody: `# Happy Holidays, {{first_name}}!

What a year it's been. I've been thinking about you and wanted to take a moment to send some warmth your way.

Wishing you and yours a season full of joy, rest, and good company.

With love,
[Your name]`,
  },
  {
    id: 'summer',
    name: 'Summer',
    style: { font: 'serif', accentColor: '#D2691E', lineSpacing: 'normal', fontSize: 'medium' },
    defaultBody: `# Hey {{first_name}}!

Summer's here and I wanted to say hi. Hope life is treating you well and you're getting some sun.

Thinking of you from afar. Let's catch up soon.

Warmly,
[Your name]`,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    style: { font: 'serif', accentColor: '#9B59B6', lineSpacing: 'relaxed', fontSize: 'medium' },
    defaultBody: `# Happy Birthday, {{first_name}}!

Just wanted to take a moment to celebrate you today. Hope this year brings you everything you've been hoping for.

Cheers to you!
[Your name]`,
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    style: { font: 'serif', accentColor: '#2E8B57', lineSpacing: 'normal', fontSize: 'medium' },
    defaultBody: `# Hi {{first_name}},

I've been meaning to write for a while. Life gets busy, but I didn't want too much time to pass without reaching out.

Hope all is well on your end. Sending good thoughts your way.

Take care,
[Your name]`,
  },
]
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run lib/letter-templates.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add lib/letter-templates.ts lib/letter-templates.test.ts && git commit -m "feat: add LetterStyle, ComposerTemplate, normalizeTemplate to letter-templates"
```

---

### Task 2: Add letterStyleSchema and update letterDraftSchema in schemas.ts

**Files:**
- Modify: `lib/schemas.ts`
- Modify: `lib/schemas.test.ts`

- [ ] **Step 1: Write failing tests for letterStyleSchema**

In `lib/schemas.test.ts`, merge `letterStyleSchema` into the **existing** import at line 2 (do not add a second import statement — ESM requires all imports at the top of the file):

```ts
import { contactSchema, letterDraftSchema, slugSchema, letterStyleSchema } from './schemas'
```

Then append these describe blocks after the existing ones:

```ts
describe('letterStyleSchema', () => {
  const valid = {
    font: 'serif',
    accentColor: '#C05C2E',
    lineSpacing: 'normal',
    fontSize: 'medium',
  }

  it('accepts valid style', () => {
    expect(letterStyleSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts sans font', () => {
    expect(letterStyleSchema.safeParse({ ...valid, font: 'sans' }).success).toBe(true)
  })

  it('rejects unknown font', () => {
    expect(letterStyleSchema.safeParse({ ...valid, font: 'mono' }).success).toBe(false)
  })

  it('rejects malformed hex color (no #)', () => {
    expect(letterStyleSchema.safeParse({ ...valid, accentColor: 'C05C2E' }).success).toBe(false)
  })

  it('rejects 3-char hex', () => {
    expect(letterStyleSchema.safeParse({ ...valid, accentColor: '#C05' }).success).toBe(false)
  })

  it('rejects invalid lineSpacing', () => {
    expect(letterStyleSchema.safeParse({ ...valid, lineSpacing: 'wide' }).success).toBe(false)
  })

  it('rejects invalid fontSize', () => {
    expect(letterStyleSchema.safeParse({ ...valid, fontSize: 'huge' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run lib/schemas.test.ts
```

Expected: fails — `letterStyleSchema` not exported from `./schemas`.

- [ ] **Step 3: Add letterStyleSchema and update letterDraftSchema in lib/schemas.ts**

Add after the existing `letterDraftSchema` block:

```ts
export const letterStyleSchema = z.object({
  font: z.enum(['serif', 'sans']),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lineSpacing: z.enum(['compact', 'normal', 'relaxed']),
  fontSize: z.enum(['small', 'medium', 'large']),
})

export type LetterStyleInput = z.infer<typeof letterStyleSchema>
```

Also update `letterDraftSchema` to accept an optional style field by composing `letterStyleSchema` — do not inline the shape again:

```ts
export const letterDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
  style: letterStyleSchema.optional(),
})

export type LetterDraftInput = z.infer<typeof letterDraftSchema>
```

Note: `letterStyleSchema` must be defined **before** `letterDraftSchema` in the file. Move it above the existing `letterDraftSchema` block.

- [ ] **Step 4: Run all tests**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run lib/schemas.test.ts
```

Expected: all tests pass including the new letterStyleSchema suite.

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add lib/schemas.ts lib/schemas.test.ts && git commit -m "feat: add letterStyleSchema, update letterDraftSchema with optional style"
```

---

### Task 3: Database migrations

**Files:**
- Create: `supabase/migrations/006_add_style_to_letter_drafts.sql`
- Create: `supabase/migrations/007_letter_templates.sql`

- [ ] **Step 1: Create migration 006 — add style column to letter_drafts**

`supabase/migrations/006_add_style_to_letter_drafts.sql`:

```sql
alter table letter_drafts
  add column if not exists style jsonb not null
  default '{"font":"serif","accentColor":"#C05C2E","lineSpacing":"normal","fontSize":"medium"}';
```

- [ ] **Step 2: Create migration 007 — letter_templates table**

`supabase/migrations/007_letter_templates.sql`:

```sql
create table if not exists letter_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  body text not null,
  style jsonb not null,
  created_at timestamptz default now()
);

alter table letter_templates enable row level security;

-- Drop first so this migration is safe to re-run in development
drop policy if exists "Users manage own templates" on letter_templates;
create policy "Users manage own templates"
  on letter_templates
  for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());
```

- [ ] **Step 3: Apply migrations via Supabase dashboard**

Open the Supabase dashboard → SQL editor. Run 006 first, then 007. Confirm both succeed with no errors.

- [ ] **Step 4: Commit migration files**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add supabase/migrations/006_add_style_to_letter_drafts.sql supabase/migrations/007_letter_templates.sql && git commit -m "feat: add style column to letter_drafts, add letter_templates table"
```

---

### Task 4: Update server actions in lib/actions/letter.ts

**Files:**
- Modify: `lib/actions/letter.ts`

- [ ] **Step 1: Update getDraft to return style**

In `getDraft`, update the fallback return to include `style`:

```ts
export async function getDraft() {
  const supabase = await createClient()
  const { data } = await supabase.from('letter_drafts').select('*').maybeSingle()
  // Cast style from Supabase Json type to LetterStyle — the DB column is validated on write
  if (data) return { ...data, style: (data.style ?? DEFAULT_STYLE) as LetterStyle }
  return { subject: '', body: '', style: DEFAULT_STYLE }
}
```

Add the import at the top of the file:

```ts
import { DEFAULT_STYLE, type LetterStyle, type ComposerTemplate } from '@/lib/letter-templates'
import { letterStyleSchema } from '@/lib/schemas'
```

- [ ] **Step 2: Update saveDraft to persist style**

Replace the existing `saveDraft` function:

```ts
export async function saveDraft(formData: { subject: string; body: string; style?: LetterStyle }) {
  const parsed = letterDraftSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('letter_drafts')
    .upsert({ admin_id: user.id, ...parsed.data }, { onConflict: 'admin_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/compose')
  return { success: true }
}
```

- [ ] **Step 3: Update buildLetterEmail in lib/resend.ts to accept LetterStyle**

`buildLetterEmail` currently accepts only `{ subject, body }`. Update it to also accept an optional `style` and apply it via **inline CSS only** (email clients strip `<style>` blocks):

Add import at top of `lib/resend.ts`:
```ts
import { type LetterStyle } from './letter-templates'
```

Replace the existing `buildLetterEmail` function:

```ts
export function buildLetterEmail(opts: {
  subject: string
  body: string
  style?: LetterStyle
}): { subject: string; html: string } {
  const accentColor = opts.style?.accentColor ?? '#C05C2E'
  const fontFamily =
    opts.style?.font === 'sans'
      ? '"Helvetica Neue", Arial, sans-serif'
      : 'Georgia, "Times New Roman", serif'
  const fontSize = { small: '14px', medium: '16px', large: '18px' }[opts.style?.fontSize ?? 'medium']
  const lineHeight = { compact: '1.5', normal: '1.75', relaxed: '2.0' }[opts.style?.lineSpacing ?? 'normal']

  const htmlBody = opts.body
    .replace(
      /^# (.+)$/gm,
      `<h1 style="color:${accentColor};font-family:${fontFamily};margin:0 0 12px">$1</h1>`,
    )
    .replace(
      /^## (.+)$/gm,
      `<h2 style="color:${accentColor};font-family:${fontFamily};margin:0 0 8px">$1</h2>`,
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px">')
    .replace(/\n/g, '<br/>')

  return {
    subject: opts.subject,
    html: `<div style="font-family:${fontFamily};font-size:${fontSize};line-height:${lineHeight};color:#231209;max-width:600px;margin:0 auto;padding:40px 24px"><p style="margin:0 0 16px">${htmlBody}</p></div>`,
  }
}
```

- [ ] **Step 4: Update sendDigitalLetters to pass style to buildLetterEmail**

In `sendDigitalLetters`, update the draft fetch and email build:

```ts
const { data: draft } = await supabase.from('letter_drafts').select('*').maybeSingle()
if (!draft?.subject || !draft?.body) return { error: 'No draft saved.' }
const style = (draft.style ?? DEFAULT_STYLE) as LetterStyle
// ... (contacts fetch unchanged) ...
const { html } = buildLetterEmail({ subject, body, style })
```

- [ ] **Step 5: Add listTemplates, saveTemplate, deleteTemplate to lib/actions/letter.ts**

Append to `lib/actions/letter.ts`:

```ts
export async function listTemplates(): Promise<ComposerTemplate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('letter_templates')
    .select('*')
    .order('created_at', { ascending: true })

  return (data ?? []).map(t => ({
    id: t.id,
    name: t.name,
    body: t.body,
    style: t.style as LetterStyle,
    source: 'user' as const,
  }))
}

export async function saveTemplate(input: {
  name: string
  body: string
  style: LetterStyle
}): Promise<{ success?: true; template?: ComposerTemplate; error?: string }> {
  if (!input.name.trim()) return { error: 'Template name is required' }

  const styleResult = letterStyleSchema.safeParse(input.style)
  if (!styleResult.success) return { error: 'Invalid style' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('letter_templates')
    .insert({ admin_id: user.id, name: input.name.trim(), body: input.body, style: styleResult.data })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/compose')
  return {
    success: true,
    template: {
      id: data.id,
      name: data.name,
      body: data.body,
      style: data.style as LetterStyle,
      source: 'user',
    },
  }
}

export async function deleteTemplate(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('letter_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/compose')
  return { success: true }
}
```

- [ ] **Step 6: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add lib/actions/letter.ts lib/resend.ts && git commit -m "feat: update saveDraft with style, add listTemplates/saveTemplate/deleteTemplate, apply LetterStyle to email"
```

---

## Chunk 2: Editor components

### Task 5: Install CodeMirror packages

**Files:** `package.json` (updated by npm)

- [ ] **Step 1: Install packages**

```bash
cd "/Volumes/General External/dev/dearfriends" && npm install @uiw/react-codemirror @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/language @lezer/highlight
```

- [ ] **Step 2: Verify install**

```bash
cd "/Volumes/General External/dev/dearfriends" && node -e "require('@uiw/react-codemirror')" 2>&1 || echo "check node_modules"
```

Expected: no error (or silent).

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add package.json package-lock.json && git commit -m "chore: install codemirror packages for markdown editor"
```

---

### Task 6: Create warm CodeMirror theme

**Files:**
- Create: `components/editor/warm-theme.ts`

- [ ] **Step 1: Create components/editor/ directory and warm-theme.ts**

`components/editor/warm-theme.ts`:

```ts
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const warmEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#F5EFE4',
      color: '#231209',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px',
    },
    '.cm-content': {
      padding: '16px 20px',
      caretColor: '#C05C2E',
      lineHeight: '1.75',
      minHeight: '380px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#C05C2E',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'inherit',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(192,92,46,0.15)',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(192,92,46,0.2)',
    },
  },
  { dark: false },
)

const warmHighlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: '1.35em',
    fontWeight: '700',
    color: '#231209',
    fontFamily: '"Playfair Display", serif',
    lineHeight: '1.3',
  },
  {
    tag: tags.heading2,
    fontSize: '1.15em',
    fontWeight: '700',
    color: '#231209',
    fontFamily: '"Playfair Display", serif',
  },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#3d2212' },
  { tag: tags.url, color: '#C05C2E', textDecoration: 'underline' },
  { tag: tags.monospace, fontFamily: 'monospace', color: '#5A7A5A', fontSize: '0.9em' },
  { tag: tags.processingInstruction, color: '#9E4A23', fontFamily: 'monospace', fontSize: '0.85em' },
])

export const warmExtensions = [warmEditorTheme, syntaxHighlighting(warmHighlightStyle)]
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add components/editor/warm-theme.ts && git commit -m "feat: add warm CodeMirror theme for composer editor"
```

---

### Task 7: Create MarkdownEditor component

**Files:**
- Create: `components/editor/markdown-editor.tsx`

- [ ] **Step 1: Create markdown-editor.tsx**

`components/editor/markdown-editor.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { warmExtensions } from './warm-theme'

export type { ReactCodeMirrorRef }

type Props = {
  value: string
  onChange: (value: string) => void
  editorRef?: React.RefObject<ReactCodeMirrorRef | null>
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, editorRef, placeholder }: Props) {
  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={onChange}
      extensions={[markdown(), ...warmExtensions, EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: false,
        bracketMatching: false,
        closeBrackets: false,
        autocompletion: false,
        rectangularSelection: false,
        crosshairCursor: false,
        highlightActiveLine: false,
        highlightSelectionMatches: false,
        closeBracketsKeymap: false,
        searchKeymap: false,
      }}
      placeholder={placeholder}
      className="min-h-[420px]"
    />
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add components/editor/markdown-editor.tsx && git commit -m "feat: add MarkdownEditor CodeMirror wrapper component"
```

---

### Task 8: Create EditorToolbar component

**Files:**
- Create: `components/editor/editor-toolbar.tsx`

- [ ] **Step 1: Create editor-toolbar.tsx**

`components/editor/editor-toolbar.tsx`:

```tsx
'use client'

import type { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'

type Props = {
  editorRef: React.RefObject<ReactCodeMirrorRef | null>
}

function wrapSelection(view: EditorView, before: string, after: string) {
  const { state } = view
  const changes = state.selection.ranges.map(range => {
    if (range.empty) {
      return { from: range.from, to: range.from, insert: before + after }
    }
    const text = state.sliceDoc(range.from, range.to)
    return { from: range.from, to: range.to, insert: before + text + after }
  })
  view.dispatch({ changes })
  view.focus()
}

function prefixLine(view: EditorView, prefix: string) {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const hasPrefix = line.text.startsWith(prefix)
  view.dispatch({
    changes: hasPrefix
      ? { from: line.from, to: line.from + prefix.length, insert: '' }
      : { from: line.from, insert: prefix },
  })
  view.focus()
}

function insertAtCursor(view: EditorView, text: string) {
  const pos = view.state.selection.main.from
  view.dispatch({ changes: { from: pos, insert: text } })
  view.focus()
}

function ToolbarButton({
  onClick,
  title,
  children,
  className = '',
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 min-w-[32px] px-2 rounded-lg text-sm text-ink-muted hover:bg-linen hover:text-ink transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editorRef }: Props) {
  const getView = () => editorRef.current?.view

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1 py-1.5 border-b border-border/80 bg-surface rounded-t-xl">
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) wrapSelection(v, '**', '**') }}
        title="Bold"
        className="font-bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) wrapSelection(v, '*', '*') }}
        title="Italic"
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '# ') }}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '## ') }}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '- ') }}
        title="Bullet list"
      >
        &#8212;
      </ToolbarButton>
      <div className="w-px h-5 bg-border/60 mx-1" />
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) insertAtCursor(v, '{{first_name}}') }}
        title="Insert first name"
        className="font-mono text-terra text-[11px] px-2"
      >
        {'{{first_name}}'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) insertAtCursor(v, '{{last_name}}') }}
        title="Insert last name"
        className="font-mono text-terra text-[11px] px-2"
      >
        {'{{last_name}}'}
      </ToolbarButton>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add components/editor/editor-toolbar.tsx && git commit -m "feat: add EditorToolbar with bold/italic/heading/list/variable buttons"
```

---

## Chunk 3: Composer UI

### Task 9: Update TemplatePicker to use ComposerTemplate

**Files:**
- Modify: `components/template-picker.tsx`

- [ ] **Step 1: Replace template-picker.tsx**

```tsx
'use client'

import { type ComposerTemplate } from '@/lib/letter-templates'

export function TemplatePicker({
  templates,
  onSelect,
  onDelete,
  selectedId,
}: {
  templates: ComposerTemplate[]
  onSelect: (template: ComposerTemplate) => void
  onDelete?: (id: string) => void
  selectedId?: string
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {templates.map(template => {
        const isSelected = template.id === selectedId
        const accentColor = template.style.accentColor
        return (
          <div key={template.id} className="relative flex-shrink-0 group">
            <button
              type="button"
              onClick={() => onSelect(template)}
              className={`w-[88px] rounded-xl border bg-white text-left transition-all overflow-hidden ${
                isSelected
                  ? 'border-terra shadow-[0_0_0_2px_rgba(192,92,46,0.18)]'
                  : 'border-border/80 hover:border-terra/40'
              }`}
            >
              {/* Mini letter preview */}
              <div
                className="h-12 p-2 flex flex-col gap-[5px]"
                style={{ backgroundColor: `${accentColor}0f` }}
              >
                <div className="h-[4px] rounded-full w-3/5" style={{ backgroundColor: `${accentColor}66` }} />
                <div className="h-[3px] rounded-full w-4/5 bg-ink/10" />
                <div className="h-[3px] rounded-full w-full bg-ink/10" />
                <div className="h-[3px] rounded-full w-2/5 bg-ink/10" />
              </div>
              {/* Name */}
              <div
                className="py-1.5 text-center"
                style={{
                  borderTop: '1px solid rgba(221,208,188,0.6)',
                  fontSize: '9px',
                  color: isSelected ? accentColor : '#7A6352',
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {template.name}
              </div>
            </button>

            {/* "yours" label + delete button for user templates */}
            {template.source === 'user' && (
              <>
                <span className="absolute top-1 left-1 text-[8px] text-ink-muted/60 leading-none pointer-events-none">
                  yours
                </span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(template.id)}
                    title="Delete template"
                    className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-ink/10 text-ink-muted hover:bg-terra hover:text-white transition-colors text-[9px] leading-none"
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors. (Note: `LetterComposer` still imports the old interface — it will error until Task 10. Expect errors only from `letter-composer.tsx`.)

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add components/template-picker.tsx && git commit -m "feat: update TemplatePicker to use ComposerTemplate with user template labels and delete"
```

---

### Task 10: Rewrite LetterComposer with editor, style tab, and template save

**Files:**
- Modify: `components/letter-composer.tsx`

- [ ] **Step 1: Replace letter-composer.tsx**

```tsx
'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft, saveTemplate, deleteTemplate } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'
import { TemplatePicker } from '@/components/template-picker'
import { MarkdownEditor, type ReactCodeMirrorRef } from '@/components/editor/markdown-editor'
import { EditorToolbar } from '@/components/editor/editor-toolbar'
import { LETTER_TEMPLATES, normalizeTemplate, DEFAULT_STYLE, type LetterStyle, type ComposerTemplate } from '@/lib/letter-templates'

const ACCENT_PRESETS = [
  '#C05C2E', '#8B4513', '#9B59B6', '#2E8B57',
  '#D2691E', '#4A90D9', '#C0392B', '#7A6352',
]

const SPACING_OPTIONS: { value: LetterStyle['lineSpacing']; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
]

const SIZE_OPTIONS: { value: LetterStyle['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

type Props = {
  initialSubject: string
  initialBody: string
  initialStyle: LetterStyle
  userTemplates: ComposerTemplate[]
  previewContact: { first_name: string; last_name: string }
}

export function LetterComposer({ initialSubject, initialBody, initialStyle, userTemplates, previewContact }: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [style, setStyle] = useState<LetterStyle>(initialStyle)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'write' | 'style'>('write')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [localUserTemplates, setLocalUserTemplates] = useState<ComposerTemplate[]>(userTemplates)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [saveTemplateError, setSaveTemplateError] = useState<string | null>(null)
  const [hexInput, setHexInput] = useState(initialStyle.accentColor)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<ReactCodeMirrorRef | null>(null)

  const allTemplates: ComposerTemplate[] = [
    ...LETTER_TEMPLATES.map(normalizeTemplate),
    ...localUserTemplates,
  ]

  function triggerSave(nextSubject: string, nextBody: string, nextStyle: LetterStyle) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!nextSubject.trim()) return
      setSaving(true)
      await saveDraft({ subject: nextSubject, body: nextBody, style: nextStyle })
      setSaving(false)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1000)
  }

  function handleTemplateSelect(template: ComposerTemplate) {
    const hasContent = body.trim().length > 0
    if (hasContent) {
      const confirmed = window.confirm('Replace your current draft with this template?')
      if (!confirmed) return
    }
    setSelectedTemplateId(template.id)
    setBody(template.body)
    setStyle(template.style)
    setHexInput(template.style.accentColor)
    triggerSave(subject, template.body, template.style)
  }

  function handleStyleChange(patch: Partial<LetterStyle>) {
    const next = { ...style, ...patch }
    setStyle(next)
    triggerSave(subject, body, next)
  }

  function handleHexBlur() {
    const clean = hexInput.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      handleStyleChange({ accentColor: clean })
    } else {
      setHexInput(style.accentColor)
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      setSaveTemplateError('Name is required')
      return
    }
    setSavingTemplate(true)
    setSaveTemplateError(null)
    const result = await saveTemplate({ name: templateName.trim(), body, style })
    setSavingTemplate(false)
    if (result.error) {
      setSaveTemplateError(result.error)
    } else if (result.template) {
      setLocalUserTemplates(prev => [...prev, result.template!])
      setTemplateName('')
      setShowSaveTemplate(false)
    }
  }

  async function handleDeleteTemplate(id: string) {
    const previous = localUserTemplates
    setLocalUserTemplates(prev => prev.filter(t => t.id !== id))
    setDeleteError(null)
    const result = await deleteTemplate(id)
    if (result.error) {
      setLocalUserTemplates(previous)
      setDeleteError(result.error)
    }
  }

  const previewBody = interpolate(body, previewContact)
  const fontClass = style.font === 'serif' ? 'font-serif' : 'font-sans'
  const spacingClass = { compact: 'leading-6', normal: 'leading-7', relaxed: 'leading-8' }[style.lineSpacing]
  const sizeClass = { small: 'text-sm', medium: 'text-base', large: 'text-lg' }[style.fontSize]

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <section className="surface-panel px-5 py-5">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-2xl text-ink">Write your letter</h2>
            <span className="text-xs text-ink-muted">{saving ? 'Saving…' : saveStatus ?? ''}</span>
          </div>

          {/* Tab row */}
          <div className="flex gap-0 border-b border-border/80">
            {(['write', 'style'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-terra text-terra font-medium'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Write tab */}
          {activeTab === 'write' && (
            <div className="flex flex-col gap-4">
              <input
                value={subject}
                onChange={e => {
                  setSubject(e.target.value)
                  triggerSave(e.target.value, body, style)
                }}
                placeholder="Subject line"
                className="input min-h-12"
              />

              <TemplatePicker
                templates={allTemplates}
                onSelect={handleTemplateSelect}
                onDelete={handleDeleteTemplate}
                selectedId={selectedTemplateId}
              />

              {deleteError && (
                <p className="text-xs text-red-500">{deleteError}</p>
              )}

              <div className="rounded-xl overflow-hidden border border-border/80">
                <EditorToolbar editorRef={editorRef} />
                <MarkdownEditor
                  value={body}
                  onChange={val => {
                    setBody(val)
                    triggerSave(subject, val, style)
                  }}
                  editorRef={editorRef}
                  placeholder={'Dear {{first_name}},\n\nYour letter here...'}
                />
              </div>

              <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4 text-sm text-ink-muted">
                Use{' '}
                <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-terra">{'{{first_name}}'}</code> and{' '}
                <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-terra">{'{{last_name}}'}</code> to personalize each note.
              </div>
            </div>
          )}

          {/* Style tab */}
          {activeTab === 'style' && (
            <div className="flex flex-col gap-6">
              {/* Font */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-ink-muted font-medium">Font</label>
                <div className="flex gap-2">
                  {(['serif', 'sans'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleStyleChange({ font: f })}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                        style.font === f
                          ? 'border-terra bg-terra/5 text-terra font-medium'
                          : 'border-border/80 text-ink-muted hover:border-terra/40'
                      } ${f === 'serif' ? 'font-serif' : 'font-sans'}`}
                    >
                      {f === 'serif' ? 'Serif' : 'Sans'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-ink-muted font-medium">Accent color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        handleStyleChange({ accentColor: color })
                        setHexInput(color)
                      }}
                      title={color}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        style.accentColor === color ? 'border-ink/40 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-7 w-7 rounded-full border border-border/80 flex-shrink-0" style={{ backgroundColor: style.accentColor }} />
                  <input
                    value={hexInput}
                    onChange={e => setHexInput(e.target.value)}
                    onBlur={handleHexBlur}
                    placeholder="#C05C2E"
                    maxLength={7}
                    className={`input text-sm font-mono w-32 ${
                      /^#[0-9a-fA-F]{6}$/.test(hexInput) ? '' : 'ring-1 ring-red-400'
                    }`}
                  />
                </div>
              </div>

              {/* Line spacing */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-ink-muted font-medium">Line spacing</label>
                <div className="flex gap-2">
                  {SPACING_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStyleChange({ lineSpacing: opt.value })}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                        style.lineSpacing === opt.value
                          ? 'border-terra bg-terra/5 text-terra font-medium'
                          : 'border-border/80 text-ink-muted hover:border-terra/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-ink-muted font-medium">Font size</label>
                <div className="flex gap-2">
                  {SIZE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStyleChange({ fontSize: opt.value })}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                        style.fontSize === opt.value
                          ? 'border-terra bg-terra/5 text-terra font-medium'
                          : 'border-border/80 text-ink-muted hover:border-terra/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save as template */}
              <div className="border-t border-border/80 pt-4">
                {!showSaveTemplate ? (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplate(true)}
                    className="text-sm text-ink-muted hover:text-ink transition-colors underline underline-offset-2"
                  >
                    Save current letter + style as template
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="Template name"
                      className="input text-sm"
                      autoFocus
                    />
                    {saveTemplateError && (
                      <p className="text-xs text-red-500">{saveTemplateError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="flex-1 py-2 px-3 rounded-xl bg-terra text-white text-sm font-medium hover:bg-terra-dark disabled:opacity-50 transition-colors"
                      >
                        {savingTemplate ? 'Saving…' : 'Save template'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveTemplate(false)
                          setTemplateName('')
                          setSaveTemplateError(null)
                        }}
                        className="py-2 px-3 rounded-xl border border-border/80 text-sm text-ink-muted hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Preview panel */}
      <section className="surface-panel px-5 py-5">
        <div className="flex items-end justify-between gap-3 border-b border-border/80 pb-4">
          <h2 className="font-serif text-3xl text-ink">
            For {previewContact.first_name} {previewContact.last_name}
          </h2>
          <div className="hidden rounded-full bg-sage/10 px-3 py-2 text-xs font-medium text-sage md:inline-flex">
            Live preview
          </div>
        </div>

        <div className="mt-4 min-h-[420px] rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,#ffffff_0%,#fdf9f3_100%)] px-6 py-6 shadow-sm overflow-hidden relative">
          {/* Accent stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[1.5rem]"
            style={{ background: `linear-gradient(90deg, ${style.accentColor}, transparent)` }}
          />
          <div className="border-b border-border/80 pb-3">
            <p className="font-serif text-lg italic text-ink-muted">{subject || 'Subject line'}</p>
          </div>
          <div className={`prose prose-sm mt-5 max-w-none ${fontClass} ${spacingClass} ${sizeClass} text-ink`}
            style={{ '--tw-prose-headings': style.accentColor } as React.CSSProperties}
          >
            <ReactMarkdown>{previewBody}</ReactMarkdown>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add components/letter-composer.tsx && git commit -m "feat: replace textarea with CodeMirror editor, add Style tab and template save in LetterComposer"
```

---

### Task 11: Update compose page to pass initialStyle and userTemplates

**Files:**
- Modify: `app/dashboard/compose/page.tsx`

- [ ] **Step 1: Update compose/page.tsx**

```tsx
import { Suspense } from 'react'
import { LetterComposer } from '@/components/letter-composer'
import { GroupFilter } from '@/components/group-filter'
import { getDraft, getRandomContact, listTemplates } from '@/lib/actions/letter'
import { getGroups, getContactsByGroup } from '@/lib/actions/groups'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null

  const [draft, groups, groupContacts, userTemplates] = await Promise.all([
    getDraft(),
    getGroups(),
    getContactsByGroup(groupId),
    listTemplates(),
  ])

  const contact =
    groupContacts.length > 0
      ? groupContacts[Math.floor(Math.random() * groupContacts.length)]
      : await getRandomContact()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <h1 className="font-serif text-4xl text-ink">Compose your letter</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          Draft once, personalize with merge tags, and check the live preview before you export or send.
        </p>
        {groups.length > 0 && (
          <div className="mt-4">
            <Suspense>
              <GroupFilter groups={groups} />
            </Suspense>
          </div>
        )}
      </section>

      <LetterComposer
        initialSubject={draft.subject}
        initialBody={draft.body}
        initialStyle={draft.style}
        userTemplates={userTemplates}
        previewContact={contact}
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add app/dashboard/compose/page.tsx && git commit -m "feat: pass initialStyle and userTemplates to LetterComposer from compose page"
```

---

## Chunk 4: Export passthrough

### Task 12: Update PDF export to apply LetterStyle

**Files:**
- Modify: `lib/pdf.ts`
- Modify: `app/api/export/pdf/route.ts`

- [ ] **Step 1: Update lib/pdf.ts to accept LetterStyle**

```ts
import { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { interpolate } from './utils'
import { DEFAULT_STYLE, type LetterStyle } from './letter-templates'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyDocument = Document as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPage = Page as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyView = View as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyText = Text as any

const FONT_MAP = {
  serif: 'Times-Roman',
  sans: 'Helvetica',
} as const

const FONT_SIZE_MAP = {
  small: 10,
  medium: 12,
  large: 14,
} as const

const LINE_HEIGHT_MAP = {
  compact: 1.4,
  normal: 1.6,
  relaxed: 1.9,
} as const

function buildLetterDocument(
  pages: { name: string; body: string }[],
  style: LetterStyle,
) {
  const pageStyles = StyleSheet.create({
    page: {
      padding: 60,
      fontFamily: FONT_MAP[style.font],
      fontSize: FONT_SIZE_MAP[style.fontSize],
      lineHeight: LINE_HEIGHT_MAP[style.lineSpacing],
    },
    body: { whiteSpace: 'pre-wrap' as const },
  })

  return createElement(
    AnyDocument,
    null,
    ...pages.map((page, i) =>
      createElement(
        AnyPage,
        { key: i, size: 'A4', style: pageStyles.page },
        createElement(AnyView, { style: pageStyles.body }, createElement(AnyText, null, page.body)),
      ),
    ),
  )
}

export async function generateLetterPdf(
  contacts: { first_name: string; last_name: string }[],
  body: string,
  style: LetterStyle = DEFAULT_STYLE,
): Promise<Buffer> {
  const pages = contacts.map(contact => ({
    name: `${contact.first_name} ${contact.last_name}`,
    body: interpolate(body, { first_name: contact.first_name, last_name: contact.last_name }),
  }))

  const doc = buildLetterDocument(pages, style)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any)
}
```

- [ ] **Step 2: Update app/api/export/pdf/route.ts to pass style**

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLetterPdf } from '@/lib/pdf'
import { recordFirstSent } from '@/lib/actions/user'
import { DEFAULT_STYLE, type LetterStyle } from '@/lib/letter-templates'

export async function GET() {
  await recordFirstSent()
  const supabase = await createClient()

  const [{ data: draft }, { data: contacts }] = await Promise.all([
    supabase.from('letter_drafts').select('body, style').maybeSingle(),
    supabase.from('contacts').select('first_name, last_name').eq('delivery_method', 'print').eq('opted_out', false),
  ])

  if (!draft?.body) return NextResponse.json({ error: 'No draft saved.' }, { status: 400 })
  if (!contacts?.length) return NextResponse.json({ error: 'No print contacts.' }, { status: 400 })

  const style = (draft.style as LetterStyle) ?? DEFAULT_STYLE
  const buffer = await generateLetterPdf(contacts, draft.body, style)
  const bytes = new Uint8Array(buffer)

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="letters.pdf"',
    },
  })
}
```

**Note — accentColor in PDF:** `LetterStyle.accentColor` is accepted by `generateLetterPdf` but not applied to the rendered output. The current `@react-pdf/renderer` implementation renders the letter body as a plain `Text` node without markdown-to-element conversion, so heading colors cannot be applied without a markdown parser. This is an intentional limitation — font, size, and spacing are applied; accent color in PDF is deferred to a future improvement.

- [ ] **Step 3: Typecheck**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/General External/dev/dearfriends" && git add lib/pdf.ts app/api/export/pdf/route.ts && git commit -m "feat: apply LetterStyle to PDF export (font, size, line height)"
```

- [ ] **Step 5: Run all tests**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Build check**

```bash
cd "/Volumes/General External/dev/dearfriends" && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

---

## Manual verification checklist

After all tasks complete, verify these flows in the browser (`npm run dev`):

- [ ] `/dashboard/compose` loads without errors
- [ ] CodeMirror editor renders with warm linen background; typing works
- [ ] Toolbar **B** wraps selected text in `**...**`; toolbar *I* wraps in `*...*`
- [ ] H1 / H2 prefix lines correctly; clicking again removes the prefix
- [ ] `{{first_name}}` and `{{last_name}}` chips insert at cursor
- [ ] Switching to Style tab shows font / accent / spacing / size controls
- [ ] Changing accent color updates the preview stripe and heading color in real time
- [ ] Hex input: entering a valid hex applies it; entering an invalid value reverts on blur
- [ ] "Save as template" form appears, saves, and the new card appears in the picker under "yours"
- [ ] Delete button on a user template card removes it; refresh still shows removal
- [ ] Selecting a template updates the editor body AND the style panel
- [ ] Draft auto-saves (check Supabase table for `style` column update)
- [ ] PDF export downloads and reflects the chosen font/size/spacing
- [ ] Digital send (if test contacts available) produces emails with styled HTML
