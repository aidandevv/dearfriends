-- Allow contacts to store geocoded coordinates for the globe view.
-- Nullable: contacts submitted before geocoding was added have no coords.
alter table public.contacts add column if not exists lat double precision;
alter table public.contacts add column if not exists lng double precision;
