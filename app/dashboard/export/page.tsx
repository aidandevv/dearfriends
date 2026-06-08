import { Suspense } from 'react'
import { ExportPanel } from '@/components/export-panel'
import { GroupFilter } from '@/components/group-filter'
import { getGroups } from '@/lib/actions/groups'

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null
  const groups = await getGroups()

  return (
    <div className="space-y-5 p-6">
      <section className="surface-panel px-6 py-5">
        <p className="eyebrow">Getting it out the door</p>
        <h1 className="dash-title">Export &amp; send</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">
          Print it yourself, or let me stamp and mail it. Pick whatever fits how each person should hear from you.
        </p>
        {groups.length > 0 && (
          <div className="mt-4">
            <Suspense>
              <GroupFilter groups={groups} />
            </Suspense>
          </div>
        )}
      </section>

      <ExportPanel groupId={groupId} />
    </div>
  )
}
