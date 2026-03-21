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
