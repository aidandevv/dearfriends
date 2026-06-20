import Link from 'next/link'
import { ContactTable } from '@/components/contact-table'
import { DashboardInviteCta } from '@/components/dashboard-invite-cta'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkCard } from '@/components/share-link-card'
import { getContacts } from '@/lib/actions/contacts'
import { getBirthdayEditableContactIds, getGroups } from '@/lib/actions/groups'
import { generateShareSlug } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { GlobePanel } from '@/components/globe-panel'
import { CalendarWidget } from '@/components/calendar-widget'
import { getCalendarWidget } from '@/lib/actions/calendar'
import { PostalLineArt } from '@/components/ui/postal-line-art'

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

  const [contacts, groups, calendarWidget, birthdayEditableIds] = await Promise.all([
    getContacts(),
    getGroups(),
    getCalendarWidget(),
    getBirthdayEditableContactIds(),
  ])
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
    { label: 'Total',     value: contacts.length,  hint: 'contacts' },
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

  const contactSummary =
    contacts.length === 0 ? 'No contacts yet' :
    contacts.length === 1 ? 'One contact' :
    `${contacts.length} contacts`

  const subtitle =
    contacts.length === 0 ? '— share your link to get started.' :
    contacts.length === 1 ? '— just getting started.' :
    null

  const uniqueCities = [...new Set(contacts.map(c => `${c.city}, ${c.state}`).filter(Boolean))]

  const filterChips = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Verified' },
  ]

  return (
    <div className="dashboard-page">
      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        padding: '44px 48px 36px',
        background: 'linear-gradient(180deg, rgba(248,249,251,0.9) 0%, rgba(238,241,246,0.82) 100%)',
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }} className="dashboard-hero">
        <PostalLineArt
          variant="compact"
          className="postal-art right-8 top-0 h-44 w-[380px]"
        />

        {/* Dotted reading rule */}
        <div className="dashboard-hero-rule" style={{
          position: 'absolute', left: 48, right: 48, top: 70,
          height: 1,
          backgroundImage: 'linear-gradient(to right, var(--line) 50%, transparent 50%)',
          backgroundSize: '6px 1px',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />

        <div className="dashboard-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'end',
          position: 'relative',
        }}>
          <div>
            <div className="eyebrow">{monthName}</div>
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
                color: 'var(--periwinkle)',
                position: 'relative',
                display: 'inline-block',
              }}>
                friends
                <span style={{
                  position: 'absolute',
                  left: '-1%', right: '-2%', bottom: '0.08em',
                  height: '0.32em',
                  background: 'var(--surface)',
                  zIndex: -1,
                  transform: 'skew(-6deg)',
                  display: 'block',
                }} />
              </em>
            </h1>
            {(contacts.length === 0 || contacts.length === 1) && (
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
            )}
          </div>

          <div className="dashboard-hero-action" style={{ textAlign: 'right', paddingBottom: 6 }}>
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
        background: 'rgba(248,249,251,0.86)',
        borderBottom: '1px solid var(--line)',
      }} className="dashboard-stats">
        {stats.map((stat, i) => (
          <div key={stat.label} className="dashboard-stat" style={{
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
                background: 'var(--periwinkle)',
                color: 'var(--cream)',
                border: '1.5px solid var(--ink)',
                boxShadow: '0 2px 0 0 #1e2b66, 0 6px 12px -6px rgba(74,108,212,.42)',
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
      }} className="dashboard-body">

        {/* ── Left column ── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Contacts section */}
          <section>
            <div className="dashboard-section-header" style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 14, gap: 16,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontWeight: 400, fontSize: 28,
                letterSpacing: '-0.018em', margin: 0, color: 'var(--ink)',
              }}>
                The{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--periwinkle)' }}>contacts</em>
              </h2>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
            background: 'rgba(238,241,246,0.92)',
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
              <ContactTable
                contacts={filteredContacts}
                allGroups={groups}
                birthdayEditableIds={birthdayEditableIds}
              />

              {/* Always-present add CTA */}
              <div className="dashboard-add-cta" style={{
                padding: '32px 24px',
                borderTop: filteredContacts.length > 0 ? '1px dashed var(--line)' : undefined,
                background: 'rgba(248,249,251,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
              }}>
                <div className="dashboard-add-copy" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
                    Share your invite link — they fill it out in a minute.
                  </div>
                </div>
                <DashboardInviteCta />
              </div>
            </div>
          </section>

          {/* ── Map preview ── */}
          <section style={{
            background: 'rgba(228,232,240,0.78)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '22px 26px 30px',
            position: 'relative',
            overflow: 'hidden',
          }} className="dashboard-mail-tray">
            <div style={{
              position: 'absolute', inset: 8,
              border: '1px dashed var(--line)', borderRadius: 6,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, position: 'relative', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Where they live</div>
                <div style={{
                  fontFamily: 'var(--font-ppwriter), Georgia, serif',
                  fontStyle: 'italic', fontSize: 14, color: 'var(--blue-slate)',
                }}>
                  {uniqueCities.length} {uniqueCities.length === 1 ? 'city' : 'cities'} · {contacts.length} {contacts.length === 1 ? 'friend' : 'friends'} mapped
                </div>
              </div>
              <a
                href="/dashboard/map"
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--periwinkle)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Open full map →
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <GlobePanel
                variant="feature"
                autoRefresh
                contacts={contacts.map(c => ({
                  lat: c.lat,
                  lng: c.lng,
                  city: c.city,
                  state: c.state,
                  country: c.country,
                  isInternational: c.is_international,
                }))}
              />
              <div style={{
                position: 'absolute', top: 22, right: 24, width: 210, textAlign: 'left', zIndex: 3,
                pointerEvents: 'none',
              }}>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(250,244,228,.92)',
                  lineHeight: 1.35,
                  margin: '0 0 6px',
                  textShadow: '0 2px 8px rgba(0,0,0,.28)',
                }}>
                  Your people, mapped at a glance.
                </p>
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 11,
                  color: 'rgba(250,244,228,.6)',
                  display: 'block',
                }}>
                  Drag to spin · scroll to zoom
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* ── Right column ── */}
        <aside style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>

          <ShareLinkCard shareSlug={shareSlug} shareMessage={profile.shareMessage} />

          <CalendarWidget events={calendarWidget.events} />

        </aside>
      </div>
    </div>
  )
}
