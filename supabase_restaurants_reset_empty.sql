drop table if exists public.restaurants cascade;

create extension if not exists pgcrypto;

create table public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text not null default '',
    map_link text not null default '',
    created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, delete on table public.restaurants to anon, authenticated;

alter table public.restaurants enable row level security;

create policy "Public can read restaurants"
on public.restaurants
for select
to anon, authenticated
using (true);

create policy "Public can insert restaurants"
on public.restaurants
for insert
to anon, authenticated
with check (
    char_length(trim(name)) between 2 and 40
    and description = ''
    and map_link = ''
);

create policy "Public can delete restaurants"
on public.restaurants
for delete
to anon, authenticated
using (true);
