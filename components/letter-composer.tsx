'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'
import { TemplatePicker } from '@/components/template-picker'
import type { LetterTemplate } from '@/lib/letter-templates'
import { LETTER_TEMPLATES } from '@/lib/letter-templates'

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedTemplate = selectedTemplateId
    ? LETTER_TEMPLATES.find(t => t.id === selectedTemplateId)
    : null

  function handleTemplateSelect(template: LetterTemplate) {
    const hasContent = body.trim().length > 0
    if (hasContent) {
      const confirmed = window.confirm('Replace your current draft with this template?')
      if (!confirmed) return
    }
    setSelectedTemplateId(template.id)
    setBody(template.defaultBody)
    triggerSave(subject, template.defaultBody)
  }

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl text-ink">Write your letter</h2>
            <span className="text-xs text-ink-muted">{saving ? 'Saving…' : saveStatus ?? ''}</span>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
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
              <TemplatePicker onSelect={handleTemplateSelect} selectedId={selectedTemplateId} />
            </div>

            <div className="flex flex-col gap-1.5">
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
            <h2 className="font-serif text-3xl text-ink">
              For {previewContact.first_name} {previewContact.last_name}
            </h2>
          </div>
          <div className="hidden rounded-full bg-sage/10 px-3 py-2 text-xs font-medium text-sage md:inline-flex">
            Live preview
          </div>
        </div>

        <div
          className="mt-4 min-h-[420px] rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,#ffffff_0%,#fdf9f3_100%)] px-6 py-6 shadow-sm overflow-hidden relative"
        >
          {selectedTemplate && (
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[1.5rem]"
              style={{
                background: `linear-gradient(90deg, ${selectedTemplate.accentColor}, transparent)`,
              }}
            />
          )}
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
