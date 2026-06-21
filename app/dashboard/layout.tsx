import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { CalendarDays, Layers, Map, PenLine, Send, Users } from 'lucide-react'
import { FeatureTour } from '@/components/feature-tour'
import { DashboardUserMenu } from '@/components/dashboard-user-menu'
import { NavLink } from '@/components/nav-link'
import { PostalLineArt } from '@/components/ui/postal-line-art'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const mainNavItems = [
  { href: '/dashboard', label: 'Contacts', icon: Users },
  { href: '/dashboard/map', label: 'Map', icon: Map },
  { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/dashboard/groups', label: 'Groups', icon: Layers },
  { href: '/dashboard/compose', label: 'Compose', icon: PenLine },
  { href: '/dashboard/export', label: 'Export & Send', icon: Send },
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
        className="dashboard-layout postal-page min-h-screen"
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
        }}
      >
        <PostalLineArt
          variant="dashboard"
          className="postal-art-fixed -right-32 top-4 z-0 h-[62vh] w-[78vw]"
        />
        <PostalLineArt
          variant="compact"
          className="postal-art-fixed -bottom-14 left-40 z-0 h-[260px] w-[560px] opacity-10"
        />

        {/* ── Sidebar ── */}
        <aside
          className="dashboard-sidebar"
          style={{
            padding: '26px 18px 24px',
            borderRight: '1px solid var(--line)',
            background: 'rgba(248,249,251,0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
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
              color: 'var(--periwinkle)',
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
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <DashboardUserMenu
              initials={initials}
              fullName={profile.fullName}
              email={user.email ?? null}
            />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="postal-page-content" style={{ minWidth: 0, position: 'relative' }}>
          <div className="postal-stripe" />
          {children}
        </main>
      </div>

      <FeatureTour initialOpen={!profile.hasSeenTour} name={profile.fullName} />
    </>
  )
}
