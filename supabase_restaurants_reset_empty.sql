create extension if not exists pgcrypto;

create table if not exists public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text not null default '',
    map_link text not null default '',
    created_at timestamptz not null default now()
);

alter table public.restaurants alter column description set default '';
alter table public.restaurants alter column map_link set default '';

update public.restaurants
set
    description = coalesce(description, ''),
    map_link = coalesce(map_link, '');

alter table public.restaurants enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, delete on table public.restaurants to anon, authenticated;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
on public.restaurants
for select
to anon, authenticated
using (true);

drop policy if exists "Public can insert restaurants" on public.restaurants;
create policy "Public can insert restaurants"
on public.restaurants
for insert
to anon, authenticated
with check (
    char_length(trim(name)) between 2 and 40
    and coalesce(description, '') = ''
    and coalesce(map_link, '') = ''
);

drop policy if exists "Public can delete restaurants" on public.restaurants;
create policy "Public can delete restaurants"
on public.restaurants
for delete
to anon, authenticated
using (true);

delete from public.restaurants;
