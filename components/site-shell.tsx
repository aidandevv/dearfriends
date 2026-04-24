import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/nav'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linen text-ink">
      <MarketingNav />
      {children}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p className="font-serif text-base text-ink">Dear Friends</p>
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-blue-ink">
            Open your dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </div>
  )
}
