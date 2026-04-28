'use client'

import { LETTER_TEMPLATES, type LetterTemplate } from '@/lib/letter-templates'

export function TemplatePicker({
  onSelect,
  selectedId,
}: {
  onSelect: (template: LetterTemplate) => void
  selectedId?: string
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {LETTER_TEMPLATES.map(template => {
        const isSelected = template.id === selectedId
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`flex-shrink-0 w-[88px] rounded-xl border bg-white text-left transition-all overflow-hidden ${
              isSelected
                ? 'border-blue-ink shadow-[0_0_0_2px_rgba(51,88,186,0.18)]'
                : 'border-border/80 hover:border-blue-ink/40'
            }`}
          >
            {/* Mini letter preview */}
            <div
              className="h-12 p-2 flex flex-col gap-[5px]"
              style={{ backgroundColor: `${template.accentColor}0f` }}
            >
              {/* Title line — colored */}
              <div
                className="h-[4px] rounded-full w-3/5"
                style={{ backgroundColor: `${template.accentColor}66` }}
              />
              {/* Body lines — neutral */}
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
                color: isSelected ? template.accentColor : 'var(--ink-muted)',
                fontWeight: isSelected ? '600' : '400',
              }}
            >
              {template.name}
            </div>
          </button>
        )
      })}
    </div>
  )
}
