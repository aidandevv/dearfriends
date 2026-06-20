import { ShareLinkEditor } from '@/components/share-link-editor'

interface ShareLinkCardProps {
  shareSlug: string | null
  shareMessage: string | null
}

export function ShareLinkCard({ shareSlug, shareMessage }: ShareLinkCardProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const siteDisplay = siteUrl.replace(/^https?:\/\//, '')

  return (
    <section id="invite" className="postal-card px-[26px] pb-6 pt-[26px]">
      <div className="eyebrow" style={{ marginBottom: 0, marginTop: 8 }}>Invite</div>

      <h3 style={{
        fontFamily: 'var(--font-ppwriter), Georgia, serif',
        fontWeight: 400, fontSize: 28,
        letterSpacing: '-0.018em',
        margin: '8px 0 16px',
        color: 'var(--ink)', lineHeight: 1.05,
      }}>
        Your{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--periwinkle)' }}>share link</em>
      </h3>

      {shareSlug ? (
        <ShareLinkEditor
          shareSlug={shareSlug}
          shareMessage={shareMessage}
          siteDisplay={siteDisplay}
          siteUrl={siteUrl}
        />
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
          Your link is being set up — refresh to try again.
        </p>
      )}
    </section>
  )
}
