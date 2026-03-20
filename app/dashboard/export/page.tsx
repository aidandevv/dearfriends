import { Suspense } from 'react'
import { ExportPanel } from '@/components/export-panel'
import { GroupFilter } from '@/components/group-filter'
import { getGroups } from '@/lib/actions/groups'

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null
  const groups = await getGroups()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <h1 className="font-serif text-4xl text-ink">Export &amp; send</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          Choose the format that matches how each person should hear from you, from printed letters to digital sends.
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
