'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const ink = '#1d2442'
const paper = '#faf4e4'
const blueInk = '#3358ba'
const line = '#d9cfb0'
const newsreader = "var(--font-newsreader), Georgia, serif"

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
        borderBottom: scrolled ? `1px solid ${line}` : '1px solid transparent',
        background: scrolled ? `${paper}f2` : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        maxWidth: 1280, margin: '0 auto',
      }}>
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'baseline', gap: 2,
            fontFamily: newsreader,
            fontSize: 22, letterSpacing: '-0.02em',
            color: ink, textDecoration: 'none',
          }}
        >
          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>dear</span>
          <span style={{ fontWeight: 500 }}>friends</span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: blueInk,
            margin: '0 8px 3px',
            display: 'inline-block',
            alignSelf: 'center',
          }} />
        </Link>

        <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0, fontSize: 14.5, color: '#3a4263' }}
          className="hidden md:flex"
        >
          {[
            { href: '#how', label: 'How it works' },
            { href: '#friends', label: 'Your people' },
            { href: '#letters', label: 'Letters' },
            { href: '#pricing', label: 'Pricing' },
          ].map(({ href, label }) => (
            <li key={href}>
              <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}
                className="hover:text-blue-600 transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px',
            background: ink,
            color: paper,
            borderRadius: 999,
            fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          className="hover:bg-[#3358ba] transition-colors"
        >
          Start writing
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>
    </header>
  )
}
