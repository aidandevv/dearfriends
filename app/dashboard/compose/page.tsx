import { Suspense } from 'react'
import { LetterComposer } from '@/components/letter-composer'
import { GroupFilter } from '@/components/group-filter'
import { getDraft, getRandomContact, listTemplates } from '@/lib/actions/letter'
import { getGroups, getContactsByGroup } from '@/lib/actions/groups'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null

  const [draft, groups, groupContacts, userTemplates] = await Promise.all([
    getDraft(),
    getGroups(),
    getContactsByGroup(groupId),
    listTemplates(),
  ])

  const contact =
    groupContacts.length > 0
      ? groupContacts[Math.floor(Math.random() * groupContacts.length)]
      : await getRandomContact()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <h1 className="font-serif text-4xl text-ink">Compose your letter</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
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

      <LetterComposer
        initialSubject={draft.subject}
        initialBody={draft.body}
        initialStyle={draft.style}
        userTemplates={userTemplates}
        previewContact={contact}
      />
    </div>
  )
}
