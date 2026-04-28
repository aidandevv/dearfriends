import Link from 'next/link'
import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkCard } from '@/components/share-link-card'
import { getContacts } from '@/lib/actions/contacts'
import { getGroups } from '@/lib/actions/groups'
import { generateShareSlug } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { GlobePanel } from '@/components/globe-panel'

const MONTH_LETTERS = ['J','F','M','A','M','J','J','A','S','O','N','D']
const MONTH_NAMES   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = getUserProfile(user)

  let shareSlug = profile.shareSlug
  if (user && !shareSlug) {
    try { shareSlug = await generateShareSlug(user.id) } catch { /* non-fatal */ }
  }

  const [contacts, groups] = await Promise.all([getContacts(), getGroups()])
  const { filter = 'all' } = await searchParams

  const verifiedCount   = contacts.filter(c => Boolean(c.verified_at) && !c.opted_out).length
  const printCount      = contacts.filter(c => c.delivery_method === 'print').length
  const digitalCount    = contacts.filter(c => c.delivery_method === 'digital').length
  const handwriteCount  = contacts.filter(c => c.delivery_method === 'handwrite').length

  const filteredContacts =
    filter === 'pending'  ? contacts.filter(c => !c.verified_at && !c.opted_out) :
    filter === 'verified' ? contacts.filter(c => Boolean(c.verified_at) && !c.opted_out) :
    contacts

  const stats = [
    { label: 'Total',     value: contacts.length,  hint: 'in your book' },
    { label: 'Verified',  value: verifiedCount,     hint: 'addresses confirmed' },
    { label: 'Print',     value: printCount,        hint: 'to mail yourself' },
    { label: 'Digital',   value: digitalCount,      hint: 'email or PDF' },
    { label: 'Handwrite', value: handwriteCount,    hint: "we'll mail it" },
  ]

  const now         = new Date()
  const monthIdx    = now.getMonth()
  const monthName   = MONTH_NAMES[monthIdx]
  const dayName     = DAY_NAMES[now.getDay()]
  const longDate    = `${dayName}, ${monthName} ${now.getDate()}`
  const shortYear   = String(now.getFullYear()).slice(2)

  const contactSummary =
    contacts.length === 0 ? 'No contacts yet' :
    contacts.length === 1 ? 'One contact' :
    `${contacts.length} contacts`

  const subtitle =
    contacts.length === 0 ? '— share your link to get started.' :
    contacts.length === 1 ? 'in your book — just getting started.' :
    'in your book.'

  const uniqueCities = [...new Set(contacts.map(c => `${c.city}, ${c.state}`).filter(Boolean))]

  const filterChips = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Verified' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Postal stripe ── */}
      <div style={{
        height: 8,
        background: 'repeating-linear-gradient(-45deg, var(--blue-ink) 0 10px, transparent 10px 20px, var(--stamp) 20px 30px, transparent 30px 40px)',
        opacity: 0.85,
      }} />

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        padding: '44px 48px 36px',
        background: 'linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%)',
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {/* Dotted reading rule */}
        <div style={{
          position: 'absolute', left: 48, right: 48, top: 70,
          height: 1,
          backgroundImage: 'linear-gradient(to right, var(--line) 50%, transparent 50%)',
          backgroundSize: '6px 1px',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />

        {/* Decorative postmark */}
        <div style={{
          position: 'absolute', top: 24, right: 0,
          width: 110, height: 110,
          border: '2px solid var(--stamp)',
          borderRadius: '50%',
          color: 'var(--stamp)',
          opacity: 0.42,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: 9, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          transform: 'rotate(-8deg)',
          textAlign: 'center', lineHeight: 1.2,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', inset: 8,
            border: '1px dashed currentColor', borderRadius: '50%',
          }} />
          dearfriends<br />· {monthName.slice(0,3)} {now.getDate()} ·
          <span style={{
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontStyle: 'italic', fontSize: 14, letterSpacing: 0,
            textTransform: 'none', display: 'block', marginTop: 2,
          }}>est. 2026</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'end',
          position: 'relative',
        }}>
          <div>
            <div className="eyebrow">Your book · {monthName}</div>
            <h1 style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(52px, 6.5vw, 88px)',
              lineHeight: 0.92,
              letterSpacing: '-0.028em',
              margin: '0 0 20px',
              color: 'var(--ink)',
            }}>
              Your{' '}
              <em style={{
                fontStyle: 'italic',
                color: 'var(--blue-ink)',
                position: 'relative',
                display: 'inline-block',
              }}>
                friends
                <span style={{
                  position: 'absolute',
                  left: '-1%', right: '-2%', bottom: '0.08em',
                  height: '0.32em',
                  background: 'var(--cream)',
                  zIndex: -1,
                  transform: 'skew(-6deg)',
                  display: 'block',
                }} />
              </em>
              ,<br />so far.
            </h1>
            <p style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontSize: 18, fontStyle: 'italic',
              color: 'var(--blue-slate)', margin: 0,
            }}>
              <b style={{ color: 'var(--ink)', fontStyle: 'normal', fontWeight: 500 }}>
                {contactSummary}
              </b>
              {' '}{subtitle}
            </p>
          </div>

          <div style={{ textAlign: 'right', paddingBottom: 6 }}>
            <div style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontStyle: 'italic', fontSize: 16,
              color: 'var(--blue-slate)', marginBottom: 14,
            }}>
              {longDate}
            </div>
            <SendVerificationButton />
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        background: 'var(--paper)',
        borderBottom: '1px solid var(--line)',
      }}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{
            padding: '24px 28px',
            borderRight: i < stats.length - 1 ? '1px dashed var(--line)' : 'none',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontSize: 26, fontWeight: 500,
              ...(stat.value > 0 ? {
                background: 'var(--blue-ink)',
                color: 'var(--cream)',
                border: '1.5px solid var(--ink)',
                boxShadow: '0 2px 0 0 var(--ink), 0 6px 12px -6px rgba(51,88,186,.4)',
              } : {
                background: 'transparent',
                color: 'var(--muted)',
                border: '1.5px dashed var(--line)',
              }),
            }}>
              {stat.value}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                color: 'var(--muted)', marginBottom: 4,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontStyle: 'italic', fontSize: 13.5,
                color: 'var(--blue-slate)', lineHeight: 1.2,
              }}>
                {stat.hint}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Body ── */}
      <div style={{
        padding: '36px 48px 72px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: 32,
        alignItems: 'start',
      }}>

        {/* ── Left column ── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Contacts section */}
          <section>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 14, gap: 16,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontWeight: 400, fontSize: 28,
                letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)',
              }}>
                The{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--blue-ink)' }}>contacts</em>
              </h2>
              <div style={{ display: 'flex', gap: 4 }}>
                {filterChips.map(chip => (
                  <Link
                    key={chip.key}
                    href={chip.key === 'all' ? '/dashboard' : `/dashboard?filter=${chip.key}`}
                    style={{
                      fontSize: 12.5, fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      border: '1px solid transparent',
                      transition: 'all 0.15s ease',
                      ...(filter === chip.key ? {
                        color: 'var(--ink)',
                        background: 'var(--paper-2)',
                        borderColor: 'var(--line)',
                      } : {
                        color: 'var(--muted)',
                      }),
                    }}
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Table card */}
            <div style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 18px 36px -22px rgba(45,35,10,.18), 0 3px 8px -3px rgba(45,35,10,.06)',
            }}>
              <ContactTable contacts={filteredContacts} allGroups={groups} />

              {/* Always-present add CTA */}
              <div style={{
                padding: '32px 24px',
                borderTop: filteredContacts.length > 0 ? '1px dashed var(--line)' : undefined,
                background: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '1.5px dashed var(--line)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--blue-slate)', flexShrink: 0,
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-ppwriter), Georgia, serif',
                    fontStyle: 'italic', fontSize: 16.5,
                    color: 'var(--blue-slate)', lineHeight: 1.4,
                  }}>
                    <b style={{ color: 'var(--ink)', fontStyle: 'normal', fontWeight: 500 }}>
                      Add another friend
                    </b>
                    <br />
                    Type their name, or share your invite link.
                  </div>
                </div>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 18px',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 999,
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: '0 1px 0 rgba(255,255,255,.6) inset',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="var(--blue-ink)" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  Add contact
                </button>
              </div>
            </div>
          </section>

          {/* ── Atmospheric strip ── */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: 22,
          }}>
            {/* Map */}
            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '22px 24px 20px',
              boxShadow: '0 12px 28px -20px rgba(45,35,10,.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 0 }}>Where your people live</div>
                <div style={{
                  fontFamily: 'var(--font-ppwriter), Georgia, serif',
                  fontStyle: 'italic', fontSize: 13.5, color: 'var(--blue-slate)',
                }}>
                  {uniqueCities.length} {uniqueCities.length === 1 ? 'city' : 'cities'} · {contacts.length} {contacts.length === 1 ? 'friend' : 'friends'}
                </div>
              </div>
              {/* TODO: remove casts after running `npx supabase gen types` (migration 006 adds lat/lng) */}
              <GlobePanel
                contacts={contacts.map(c => ({
                  lat: (c as { lat?: number | null }).lat ?? null,
                  lng: (c as { lng?: number | null }).lng ?? null,
                  city: c.city,
                  state: c.state,
                }))}
              />
            </div>

            {/* Almanac */}
            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '22px 24px 20px',
              boxShadow: '0 12px 28px -20px rgba(45,35,10,.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 0 }}>Your year, so far</div>
                <span style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  fontWeight: 500,
                  fontSize: 36, color: 'var(--blue-ink)',
                  lineHeight: 1, transform: 'rotate(-2deg)',
                  display: 'inline-block',
                }}>
                  &apos;{shortYear}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 4,
                marginBottom: 16,
                alignItems: 'end',
              }}>
                {MONTH_LETTERS.map((letter, i) => {
                  const isPast    = i < monthIdx
                  const isCurrent = i === monthIdx
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      position: 'relative', paddingTop: 24,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-ppwriter), Georgia, serif',
                        fontSize: 13,
                        marginBottom: 4,
                        color: isCurrent ? 'var(--blue-ink)' : isPast ? 'var(--ink-soft)' : 'var(--muted)',
                        fontWeight: isCurrent ? 600 : 400,
                        fontStyle: isCurrent ? 'italic' : 'normal',
                      }}>
                        {letter}
                      </span>
                      <div style={{
                        width: '100%', height: 28, borderRadius: 3,
                        border: '1px solid',
                        ...(isCurrent ? {
                          background: 'var(--blue-ink)',
                          borderColor: 'var(--ink)',
                          boxShadow: '0 2px 0 0 var(--ink)',
                        } : isPast ? {
                          background: 'var(--paper-3)',
                          borderColor: 'var(--line)',
                        } : {
                          background: 'var(--paper-2)',
                          borderColor: 'var(--line-soft)',
                        }),
                      }} />
                      {isCurrent && (
                        <span style={{
                          position: 'absolute', top: -4, left: '50%',
                          transform: 'translateX(-50%) rotate(-3deg)',
                          fontFamily: 'var(--font-caveat), cursive',
                          fontSize: 14, color: 'var(--stamp)',
                          whiteSpace: 'nowrap',
                        }}>
                          you are here
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{
                display: 'flex', gap: 18,
                paddingTop: 12,
                borderTop: '1px dashed var(--line)',
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontStyle: 'italic', fontSize: 13.5, color: 'var(--blue-slate)',
              }}>
                <span><b style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--ink)', fontSize: 17, marginRight: 4 }}>0</b> letters sent</span>
                <span><b style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--ink)', fontSize: 17, marginRight: 4 }}>0</b> received</span>
                <span><b style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--ink)', fontSize: 17, marginRight: 4 }}>{contacts.length}</b> {contacts.length === 1 ? 'friend' : 'friends'} kept</span>
              </div>
            </div>
          </section>

          {/* ── Mail tray ── */}
          <section style={{
            background: 'var(--paper-3)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '22px 26px 30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 8,
              border: '1px dashed var(--line)', borderRadius: 6,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, position: 'relative' }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>Drafts &amp; outbox</div>
              <span style={{
                fontFamily: 'var(--font-caveat), cursive',
                fontWeight: 500, fontSize: 18, color: 'var(--blue-slate)',
                transform: 'rotate(-1deg)',
              }}>
                a quiet pile, for now
              </span>
            </div>
            <div style={{ position: 'relative', height: 220 }}>
              {/* Envelope 1 */}
              <Envelope style={{ top: 18, left: '6%', transform: 'rotate(-5deg)' }} bg="var(--paper)" />
              {/* Envelope 2 */}
              <Envelope style={{ top: 30, left: '30%', transform: 'rotate(2deg)', zIndex: 2 }} bg="var(--paper-2)" />
              {/* Envelope 3 */}
              <Envelope style={{ top: 8, left: '54%', transform: 'rotate(-2deg)' }} bg="var(--paper)" />
              {/* Quote */}
              <div style={{
                position: 'absolute', top: 24, right: '4%', width: 240, textAlign: 'left', zIndex: 3,
              }}>
                <p style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  fontWeight: 500, fontSize: 22, color: 'var(--blue-ink)',
                  lineHeight: 1.15, margin: '0 0 8px',
                  transform: 'rotate(-2deg)',
                }}>
                  &ldquo;the people you love<br />aren&apos;t going to know<br />unless you tell them.&rdquo;
                </p>
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 11.5, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: 0,
                  display: 'block', marginLeft: 10,
                }}>
                  — a postcard, somewhere
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* ── Right column ── */}
        <aside style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>

          <ShareLinkCard shareSlug={shareSlug} />

          {/* Nudge card */}
          <section style={{
            background: 'var(--blue-ink)',
            border: '1px solid var(--blue-mid)',
            borderRadius: 10,
            padding: '22px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 18px 36px -22px rgba(45,35,10,.18)',
          }}>
            <div style={{
              position: 'absolute', right: -40, bottom: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(228,206,149,.18), transparent 65%)',
              pointerEvents: 'none',
            }} />
            <div className="eyebrow" style={{ color: 'var(--cream)' }}>A gentle nudge</div>
            <h4 style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontWeight: 400, fontSize: 22,
              letterSpacing: '-0.015em',
              margin: '0 0 10px',
              color: 'var(--paper)', lineHeight: 1.15,
            }}>
              Add three more{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--cream)' }}>before Sunday</em>.
            </h4>
            <p style={{
              fontSize: 13.5, color: 'rgba(250,244,228,.78)',
              lineHeight: 1.5, margin: '0 0 16px', maxWidth: 250,
            }}>
              Most books start with the people you&apos;d call at midnight. Keep going — three names is enough to feel real.
            </p>
            <a
              href="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 14px',
                background: 'var(--cream)',
                color: 'var(--ink)',
                border: 'none', borderRadius: 999,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', textDecoration: 'none',
                boxShadow: '0 2px 0 0 #8a7a3a',
              }}
            >
              Add a friend
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </section>

        </aside>
      </div>
    </div>
  )
}

function Envelope({ style, bg }: { style: React.CSSProperties; bg: string }) {
  return (
    <div style={{
      position: 'absolute',
      width: 260, height: 160,
      background: bg,
      border: '1px solid var(--line)',
      borderRadius: 4,
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 18px 36px -18px rgba(45,35,10,.25), 0 4px 10px -2px rgba(45,35,10,.1)',
      padding: '14px 16px',
      overflow: 'hidden',
      ...style,
    }}>
      {/* Stripes top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 6,
        background: 'repeating-linear-gradient(-45deg, var(--blue-ink) 0 8px, transparent 8px 16px, var(--stamp) 16px 24px, transparent 24px 32px)',
        opacity: 0.8,
      }} />
      {/* Stripes bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
        background: 'repeating-linear-gradient(-45deg, var(--blue-ink) 0 8px, transparent 8px 16px, var(--stamp) 16px 24px, transparent 24px 32px)',
        opacity: 0.8,
      }} />
      {/* Stamp */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 32, height: 38,
        background: 'var(--cream)',
        border: '1.5px dashed var(--paper)',
        outline: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-ppwriter), Georgia, serif',
        fontStyle: 'italic', fontSize: 13,
        color: 'var(--blue-ink)',
        transform: 'rotate(4deg)',
      }}>
        df
      </div>
      {/* Address lines */}
      <div style={{
        position: 'absolute', bottom: 18, left: 16, right: 60,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--muted)' }}>To</span>
        <span style={{
          fontFamily: 'var(--font-ppwriter), Georgia, serif',
          fontStyle: 'italic', fontSize: 14, color: 'var(--blue-slate)',
        }}>
          — a draft, not yet —
        </span>
        <div style={{ height: 1, background: 'var(--line)', width: '100%' }} />
        <div style={{ height: 1, background: 'var(--line)', width: '60%' }} />
      </div>
    </div>
  )
}
