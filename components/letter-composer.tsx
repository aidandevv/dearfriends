'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bold, Heading2, Italic, Link, List, ListOrdered, Quote } from 'lucide-react'
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
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

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

  function updateBody(nextBody: string) {
    setBody(nextBody)
    triggerSave(subject, nextBody)
  }

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

  const previewSubject = interpolate(subject, previewContact)
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
                placeholder="Subject line, e.g. A note for {{first_name}}"
                className="input min-h-12"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <TemplatePicker onSelect={handleTemplateSelect} selectedId={selectedTemplateId} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-surface-raised p-1">
                {formattingButtons.map(button => {
                  const Icon = button.icon
                  return (
                    <button
                      key={button.label}
                      type="button"
                      onClick={button.action}
                      aria-label={button.label}
                      title={button.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-linen hover:text-blue-ink"
                    >
                      <Icon size={16} />
                    </button>
                  )
                })}
              </div>
              <textarea
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
            Use <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-blue-ink">{'{{first_name}}'}</code> and{' '}
            <code className="rounded bg-linen px-1.5 py-0.5 font-mono text-blue-ink">{'{{last_name}}'}</code> to personalize the subject and body.
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
