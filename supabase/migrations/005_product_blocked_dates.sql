-- Admin-blocked dates per product (calendar unavailable slots).
-- Multiple customers can book the same date unless it is listed here.

alter table public.products
  add column if not exists blocked_dates jsonb not null default '[]'::jsonb;
