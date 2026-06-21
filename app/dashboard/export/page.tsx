import { Suspense } from 'react'
import { ExportPanel } from '@/components/export-panel'
import { GroupFilter } from '@/components/group-filter'
import { getGroups } from '@/lib/actions/groups'

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null
  const groups = await getGroups()

  return (
    <div className="app-page-stack">
      <section className="app-page-header">
        <p className="eyebrow">Sending</p>
        <h1 className="dash-title">Export &amp; send</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">
          Export labels and letter PDFs for mail you send yourself, or email contacts marked digital. Dear Friends is your address book and composer — not a mailing service.
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
