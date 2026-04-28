-- Allow contacts to store geocoded coordinates for the globe view.
-- Nullable: contacts submitted before geocoding was added have no coords.
alter table contacts add column lat double precision;
alter table contacts add column lng double precision;
