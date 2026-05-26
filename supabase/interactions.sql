-- =====================================================================
-- Anonix · Kişiselleştirme: user_interactions tablosu
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: profiles, is_admin().
-- =====================================================================

create table if not exists public.user_interactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  entity_type      text not null,                 -- 'confession' | 'golge' ...
  entity_id        uuid not null,
  mood_tag         text,
  interaction_type text not null,                 -- view | like | comment | follow | share
  weight           integer not null default 1,    -- view:1 like:3 comment:5 follow:8 share:10
  created_at       timestamptz not null default now()
);

-- İndeksler
create index if not exists user_interactions_user_idx on public.user_interactions (user_id);
create index if not exists user_interactions_mood_idx on public.user_interactions (mood_tag);
create index if not exists user_interactions_entity_idx on public.user_interactions (entity_type);
create index if not exists confessions_mood_idx on public.confessions (mood_tag);

-- RLS: kullanıcı yalnızca kendi kayıtlarını görür/oluşturur; admin hepsini görür
alter table public.user_interactions enable row level security;

drop policy if exists "Kullanıcı kendi etkileşimlerini görür" on public.user_interactions;
create policy "Kullanıcı kendi etkileşimlerini görür"
  on public.user_interactions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Kullanıcı kendi etkileşimini ekler" on public.user_interactions;
create policy "Kullanıcı kendi etkileşimini ekler"
  on public.user_interactions for insert
  with check (auth.uid() = user_id);
