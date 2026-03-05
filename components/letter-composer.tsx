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

  function handleSubjectChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubject(e.target.value)
    triggerSave(e.target.value, body)
  }

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value)
    triggerSave(subject, e.target.value)
  }

  const previewBody = interpolate(body, previewContact)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          value={subject}
          onChange={handleSubjectChange}
          placeholder="Subject line"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        {saving && <span className="text-xs text-gray-400">Saving...</span>}
        {saveStatus && <span className="text-xs text-gray-500">{saveStatus}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium">Draft</p>
          <textarea
            value={body}
            onChange={handleBodyChange}
            placeholder={'Dear {{first_name}},\n\nYour letter here...'}
            className="border rounded px-3 py-2 text-sm h-96 resize-none font-mono"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium">Preview - {previewContact.first_name} {previewContact.last_name}</p>
          <div className="border rounded px-4 py-3 h-96 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown>{previewBody}</ReactMarkdown>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Use <code>{'{{first_name}}'}</code> and <code>{'{{last_name}}'}</code> as variables.
      </p>
    </div>
  )
}
