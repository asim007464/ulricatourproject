create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  subject text,
  message text,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

alter table public.contact_messages enable row level security;

drop policy if exists "Authenticated users manage contact messages" on public.contact_messages;
create policy "Authenticated users manage contact messages"
  on public.contact_messages for all
  to authenticated
  using (true)
  with check (true);
