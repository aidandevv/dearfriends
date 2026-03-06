'use client'

import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'
import { FileText, FileDown, Send } from 'lucide-react'

export function ExportPanel() {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return
    setSending(true)
    const result = await sendDigitalLetters()
    setDigitalStatus(
      result.error
        ? `Error: ${result.error}`
        : `Sent to ${(result as { count?: number }).count} contacts.`
    )
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <ExportCard
        icon={<FileText size={18} className="text-terra" />}
        title="CSV Export"
        description="Avery label format for mail merge"
      >
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export/csv?method=handwrite" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            Handwrite contacts
          </a>
          <a href="/api/export/csv?method=print" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            Print contacts
          </a>
          <a href="/api/export/csv?method=all" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            All contacts
          </a>
        </div>
      </ExportCard>

      <ExportCard
        icon={<FileDown size={18} className="text-terra" />}
        title="PDF Export"
        description="One page per print contact with variables interpolated"
      >
        <a href="/api/export/pdf" className="btn-outline text-sm px-4 py-2 w-auto rounded-full inline-block">
          Download PDF
        </a>
      </ExportCard>

      <ExportCard
        icon={<Send size={18} className="text-terra" />}
        title="Digital Send"
        description="Sends the composed letter to all digital contacts via Resend"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDigitalSend}
            disabled={sending}
            className="btn-primary text-sm px-5 py-2 w-auto rounded-full"
          >
            {sending ? 'Sending...' : 'Send to digital contacts'}
          </button>
          {digitalStatus && <p className="text-xs text-ink-muted">{digitalStatus}</p>}
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
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-xl bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-serif text-lg text-ink">{title}</h2>
      </div>
      <p className="text-xs text-ink-muted">{description}</p>
      {children}
    </div>
  )
}
