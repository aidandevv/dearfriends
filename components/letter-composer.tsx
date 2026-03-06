'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'

type Props = {
  initialSubject: string
  initialBody: string
  previewContact: { first_name: string; last_name: string }
}

export function LetterComposer({ initialSubject, initialBody, previewContact }: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function triggerSave(nextSubject: string, nextBody: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!nextSubject.trim()) return
      setSaving(true)
      await saveDraft({ subject: nextSubject, body: nextBody })
      setSaving(false)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1000)
  }

  const previewBody = interpolate(body, previewContact)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <section className="surface-panel px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Draft</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Write your letter</h2>
            </div>
            <span className="text-sm text-ink-muted">{saving ? 'Saving...' : saveStatus ?? 'Autosaves as you type'}</span>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Subject</label>
              <input
                value={subject}
                onChange={e => {
                  setSubject(e.target.value)
                  triggerSave(e.target.value, body)
                }}
                placeholder="Subject line"
                className="input min-h-12"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Body</label>
              <textarea
                value={body}
                onChange={e => {
                  setBody(e.target.value)
                  triggerSave(subject, e.target.value)
                }}
                placeholder={'Dear {{first_name}},\n\nYour letter here...'}
                className="input min-h-[420px] resize-none font-mono text-sm leading-7"
              />
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4 text-sm text-ink-muted">
            Use <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-terra">{'{{first_name}}'}</code> and{' '}
            <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-terra">{'{{last_name}}'}</code> to personalize each note.
          </div>
        </div>
      </section>

      <section className="surface-panel px-5 py-5">
        <div className="flex items-end justify-between gap-3 border-b border-border/80 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Preview</p>
            <h2 className="mt-2 font-serif text-3xl text-ink">
              For {previewContact.first_name} {previewContact.last_name}
            </h2>
          </div>
          <div className="hidden rounded-full border border-border/80 bg-surface-raised px-3 py-2 text-xs font-medium text-ink-muted md:inline-flex">
            Live preview
          </div>
        </div>

        <div className="mt-4 min-h-[420px] rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,#ffffff_0%,#fdf9f3_100%)] px-6 py-6 shadow-sm">
          <div className="border-b border-border/80 pb-3">
            <p className="font-serif text-lg italic text-ink-muted">{subject || 'Subject line'}</p>
          </div>
          <div className="prose prose-sm mt-5 max-w-none font-serif text-ink">
            <ReactMarkdown>{previewBody}</ReactMarkdown>
          </div>
        </div>
      </section>
    </div>
  )
}
