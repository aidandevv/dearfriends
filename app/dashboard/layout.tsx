import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Link2, PenLine, Send, Settings, Users } from 'lucide-react'
import { FeatureTour } from '@/components/feature-tour'
import { ShareLinkActions } from '@/components/share-link-actions'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const navItems = [
  { href: '/dashboard', label: 'Contacts', icon: Users },
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

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`

  return (
    <>
      <div className="min-h-screen bg-linen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <nav className="border-b border-border/60 bg-sidebar/95 px-4 py-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <div className="lg:sticky lg:top-5 lg:flex lg:flex-col lg:gap-4">
            <div className="mb-4 px-2 lg:mb-2">
              <p className="font-serif text-2xl text-ink">Dear Friends</p>
              <p className="mt-1 text-sm text-ink-muted">
                {profile.firstName ? `Welcome back, ${profile.firstName}.` : 'A warmer way to keep your mailing list in order.'}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="surface-panel flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-terra/50 hover:bg-linen"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terra/10 text-terra">
                    <Icon size={17} />
                  </span>
                  {label}
                </Link>
              ))}
            </div>

            <div className="surface-panel mt-4 p-4 lg:mt-auto">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
                <Link2 size={12} />
                {profile.firstName ? `${profile.firstName}'s share link` : 'Share link'}
              </p>
              <p className="mt-2 break-all text-xs leading-5 text-ink-muted">{shareUrl}</p>
              <ShareLinkActions url={shareUrl} />
            </div>
          </div>
        </nav>

        <main className="p-4 lg:p-5">
          <div className="min-h-full rounded-[1.75rem] border border-border/70 bg-surface-raised p-4 shadow-sm lg:p-5">
            {children}
          </div>
        </main>
      </div>

      <FeatureTour initialOpen={!profile.hasSeenTour} name={profile.fullName} />
    </>
  )
}
