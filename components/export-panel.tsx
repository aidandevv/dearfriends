'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { sendDigitalLetters, type DeliverySummary } from '@/lib/actions/letter'
import { DELIVERY_LABELS } from '@/lib/delivery-methods'
import { FileDown, FileText, Send } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { ActionState } from '@/lib/action-result'

export function ExportPanel({ groupId, summary }: { groupId?: string | null; summary: DeliverySummary }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ state: ActionState; message: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [failures, setFailures] = useState<string[]>([])
  const groupParam = groupId ? `&group=${groupId}` : ''

  async function handleDigitalSend(retryEmails: string[] | null = null) {
    setSending(true)
    setFeedback({ state: 'pending', message: retryEmails ? `Retrying ${retryEmails.length} failed emails…` : `Sending ${summary.eligibleDigital} emails…` })
    const result = await sendDigitalLetters(groupId ?? null, retryEmails)
    if (!('success' in result)) {
      setFeedback({ state: 'error', message: result.error })
    } else {
      const failed = result.failed ?? 0
      setFailures(result.failures ?? [])
      setFeedback({
        state: failed ? 'error' : 'saved',
        message: failed ? `Sent ${result.count}; ${failed} failed. You can retry only the failures.` : `Sent to ${result.count} contacts.`,
      })
    }
    setSending(false)
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-4" aria-label="Selected audience summary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="eyebrow">Audience</p><h2 className="section-title">{summary.audienceLabel}</h2></div>
          <p className="text-sm text-ink-muted">{summary.total} total · {summary.handwrite} handwriting · {summary.print} print · {summary.eligibleDigital} digital</p>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <ExportCard eyebrow="Labels" icon={<FileText size={18} strokeWidth={1.6} />} title="CSV export" description="Avery-ready address files for your own printer and stamps. Dear Friends never mails anything for you.">
          <div className="grid gap-2">
            <DownloadLink enabled={summary.handwrite > 0} href={`/api/export/csv?method=handwrite${groupParam}`}>{DELIVERY_LABELS.handwrite} contacts ({summary.handwrite})</DownloadLink>
            <DownloadLink enabled={summary.print > 0} href={`/api/export/csv?method=print${groupParam}`}>{DELIVERY_LABELS.print} contacts ({summary.print})</DownloadLink>
            <DownloadLink enabled={summary.total > 0} href={`/api/export/csv?method=all${groupParam}`}>All contacts ({summary.total})</DownloadLink>
          </div>
        </ExportCard>

        <ExportCard eyebrow="Letters" icon={<FileDown size={18} strokeWidth={1.6} />} title="PDF export" description="One personalized page per contact — a print-ready letter for print-at-home, or a reference draft while you write by hand.">
          <DownloadLink enabled={summary.total > 0 && summary.hasDraft} href={`/api/export/pdf${groupId ? `?group=${groupId}` : ''}`}>Download letter PDF ({summary.total})</DownloadLink>
          {!summary.hasDraft && <p className="mt-2 text-xs text-ink-muted">Save a subject and letter body before exporting.</p>}
        </ExportCard>

        <ExportCard eyebrow="Email" icon={<Send size={18} strokeWidth={1.6} />} title="Digital send" description="The only delivery Dear Friends sends for you — email to contacts marked digital.">
          <div className="grid gap-3">
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={sending || summary.eligibleDigital === 0 || !summary.hasDraft} className="btn-primary min-h-11 px-4 text-sm">
              {sending ? 'Sending…' : `Send to ${summary.eligibleDigital} digital ${summary.eligibleDigital === 1 ? 'contact' : 'contacts'}`}
            </button>
            {!summary.hasDraft && <p className="text-xs text-ink-muted">Save a draft before sending.</p>}
            {feedback && <ActionFeedback {...feedback} className="text-sm" />}
            {failures.length > 0 && <button type="button" onClick={() => void handleDigitalSend(failures)} disabled={sending} className="btn-outline min-h-11 px-4 text-sm">Retry {failures.length} failed</button>}
          </div>
        </ExportCard>
      </div>
      <ConfirmDialog open={confirmOpen} title={`Send ${summary.eligibleDigital} ${summary.eligibleDigital === 1 ? 'email' : 'emails'}?`} description={`This sends “${summary.draftSubject ?? 'your saved draft'}” to digital contacts in ${summary.audienceLabel}.`} confirmLabel={`Send ${summary.eligibleDigital}`} pending={sending} onCancel={() => setConfirmOpen(false)} onConfirm={() => handleDigitalSend()}>
        <dl className="grid grid-cols-2 gap-2 rounded-xl bg-linen px-4 py-3 text-sm"><dt className="text-ink-muted">Audience</dt><dd className="text-right text-ink">{summary.audienceLabel}</dd><dt className="text-ink-muted">Recipients</dt><dd className="text-right text-ink">{summary.eligibleDigital}</dd><dt className="text-ink-muted">Subject</dt><dd className="truncate text-right text-ink">{summary.draftSubject}</dd></dl>
      </ConfirmDialog>
    </div>
  )
}

function DownloadLink({ enabled, href, children }: { enabled: boolean; href: string; children: ReactNode }) {
  return enabled
    ? <a href={href} className="btn-outline inline-flex min-h-11 items-center justify-center px-4 text-sm">{children}</a>
    : <span aria-disabled="true" className="btn-outline inline-flex min-h-11 cursor-not-allowed items-center justify-center px-4 text-sm opacity-45">{children}</span>
}

function ExportCard({ eyebrow, icon, title, description, children }: { eyebrow: string; icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <section className="surface-panel flex h-full flex-col gap-4 px-5 py-5"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70" style={{ color: 'var(--periwinkle)', background: 'rgba(74,108,212,0.1)' }}>{icon}</div><div><p className="eyebrow">{eyebrow}</p><p className="section-title">{title}</p><p className="mt-1.5 text-sm leading-5 text-ink-muted">{description}</p></div><div className="mt-auto">{children}</div></section>
}
