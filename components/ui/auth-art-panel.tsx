const newsreader = "var(--font-newsreader), Georgia, serif"

export function AuthArtPanel() {
  return (
    <div
      className="hidden md:flex md:w-[40%] min-h-screen flex-col items-center justify-between py-8 px-8 relative overflow-hidden flex-shrink-0"
      style={{ background: '#1d2442' }}
    >
      {/* Dot-grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(228,206,149,.06) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Brand mark */}
      <div style={{ fontFamily: newsreader, fontSize: 18, color: '#E4CE95', position: 'relative', zIndex: 1 }}>
        <em>dear</em>friends
      </div>

      {/* Envelope art + tagline */}
      <div className="flex flex-col items-center gap-8 relative z-10">
        {/* Envelope */}
        <div style={{
          width: 260, height: 162,
          background: '#f5ecd3',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 4,
          transform: 'rotate(-4deg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 32px 64px -20px rgba(0,0,0,.8)',
        }}>
          {/* Stripes top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 13,
            background: 'repeating-linear-gradient(-45deg, #3358ba 0 10px, transparent 10px 20px, #b8453b 20px 30px, transparent 30px 40px)',
            opacity: 0.85,
          }} />
          {/* Stripes bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 13,
            background: 'repeating-linear-gradient(-45deg, #3358ba 0 10px, transparent 10px 20px, #b8453b 20px 30px, transparent 30px 40px)',
            opacity: 0.85,
          }} />
          {/* Stamp */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            width: 54, height: 66,
            background: '#E4CE95',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 42, height: 54,
              background: '#3358ba',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: newsreader, fontSize: 16, fontStyle: 'italic', color: '#E4CE95',
            }}>df</div>
          </div>
          {/* Postmark */}
          <div style={{
            position: 'absolute', top: 28, right: 90,
            width: 70, height: 70,
            border: '2px solid #b8453b', borderRadius: '50%',
            color: '#b8453b', opacity: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-12deg)',
            fontFamily: 'var(--font-dm-sans)', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            textAlign: 'center', lineHeight: 1.3,
          }}>
            <div style={{ position: 'absolute', inset: 7, border: '1px dashed #b8453b', borderRadius: '50%' }} />
            New York<br />Apr · 26
          </div>
          {/* Address hint */}
          <div style={{
            position: 'absolute', bottom: 22, left: 20,
            fontFamily: newsreader, fontSize: 16,
            color: '#3a4263', lineHeight: 1.4, fontStyle: 'italic',
          }}>
            A letter, soon
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: newsreader,
          fontSize: 24, lineHeight: 1.3,
          color: '#faf4e4',
          textAlign: 'center', maxWidth: 240,
        }}>
          keep up with<br />
          <em style={{ color: '#E4CE95', fontStyle: 'italic' }}>the people</em><br />
          you love
        </p>
      </div>

      {/* Bottom spacer (balances brand mark top) */}
      <div aria-hidden style={{ height: 18 }} />
    </div>
  )
}
