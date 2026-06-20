'use client'

import { Mail } from 'lucide-react'

type EnvelopePreviewProps = {
  senderName: string | null
  recipient: {
    first_name: string
    last_name: string
    address_line_1: string | null
    address_line_2?: string | null
    city: string | null
    state: string | null
    zip: string | null
  }
}

function joinAddressLine(parts: Array<string | null | undefined>, separator: string) {
  return parts.filter(Boolean).join(separator)
}

export function EnvelopePreview({ senderName, recipient }: EnvelopePreviewProps) {
  const fullName = joinAddressLine([recipient.first_name, recipient.last_name], ' ')
  const cityStateZip = joinAddressLine(
    [joinAddressLine([recipient.city, recipient.state], ', '), recipient.zip],
    ' ',
  )

  return (
    <div className="mt-4 min-h-[420px] rounded-[1.5rem] border border-border/80 bg-surface-raised px-6 py-6 shadow-[0_20px_45px_rgba(29,36,66,0.08)]">
      <div className="flex min-h-[372px] flex-col rounded-[1.25rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(250,244,228,0.92)_100%)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[220px] text-sm leading-6 text-ink">
            <p className="font-serif text-lg text-ink">{senderName ?? 'Your name'}</p>
            <p className="italic text-ink-muted">Return address</p>
          </div>

          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-periwinkle/35 bg-periwinkle/5 text-center">
            <Mail size={18} className="text-periwinkle" />
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-periwinkle">
              Stamp
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-[320px] text-left text-[15px] leading-7 text-ink">
            <p className="font-serif text-[1.45rem] leading-8 text-ink">{fullName || 'Recipient name'}</p>
            <p>{recipient.address_line_1 ?? 'Address line 1'}</p>
            {recipient.address_line_2 ? <p>{recipient.address_line_2}</p> : null}
            <p>{cityStateZip || 'City, State ZIP'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
