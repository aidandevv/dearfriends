import { createClient } from '@supabase/supabase-js'

const email = process.env.E2E_USER_EMAIL ?? 'e2e.owner@local.test'
const password = process.env.E2E_USER_PASSWORD ?? 'test-only-password-123'

function assertLocalSupabase(url: string) {
  const hostname = new URL(url).hostname
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error('Authenticated browser tests may only use a local Supabase instance.')
  }
}

export default async function globalSetup() {
  if (process.env.E2E_LOCAL_SUPABASE !== 'true') return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Local authenticated browser tests require Supabase URL and service-role credentials.')
  }

  assertLocalSupabase(url)
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError

  const existing = users.users.find(user => user.email === email)
  if (existing) {
    const { error } = await admin.auth.admin.deleteUser(existing.id)
    if (error) throw error
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Owner',
      has_seen_tour: true,
      share_slug: 'e2e-owner',
    },
  })
  if (createError || !created.user) throw createError ?? new Error('Could not create local E2E user.')

  const { error: contactError } = await admin.from('contacts').insert({
    admin_id: created.user.id,
    first_name: 'E2E',
    last_name: 'Contact',
    email: 'e2e.contact@local.test',
    address_line_1: '123 Test Way',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    delivery_method: 'digital',
  })
  if (contactError) throw contactError

  return async () => {
    const { error } = await admin.auth.admin.deleteUser(created.user.id)
    if (error) throw error
  }
}
