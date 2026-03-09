'use client'

import { LETTER_TEMPLATES, type LetterTemplate } from '@/lib/letter-templates'

export function TemplatePicker({
  onSelect,
}: {
  onSelect: (template: LetterTemplate) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {LETTER_TEMPLATES.map(template => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-[1rem] border border-border/80 bg-surface-raised px-3 py-2.5 text-left hover:border-terra/40 transition-colors"
        >
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: template.accentColor }}
          />
          <span className="text-xs font-medium text-ink">{template.name}</span>
        </button>
      ))}
    </div>
  )
}
