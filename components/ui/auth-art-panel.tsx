import { PostalLineArt } from '@/components/ui/postal-line-art'

const newsreader = "var(--font-ppwriter), Georgia, serif"

export function AuthArtPanel() {
  return (
    <div
      className="relative z-10 hidden min-h-screen flex-shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-surface/75 px-8 py-8 md:flex md:w-[42%]"
      style={{ position: 'relative' }}
    >
      <PostalLineArt variant="panel" className="postal-art -left-20 top-20 h-[52vh] w-[56vw]" />

      {/* Brand mark */}
      <div style={{ fontFamily: newsreader, fontSize: 18, color: 'var(--ink)', position: 'relative', zIndex: 1 }}>
        <em>dear</em>friends
      </div>

      {/* Envelope art + tagline */}
      <div className="flex flex-col items-center gap-8 relative z-10">
        {/* Envelope */}
        <div style={{
          width: 260, height: 162,
          background: 'var(--surface-raised)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          transform: 'rotate(-4deg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 70px -38px rgba(35,41,64,.36), 0 1px 0 rgba(255,255,255,.72) inset',
        }}>
          {/* Stripes top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 13,
            background: 'repeating-linear-gradient(-45deg, var(--periwinkle) 0 10px, transparent 10px 20px, var(--peach) 20px 30px, transparent 30px 40px)',
            opacity: 0.85,
          }} />
          {/* Stripes bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 13,
            background: 'repeating-linear-gradient(-45deg, var(--periwinkle) 0 10px, transparent 10px 20px, var(--peach) 20px 30px, transparent 30px 40px)',
            opacity: 0.85,
          }} />
          {/* Stamp */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            width: 54, height: 66,
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4,
          }}>
            <div style={{
              width: 42, height: 54,
              background: 'var(--periwinkle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: newsreader, fontSize: 16, fontStyle: 'italic', color: 'white',
              borderRadius: 3,
            }}>df</div>
          </div>
          {/* Postmark */}
          <div style={{
            position: 'absolute', top: 28, right: 90,
            width: 70, height: 70,
            border: '2px solid var(--peach)', borderRadius: '50%',
            color: 'var(--peach)', opacity: 0.72,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-12deg)',
            fontFamily: 'var(--font-dm-sans)', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            textAlign: 'center', lineHeight: 1.3,
          }}>
            <div style={{ position: 'absolute', inset: 7, border: '1px dashed var(--peach)', borderRadius: '50%' }} />
            New York<br />Apr · 26
          </div>
          {/* Address hint */}
          <div style={{
            position: 'absolute', bottom: 22, left: 20,
            fontFamily: newsreader, fontSize: 16,
            color: 'var(--ink-soft)', lineHeight: 1.4, fontStyle: 'italic',
          }}>
            Ready to send
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: newsreader,
          fontSize: 24, lineHeight: 1.3,
          color: 'var(--ink)',
          textAlign: 'center', maxWidth: 240,
        }}>
          keep up with<br />
          <em style={{ color: 'var(--periwinkle)', fontStyle: 'italic' }}>the people</em><br />
          who matter
        </p>
      </div>

      {/* Bottom spacer (balances brand mark top) */}
      <div aria-hidden style={{ height: 18 }} />
    </div>
  )
}
