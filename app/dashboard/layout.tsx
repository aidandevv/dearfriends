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

  return (
    <>
      <div className="min-h-screen bg-linen grid grid-cols-[68px_minmax(0,1fr)]">
        <nav className="flex w-[68px] flex-shrink-0 flex-col items-center border-r border-border/60 bg-sidebar py-5 min-h-screen">
          <div className="flex flex-1 flex-col items-center gap-1 w-full">
            {/* Wordmark */}
            <span
              className="mb-5 font-serif text-[10px] font-bold uppercase tracking-[0.18em] text-blue-ink"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              DF
            </span>

            {navItems.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label}>
                <Icon size={18} />
              </NavLink>
            ))}
          </div>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-ink to-border" />
        </nav>

        <main className="min-h-screen overflow-auto p-5">
          {children}
        </main>
      </div>

      <FeatureTour initialOpen={!profile.hasSeenTour} name={profile.fullName} />
    </>
  )
}
