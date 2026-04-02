create table if not exists public.ownership_signals (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('concern', 'recognition')),
  title text not null,
  details text not null,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ownership_signals enable row level security;

create policy "allow insert signals"
on public.ownership_signals
for insert
to anon, authenticated
with check (true);

create policy "allow read signals"
on public.ownership_signals
for select
to anon, authenticated
using (true);
