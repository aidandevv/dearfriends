import Link from 'next/link'
import { ShareLinkActions } from '@/components/share-link-actions'

interface ShareLinkCardProps {
  shareSlug: string | null
}

export function ShareLinkCard({ shareSlug }: ShareLinkCardProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = shareSlug ? `${siteUrl}/share/${shareSlug}` : null

  return (
    <section className="surface-panel px-5 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Your share link</p>
      {url ? (
        <>
          <p className="mt-3 break-all font-mono text-sm text-ink">{url}</p>
          <ShareLinkActions url={url} />
          <Link
            href="/dashboard/settings"
            className="mt-3 block text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Edit slug →
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Your link is being set up — refresh to try again.
        </p>
      )}
    </section>
  )
}
