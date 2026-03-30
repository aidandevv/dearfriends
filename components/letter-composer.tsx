'use client'

import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft, saveTemplate, deleteTemplate } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'
import { TemplatePicker } from '@/components/template-picker'
import { MarkdownEditor, type ReactCodeMirrorRef } from '@/components/editor/markdown-editor'
import { EditorToolbar } from '@/components/editor/editor-toolbar'
import { LETTER_TEMPLATES, normalizeTemplate, type LetterStyle, type ComposerTemplate } from '@/lib/letter-templates'

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

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
