'use client'

import dynamic from 'next/dynamic'

const ContactMap = dynamic(
  () => import('@/components/contact-map').then(mod => mod.ContactMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] animate-pulse rounded-[1.5rem] border border-border/80 bg-sidebar/40" />
    ),
  },
)

type FullMapPanelProps = {
  contacts: Array<{
    id: string
    first_name: string
    city: string | null
    state: string | null
    lat?: number | null
    lng?: number | null
  }>
}

export function FullMapPanel({ contacts }: FullMapPanelProps) {
  return <ContactMap contacts={contacts} interactive heightClassName="h-[70vh]" />
}
