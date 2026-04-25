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
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-blue-ink text-white shadow-sm'
          : 'text-ink-muted hover:bg-blue-ink/8 hover:text-ink'
      }`}
      style={isActive ? {
        boxShadow: '0 2px 0 0 #0e1230, 0 3px 10px -2px rgba(51,88,186,.3)',
      } : undefined}
    >
      <span className="flex-shrink-0">{children}</span>
      <span>{label}</span>
    </Link>
  )
}
