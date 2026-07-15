import { Suspense } from 'react'
import { LetterComposer } from '@/components/letter-composer'
import { GroupFilter } from '@/components/group-filter'
import { getDraft } from '@/lib/actions/letter'
import { getGroups, getContactsByGroup } from '@/lib/actions/groups'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null

  const [draft, groups, groupContacts] = await Promise.all([
    getDraft(),
    getGroups(),
    getContactsByGroup(groupId),
  ])

  const previewContacts = groupContacts.length > 0
    ? groupContacts
        .map(contact => ({ first_name: contact.first_name, last_name: contact.last_name }))
        .sort((a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`))
    : [{ first_name: 'Jane', last_name: 'Smith' }]

  return (
    <div className="app-page-stack">
      <section className="app-page-header">
        <p className="eyebrow">Writing desk</p>
        <h1 className="dash-title">Compose your letter</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">
          Draft once, personalize with merge tags, and check the live preview before you export or send.
        </p>
        {groups.length > 0 && (
          <div className="mt-4">
            <Suspense>
              <GroupFilter groups={groups} />
            </Suspense>
          </div>
        )}
      </section>

      <LetterComposer initialSubject={draft.subject} initialBody={draft.body} previewContacts={previewContacts} />
    </div>
  )
}
