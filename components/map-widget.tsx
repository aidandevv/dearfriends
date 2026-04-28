'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

const ContactMap = dynamic(
  () => import('@/components/contact-map').then(mod => mod.ContactMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] animate-pulse rounded-[1.2rem] border border-border/80 bg-sidebar/40" />
    ),
  },
)

type MapWidgetProps = {
  contacts: Array<{
    id: string
    first_name: string
    city: string | null
    state: string | null
    lat?: number | null
    lng?: number | null
  }>
}

export function MapWidget({ contacts }: MapWidgetProps) {
  return (
    <Link href="/dashboard/map" className="group block">
      <section className="surface-panel hover-lift px-5 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Your friends, worldwide</p>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-ink-muted">
              See where your letter list stretches, then open the full map to explore it.
            </p>
          </div>
        </div>

        <div className="mt-4 pointer-events-none">
          <ContactMap contacts={contacts} interactive={false} heightClassName="h-[250px]" />
        </div>

        <p className="mt-4 text-sm font-medium text-blue-ink transition-colors group-hover:text-blue-mid">
          Click to explore full map →
        </p>
      </section>
    </Link>
  )
}
