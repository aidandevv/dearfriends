import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingNav } from '@/components/marketing/landing-nav'
import { PostalLineArt } from '@/components/ui/postal-line-art'

const newsreader = "var(--font-ppwriter), Georgia, serif"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="postal-page text-ink">
      <LandingNav />
      <PostalLineArt
        variant="full"
        className="postal-art-fixed -right-40 top-20 z-0 h-[68vh] w-[86vw]"
      />
      <div className="postal-page-content">{children}</div>
      <footer className="postal-page-content border-t border-dashed border-line bg-porcelain/75">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p style={{ fontFamily: newsreader, fontSize: 16, fontStyle: 'italic', color: 'var(--ink)' }}>
            dearfriends
          </p>
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-periwinkle">
            Open your dashboard →
          </Link>
        </div>
      </footer>
    </div>
  )
}
