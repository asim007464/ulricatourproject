-- Run this in Supabase Dashboard → SQL Editor

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  wordpress_id text,
  title text not null,
  category text not null check (category in ('tour', 'taxi')),
  base_price numeric not null default 0,
  base_pax_limit int not null default 4,
  extra_surcharge numeric not null default 0,
  max_seats int not null default 6,
  min_pax int not null default 1,
  duration_days int not null default 1,
  rental_type text not null default 'tour',
  description text,
  body_html text,
  image_url text,
  locations jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  product_title text not null,
  order_type text not null check (order_type in ('paid', 'request', 'pending')),
  status text not null default 'pending',
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_message text,
  pickup_date text not null,
  dropoff_date text not null,
  guests int not null default 1,
  departure_location text,
  amount numeric,
  currency text not null default 'USD',
  paypal_order_id text,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists products_slug_idx on public.products (slug);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  hero_title text,
  hero_description text,
  body_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_pages_slug_idx on public.site_pages (slug);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.site_pages enable row level security;

create policy "Public can read active products"
  on public.products for select
  using (active = true);

create policy "Authenticated users manage products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users read orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "Authenticated users update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Public can read site pages"
  on public.site_pages for select
  using (true);

create policy "Authenticated users manage site pages"
  on public.site_pages for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists site_pages_updated_at on public.site_pages;
create trigger site_pages_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();
