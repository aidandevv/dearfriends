'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

export function ShareLinkActions({ url, compact = false }: { url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCopy() {
    setError(null)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the link. Select and copy it manually.')
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy share link'}
        aria-label={copied ? 'Share link copied' : 'Copy share link'}
        className="flex h-11 w-11 items-center justify-center text-ink-muted transition-colors hover:text-periwinkle"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="btn-primary flex min-h-11 flex-1 items-center justify-center gap-2 text-sm"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="surface-panel flex min-h-11 items-center justify-center gap-1.5 px-3 text-sm text-ink-muted transition-colors hover:text-ink"
        title="View share page"
      >
        <ExternalLink size={14} />
        View
      </a>
      </div>
      {error && <p className="mt-2 text-xs text-stamp" role="alert">{error}</p>}
    </div>
  )
}
