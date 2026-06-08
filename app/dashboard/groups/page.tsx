import { getGroups } from '@/lib/actions/groups'
import { GroupsManager } from '@/components/groups-manager'

export default async function GroupsPage() {
  const groups = await getGroups()

  return (
    <div className="space-y-5 p-6">
      <section className="surface-panel px-6 py-5">
        <p className="eyebrow">However you think of them</p>
        <h1 className="dash-title">Groups</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
          Family, old roommates, the people from that one summer. Turn on birthday reminders for any group you want to stay close to.
        </p>
      </section>
      <section className="surface-panel px-6 py-5">
        <GroupsManager initialGroups={groups} />
      </section>
    </div>
  )
}
