import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

describe('share slug server action boundary', () => {
  it('does not export a user-id accepting share slug generator as a server action', () => {
    const actions = readFileSync('lib/actions/user.ts', 'utf8')
    expect(actions).toContain('export async function generateShareSlug(): Promise<string>')
    expect(actions).not.toContain('export async function generateShareSlug(userId')
    expect(actions).not.toContain('updateUserById(resolvedId')
  })

  it('keeps privileged user-id slug generation in a non-action helper module', () => {
    const helper = readFileSync('lib/share-slugs.ts', 'utf8')
    expect(helper).toContain('export async function generateShareSlugForUser(userId: string)')
    expect(helper).toContain('updateUserById(userId')
  })
})
