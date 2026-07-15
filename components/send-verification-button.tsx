'use client'

import { useState } from 'react'
import { sendVerificationToAll } from '@/lib/actions/verification'
import { MailCheck } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { ActionState } from '@/lib/action-result'

export function SendVerificationButton({
  eligibleCount,
  senderName,
}: {
  eligibleCount: number
  senderName?: string | null
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ state: ActionState; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    setLoading(true)
    setFeedback({ state: 'pending', message: `Sending to ${eligibleCount} contacts…` })
    const result = await sendVerificationToAll()
    if (result.error) {
      setFeedback({ state: 'error', message: result.error })
    } else {
      const failed = result.failed ? ` ${result.failed} failed and can be retried.` : ''
      setFeedback({ state: result.failed ? 'error' : 'saved', message: `Sent to ${result.count} contacts.${failed}` })
    }
    setLoading(false)
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col items-stretch gap-2 lg:items-end">
      <button type="button" onClick={() => setDialogOpen(true)} disabled={loading || eligibleCount === 0} className="btn-outline inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm">
        <MailCheck size={16} />
        {eligibleCount === 0 ? 'No contacts to verify' : 'Send verification emails'}
      </button>
      {feedback && <ActionFeedback {...feedback} className="max-w-sm text-sm lg:text-right" />}
      <ConfirmDialog
        open={dialogOpen}
        title={`Email ${eligibleCount} ${eligibleCount === 1 ? 'contact' : 'contacts'}?`}
        description={`Each eligible contact will receive a unique address-confirmation link${senderName ? ` from ${senderName}` : ''}. Existing links will be replaced.`}
        confirmLabel={`Send ${eligibleCount} ${eligibleCount === 1 ? 'email' : 'emails'}`}
        pending={loading}
        onCancel={() => setDialogOpen(false)}
        onConfirm={handleSend}
      >
        <p className="rounded-xl bg-linen px-4 py-3 text-sm text-ink-soft">Recipients can confirm, correct, or opt out from the email. Contacts already opted out are excluded.</p>
      </ConfirmDialog>
    </div>
  )
}
