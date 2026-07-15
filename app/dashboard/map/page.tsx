import { FullMapPanel } from '@/components/full-map-panel'
import { getContacts } from '@/lib/actions/contacts'

export default async function DashboardMapPage() {
  const contacts = await getContacts()
  const mappableContacts = contacts.map(contact => ({
    id: contact.id,
    first_name: contact.first_name,
    city: contact.city,
    state: contact.state,
    lat: contact.lat,
    lng: contact.lng,
  }))

  return (
    <div className="dashboard-page-pad app-page-stack">
      <section className="app-page-header">
        <p className="eyebrow">Where your people live</p>
        <h1 className="dash-title">Friend map</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          A living view of the cities your letters are headed toward. Select a dot or use the contact list below the map.
        </p>
      </section>

      <section className="surface-panel px-6 py-5">
        <FullMapPanel contacts={mappableContacts} />
      </section>
    </div>
  )
}
