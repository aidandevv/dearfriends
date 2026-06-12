import { ShareLinkEditor } from '@/components/share-link-editor'

interface ShareLinkCardProps {
  shareSlug: string | null
  shareMessage: string | null
}

export function ShareLinkCard({ shareSlug, shareMessage }: ShareLinkCardProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const siteDisplay = siteUrl.replace(/^https?:\/\//, '')

  return (
    <section style={{
      background: 'var(--paper-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 18px 36px -22px rgba(45,35,10,.18), 0 3px 8px -3px rgba(45,35,10,.06)',
      padding: '26px 26px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Envelope flap stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'repeating-linear-gradient(-45deg, var(--blue-ink) 0 6px, transparent 6px 12px, var(--stamp) 12px 18px, transparent 18px 24px)',
        opacity: 0.85,
      }} />

      <div className="eyebrow" style={{ marginBottom: 0, marginTop: 8 }}>Invite</div>

      <h3 style={{
        fontFamily: 'var(--font-ppwriter), Georgia, serif',
        fontWeight: 400, fontSize: 28,
        letterSpacing: '-0.018em',
        margin: '8px 0 16px',
        color: 'var(--ink)', lineHeight: 1.05,
      }}>
        Your{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--blue-ink)' }}>share link</em>
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
