import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Layers, PenLine, Send, Settings, Users } from 'lucide-react'
import { FeatureTour } from '@/components/feature-tour'
import { NavLink } from '@/components/nav-link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const mainNavItems = [
  { href: '/dashboard', label: 'Contacts', icon: Users },
  { href: '/dashboard/groups', label: 'Groups', icon: Layers },
  { href: '/dashboard/compose', label: 'Compose', icon: PenLine },
  { href: '/dashboard/export', label: 'Export & Send', icon: Send },
]

const accountNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (!profile.hasCompletedOnboarding) redirect('/onboarding')

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
          background: 'var(--paper)',
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            padding: '26px 18px 24px',
            borderRight: '1px solid var(--line)',
            background: 'var(--paper)',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 2,
          }}
        >
          {/* Brand */}
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontStyle: 'italic',
              fontSize: 22,
              letterSpacing: '-0.02em',
              color: 'var(--blue-ink)',
              padding: '4px 10px 16px',
              marginBottom: 14,
              textDecoration: 'none',
            }}
          >
            dearfriends
          </a>

          {/* Main nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mainNavItems.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label}>
                <Icon size={17} />
              </NavLink>
            ))}

            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--muted)',
                padding: '18px 14px 8px',
              }}
            >
              Account
            </div>

            {accountNavItems.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label}>
                <Icon size={17} />
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--blue-ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cream)',
                  fontFamily: 'var(--font-ppwriter), Georgia, serif',
                  fontSize: 14,
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                  {profile.fullName ?? 'You'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ minWidth: 0, position: 'relative' }}>
          {children}
        </main>
      </div>

      <FeatureTour initialOpen={!profile.hasSeenTour} name={profile.fullName} />
    </>
  )
}
