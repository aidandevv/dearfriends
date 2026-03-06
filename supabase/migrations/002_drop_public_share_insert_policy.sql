-- The share form writes through a server action using the service role key,
-- so anonymous clients do not need direct INSERT access on contacts.
-- The original policy referenced auth.users, which causes
-- "permission denied for table users" for non-privileged roles.

drop policy if exists "public_share_insert" on contacts;
