-- =====================================================================
-- Anonix · Supabase şeması (Aşama 2: Authentication & Profiles)
-- Bu dosyayı Supabase panelinde: SQL Editor > New query içine yapıştırıp
-- çalıştırın. Tüm komutlar tekrar çalıştırmaya karşı güvenlidir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles tablosu
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique not null,
  gender        text not null default 'other'
                  check (gender in ('male', 'female', 'other')),
  avatar_url    text,
  is_anonymous  boolean not null default true,
  is_plus       boolean not null default false,
  points        integer not null default 0,
  rank          text not null default 'Sessiz Ruh',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Herkes (giriş yapmış/yapmamış) profilleri okuyabilir.
drop policy if exists "Profiller herkese açık (okuma)" on public.profiles;
create policy "Profiller herkese açık (okuma)"
  on public.profiles
  for select
  using (true);

-- Kullanıcı yalnızca kendi profilini oluşturabilir.
drop policy if exists "Kullanıcı kendi profilini oluşturur" on public.profiles;
create policy "Kullanıcı kendi profilini oluşturur"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Kullanıcı yalnızca kendi profilini güncelleyebilir.
drop policy if exists "Kullanıcı kendi profilini günceller" on public.profiles;
create policy "Kullanıcı kendi profilini günceller"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 3) updated_at otomatik güncelleme trigger'ı
-- ---------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ---------------------------------------------------------------------
-- 4) Yeni kullanıcı kaydında profili otomatik oluştur
--    (auth.signUp sırasında gönderilen user_metadata'dan okur)
--    security definer: RLS'i atlayarak güvenli şekilde insert yapar.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, gender, is_anonymous)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'kullanici_' || substr(new.id::text, 1, 8)
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'gender', ''), 'other'),
    coalesce((new.raw_user_meta_data ->> 'is_anonymous')::boolean, true)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5) Performans için index
-- ---------------------------------------------------------------------
create index if not exists profiles_username_idx on public.profiles (username);
