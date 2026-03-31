create extension if not exists pgcrypto;

create table if not exists public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text not null,
    map_link text not null,
    created_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
on public.restaurants
for select
using (true);

drop policy if exists "Public can insert restaurants" on public.restaurants;
create policy "Public can insert restaurants"
on public.restaurants
for insert
with check (
    char_length(trim(name)) between 2 and 40
    and char_length(trim(description)) between 5 and 180
    and char_length(trim(map_link)) between 8 and 400
    and map_link like 'http%'
);

insert into public.restaurants (name, description, map_link)
values
    ('장군집', '가성비 최고! 연탄불에 구워먹는 쫄깃한 돼지 부속고기와 시원한 소주 한 잔 🍶', 'https://map.naver.com/p/search/광명%20장군집'),
    ('대송참숯', '입에서 살살 녹는 투뿔 한우! 프라이빗하고 고급스러운 분위기에서 제대로 된 식사를 ✨', 'https://map.naver.com/p/search/대송참숯'),
    ('마포옥', '미쉐린 가이드 선정! 맑고 깊은 국물의 한우 양지 설렁탕으로 몸보신 제대로 🥣', 'https://map.naver.com/p/search/마포옥'),
    ('맛찬들', '전문가가 구워주는 겉바속촉 끝판왕! 두툼한 숙성 돼지고기의 진수를 맛보세요 🥩', 'https://map.naver.com/p/search/철산%20맛찬들'),
    ('유일순대', '은은한 인삼 향이 매력적인, 늘 웨이팅이 끊이지 않는 지역 찐 순대국 맛집 🥘', 'https://map.naver.com/p/search/광명%20유일순대')
on conflict (name) do nothing;

