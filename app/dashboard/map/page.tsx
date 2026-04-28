import { FullMapPanel } from '@/components/full-map-panel'
import { getContacts } from '@/lib/actions/contacts'

export default async function DashboardMapPage() {
  const contacts = await getContacts()
  const mappableContacts = contacts.map(contact => ({
    id: contact.id,
    first_name: contact.first_name,
    city: contact.city,
    state: contact.state,
    lat: (contact as { lat?: number | null }).lat ?? null,
    lng: (contact as { lng?: number | null }).lng ?? null,
  }))

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <h1 className="font-serif text-4xl text-ink">Friend map</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          A living view of the cities your letters are headed toward. Hover over a dot to see who&apos;s there.
        </p>
      </section>

      <section className="surface-panel px-5 py-5">
        <FullMapPanel contacts={mappableContacts} />
      </section>
    </div>
  )
}
