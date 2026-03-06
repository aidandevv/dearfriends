'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'
import { FileDown, FileText, Send } from 'lucide-react'

export function ExportPanel() {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return
    setSending(true)
    const result = await sendDigitalLetters()
    setDigitalStatus(result.error ? `Error: ${result.error}` : `Sent to ${(result as { count?: number }).count} contacts.`)
    setSending(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ExportCard
        icon={<FileText size={20} className="text-terra" />}
        title="CSV export"
        description="Generate mailing data for labels and list cleanup."
      >
        <div className="grid gap-2">
          <a href="/api/export/csv?method=handwrite" className="btn-outline inline-flex min-h-12 items-center justify-center px-4 text-sm">
            Handwrite contacts
          </a>
          <a href="/api/export/csv?method=print" className="btn-outline inline-flex min-h-12 items-center justify-center px-4 text-sm">
            Print contacts
          </a>
          <a href="/api/export/csv?method=all" className="btn-outline inline-flex min-h-12 items-center justify-center px-4 text-sm">
            All contacts
          </a>
        </div>
      </ExportCard>

      <ExportCard
        icon={<FileDown size={20} className="text-terra" />}
        title="PDF export"
        description="Build a ready-to-print packet with one personalized page per print contact."
      >
        <a href="/api/export/pdf" className="btn-outline inline-flex min-h-12 items-center justify-center px-4 text-sm">
          Download print-ready PDF
        </a>
      </ExportCard>

      <ExportCard
        icon={<Send size={20} className="text-terra" />}
        title="Digital send"
        description="Use your current letter draft to email everyone marked for digital delivery."
      >
        <div className="grid gap-3">
          <button
            onClick={handleDigitalSend}
            disabled={sending}
            className="btn-primary min-h-12 px-4 text-sm"
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
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="surface-panel flex h-full flex-col gap-4 px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-terra/10">
        {icon}
      </div>
      <div>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </section>
  )
}
