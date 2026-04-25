import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Layers, PenLine, Send, Settings, Users } from 'lucide-react'
import { FeatureTour } from '@/components/feature-tour'
import { NavLink } from '@/components/nav-link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const navItems = [
  { href: '/dashboard', label: 'Contacts', icon: Users },
  { href: '/dashboard/groups', label: 'Groups', icon: Layers },
  { href: '/dashboard/compose', label: 'Compose', icon: PenLine },
  { href: '/dashboard/export', label: 'Export & Send', icon: Send },
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
      <div className="min-h-screen bg-linen grid" style={{ gridTemplateColumns: '220px minmax(0,1fr)' }}>
        <nav
          className="flex flex-shrink-0 flex-col border-r border-border/50 min-h-screen py-6 px-4"
          style={{ background: 'var(--sidebar)' }}
        >
          {/* Wordmark */}
          <div className="mb-8 px-1">
            <a
              href="/dashboard"
              style={{
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--blue-ink)',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              dearfriends
            </a>
            <div
              style={{
                marginTop: 2,
                height: 1,
                background: 'linear-gradient(90deg, var(--border) 0%, transparent 80%)',
              }}
            />
          </div>

          {/* Nav items */}
          <div className="flex flex-1 flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label}>
                <Icon size={16} />
              </NavLink>
            ))}
          </div>

          {/* User avatar */}
          <div className="mt-6 flex items-center gap-3 rounded-xl px-3 py-2.5 border border-border/60 bg-linen/60">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--blue-ink), var(--blue-slate))' }}
            >
              {initials}
            </div>
            <span className="text-xs font-medium text-ink truncate">{profile.fullName ?? 'You'}</span>
          </div>
        </nav>

        <main className="min-h-screen overflow-auto p-6">
          {children}
        </main>
      </div>

      <FeatureTour initialOpen={!profile.hasSeenTour} name={profile.fullName} />
    </>
  )
}
