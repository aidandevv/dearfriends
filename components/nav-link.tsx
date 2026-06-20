'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function NavLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 14.5,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'background 0.15s ease, color 0.15s ease',
        ...(isActive ? {
          background: 'var(--periwinkle)',
          color: 'var(--paper)',
          boxShadow: '0 2px 0 0 #1e2b66, 0 6px 16px -6px rgba(74,108,212,.45)',
        } : {
          color: 'var(--ink-soft)',
        }),
      }}
      onMouseOver={e => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--paper-2)'
          ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'
        }
      }}
      onMouseOut={e => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = ''
          ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-soft)'
        }
      }}
    >
      <span style={{
        flexShrink: 0,
        color: isActive ? 'white' : 'var(--blue-slate)',
        display: 'flex',
      }}>
        {children}
      </span>
      <span>{label}</span>
    </Link>
  )
}
