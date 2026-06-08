import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/marketing/landing-nav'

export const metadata: Metadata = {
  title: 'dearfriends — keep up with friends by mail',
  description: "Collect your friends' addresses, remember birthdays, and actually send a card now and then.",
}

// ─── Palette (small + warm) ────────────────────────────────────────────────
const paper    = '#faf4e4'
const paper2   = '#f5ecd3'
const blueInk  = '#3358ba'
const blueSlate = '#516183'
const ink      = '#1d2442'
const inkSoft  = '#3a4263'
const muted    = '#6b7290'
const line     = '#d9cfb0'

const serif  = "var(--font-ppwriter), Georgia, serif"
const dmSans = "var(--font-dm-sans), system-ui, sans-serif"

const Italic = ({ children }: { children: React.ReactNode }) => (
  <em style={{ fontStyle: 'italic', color: blueInk, fontWeight: 400 }}>{children}</em>
)

// ═══════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <div
      style={{ fontFamily: dmSans, background: paper, color: ink, fontSize: 17, lineHeight: 1.6 }}
      className="relative overflow-x-hidden"
    >
      <LandingNav />

      {/* ── Hero — a single quiet sentence, left aligned like a letter ── */}
      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '170px 28px 90px',
        }}
      >
        <p style={{
          fontFamily: serif, fontStyle: 'italic', fontSize: 19,
          color: blueSlate, margin: '0 0 28px',
        }}>
          A little address book for the people you love.
        </p>

        <h1 style={{
          fontFamily: serif, fontWeight: 400,
          fontSize: 'clamp(40px, 6.5vw, 78px)',
          lineHeight: 1.06, letterSpacing: '-0.025em',
          margin: 0, color: ink,
        }}
          className="text-pretty"
        >
          Write to the people you&apos;d <Italic>miss</Italic>, before
          another year quietly slips by.
        </h1>

        <p style={{
          fontSize: 18, color: inkSoft, maxWidth: 500,
          margin: '32px 0 40px', lineHeight: 1.65,
        }}>
          Keep their addresses in one place, remember the birthdays, and
          get a small nudge to actually send a card now and then. That&apos;s
          really the whole thing.
        </p>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '14px 24px', background: ink, color: paper,
            borderRadius: 4, fontFamily: dmSans, fontSize: 15.5, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Start your book
          </Link>
          <a href="#why" style={{
            color: blueSlate, fontSize: 15.5, textDecoration: 'underline',
            textUnderlineOffset: 4, textDecorationColor: line,
            fontFamily: serif, fontStyle: 'italic',
          }}>
            why I made this
          </a>
        </div>
      </section>

      {/* ── A single envelope, plainly drawn ── */}
      <section style={{ padding: '0 28px 100px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div aria-hidden style={{ maxWidth: 420 }}>
            <div style={{
              position: 'relative',
              background: paper2,
              border: `1px solid ${line}`,
              borderRadius: 3,
              padding: '30px 30px 34px',
              minHeight: 200,
            }}>
              {/* flap line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 70,
                borderBottom: `1px solid ${line}`,
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                background: 'rgba(0,0,0,0.015)',
              }} />
              {/* stamp — small, plain */}
              <div style={{
                position: 'absolute', top: 24, right: 28,
                width: 50, height: 60, background: paper,
                border: `1px solid ${line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: serif, fontStyle: 'italic', fontSize: 16,
                color: blueSlate,
              }}>
                df
              </div>
              {/* address */}
              <div style={{
                marginTop: 78, fontFamily: serif, fontSize: 16, color: ink, lineHeight: 1.6,
              }}>
                <span style={{ fontWeight: 500, fontSize: 19 }}>Hana Okafor</span><br />
                214 Linden St., Apt 3<br />
                Brooklyn, NY 11221
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why — a personal note, plainly set ── */}
      <section id="why" style={{
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
        padding: '90px 28px',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{
            fontFamily: dmSans, fontSize: 12.5, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            color: muted, margin: '0 0 28px',
          }}>
            Why this exists
          </p>
          <div style={{
            fontFamily: serif, fontSize: 'clamp(20px, 2.4vw, 25px)',
            lineHeight: 1.65, color: ink,
          }}>
            <p style={{ margin: '0 0 24px' }}>
              I kept losing touch with people I genuinely loved. Not on
              purpose — just the slow drift of busy weeks, until a year had
              quietly gone by.
            </p>
            <p style={{ margin: '0 0 24px' }}>
              So I made a small place to keep their addresses and the dates
              that matter, and to nudge me to write before the moment passes.
              No feeds, no streaks, no notifications begging for my attention.
            </p>
            <p style={{ margin: 0, color: inkSoft }}>
              If it helps you mail one card you would have otherwise only
              meant to, it has done its job.
            </p>
          </div>
        </div>
      </section>

      {/* ── The rituals — a plain numbered read ── */}
      <section id="rituals" style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: serif, fontWeight: 400,
            fontSize: 'clamp(30px, 4vw, 44px)',
            lineHeight: 1.1, letterSpacing: '-0.02em',
            margin: '0 0 44px', color: ink,
          }}>
            It only asks three small things of you.
          </h2>

          <ol style={{
            listStyle: 'none', margin: 0, padding: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            {[
              {
                t: 'Keep their addresses.',
                d: 'Add the people you care about, or send a private link and let them fill in their own. No account needed on their end.',
              },
              {
                t: 'Remember the dates.',
                d: 'Birthdays and the days that matter. You will hear from me about a week before — enough time to put something in the mail.',
              },
              {
                t: 'Actually write.',
                d: 'A card in your own words. Print it at home, or I will stamp and mail it for you. Your handwriting still counts for something.',
              },
            ].map((r, i) => (
              <li key={r.t} style={{
                display: 'flex', gap: 22, padding: '24px 0',
                borderTop: `1px solid ${line}`,
                ...(i === 2 ? { borderBottom: `1px solid ${line}` } : {}),
              }}>
                <span style={{
                  fontFamily: serif, fontStyle: 'italic', fontSize: 22,
                  color: blueSlate, flexShrink: 0, width: 24,
                }}>
                  {i + 1}
                </span>
                <div>
                  <h3 style={{
                    fontFamily: serif, fontSize: 21, fontWeight: 500,
                    margin: '0 0 6px', color: ink,
                  }}>
                    {r.t}
                  </h3>
                  <p style={{ fontSize: 16.5, color: inkSoft, margin: 0, lineHeight: 1.6 }}>
                    {r.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── A letter — one plain glimpse ── */}
      <section id="letter" style={{
        background: paper2,
        borderTop: `1px solid ${line}`,
        borderBottom: `1px solid ${line}`,
        padding: '90px 28px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            background: paper, border: `1px solid ${line}`, borderRadius: 4,
            padding: '40px 40px 44px',
            fontFamily: serif, lineHeight: 1.7, color: ink,
          }}>
            <div style={{ fontFamily: dmSans, fontSize: 12.5, color: muted, marginBottom: 18 }}>
              April 26, 2026
            </div>
            <p style={{ fontSize: 21, fontStyle: 'italic', color: blueInk, margin: '0 0 14px' }}>
              Dear Mira,
            </p>
            <p style={{ fontSize: 17, color: ink, margin: '0 0 16px' }}>
              It&apos;s been a strange spring. I keep thinking about that
              winter we spent in Helsinki — the little kitchen, the candles,
              the way you made coffee at 11pm and we somehow still slept.
            </p>
            <p style={{ fontSize: 17, color: ink, margin: '0 0 24px' }}>
              I hope the new apartment is warm. Tell me about it. I&apos;ll be
              in Copenhagen in June — any chance?
            </p>
            <p style={{ fontStyle: 'italic', color: blueInk, fontSize: 18, margin: 0 }}>
              Yours, always.
            </p>
          </div>

          <p style={{
            fontFamily: serif, fontSize: 17, color: inkSoft, lineHeight: 1.65,
            margin: '28px 0 0',
          }}>
            dearfriends quietly holds onto the small things you&apos;ve
            mentioned — a trip, a new kid, a hard season — so your letters
            never have to start with &ldquo;sorry it&apos;s been so long.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Closing ── */}
      <section style={{
        padding: '100px 28px',
        maxWidth: 640, margin: '0 auto',
      }}>
        <h2 style={{
          fontFamily: serif, fontWeight: 400,
          fontSize: 'clamp(32px, 4.5vw, 54px)',
          lineHeight: 1.08, letterSpacing: '-0.02em',
          margin: '0 0 20px', color: ink,
        }}
          className="text-pretty"
        >
          The people you love won&apos;t know <Italic>unless you tell them.</Italic>
        </h2>
        <p style={{ fontSize: 18, color: inkSoft, margin: '0 0 32px' }}>
          Start your little book today. It takes about four minutes.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '14px 24px', background: ink, color: paper,
          borderRadius: 4, fontFamily: dmSans, fontSize: 15.5, fontWeight: 500,
          textDecoration: 'none',
        }}>
          Begin writing
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${line}`,
        padding: '32px 28px',
        maxWidth: 720, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        fontSize: 13, color: muted,
      }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: blueSlate }}>
          dearfriends
        </div>
        <ul style={{ display: 'flex', gap: 22, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {['About', 'Privacy'].map(item => (
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
        <div>© 2026</div>
      </footer>
    </div>
  )
}
