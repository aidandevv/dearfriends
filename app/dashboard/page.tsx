import Link from 'next/link'
import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkCard } from '@/components/share-link-card'
import { getContacts } from '@/lib/actions/contacts'
import { getGroups } from '@/lib/actions/groups'
import { generateShareSlug } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { CalendarWidget } from '@/components/calendar-widget'
import { getCalendarWidget } from '@/lib/actions/calendar'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

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

  const [contacts, groups, calendarWidget] = await Promise.all([getContacts(), getGroups(), getCalendarWidget()])
  const { filter = 'all' } = await searchParams

  const filteredContacts =
    filter === 'pending'  ? contacts.filter(c => !c.verified_at && !c.opted_out) :
    filter === 'verified' ? contacts.filter(c => Boolean(c.verified_at) && !c.opted_out) :
    contacts

  const now       = new Date()
  const monthName = MONTH_NAMES[now.getMonth()]
  const dayName   = DAY_NAMES[now.getDay()]
  const longDate  = `${dayName}, ${monthName} ${now.getDate()}`

  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : null

  const greeting =
    contacts.length === 0
      ? 'Let\u2019s start your book. Add the first person you\u2019d hate to lose touch with.'
      : contacts.length === 1
        ? 'One person in your book so far. A good beginning.'
        : `${contacts.length} people in your book.`

  const filterChips = [
    { key: 'all',      label: 'Everyone' },
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Confirmed' },
  ]

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <section style={{
        padding: '56px 48px 40px',
        borderBottom: '1px solid var(--line)',
      }} className="dashboard-hero">
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 32, flexWrap: 'wrap',
        }} className="dashboard-hero-grid">
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontStyle: 'italic', fontSize: 16,
              color: 'var(--blue-slate)', marginBottom: 12,
            }}>
              {longDate}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(34px, 5vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              margin: '0 0 14px',
              color: 'var(--ink)',
            }}>
              {firstName ? `Hello, ${firstName}.` : 'Your book.'}
            </h1>
            <p style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontSize: 18, fontStyle: 'italic',
              color: 'var(--blue-slate)', margin: 0, maxWidth: 460,
            }}>
              {greeting}
            </p>
          </div>

          <div className="dashboard-hero-action" style={{ paddingBottom: 4 }}>
            <SendVerificationButton />
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div style={{
        padding: '40px 48px 72px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: 40,
        alignItems: 'start',
      }} className="dashboard-body">

        {/* ── Left: the contacts ── */}
        <div style={{ minWidth: 0 }}>
          <div className="dashboard-section-header" style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 16, gap: 16,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontWeight: 400, fontSize: 24,
              letterSpacing: '-0.015em', margin: 0, color: 'var(--ink)',
            }}>
              Your people
            </h2>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {filterChips.map(chip => (
                <Link
                  key={chip.key}
                  href={chip.key === 'all' ? '/dashboard' : `/dashboard?filter=${chip.key}`}
                  style={{
                    fontSize: 13, fontWeight: 500,
                    padding: '5px 10px',
                    borderRadius: 4,
                    textDecoration: 'none',
                    border: '1px solid transparent',
                    ...(filter === chip.key ? {
                      color: 'var(--ink)',
                      borderColor: 'var(--line)',
                      background: 'var(--paper-2)',
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

          {/* Plain list, framed simply */}
          <div style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            <ContactTable contacts={filteredContacts} allGroups={groups} />

            <div className="dashboard-add-cta" style={{
              padding: '24px',
              borderTop: filteredContacts.length > 0 ? '1px solid var(--line)' : undefined,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
            }}>
              <div style={{
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontStyle: 'italic', fontSize: 16,
                color: 'var(--blue-slate)',
              }}>
                Add another friend, or share your invite link.
              </div>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                border: 'none',
                borderRadius: 4,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 13.5, fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
              }}>
                Add contact
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: quiet sidebar ── */}
        <aside style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ShareLinkCard shareSlug={shareSlug} />
          <CalendarWidget events={calendarWidget.events} />
        </aside>
      </div>
    </div>
  )
}
