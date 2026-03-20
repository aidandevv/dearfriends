'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'

export function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: ComponentType<{ size?: number | string }>
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
      <Icon size={18} />
    </Link>
  )
}
