'use client'

import { useState, useRef } from 'react'
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
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-ink-muted font-medium">Subject</label>
          <input
            value={subject}
            onChange={e => { setSubject(e.target.value); triggerSave(e.target.value, body) }}
            placeholder="Subject line"
            className="input"
          />
        </div>
        <span className="text-xs text-ink-muted pb-2.5 min-w-[40px]">
          {saving ? 'Saving...' : saveStatus ?? ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">Draft</p>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); triggerSave(subject, e.target.value) }}
            placeholder={'Dear {{first_name}},\n\nYour letter here...'}
            className="input h-96 resize-none font-mono text-xs leading-relaxed"
          />
          <p className="text-xs text-ink-muted">
            Use{' '}
            <code className="bg-linen px-1.5 py-0.5 rounded text-terra font-mono">{'{{first_name}}'}</code>
            {' '}and{' '}
            <code className="bg-linen px-1.5 py-0.5 rounded text-terra font-mono">{'{{last_name}}'}</code>
            {' '}as variables.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">
            Preview — {previewContact.first_name} {previewContact.last_name}
          </p>
          <div className="bg-surface-raised border border-border rounded-xl shadow-sm p-6 h-96 overflow-y-auto">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-serif text-sm text-ink-muted italic">{subject || 'Subject line'}</p>
            </div>
            <div className="prose prose-sm max-w-none font-serif text-ink">
              <ReactMarkdown>{previewBody}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
