-- =====================================================================
-- Anonix · Takip sistemi (follows tablosu)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- follows tablosu: bir kullanıcı (follower) başka birini (following) takip eder
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Hızlı sorgular için indeksler
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------
-- RLS: takipler herkese görünür; kullanıcı yalnızca kendi takiplerini yönetir
-- ---------------------------------------------------------------------
alter table public.follows enable row level security;

drop policy if exists "Takipler herkese görünür" on public.follows;
create policy "Takipler herkese görünür"
  on public.follows for select
  using (true);

drop policy if exists "Kullanıcı kendi takibini ekler" on public.follows;
create policy "Kullanıcı kendi takibini ekler"
  on public.follows for insert
  with check (auth.uid() = follower_id and not public.is_banned());

drop policy if exists "Kullanıcı kendi takibini siler" on public.follows;
create policy "Kullanıcı kendi takibini siler"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------
-- Bildirim: biri seni takip edince (security definer)
-- Kimlik gizli tutulur; mesaj geneldir (anonimlik korunur).
-- ---------------------------------------------------------------------
create or replace function public.s_follow_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message)
  values (new.following_id, new.follower_id, 'follow', 'profile', new.follower_id,
    'Yeni bir takipçin var 👤');
  return new;
end;
$$;
drop trigger if exists trg_follow_notify on public.follows;
create trigger trg_follow_notify after insert on public.follows
  for each row execute function public.s_follow_notify();
