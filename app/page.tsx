import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/marketing/landing-nav'

export const metadata: Metadata = {
  title: 'dearfriends — keep up with friends by mail',
  description: "Collect your friends' addresses, remember birthdays, and actually send a card now and then.",
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const cream    = '#E4CE95'
const paper    = '#faf4e4'
const paper2   = '#f5ecd3'
const blueInk  = '#3358ba'
const blueSlate = '#516183'
const ink      = '#1d2442'
const inkSoft  = '#3a4263'
const muted    = '#6b7290'
const line     = '#d9cfb0'
const stamp    = '#b8453b'

const newsreader = "var(--font-newsreader), Georgia, serif"
const caveat     = "var(--font-caveat), cursive"
const dmSans     = "var(--font-dm-sans), system-ui, sans-serif"

// ─── Small helpers ────────────────────────────────────────────────────────────
function Eyebrow({ children, center = false, light = false }: {
  children: React.ReactNode
  center?: boolean
  light?: boolean
}) {
  const col = light ? cream : blueSlate
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.18em',
      color: col, marginBottom: 14,
      ...(center && { display: 'flex', justifyContent: 'center' }),
    }}>
      <span style={{ width: 20, height: 1, background: col, flexShrink: 0 }} />
      {children}
    </div>
  )
}

function SecTitle({ children, light = false, center = false }: {
  children: React.ReactNode
  light?: boolean
  center?: boolean
}) {
  return (
    <h2 style={{
      fontFamily: newsreader,
      fontWeight: 400,
      fontSize: 'clamp(40px, 5vw, 66px)',
      lineHeight: 1.02,
      letterSpacing: '-0.022em',
      margin: '0 0 18px',
      color: light ? paper : ink,
      ...(center && { textAlign: 'center' }),
    }}>
      {children}
    </h2>
  )
}

const Italic = ({ children, col = blueInk }: { children: React.ReactNode; col?: string }) => (
  <em style={{ fontStyle: 'italic', color: col }}>{children}</em>
)

// ─── Arrow SVG ───────────────────────────────────────────────────────────────
function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Button styles ────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  padding: '15px 24px',
  background: blueInk, color: paper,
  border: 'none', borderRadius: 999,
  fontFamily: dmSans, fontSize: 15.5, fontWeight: 500,
  textDecoration: 'none', cursor: 'pointer',
  boxShadow: `0 2px 0 0 ${ink}, 0 6px 16px -4px rgba(51,88,186,.4)`,
  transition: 'transform .15s ease, box-shadow .2s ease',
}

const btnInk: React.CSSProperties = {
  ...btnPrimary,
  background: ink,
  boxShadow: `0 2px 0 0 #0e1230, 0 6px 16px -4px rgba(29,36,66,.3)`,
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, icon }: {
  num: string
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <article style={{
      background: paper,
      border: `1px solid ${line}`,
      borderRadius: 6,
      padding: '32px 28px 28px',
      position: 'relative',
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset',
    }}>
      <div style={{
        position: 'absolute', top: -18, left: 28,
        width: 36, height: 36, borderRadius: '50%',
        background: blueInk, color: cream,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: newsreader, fontSize: 17, fontStyle: 'italic', fontWeight: 500,
      }}>
        {num}
      </div>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <h3 style={{
        fontFamily: newsreader, fontWeight: 500, fontSize: 26,
        letterSpacing: '-0.015em', margin: '0 0 10px', color: ink,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, color: inkSoft, lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </article>
  )
}

// ─── Friend row ───────────────────────────────────────────────────────────────
function FriendRow({ initial, bg, name, place, lastLetter, lastWarn, pill, pillStyle }: {
  initial: string; bg: string; name: string; place: string
  lastLetter: React.ReactNode; lastWarn?: boolean
  pill: string; pillStyle?: 'blue' | 'slate' | 'default'
}) {
  const pillBg = pillStyle === 'blue'
    ? { background: 'rgba(51,88,186,.12)', color: blueInk }
    : pillStyle === 'slate'
    ? { background: 'rgba(81,97,131,.15)', color: blueSlate }
    : { background: cream, color: ink }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1.2fr 1.4fr 1fr auto',
      gap: 14, alignItems: 'center',
      padding: '14px 18px',
      borderBottom: `1px solid rgba(217,207,176,.6)`,
      fontSize: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: newsreader, fontSize: 14, fontWeight: 500,
      }}>
        {initial}
      </div>
      <div>
        <div style={{ fontWeight: 500, color: ink }}>{name}</div>
        <div style={{ color: muted, fontSize: 13 }}>{place}</div>
      </div>
      <div style={{ fontSize: 12.5, color: inkSoft }}>
        {lastWarn
          ? <>{lastLetter}</>
          : lastLetter}
      </div>
      <div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: '4px 9px', borderRadius: 999,
          ...pillBg,
          whiteSpace: 'nowrap' as const,
        }}>
          {pill}
        </span>
      </div>
      <div style={{ color: muted }}>→</div>
    </div>
  )
}

// ─── Reminder card ────────────────────────────────────────────────────────────
function ReminderCard({ icon, title, when, body, primary, secondary, rotate, bg }: {
  icon: React.ReactNode; title: string; when: string
  body: React.ReactNode; primary: string; secondary: string
  rotate: string; bg?: string; iconBg?: string
}) {
  return (
    <div style={{
      background: bg || paper,
      color: ink,
      borderRadius: 10,
      padding: 22,
      transform: rotate,
      boxShadow: '0 30px 60px -20px rgba(0,0,0,.4), 0 8px 20px -6px rgba(0,0,0,.15)',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: blueInk, color: cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: newsreader, fontSize: 17, fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: 12, color: muted }}>{when}</div>
        </div>
      </div>
      <div style={{ fontSize: 14.5, color: inkSoft, lineHeight: 1.5 }}>{body}</div>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button style={{
          fontSize: 12.5, fontWeight: 500, padding: '7px 12px',
          borderRadius: 999, background: ink, color: paper, border: 'none', cursor: 'pointer',
        }}>
          {primary}
        </button>
        <button style={{
          fontSize: 12.5, fontWeight: 500, padding: '7px 12px',
          borderRadius: 999, background: 'transparent', color: ink,
          border: `1px solid ${line}`, cursor: 'pointer',
        }}>
          {secondary}
        </button>
      </div>
    </div>
  )
}

// ─── Price card ───────────────────────────────────────────────────────────────
function PriceCard({ name, desc, price, per, features, cta, featured }: {
  name: string; desc: string; price: string; per: string
  features: string[]; cta: string; featured?: boolean
}) {
  return (
    <div style={{
      background: featured ? ink : paper,
      color: featured ? paper : ink,
      border: `1px solid ${featured ? ink : line}`,
      borderRadius: 10, padding: '36px 32px',
      textAlign: 'left', position: 'relative',
    }}>
      {featured && (
        <span style={{
          position: 'absolute', top: -12, right: 28,
          background: cream, color: ink,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
        }}>
          Most loved
        </span>
      )}
      <h4 style={{ fontFamily: newsreader, fontWeight: 500, fontSize: 22, margin: '0 0 6px' }}>{name}</h4>
      <p style={{ fontSize: 14, color: featured ? 'rgba(250,244,228,.65)' : muted, marginBottom: 22 }}>{desc}</p>
      <div style={{
        fontFamily: newsreader, fontSize: 56, fontWeight: 400,
        lineHeight: 1, letterSpacing: '-0.02em',
      }}>
        {price}
        <small style={{ fontSize: 18, color: featured ? 'rgba(250,244,228,.6)' : muted }}>{per}</small>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '22px 0 28px', fontSize: 14.5 }}>
        {features.map(f => (
          <li key={f} style={{
            padding: '6px 0', display: 'flex', gap: 10, alignItems: 'flex-start',
            color: featured ? 'rgba(250,244,228,.85)' : inkSoft,
          }}>
            <span style={{ color: featured ? cream : blueInk, fontSize: 20, lineHeight: 1.2 }}>•</span>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/login" style={{
        ...btnPrimary,
        ...(featured
          ? { background: cream, color: ink, boxShadow: '0 2px 0 0 #8a7a3a', width: '100%', justifyContent: 'center' }
          : { ...btnInk, width: '100%', justifyContent: 'center' }),
      }}>
        {cta}
      </Link>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <div
      className="relative overflow-x-hidden"
      style={{ fontFamily: dmSans, background: paper, color: ink, fontSize: 17, lineHeight: 1.55 }}
    >
      {/* Paper grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(rgba(140,110,50,.08) 1px, transparent 1px)',
            'radial-gradient(rgba(140,110,50,.05) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '3px 3px, 7px 7px',
          backgroundPosition: '0 0, 1px 2px',
          opacity: 0.6,
          zIndex: 0,
        }}
      />

      <LandingNav />

      {/* ═════ HERO ═════ */}
      <section
        className="landing-grid-2col"
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1280, margin: '0 auto',
          padding: '40px 40px 100px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 60, alignItems: 'center',
        }}
      >
        {/* Copy */}
        <div>
          <Eyebrow>A very small app · for sending real mail</Eyebrow>
          <h1 style={{
            fontFamily: newsreader, fontWeight: 400,
            fontSize: 'clamp(54px, 7vw, 108px)',
            lineHeight: 0.98, letterSpacing: '-0.025em',
            margin: '0 0 28px', color: ink,
          }}>
            Keep up with{' '}
            <em style={{ fontStyle: 'italic', color: blueInk, fontWeight: 400 }}>the&nbsp;people</em>
            <br />
            you love, the
            <br />
            <span style={{ display: 'inline-block', position: 'relative' }}>
              slow way.
              <span style={{
                position: 'absolute',
                left: '-2%', right: '-4%',
                bottom: '0.05em', height: '0.35em',
                background: cream, zIndex: -1,
                transform: 'skew(-6deg)', display: 'block',
              }} />
            </span>
          </h1>

          <p style={{ fontSize: 19, color: inkSoft, maxWidth: 520, margin: '0 0 36px', lineHeight: 1.5 }}>
            <b>dearfriends</b> helps you collect your friends&apos; addresses, remember birthdays,
            and actually send a card now and then. It&apos;s a little notebook for the people
            who matter —{' '}
            <span style={{ color: blueSlate, fontStyle: 'italic', fontFamily: newsreader }}>
              and gentle nudges to write to them.
            </span>
          </p>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={btnPrimary}>
              Write your first letter
              <Arrow />
            </Link>
            <a href="#how" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 20px',
              color: ink, fontSize: 15, fontWeight: 500, textDecoration: 'none',
            }}>
              See how it works →
            </a>
          </div>

          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, fontSize: 13.5, color: muted }}>
            <div style={{ display: 'flex' }}>
              {[
                'linear-gradient(135deg, #d97757, #e4ce95)',
                'linear-gradient(135deg, #3358ba, #516183)',
                'linear-gradient(135deg, #516183, #e4ce95)',
                'linear-gradient(135deg, #3e5da0, #b8453b)',
              ].map((bg, i) => (
                <span key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `2px solid ${paper}`,
                  marginLeft: i === 0 ? 0 : -8,
                  background: bg, display: 'inline-block',
                }} />
              ))}
            </div>
            <span>Made by one person, for a few hundred friends.</span>
          </div>
        </div>

        {/* Art */}
        <div aria-hidden style={{ position: 'relative', height: 560 }} className="hidden lg:block">
          {/* Envelope */}
          <div style={{
            position: 'absolute',
            width: 420, height: 260,
            background: paper2,
            border: `1px solid ${line}`,
            borderRadius: 3,
            boxShadow: `0 1px 0 rgba(255,255,255,.6) inset, 0 22px 40px -18px rgba(45,35,10,.25), 0 4px 10px -2px rgba(45,35,10,.1)`,
            transform: 'rotate(-6deg)',
            top: 40, left: 20,
            padding: '24px 26px',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.2), transparent 40%)', pointerEvents: 'none' }} />
            {/* Stripes top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 10,
              background: `repeating-linear-gradient(-45deg, ${blueInk} 0 10px, transparent 10px 20px, ${stamp} 20px 30px, transparent 30px 40px)`,
              opacity: 0.85,
            }} />
            {/* Stripes bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 10,
              background: `repeating-linear-gradient(-45deg, ${blueInk} 0 10px, transparent 10px 20px, ${stamp} 20px 30px, transparent 30px 40px)`,
              opacity: 0.85,
            }} />
            {/* Stamp */}
            <div style={{
              position: 'absolute', top: 20, right: 20,
              width: 76, height: 92,
              background: cream,
              border: `2px dashed ${paper}`,
              outline: `1px solid ${line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,.08)',
              transform: 'rotate(4deg)',
            }}>
              <div style={{
                width: 60, height: 76,
                background: blueInk,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: cream, fontFamily: newsreader, gap: 2,
              }}>
                <div style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 500, lineHeight: 1 }}>df</div>
                <div style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>forever</div>
              </div>
            </div>
            {/* Postmark */}
            <div style={{
              position: 'absolute', top: 60, right: 110,
              width: 90, height: 90,
              border: `2px solid ${stamp}`,
              borderRadius: '50%',
              color: stamp, opacity: 0.55,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: dmSans, fontSize: 9, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transform: 'rotate(-12deg)', textAlign: 'center', lineHeight: 1.1,
            }}>
              <div style={{ position: 'absolute', inset: 8, border: `1px dashed ${stamp}`, borderRadius: '50%' }} />
              New York<br />Apr · 26
            </div>
            {/* Address */}
            <div style={{
              position: 'absolute', bottom: 40, left: 30,
              fontFamily: newsreader, fontSize: 14, color: ink, lineHeight: 1.5,
            }}>
              <span style={{ fontFamily: dmSans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: muted, display: 'block', marginBottom: 4 }}>To</span>
              <span style={{ fontWeight: 500, fontSize: 17 }}>Hana Okafor</span><br />
              <em>214 Linden St., Apt 3</em><br />
              <em>Brooklyn, NY 11221</em>
            </div>
          </div>

          {/* Postcard */}
          <div style={{
            position: 'absolute',
            width: 380, height: 230,
            background: paper, border: `1px solid ${line}`, borderRadius: 3,
            boxShadow: `0 20px 30px -12px rgba(45,35,10,.18), 0 3px 8px -2px rgba(45,35,10,.08)`,
            transform: 'rotate(8deg)',
            top: 220, right: 10, padding: 22, zIndex: 2,
          }}>
            <div style={{ fontFamily: caveat, fontSize: 28, color: blueInk, lineHeight: 1.1, marginBottom: 8 }}>Dear Sam,</div>
            <div style={{ height: 1, background: line, margin: '10px 0' }} />
            <div style={{ fontFamily: caveat, fontSize: 19, color: inkSoft, lineHeight: 1.35 }}>
              The lilacs are out already — I keep<br />
              thinking of that afternoon we spent<br />
              at your mom&apos;s. Let&apos;s not wait<br />
              another year, okay?
            </div>
            <div style={{ fontFamily: caveat, fontSize: 24, color: blueInk, textAlign: 'right', marginTop: 6 }}>— M</div>
          </div>

          {/* Pin card */}
          <div style={{
            position: 'absolute',
            width: 220, background: 'white', borderRadius: 4,
            padding: '14px 16px 16px',
            boxShadow: `0 18px 36px -14px rgba(45,35,10,.3), 0 3px 8px -2px rgba(45,35,10,.1)`,
            transform: 'rotate(-3deg)',
            top: 380, left: 60, zIndex: 3,
            border: '1px solid rgba(0,0,0,.04)',
          }}>
            <div style={{
              position: 'absolute', top: -10, left: '50%',
              width: 14, height: 14, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ef5a4a, #8a2a22)',
              transform: 'translateX(-50%)',
              boxShadow: '0 2px 4px rgba(0,0,0,.3)',
            }} />
            <div style={{ fontFamily: newsreader, fontSize: 18, fontWeight: 500, color: ink, marginBottom: 2 }}>Sam Beaumont</div>
            <div style={{ fontSize: 11.5, color: muted, marginBottom: 10 }}>college roommate · writes back</div>
            <div style={{ fontFamily: dmSans, fontSize: 11, color: inkSoft, lineHeight: 1.45, paddingTop: 10, borderTop: `1px dashed ${line}` }}>
              1428 Perimeter Dr<br />
              Portland, OR 97210
            </div>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 600,
              color: blueInk, background: cream,
              padding: '3px 7px', borderRadius: 999, marginTop: 8, letterSpacing: '0.03em',
            }}>
              birthday in 11 days
            </span>
          </div>
        </div>
      </section>

      {/* ═════ HOW IT WORKS ═════ */}
      <section id="how" style={{
        position: 'relative', zIndex: 1,
        padding: '100px 0 120px',
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 60, alignItems: 'end', marginBottom: 70,
          }} className="landing-grid-2col">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <SecTitle>
                Three small rituals,<br />
                {' '}<Italic>one little book</Italic>.
              </SecTitle>
            </div>
            <p style={{ fontSize: 18, color: inkSoft, maxWidth: 580, lineHeight: 1.5, margin: 0 }}>
              Not another social feed. dearfriends is a calm place to remember who&apos;s
              where, what they&apos;re up to, and the last time you reached out.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="landing-steps-grid">
            <StepCard
              num="i"
              title="Ask, gently."
              desc="Send a friend a private link. They fill in their address — no account, no app, nothing weird. It shows up in your book."
              icon={
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <rect x="4" y="10" width="36" height="26" rx="3" stroke={blueInk} strokeWidth="1.8" />
                  <path d="M4 14l18 12 18-12" stroke={blueInk} strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="34" cy="10" r="5" fill={cream} />
                </svg>
              }
            />
            <StepCard
              num="ii"
              title="Remember the dates."
              desc="Birthdays, move-in days, kid's first days of school. You'll get a nudge a week before — enough time to actually mail something."
              icon={
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <rect x="6" y="6" width="32" height="32" rx="2" stroke={blueInk} strokeWidth="1.8" />
                  <path d="M6 14h32M14 6v4M30 6v4" stroke={blueInk} strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="16" cy="22" r="2.5" fill={cream} />
                  <circle cx="28" cy="30" r="2.5" fill={blueInk} />
                </svg>
              }
            />
            <StepCard
              num="iii"
              title="Write something."
              desc="Draft a postcard or letter in the app. Print it at home, or we'll stamp and mail it for you. Your handwriting still works, promise."
              icon={
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <path d="M6 8l16 14L38 8" stroke={blueInk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="6" y="8" width="32" height="24" rx="2" stroke={blueInk} strokeWidth="1.8" />
                  <path d="M22 22v10M18 32h8" stroke={cream} strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ═════ DIRECTORY ═════ */}
      <section id="friends" style={{ padding: '120px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr',
            gap: 70, alignItems: 'center',
          }} className="landing-grid-2col">
            {/* Copy */}
            <div>
              <Eyebrow>Your people</Eyebrow>
              <SecTitle>
                A little book<br />
                of <Italic>everyone</Italic><br />
                you&apos;d miss.
              </SecTitle>
              <p style={{ fontSize: 18, color: inkSoft, maxWidth: 480, lineHeight: 1.5, margin: '0 0 26px' }}>
                Not a CRM. Not a contact list. Just the friends, the family, the ones
                you keep meaning to call — with the details you need to actually send
                something in the mail.
              </p>
              <Link href="/login" style={btnInk}>
                Start your book <Arrow />
              </Link>
            </div>

            {/* Mock UI */}
            <div style={{
              background: paper, border: `1px solid ${line}`, borderRadius: 10,
              boxShadow: `0 1px 0 rgba(255,255,255,.8) inset, 0 30px 60px -20px rgba(45,35,10,.18), 0 8px 20px -6px rgba(45,35,10,.08)`,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderBottom: `1px solid ${line}`, background: paper2,
              }}>
                <h4 style={{ fontFamily: newsreader, fontWeight: 500, fontSize: 19, margin: 0 }}>My people</h4>
                <span style={{ fontSize: 12, color: muted }}>34 friends · 12 this month</span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px 0', borderBottom: `1px solid ${line}` }}>
                {['All', 'Family', 'Close', 'Abroad', 'Out of touch'].map((tab, i) => (
                  <div key={tab} style={{
                    fontSize: 13, fontWeight: 500, padding: '8px 12px',
                    borderRadius: '6px 6px 0 0',
                    color: i === 0 ? blueInk : muted,
                    background: i === 0 ? paper2 : 'transparent',
                    border: i === 0 ? `1px solid ${line}` : 'none',
                    borderBottom: i === 0 ? `1px solid ${paper2}` : 'none',
                    marginBottom: i === 0 ? -1 : 0,
                    cursor: 'default',
                  }}>
                    {tab}
                  </div>
                ))}
              </div>

              <FriendRow initial="H" bg={blueInk} name="Hana Okafor" place="Brooklyn, NY"
                lastLetter={<>last letter <b>3 weeks ago</b></>}
                pill="birthday soon" pillStyle="blue" />
              <FriendRow initial="S" bg={blueSlate} name="Sam Beaumont" place="Portland, OR"
                lastLetter={<>last letter <span style={{ color: stamp }}>11 months ago</span></>}
                pill="write soon" />
              <FriendRow initial="M" bg={stamp} name="Mira Väänänen" place="Helsinki, FI"
                lastLetter={<>writes back <b>always</b></>}
                pill="pen pal" pillStyle="slate" />
              <FriendRow initial="D" bg="#3e5da0" name="Dad" place="Tucson, AZ"
                lastLetter={<>last letter <b>last Sunday</b></>}
                pill="family" pillStyle="blue" />
              <FriendRow initial="T" bg="#8a7a3a" name="Theo & Liv" place="Oaxaca, MX"
                lastLetter={<>just moved <b>3 days ago</b></>}
                pill="new address" />

              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1.2fr 1.4fr 1fr auto',
                gap: 14, alignItems: 'center',
                padding: '14px 18px', fontSize: 14, color: muted,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: line, color: inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>?</div>
                <div>
                  <div style={{ color: muted }}>+ add someone</div>
                  <div style={{ fontSize: 13, color: muted }}>or send a link</div>
                </div>
                <div /><div /><div />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ REMINDERS ═════ */}
      <section style={{
        padding: '110px 0 120px',
        background: blueInk,
        color: paper,
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(rgba(228,206,149,.08) 1px, transparent 1px)`,
          backgroundSize: '4px 4px', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.1fr 1fr',
            gap: 80, alignItems: 'center',
          }} className="landing-grid-2col">
            <div>
              <Eyebrow light>Nudges, not notifications</Eyebrow>
              <SecTitle light>
                We&apos;ll whisper<br />
                when it&apos;s <em style={{ fontStyle: 'italic', color: cream }}>time to write</em>.
              </SecTitle>
              <p style={{ fontSize: 18, color: 'rgba(250,244,228,.75)', maxWidth: 520, lineHeight: 1.5, margin: '0 0 26px' }}>
                One small email on Sunday mornings. A heads-up before birthdays. That&apos;s it.
                You&apos;ll never get a red badge, a streak, or a push notification.
                This app wants you to close it and write.
              </p>
              <Link href="/login" style={{ ...btnPrimary, background: cream, color: ink, boxShadow: '0 2px 0 0 #8a7a3a' }}>
                Turn on Sunday nudges
              </Link>
            </div>

            <div>
              <ReminderCard
                rotate="rotate(-1.5deg)"
                icon={
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                }
                title="Hana's birthday — next Friday"
                when="Sunday, April 26 · 8:02 am"
                body={<>You sent a postcard <b>last year from Lisbon</b>. She wrote back with a drawing. If you mail something Tuesday, it&apos;ll land just in time.</>}
                primary="Start a card"
                secondary="Remind me tomorrow"
              />
              <div style={{ marginTop: -20, marginLeft: 60 }}>
                <ReminderCard
                  rotate="rotate(1.2deg)"
                  bg="#f0e3b8"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M3 6l7 5 7-5M3 6v9a1 1 0 001 1h12a1 1 0 001-1V6M3 6l7-3 7 3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  }
                  title="Sam hasn't heard from you in a while"
                  when="quietly, since last July"
                  body={<>No pressure — just a soft reminder. <b>Seven minutes</b> is about all it takes.</>}
                  primary="Write to Sam"
                  secondary="Not this week"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ COMPOSER ═════ */}
      <section id="letters" style={{ padding: '120px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.1fr 1fr',
            gap: 70, alignItems: 'center',
          }} className="landing-grid-2col">
            {/* Letter mock */}
            <div style={{
              background: paper, border: `1px solid ${line}`, borderRadius: 8,
              padding: '36px 40px',
              fontFamily: newsreader, lineHeight: 1.55, color: ink,
              position: 'relative',
              boxShadow: `0 30px 60px -20px rgba(45,35,10,.15), 0 8px 20px -6px rgba(45,35,10,.08)`,
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 29px, rgba(81,97,131,.12) 29px 30px)`,
              backgroundPosition: '0 48px',
            }}>
              <div style={{ fontFamily: dmSans, fontSize: 13, color: muted, marginBottom: 12, textAlign: 'right' }}>
                april 26, 2026
              </div>
              <div style={{ fontSize: 22, fontStyle: 'italic', color: blueInk, marginBottom: 8 }}>
                Dear Mira,
              </div>
              <div style={{ fontSize: 17, color: ink, marginBottom: 30 }}>
                It&apos;s been a strange spring. I&apos;ve been thinking about{' '}
                <span style={{
                  background: cream, padding: '0 3px',
                  borderBottom: `1.5px dotted ${blueInk}`,
                  cursor: 'pointer',
                }}>
                  that winter we spent in Helsinki
                </span>{' '}
                — the little kitchen, the candles, the way you made coffee at 11pm and we somehow still slept.
                <br /><br />
                I hope the new apartment is warm. Tell me about it. I&apos;ll be in{' '}
                <span style={{
                  background: cream, padding: '0 3px',
                  borderBottom: `1.5px dotted ${blueInk}`,
                  cursor: 'pointer',
                }}>
                  Copenhagen in June
                </span>{' '}
                — any chance?
              </div>
              <div style={{ fontStyle: 'italic', color: blueInk, fontSize: 18 }}>
                Yours, always —
              </div>

              {/* Toolbar */}
              <div style={{
                position: 'absolute', bottom: -24, left: 40,
                display: 'flex', gap: 4,
                background: 'white',
                border: `1px solid ${line}`,
                borderRadius: 999, padding: 4,
                boxShadow: `0 8px 20px -6px rgba(45,35,10,.15)`,
                fontFamily: dmSans,
              }}>
                {['Postcard', 'Letter', 'Long letter', 'Birthday card'].map((t, i) => (
                  <button key={t} style={{
                    padding: '7px 12px', fontSize: 12.5, fontWeight: 500,
                    color: i === 0 ? paper : inkSoft,
                    background: i === 0 ? blueInk : 'transparent',
                    border: 'none', borderRadius: 999, cursor: 'pointer',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div>
              <Eyebrow>The letters</Eyebrow>
              <SecTitle>
                Write it<br />
                <Italic>in your own words</Italic>.
              </SecTitle>
              <p style={{ fontSize: 18, color: inkSoft, lineHeight: 1.5, margin: '0 0 0' }}>
                dearfriends remembers the small things you&apos;ve mentioned before —
                a trip, a new kid, a hard season — so your letters don&apos;t start
                with <em>&ldquo;sorry it&apos;s been so long.&rdquo;</em> Print at home, or we&apos;ll
                mail it for $3.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', fontSize: 15.5, color: inkSoft }}>
                {[
                  { label: 'Print & mail yourself', price: 'free' },
                  { label: 'We print + stamp + mail', price: '$3 / card' },
                  { label: 'Handwritten, actually', price: '$8 / card' },
                ].map(({ label, price }, i, arr) => (
                  <li key={label} style={{
                    padding: '8px 0',
                    borderBottom: i < arr.length - 1 ? `1px dashed ${line}` : 'none',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <b style={{ color: ink }}>{label}</b>
                    <span style={{ color: muted }}>{price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ TESTIMONIAL ═════ */}
      <section style={{
        padding: '100px 0',
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            <Eyebrow center>From an early user</Eyebrow>
            <p style={{
              fontFamily: newsreader, fontWeight: 400, fontStyle: 'italic',
              fontSize: 'clamp(28px, 3.6vw, 44px)',
              lineHeight: 1.2, letterSpacing: '-0.015em',
              color: ink, margin: '0 0 28px',
            }}>
              <span style={{ color: blueInk }}>&#8220;</span>
              I sent my grandmother a postcard for the first time in twelve years.
              She called me the day it arrived. I&apos;d forgotten what that felt like.
              <span style={{ color: blueInk }}>&#8221;</span>
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 14, color: muted }}>
              <span style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${cream}, ${blueSlate})`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: newsreader, fontSize: 14, fontWeight: 500,
              }}>J</span>
              <span><b style={{ color: ink, fontWeight: 500 }}>Jules, 29</b> · Brooklyn · used it for 4 months</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ PRICING ═════ */}
      <section id="pricing" style={{ padding: '110px 0', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto 48px' }}>
            <Eyebrow center>Pricing</Eyebrow>
            <SecTitle center><Italic>Small</Italic> and honest.</SecTitle>
            <p style={{ fontSize: 18, color: inkSoft, lineHeight: 1.5, margin: '0 auto' }}>
              dearfriends is built by one person. No VC, no dark patterns.
              The free plan is real, forever.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24, maxWidth: 840, margin: '0 auto',
          }} className="landing-price-grid">
            <PriceCard
              name="A little book"
              desc="For keeping in touch with your closest circle."
              price="$0"
              per=" / forever"
              features={[
                'Up to 25 friends',
                'Birthday & address book',
                'Sunday morning nudges',
                'Print your letters at home',
              ]}
              cta="Start free"
            />
            <PriceCard
              name="A bigger book"
              desc="For people with a lot of people."
              price="$4"
              per=" / month"
              features={[
                'Unlimited friends & notes',
                'We mail cards for you ($3 each)',
                'Handwritten option',
                'Shared family book',
              ]}
              cta="Try it for a month"
              featured
            />
          </div>
        </div>
      </section>

      {/* ═════ CLOSING ═════ */}
      <section id="start" style={{
        padding: '140px 40px 120px',
        textAlign: 'center',
        maxWidth: 900, margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontFamily: caveat, fontSize: 32, color: blueSlate,
          marginBottom: 12, transform: 'rotate(-2deg)', display: 'inline-block',
        }}>
          p.s. —
        </div>
        <h2 style={{
          fontFamily: newsreader, fontWeight: 400,
          fontSize: 'clamp(48px, 6vw, 88px)',
          lineHeight: 1, letterSpacing: '-0.025em',
          margin: '0 0 22px', color: ink,
        }}>
          The people you love<br />
          aren&apos;t going to know<br />
          <em style={{ fontStyle: 'italic', color: blueInk }}>unless you tell them.</em>
        </h2>
        <p style={{ fontSize: 18, color: inkSoft, margin: '0 0 32px' }}>
          Start your little book today. It takes about four minutes.
        </p>
        <Link href="/login" style={btnPrimary}>
          Begin writing <Arrow />
        </Link>
        <div style={{
          marginTop: 56, fontFamily: caveat, fontSize: 28,
          color: blueInk, lineHeight: 1.2,
        }}>
          with love,
          <span style={{
            display: 'block', fontFamily: dmSans,
            fontSize: 12, color: muted, marginTop: 4,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            the dearfriends team (it&apos;s just me)
          </span>
        </div>
      </section>

      {/* ═════ FOOTER ═════ */}
      <footer style={{
        borderTop: `1px solid ${line}`,
        padding: '36px 40px',
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        fontSize: 13, color: muted,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontFamily: newsreader, fontSize: 16 }}>
          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>dear</span>
          <span style={{ fontWeight: 500 }}>friends</span>
        </div>
        <ul style={{ display: 'flex', gap: 24, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {['About', 'Privacy', 'Changelog'].map(item => (
            <li key={item}>
              <Link href={`/${item.toLowerCase()}`} style={{ color: muted, textDecoration: 'none' }}>
                {item}
              </Link>
            </li>
          ))}
          <li>
            <a href="mailto:hi@dearfriends.co" style={{ color: muted, textDecoration: 'none' }}>
              hi@dearfriends.co
            </a>
          </li>
        </ul>
        <div>© 2026 · handmade</div>
      </footer>
    </div>
  )
}
