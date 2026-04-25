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
      <p className="eyebrow">Invite</p>
      <p
        style={{
          fontFamily: 'var(--font-ppwriter), Georgia, serif',
          fontSize: 20,
          fontWeight: 400,
          color: 'var(--ink)',
          letterSpacing: '-0.015em',
          marginBottom: 12,
        }}
      >
        Your share link
      </p>

      {url ? (
        <>
          <div
            className="rounded-xl border border-border/70 bg-linen/70 px-3 py-2.5"
            style={{ wordBreak: 'break-all' }}
          >
            <span className="font-mono text-xs text-ink-muted">{url}</span>
          </div>
          <ShareLinkActions url={url} />
          <Link
            href="/dashboard/settings"
            className="mt-3 block text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Edit slug →
          </Link>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          Your link is being set up — refresh to try again.
        </p>
      )}
    </section>
  )
}
