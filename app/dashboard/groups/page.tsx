import { getGroups } from '@/lib/actions/groups'
import { GroupsManager } from '@/components/groups-manager'

export default async function GroupsPage() {
  const groups = await getGroups()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <h1 className="font-serif text-4xl text-ink">Manage groups</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
          Organize contacts into relationship groups. Enable birthday tracking per group to get weekly reminders.
        </p>
      </section>
      <section className="surface-panel px-5 py-5">
        <GroupsManager initialGroups={groups} />
      </section>
    </div>
  )
}
