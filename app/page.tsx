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

const serif  = "var(--font-ppwriter), Georgia, serif"
const caveat = "var(--font-caveat), cursive"
const dmSans = "var(--font-dm-sans), system-ui, sans-serif"

// ─── Arrow ───────────────────────────────────────────────────────────────────
function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  padding: '15px 26px',
  background: ink, color: paper,
  border: 'none', borderRadius: 999,
  fontFamily: dmSans, fontSize: 15.5, fontWeight: 500,
  textDecoration: 'none', cursor: 'pointer',
  boxShadow: `0 2px 0 0 #0e1230`,
}

const Italic = ({ children, col = blueInk }: { children: React.ReactNode; col?: string }) => (
  <em style={{ fontStyle: 'italic', color: col, fontWeight: 400 }}>{children}</em>
)

// A small ruled divider — a single hand-drawn-feeling line.
function Rule() {
  return (
    <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      <span style={{ width: 40, height: 1, background: line }} />
    </div>
  )
}

// One quiet line in the "rituals" read.
function Ritual({ mark, children }: { mark: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
      <span style={{
        fontFamily: serif, fontStyle: 'italic', fontSize: 22,
        color: blueInk, flexShrink: 0, width: 28, textAlign: 'right',
      }}>
        {mark}
      </span>
      <p style={{ fontSize: 19, color: inkSoft, lineHeight: 1.6, margin: 0 }}>
        {children}
      </p>
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
      {/* Paper grain overlay — felt, not seen */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(rgba(140,110,50,.06) 1px, transparent 1px)',
            'radial-gradient(rgba(140,110,50,.04) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '3px 3px, 7px 7px',
          backgroundPosition: '0 0, 1px 2px',
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      <LandingNav />

      {/* ═════ HERO — one sentence, a lot of quiet ═════ */}
      <section
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 940, margin: '0 auto',
          padding: '200px 28px 120px',
          textAlign: 'center',
        }}
      >
        <p style={{
          fontFamily: dmSans, fontSize: 13, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.22em',
          color: blueSlate, margin: '0 0 36px',
        }}>
          a little book for the people you love
        </p>

        <h1 style={{
          fontFamily: serif, fontWeight: 400,
          fontSize: 'clamp(48px, 8vw, 104px)',
          lineHeight: 1.03, letterSpacing: '-0.03em',
          margin: '0 auto', maxWidth: 900, color: ink,
        }}
          className="text-balance"
        >
          <span>
            Write to the people you&apos;d{' '}
            <Italic>miss</Italic>,
            <br />
            before another year{' '}
            <span style={{ display: 'inline-block', position: 'relative' }}>
              slips by
              <span aria-hidden style={{
                position: 'absolute',
                left: '-2%', right: '-4%',
                bottom: '0.08em', height: '0.32em',
                background: cream, zIndex: -1,
                transform: 'skew(-6deg)', display: 'block',
              }} />
            </span>
            .
          </span>
        </h1>

        <p style={{
          fontSize: 19, color: inkSoft, maxWidth: 540,
          margin: '34px auto 44px', lineHeight: 1.6,
        }}>
          Keep their addresses in one place, remember the birthdays,
          and get a gentle nudge to actually send a card now and then.
          That&apos;s the whole thing.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={btnPrimary}>
            Start your book
            <Arrow />
          </Link>
          <a href="#why" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: blueSlate, fontSize: 15, fontWeight: 500, textDecoration: 'none',
            fontFamily: serif, fontStyle: 'italic',
          }}>
            why I made this →
          </a>
        </div>
      </section>

      {/* ═════ ONE STILL OBJECT — a single envelope ═════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 28px 130px' }}>
        <div aria-hidden style={{ maxWidth: 460, margin: '0 auto' }}>
          <div style={{
            position: 'relative',
            background: paper2,
            border: `1px solid ${line}`,
            borderRadius: 4,
            boxShadow: `0 1px 0 rgba(255,255,255,.6) inset, 0 30px 60px -28px rgba(45,35,10,.3), 0 6px 16px -6px rgba(45,35,10,.12)`,
            transform: 'rotate(-1.5deg)',
            padding: '28px 30px',
            height: 280,
            overflow: 'hidden',
          }}>
            {/* Stripe borders */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 10,
              background: `repeating-linear-gradient(-45deg, ${blueInk} 0 10px, transparent 10px 20px, ${stamp} 20px 30px, transparent 30px 40px)`,
              opacity: 0.85,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 10,
              background: `repeating-linear-gradient(-45deg, ${blueInk} 0 10px, transparent 10px 20px, ${stamp} 20px 30px, transparent 30px 40px)`,
              opacity: 0.85,
            }} />
            {/* Stamp */}
            <div style={{
              position: 'absolute', top: 28, right: 28,
              width: 72, height: 88,
              background: cream,
              border: `2px dashed ${paper}`,
              outline: `1px solid ${line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,.08)',
              transform: 'rotate(4deg)',
            }}>
              <div style={{
                width: 56, height: 72,
                background: blueInk,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: cream, fontFamily: serif, gap: 2,
              }}>
                <div style={{ fontSize: 21, fontStyle: 'italic', fontWeight: 500, lineHeight: 1 }}>df</div>
                <div style={{ fontSize: 7.5, letterSpacing: '0.15em', textTransform: 'uppercase' }}>forever</div>
              </div>
            </div>
            {/* Postmark */}
            <div style={{
              position: 'absolute', top: 64, right: 116,
              width: 84, height: 84,
              border: `2px solid ${stamp}`,
              borderRadius: '50%',
              color: stamp, opacity: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: dmSans, fontSize: 8.5, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transform: 'rotate(-12deg)', textAlign: 'center', lineHeight: 1.1,
            }}>
              <div style={{ position: 'absolute', inset: 7, border: `1px dashed ${stamp}`, borderRadius: '50%' }} />
              New York<br />Apr · 26
            </div>
            {/* Address */}
            <div style={{
              position: 'absolute', bottom: 44, left: 32,
              fontFamily: serif, fontSize: 15, color: ink, lineHeight: 1.5,
            }}>
              <span style={{ fontFamily: dmSans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: muted, display: 'block', marginBottom: 5 }}>To someone you miss</span>
              <span style={{ fontWeight: 500, fontSize: 18 }}>Hana Okafor</span><br />
              <em>214 Linden St., Apt 3</em><br />
              <em>Brooklyn, NY 11221</em>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ WHY — a personal note ═════ */}
      <section id="why" style={{
        position: 'relative', zIndex: 1,
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
        padding: '110px 28px',
      }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <p style={{
            fontFamily: caveat, fontSize: 30, color: blueSlate,
            margin: '0 0 24px', transform: 'rotate(-1.5deg)', display: 'inline-block',
          }}>
            a note, from me —
          </p>
          <div style={{
            fontFamily: serif, fontSize: 'clamp(21px, 2.6vw, 27px)',
            lineHeight: 1.62, color: ink, letterSpacing: '-0.01em',
          }}>
            <p style={{ margin: '0 0 26px' }}>
              I kept losing touch with people I genuinely loved. Not on purpose —
              just the slow drift of busy weeks, until a year had quietly gone by.
            </p>
            <p style={{ margin: '0 0 26px' }}>
              So I made a small place to keep their addresses and the dates that matter,
              and to{' '}
              <span style={{
                background: cream, padding: '0 4px',
                borderBottom: `1.5px dotted ${blueInk}`,
              }}>
                nudge me to write
              </span>{' '}
              before the moment passes. No feeds, no streaks, no red badges.
            </p>
            <p style={{ margin: 0, color: inkSoft }}>
              If it helps you mail one card you would&apos;ve otherwise meant to,
              it&apos;s done its job.
            </p>
          </div>
        </div>
      </section>

      {/* ═════ THE RITUALS — quiet list, no cards ═════ */}
      <section id="rituals" style={{
        position: 'relative', zIndex: 1,
        padding: '110px 28px',
      }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: serif, fontWeight: 400,
            fontSize: 'clamp(34px, 4.5vw, 52px)',
            lineHeight: 1.05, letterSpacing: '-0.025em',
            margin: '0 0 48px', color: ink,
          }}>
            It only asks three<br />
            small things of you.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            <Ritual mark="i">
              Add the people you care about — or send a private link and let them
              fill in their own address. No account, no app, nothing weird.
            </Ritual>
            <Ritual mark="ii">
              Note the birthdays and the days that matter. You&apos;ll hear from me
              a week before — enough time to actually put something in the mail.
            </Ritual>
            <Ritual mark="iii">
              Write a card in your own words. Print it at home, or I&apos;ll stamp
              and mail it for you. Your handwriting still counts.
            </Ritual>
          </div>
        </div>
      </section>

      {/* ═════ A LETTER — single calm glimpse ═════ */}
      <section id="letter" style={{
        position: 'relative', zIndex: 1,
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
        padding: '120px 28px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{
            fontFamily: dmSans, fontSize: 13, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.2em',
            color: blueSlate, margin: '0 0 28px', textAlign: 'center',
          }}>
            something like this
          </p>

          <div style={{
            background: paper, border: `1px solid ${line}`, borderRadius: 8,
            padding: '40px 42px',
            fontFamily: serif, lineHeight: 1.6, color: ink,
            boxShadow: `0 30px 60px -24px rgba(45,35,10,.18), 0 8px 20px -8px rgba(45,35,10,.08)`,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, rgba(81,97,131,.10) 31px 32px)`,
            backgroundPosition: '0 52px',
          }}>
            <div style={{ fontFamily: dmSans, fontSize: 12.5, color: muted, marginBottom: 14, textAlign: 'right' }}>
              april 26, 2026
            </div>
            <div style={{ fontSize: 22, fontStyle: 'italic', color: blueInk, marginBottom: 10 }}>
              Dear Mira,
            </div>
            <div style={{ fontSize: 17, color: ink, marginBottom: 30 }}>
              It&apos;s been a strange spring. I keep thinking about that winter we spent in
              Helsinki — the little kitchen, the candles, the way you made coffee at 11pm
              and we somehow still slept.
              <br /><br />
              I hope the new apartment is warm. Tell me about it. I&apos;ll be in Copenhagen
              in June — any chance?
            </div>
            <div style={{ fontStyle: 'italic', color: blueInk, fontSize: 18 }}>
              Yours, always —
            </div>
          </div>

          <p style={{
            fontSize: 16, color: inkSoft, lineHeight: 1.6,
            textAlign: 'center', margin: '32px auto 0', maxWidth: 440,
          }}>
            dearfriends quietly remembers the small things you&apos;ve mentioned —
            a trip, a new kid, a hard season — so your letters never have to start
            with <Italic col={blueSlate}>&ldquo;sorry it&apos;s been so long.&rdquo;</Italic>
          </p>
        </div>
      </section>

      {/* ═════ CLOSING ═════ */}
      <section id="start" style={{
        padding: '130px 28px 110px',
        textAlign: 'center',
        maxWidth: 760, margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        <Rule />
        <h2 style={{
          fontFamily: serif, fontWeight: 400,
          fontSize: 'clamp(38px, 5.2vw, 68px)',
          lineHeight: 1.06, letterSpacing: '-0.025em',
          margin: '24px 0 22px', color: ink,
        }}
          className="text-balance"
        >
          The people you love won&apos;t know{' '}
          <Italic>unless you tell them.</Italic>
        </h2>
        <p style={{ fontSize: 18, color: inkSoft, margin: '0 0 36px' }}>
          Start your little book today. It takes about four minutes.
        </p>
        <Link href="/login" style={btnPrimary}>
          Begin writing <Arrow />
        </Link>
        <div style={{
          marginTop: 56, fontFamily: caveat, fontSize: 26,
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
        padding: '36px 28px',
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        fontSize: 13, color: muted,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontFamily: serif, fontSize: 16 }}>
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
