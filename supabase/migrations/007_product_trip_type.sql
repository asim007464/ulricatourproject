alter table public.products
  add column if not exists trip_type text not null default 'one_way'
  check (trip_type in ('one_way', 'round_trip'));

update public.products
set trip_type = 'round_trip'
where category = 'taxi' and slug like '%round-trip%';

update public.products
set trip_type = 'round_trip'
where category = 'tour';
