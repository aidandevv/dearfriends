'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/60 bg-linen/95 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-2xl text-ink transition-colors hover:text-periwinkle">
          Dear Friends
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-linen transition-colors hover:bg-periwinkle"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
