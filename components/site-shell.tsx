import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/login', label: 'Login' },
]

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linen text-ink">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-linen/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-serif text-2xl text-ink transition-colors hover:text-terra">
            Dear Friends
          </Link>

          <nav className="flex items-center gap-2 text-sm text-ink-muted">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-terra">
            Open your dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </div>
  )
}
