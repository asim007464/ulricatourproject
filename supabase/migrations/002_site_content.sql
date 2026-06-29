-- Additive migration for existing Supabase projects

alter table public.products
  add column if not exists body_html text;

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

alter table public.site_pages enable row level security;

drop policy if exists "Public can read site pages" on public.site_pages;
create policy "Public can read site pages"
  on public.site_pages for select
  using (true);

drop policy if exists "Authenticated users manage site pages" on public.site_pages;
create policy "Authenticated users manage site pages"
  on public.site_pages for all
  to authenticated
  using (true)
  with check (true);

drop trigger if exists site_pages_updated_at on public.site_pages;
create trigger site_pages_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();
