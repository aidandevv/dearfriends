-- Verification links are handled by server actions with explicit token checks.
-- Anonymous clients should not be able to update contacts directly via RLS.

drop policy if exists "public_verify_update" on public.contacts;
