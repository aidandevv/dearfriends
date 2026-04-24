import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingNav } from '@/components/marketing/landing-nav'

const newsreader = "var(--font-ppwriter), Georgia, serif"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <LandingNav />
      {children}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p style={{ fontFamily: newsreader, fontSize: 16, fontStyle: 'italic', color: '#1d2442' }}>
            dearfriends
          </p>
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-blue-ink">
            Open your dashboard →
          </Link>
        </div>
      </footer>
    </div>
  )
}
