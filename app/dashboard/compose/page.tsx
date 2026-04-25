import { Suspense } from 'react'
import { LetterComposer } from '@/components/letter-composer'
import { GroupFilter } from '@/components/group-filter'
import { getDraft, getRandomContact } from '@/lib/actions/letter'
import { getGroups, getContactsByGroup } from '@/lib/actions/groups'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null

  const [draft, groups, groupContacts] = await Promise.all([
    getDraft(),
    getGroups(),
    getContactsByGroup(groupId),
  ])

  const contact = groupContacts.length > 0
    ? groupContacts[Math.floor(Math.random() * groupContacts.length)]
    : await getRandomContact()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-6 py-5">
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

      <LetterComposer initialSubject={draft.subject} initialBody={draft.body} previewContact={contact} />
    </div>
  )
}
