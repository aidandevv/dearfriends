'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Group = { id: string; name: string }

export function GroupFilter({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('group') ?? 'all'

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('group')
    else params.set('group', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[{ id: 'all', name: 'All contacts' }, ...groups].map(g => (
        <button
          key={g.id}
          onClick={() => select(g.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            current === g.id
              ? 'bg-periwinkle text-white'
              : 'border border-border/80 bg-surface-raised text-ink-muted hover:text-ink'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
