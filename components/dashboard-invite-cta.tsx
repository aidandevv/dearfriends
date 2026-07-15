'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function DashboardInviteCta({ url }: { url?: string | null }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  async function handleClick() {
    if (!url) {
      document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      window.setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={() => void handleClick()} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-[18px] text-[13.5px] font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.6)]">
        {status === 'copied' ? <Check size={15} className="text-sage" /> : <Copy size={15} className="text-periwinkle" />}
        {status === 'copied' ? 'Invite link copied' : 'Copy invite link'}
      </button>
      {status === 'error' && <p className="text-xs text-stamp" role="alert">Copy failed; use the link in the invite card.</p>}
    </div>
  )
}
