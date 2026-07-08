alter table public.orders
  add column if not exists flight_details text;
