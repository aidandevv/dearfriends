'use client'

import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'
import { signOut } from '@/lib/actions/user'

type DashboardUserMenuProps = {
  initials: string
  fullName: string | null
  email: string | null
}

export function DashboardUserMenu({ initials, fullName, email }: DashboardUserMenuProps) {
  return (
    <div
      className="dashboard-user-menu"
      style={{
        borderRadius: 10,
        border: '1px solid var(--line)',
        background: 'rgba(255,255,255,0.72)',
        overflow: 'hidden',
      }}
    >
      <Link
        href="/dashboard/settings"
        className="dashboard-user-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          textDecoration: 'none',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--periwinkle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontSize: 14,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
            {fullName ?? 'Your profile'}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {email}
          </div>
        </div>
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px' }}>
        <Link
          href="/dashboard/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-soft)',
            textDecoration: 'none',
          }}
        >
          <Settings size={15} />
          Settings
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={15} />
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
