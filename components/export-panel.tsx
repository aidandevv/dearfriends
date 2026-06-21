'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'
import { DELIVERY_LABELS } from '@/lib/delivery-methods'
import { FileDown, FileText, Send } from 'lucide-react'

export function ExportPanel({ groupId }: { groupId?: string | null }) {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const groupParam = groupId ? `&group=${groupId}` : ''

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return
    setSending(true)
    const result = await sendDigitalLetters(groupId ?? null)
    setDigitalStatus(
      result.error
        ? `Error: ${result.error}`
        : `Sent to ${(result as { count?: number }).count} contacts.${(result as { failed?: number }).failed ? ` ${(result as { failed?: number }).failed} failed.` : ''}`,
    )
    setSending(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ExportCard
        eyebrow="Labels"
        icon={<FileText size={18} strokeWidth={1.6} />}
        title="CSV export"
        description="Avery-ready address files for your own printer and stamps. Dear Friends never mails anything for you."
      >
        <div className="grid gap-2">
          <a href={`/api/export/csv?method=handwrite${groupParam}`} className="btn-outline inline-flex min-h-11 items-center justify-center px-4 text-sm">
            {DELIVERY_LABELS.handwrite} contacts
          </a>
          <a href={`/api/export/csv?method=print${groupParam}`} className="btn-outline inline-flex min-h-11 items-center justify-center px-4 text-sm">
            {DELIVERY_LABELS.print} contacts
          </a>
          <a href={`/api/export/csv?method=all${groupParam}`} className="btn-outline inline-flex min-h-11 items-center justify-center px-4 text-sm">
            All contacts
          </a>
        </div>
      </ExportCard>

      <ExportCard
        eyebrow="Letters"
        icon={<FileDown size={18} strokeWidth={1.6} />}
        title="PDF export"
        description="One personalized page per contact — a print-ready letter for print-at-home, or a reference draft while you write by hand."
      >
        <a href={`/api/export/pdf${groupId ? `?group=${groupId}` : ''}`} className="btn-outline inline-flex min-h-11 items-center justify-center px-4 text-sm">
          Download letter PDF
        </a>
      </ExportCard>

      <ExportCard
        eyebrow="Email"
        icon={<Send size={18} strokeWidth={1.6} />}
        title="Digital send"
        description="The only delivery Dear Friends sends for you — email to contacts marked digital."
      >
        <div className="grid gap-3">
          <button
            onClick={handleDigitalSend}
            disabled={sending}
            className="btn-primary min-h-11 px-4 text-sm"
          >
            {sending ? 'Sending...' : 'Send to digital contacts'}
          </button>
          {digitalStatus && <p className="text-sm text-ink-muted">{digitalStatus}</p>}
        </div>
      </ExportCard>
    </div>
  )
}

function ExportCard({
  eyebrow,
  icon,
  title,
  description,
  children,
}: {
  eyebrow: string
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="surface-panel flex h-full flex-col gap-4 px-5 py-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70"
        style={{ color: 'var(--periwinkle)', background: 'rgba(74,108,212,0.1)' }}
      >
        {icon}
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <p className="section-title">{title}</p>
        <p className="mt-1.5 text-sm leading-5 text-ink-muted">{description}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </section>
  )
}
