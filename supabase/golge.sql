-- =====================================================================
-- Anonix · Supabase şeması (Aşama 5: Gölge — Fotoğraflı Anonim Paylaşım)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- Not: profiles + add_points/anonix_rank (Aşama 3) önceden kurulmuş olmalı.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Storage bucket: golge-media (public, 10MB, yalnızca görsel)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'golge-media', 'golge-media', true, 10485760,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Storage RLS: herkes okur; yalnızca giriş yapan kendi klasörüne yükler/siler
drop policy if exists "Gölge medya herkese okunur" on storage.objects;
create policy "Gölge medya herkese okunur"
  on storage.objects for select
  using (bucket_id = 'golge-media');

drop policy if exists "Gölge medya yükleme" on storage.objects;
create policy "Gölge medya yükleme"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'golge-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Gölge medya silme" on storage.objects;
create policy "Gölge medya silme"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'golge-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 2) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.golge_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  image_url     text not null,
  caption       text,
  overlay_text  text,
  overlay_style text,
  mood_tag      text,
  is_anonymous  boolean not null default true,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.golge_likes (
  id            uuid primary key default gen_random_uuid(),
  golge_post_id uuid not null references public.golge_posts (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (golge_post_id, user_id)
);

create table if not exists public.golge_comments (
  id            uuid primary key default gen_random_uuid(),
  golge_post_id uuid not null references public.golge_posts (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  content       text not null check (char_length(btrim(content)) > 0),
  created_at    timestamptz not null default now()
);

create index if not exists golge_posts_created_idx on public.golge_posts (created_at desc);
create index if not exists golge_likes_post_idx on public.golge_likes (golge_post_id);
create index if not exists golge_comments_post_idx on public.golge_comments (golge_post_id);

-- ---------------------------------------------------------------------
-- 3) Row Level Security
-- ---------------------------------------------------------------------
alter table public.golge_posts enable row level security;
alter table public.golge_likes enable row level security;
alter table public.golge_comments enable row level security;

-- golge_posts
drop policy if exists "Gölge paylaşımları herkese açık" on public.golge_posts;
create policy "Gölge paylaşımları herkese açık"
  on public.golge_posts for select using (true);

drop policy if exists "Giriş yapan gölge paylaşır" on public.golge_posts;
create policy "Giriş yapan gölge paylaşır"
  on public.golge_posts for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi gölgesini siler" on public.golge_posts;
create policy "Kullanıcı kendi gölgesini siler"
  on public.golge_posts for delete using (auth.uid() = user_id);

-- golge_likes
drop policy if exists "Gölge beğenileri herkese açık" on public.golge_likes;
create policy "Gölge beğenileri herkese açık"
  on public.golge_likes for select using (true);

drop policy if exists "Giriş yapan gölge beğenir" on public.golge_likes;
create policy "Giriş yapan gölge beğenir"
  on public.golge_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi gölge beğenisini kaldırır" on public.golge_likes;
create policy "Kullanıcı kendi gölge beğenisini kaldırır"
  on public.golge_likes for delete using (auth.uid() = user_id);

-- golge_comments
drop policy if exists "Gölge yorumları herkese açık" on public.golge_comments;
create policy "Gölge yorumları herkese açık"
  on public.golge_comments for select using (true);

drop policy if exists "Giriş yapan gölge yorumlar" on public.golge_comments;
create policy "Giriş yapan gölge yorumlar"
  on public.golge_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi gölge yorumunu siler" on public.golge_comments;
create policy "Kullanıcı kendi gölge yorumunu siler"
  on public.golge_comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4) Temel rate limit: dakikada en fazla 5 gölge paylaşımı
-- ---------------------------------------------------------------------
create or replace function public.golge_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt integer;
begin
  select count(*) into cnt
  from public.golge_posts
  where user_id = new.user_id
    and created_at > now() - interval '1 minute';
  if cnt >= 5 then
    raise exception 'Çok hızlı paylaşım yapıyorsunuz. Lütfen biraz bekleyin.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_golge_rate on public.golge_posts;
create trigger trg_golge_rate
  before insert on public.golge_posts
  for each row execute function public.golge_rate_limit();

-- ---------------------------------------------------------------------
-- 5) Puan trigger'ları (add_points + anonix_rank Aşama 3'ten gelir)
--    Gölge paylaşımı +200, beğeni +8, yorum +4
-- ---------------------------------------------------------------------
create or replace function public.on_golge_post_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_points(new.user_id, 200);
  return new;
end;
$$;
drop trigger if exists trg_golge_post_insert on public.golge_posts;
create trigger trg_golge_post_insert
  after insert on public.golge_posts
  for each row execute function public.on_golge_post_insert();

create or replace function public.on_golge_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts
  set like_count = like_count + 1, updated_at = now()
  where id = new.golge_post_id
  returning user_id into author;
  if author is not null then perform public.add_points(author, 8); end if;
  return new;
end;
$$;
drop trigger if exists trg_golge_like_insert on public.golge_likes;
create trigger trg_golge_like_insert
  after insert on public.golge_likes
  for each row execute function public.on_golge_like_insert();

create or replace function public.on_golge_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts
  set like_count = greatest(0, like_count - 1), updated_at = now()
  where id = old.golge_post_id
  returning user_id into author;
  if author is not null then perform public.add_points(author, -8); end if;
  return old;
end;
$$;
drop trigger if exists trg_golge_like_delete on public.golge_likes;
create trigger trg_golge_like_delete
  after delete on public.golge_likes
  for each row execute function public.on_golge_like_delete();

create or replace function public.on_golge_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.golge_posts
  set comment_count = comment_count + 1, updated_at = now()
  where id = new.golge_post_id
  returning user_id into author;
  if author is not null then perform public.add_points(author, 4); end if;
  return new;
end;
$$;
drop trigger if exists trg_golge_comment_insert on public.golge_comments;
create trigger trg_golge_comment_insert
  after insert on public.golge_comments
  for each row execute function public.on_golge_comment_insert();
