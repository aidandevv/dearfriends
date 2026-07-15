'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bold, Heading2, Italic, Link, List, ListOrdered, Quote } from 'lucide-react'
import { saveDraft } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'
import { TemplatePicker } from '@/components/template-picker'
import type { LetterTemplate } from '@/lib/letter-templates'
import { LETTER_TEMPLATES } from '@/lib/letter-templates'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { ActionState } from '@/lib/action-result'

type Props = {
  initialSubject: string
  initialBody: string
  previewContacts: { first_name: string; last_name: string }[]
}

export function LetterComposer({ initialSubject, initialBody, previewContacts }: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [saveState, setSaveState] = useState<ActionState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [previewIndex, setPreviewIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const currentDraftRef = useRef({ subject: initialSubject, body: initialBody })
  const persistedDraftRef = useRef({ subject: initialSubject, body: initialBody })
  const savingRef = useRef(false)
  const queuedDraftRef = useRef<{ subject: string; body: string } | null>(null)

  const isDirty = subject !== persistedDraftRef.current.subject || body !== persistedDraftRef.current.body

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
  }

  const persistDraft = useCallback(async (requestedDraft = currentDraftRef.current) => {
    if (!requestedDraft.subject.trim()) {
      setSaveState('dirty')
      setSaveMessage('Add a subject to save this draft.')
      return
    }

    if (savingRef.current) {
      queuedDraftRef.current = requestedDraft
      return
    }

    savingRef.current = true
    let draft: { subject: string; body: string } | null = requestedDraft
    while (draft) {
      setSaveState('pending')
      setSaveMessage('Saving…')
      const result = await saveDraft(draft)
      if (result.success) {
        persistedDraftRef.current = draft
        const current = currentDraftRef.current
        const stillCurrent = current.subject === draft.subject && current.body === draft.body
        setSaveState(stillCurrent ? 'saved' : 'dirty')
        setSaveMessage(stillCurrent ? 'Saved.' : 'Unsaved changes')
      } else {
        setSaveState('error')
        setSaveMessage(`Could not save: ${result.error}`)
      }

      const queued = queuedDraftRef.current
      queuedDraftRef.current = null
      draft = queued && (queued.subject !== draft.subject || queued.body !== draft.body) ? queued : null
    }
    savingRef.current = false
  }, [])

  function updateBody(nextBody: string) {
    setBody(nextBody)
  }

  useEffect(() => {
    currentDraftRef.current = { subject, body }
    if (subject === persistedDraftRef.current.subject && body === persistedDraftRef.current.body) {
      if (!savingRef.current) {
        setSaveState('idle')
        setSaveMessage(null)
      }
      return
    }

    setSaveState('dirty')
    setSaveMessage(subject.trim() ? 'Unsaved changes' : 'Add a subject to save this draft.')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (subject.trim()) {
      const draft = { subject, body }
      debounceRef.current = setTimeout(() => void persistDraft(draft), 1000)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [subject, body, persistDraft])

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      const current = currentDraftRef.current
      const persisted = persistedDraftRef.current
      if (current.subject === persisted.subject && current.body === persisted.body) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [])

  function replaceSelection(formatter: (selection: string) => { text: string; cursorOffset?: number }) {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = body.slice(start, end)
    const { text, cursorOffset } = formatter(selected)
    const nextBody = `${body.slice(0, start)}${text}${body.slice(end)}`

    updateBody(nextBody)

    requestAnimationFrame(() => {
      textarea.focus()
      const nextCursor = start + (cursorOffset ?? text.length)
      textarea.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function formatLines(prefix: string) {
    replaceSelection(selection => {
      const text = selection || 'Text'
      const lines = text.split('\n')
      return { text: lines.map(line => line ? `${prefix}${line}` : prefix.trim()).join('\n') }
    })
  }

  const formattingButtons = [
    {
      label: 'Bold',
      icon: Bold,
      action: () => replaceSelection(selection => {
        const text = selection || 'bold text'
        return { text: `**${text}**`, cursorOffset: selection ? undefined : 2 + text.length }
      }),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => replaceSelection(selection => {
        const text = selection || 'italic text'
        return { text: `_${text}_`, cursorOffset: selection ? undefined : 1 + text.length }
      }),
    },
    {
      label: 'Heading',
      icon: Heading2,
      action: () => formatLines('## '),
    },
    {
      label: 'Bulleted list',
      icon: List,
      action: () => formatLines('- '),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      action: () => {
        replaceSelection(selection => {
          const text = selection || 'First item'
          const lines = text.split('\n')
          return { text: lines.map((line, index) => `${index + 1}. ${line || 'Item'}`).join('\n') }
        })
      },
    },
    {
      label: 'Quote',
      icon: Quote,
      action: () => formatLines('> '),
    },
    {
      label: 'Link',
      icon: Link,
      action: () => replaceSelection(selection => {
        const text = selection || 'link text'
        return { text: `[${text}](https://example.com)`, cursorOffset: selection ? text.length + 3 : text.length + 3 }
      }),
    },
  ]

  const previewContact = previewContacts[previewIndex] ?? previewContacts[0] ?? { first_name: 'Jane', last_name: 'Smith' }
  const previewSubject = interpolate(subject, previewContact)
  const previewBody = interpolate(body, previewContact)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <section className="surface-panel px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl text-ink">Write your letter</h2>
            <div className="flex items-center gap-3">
              <ActionFeedback state={saveState} message={saveMessage} className="text-xs" />
              <button
                type="button"
                onClick={() => void persistDraft()}
                disabled={!isDirty || saveState === 'pending' || !subject.trim()}
                className="btn-outline min-h-9 px-3 text-xs"
              >
                {saveState === 'error' ? 'Retry save' : 'Save now'}
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="letter-subject" className="text-xs font-medium text-ink-soft">Subject</label>
              <input
                id="letter-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject line, e.g. A note for {{first_name}}"
                className="input min-h-12"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Template</span>
              <TemplatePicker onSelect={handleTemplateSelect} selectedId={selectedTemplateId} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="letter-body" className="text-xs font-medium text-ink-soft">Letter body</label>
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-surface-raised p-1" role="toolbar" aria-label="Letter formatting">
                {formattingButtons.map(button => {
                  const Icon = button.icon
                  return (
                    <button
                      key={button.label}
                      type="button"
                      onClick={button.action}
                      aria-label={button.label}
                      title={button.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-periwinkle"
                    >
                      <Icon size={16} />
                    </button>
                  )
                })}
              </div>
              <textarea
                id="letter-body"
                ref={bodyRef}
                value={body}
                onChange={e => {
                  updateBody(e.target.value)
                }}
                placeholder={'Dear {{first_name}},\n\nYour letter here...'}
                className="input min-h-[420px] resize-none font-mono text-sm leading-7"
              />
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4 text-sm text-ink-muted">
            <p className="mb-2">Insert a merge tag at the cursor:</p>
            <div className="flex flex-wrap gap-2">
              {['first_name', 'last_name'].map(tag => <button key={tag} type="button" onClick={() => replaceSelection(() => ({ text: `{{${tag}}}` }))} className="min-h-11 rounded-full border border-border bg-surface px-3 font-mono text-xs text-periwinkle">{`{{${tag}}}`}</button>)}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel px-5 py-5">
        <div className="flex items-end justify-between gap-3 border-b border-border/80 pb-4">
          <div className="min-w-0">
            <label htmlFor="preview-contact" className="mb-1 block text-xs font-medium text-ink-muted">Preview recipient</label>
            <select id="preview-contact" value={previewIndex} onChange={event => setPreviewIndex(Number(event.target.value))} className="input min-h-11 max-w-full text-sm">
              {previewContacts.map((contact, index) => <option key={`${contact.first_name}-${contact.last_name}-${index}`} value={index}>{contact.first_name} {contact.last_name}</option>)}
            </select>
            <h2 className="font-serif text-3xl text-ink">
              For {previewContact.first_name} {previewContact.last_name}
            </h2>
          </div>
          <div className="hidden rounded-full bg-sage/10 px-3 py-2 text-xs font-medium text-sage md:inline-flex">
            Live preview
          </div>
        </div>

        <div
          className="relative mt-4 min-h-[420px] overflow-hidden rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,#ffffff_0%,#F8F9FB_100%)] px-6 py-6 shadow-sm"
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
            <p className="font-serif text-lg italic text-ink-muted">{previewSubject || 'Subject line'}</p>
          </div>
          <div className="prose prose-sm mt-5 max-w-none font-serif text-ink">
            <ReactMarkdown>{previewBody}</ReactMarkdown>
          </div>
        </div>
      </section>
    </div>
  )
}
