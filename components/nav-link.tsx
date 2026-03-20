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
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        isActive
          ? 'bg-terra text-white'
          : 'text-ink-muted hover:bg-terra/10 hover:text-terra'
      }`}
    >
      {children}
    </Link>
  )
}
