'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

export function ShareLinkActions({ url, compact = false }: { url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy share link'}
        className="flex h-5 w-5 items-center justify-center text-ink-muted transition-colors hover:text-periwinkle"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    )
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={handleCopy}
        className="btn-primary flex flex-1 items-center justify-center gap-2 min-h-10 text-sm"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="surface-panel flex items-center justify-center gap-1.5 px-3 min-h-10 text-sm text-ink-muted hover:text-ink transition-colors"
        title="View share page"
      >
        <ExternalLink size={14} />
        View
      </a>
    </div>
  )
}
