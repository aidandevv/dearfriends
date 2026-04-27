import Link from 'next/link'
import { ShareLinkActions } from '@/components/share-link-actions'

interface ShareLinkCardProps {
  shareSlug: string | null
}

export function ShareLinkCard({ shareSlug }: ShareLinkCardProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = shareSlug ? `${siteUrl}/share/${shareSlug}` : null

  const siteDisplay = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

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

      {url ? (
        <>
          {/* URL field */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 8, overflow: 'hidden',
            marginBottom: 14,
          }}>
            <div style={{
              flex: 1, padding: '12px 14px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5, color: 'var(--ink-soft)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFeatureSettings: '"tnum"',
            }}>
              <span style={{ color: 'var(--muted)' }}>{siteDisplay}/share/</span>
              <span style={{ color: 'var(--blue-ink)', fontWeight: 600 }}>{shareSlug}</span>
            </div>
          </div>

          {/* Actions */}
          <ShareLinkActions url={url} />

          {/* Edit slug */}
          <Link href="/dashboard/settings" className="edit-slug-link">
            Edit slug →
          </Link>

          {/* Dashed divider */}
          <div style={{
            height: 1,
            background: 'repeating-linear-gradient(to right, var(--line) 0 6px, transparent 6px 12px)',
            margin: '18px -4px 16px',
          }} />

          {/* Share preview */}
          <div style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 8, padding: '14px 16px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
            position: 'relative',
          }}>
            <div style={{
              width: 36, height: 44,
              background: 'var(--cream)',
              border: '1.5px dashed var(--paper)',
              outline: '1px solid var(--line)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontStyle: 'italic', fontSize: 14, color: 'var(--blue-ink)',
              transform: 'rotate(-4deg)',
            }}>
              df
            </div>
            <div style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontSize: 13.5, color: 'var(--ink-soft)',
              lineHeight: 1.45, flex: 1, minWidth: 0,
            }}>
              <b style={{ color: 'var(--ink)', fontWeight: 500 }}>
                &ldquo;Hey — I&apos;m putting together an address book.&rdquo;
              </b>
              <br />
              They fill it out in a minute. No account, nothing weird.
              <span style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.16em',
                display: 'block', marginTop: 6,
              }}>
                how it&apos;ll read
              </span>
            </div>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
          Your link is being set up — refresh to try again.
        </p>
      )}
    </section>
  )
}
