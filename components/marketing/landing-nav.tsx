'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const links = [
  { href: '#how', label: 'How it works' },
  { href: '#friends', label: 'Your people' },
  { href: '#reminders', label: 'Reminders' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        background: scrolled ? 'rgba(248, 249, 251, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
        <Link href="/" className="group flex items-center gap-2.5 no-underline">
          {/* Stamp mark */}
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-dashed border-peach/70 transition-colors group-hover:border-peach"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-peach" />
          </span>
          <span className="font-serif text-[21px] tracking-tight text-ink">
            <em className="font-medium italic">dear</em>
            <span className="font-medium">friends</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 text-[14px] text-ink-soft md:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a href={href} className="transition-colors hover:text-periwinkle">
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/login"
            className="text-[13px] font-medium text-ink-soft transition-colors hover:text-periwinkle sm:text-[14px]"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-periwinkle px-[18px] py-[9px] text-[14px] font-medium text-white shadow-[0_4px_14px_-4px_rgba(74,108,212,0.5)] transition-all hover:bg-periwinkle-deep hover:shadow-[0_6px_18px_-4px_rgba(74,108,212,0.55)]"
          >
            Start your list
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </nav>
    </header>
  )
}
