-- =====================================================================
-- Anonix · Supabase şeması (Aşama 3: İtiraflar, Beğeni, Yorum, Puan)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- Not: profiles tablosu (Aşama 2) önceden kurulmuş olmalıdır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.confessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  content       text not null,
  mood_tag      text,
  is_anonymous  boolean not null default true,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.confession_likes (
  id            uuid primary key default gen_random_uuid(),
  confession_id uuid not null references public.confessions (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (confession_id, user_id)
);

create table if not exists public.confession_comments (
  id            uuid primary key default gen_random_uuid(),
  confession_id uuid not null references public.confessions (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  content       text not null,
  is_anonymous  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists confessions_created_at_idx on public.confessions (created_at desc);
create index if not exists confession_likes_confession_idx on public.confession_likes (confession_id);
create index if not exists confession_comments_confession_idx on public.confession_comments (confession_id);

-- ---------------------------------------------------------------------
-- 2) Row Level Security
-- ---------------------------------------------------------------------
alter table public.confessions enable row level security;
alter table public.confession_likes enable row level security;
alter table public.confession_comments enable row level security;

-- confessions
drop policy if exists "İtiraflar herkese açık" on public.confessions;
create policy "İtiraflar herkese açık"
  on public.confessions for select using (true);

drop policy if exists "Giriş yapan itiraf paylaşır" on public.confessions;
create policy "Giriş yapan itiraf paylaşır"
  on public.confessions for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi itirafını siler" on public.confessions;
create policy "Kullanıcı kendi itirafını siler"
  on public.confessions for delete using (auth.uid() = user_id);

-- confession_likes
drop policy if exists "Beğeniler herkese açık" on public.confession_likes;
create policy "Beğeniler herkese açık"
  on public.confession_likes for select using (true);

drop policy if exists "Giriş yapan beğeni ekler" on public.confession_likes;
create policy "Giriş yapan beğeni ekler"
  on public.confession_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi beğenisini kaldırır" on public.confession_likes;
create policy "Kullanıcı kendi beğenisini kaldırır"
  on public.confession_likes for delete using (auth.uid() = user_id);

-- confession_comments
drop policy if exists "Yorumlar herkese açık" on public.confession_comments;
create policy "Yorumlar herkese açık"
  on public.confession_comments for select using (true);

drop policy if exists "Giriş yapan yorum yapar" on public.confession_comments;
create policy "Giriş yapan yorum yapar"
  on public.confession_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı kendi yorumunu siler" on public.confession_comments;
create policy "Kullanıcı kendi yorumunu siler"
  on public.confession_comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) Rütbe hesaplama + puan ekleme yardımcıları
-- ---------------------------------------------------------------------
create or replace function public.anonix_rank(p integer)
returns text language sql immutable as $$
  select case
    when p >= 100000 then 'İtiraf Kralı'
    when p >= 50000  then 'Anonim Efsane'
    when p >= 15000  then 'Karanlık Kalem'
    when p >= 5000   then 'Gece İtirafçısı'
    when p >= 1000   then 'Gizli Yazar'
    else                  'Sessiz Ruh'
  end;
$$;

-- Puanı güvenli (RLS'i atlayarak) ekler ve rütbeyi otomatik günceller.
create or replace function public.add_points(target uuid, delta integer)
returns void language plpgsql security definer set search_path = public as $$
declare new_points integer;
begin
  update public.profiles
  set points = greatest(0, points + delta)
  where id = target
  returning points into new_points;

  if new_points is not null then
    update public.profiles
    set rank = public.anonix_rank(new_points), updated_at = now()
    where id = target;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Trigger'lar: puan + sayaç güncelleme (security definer)
-- ---------------------------------------------------------------------

-- İtiraf paylaşınca sahibine +150 puan
create or replace function public.on_confession_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_points(new.user_id, 150);
  return new;
end;
$$;

drop trigger if exists trg_confession_insert on public.confessions;
create trigger trg_confession_insert
  after insert on public.confessions
  for each row execute function public.on_confession_insert();

-- Beğeni eklenince: like_count +1, itiraf sahibine +6 puan
create or replace function public.on_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions
  set like_count = like_count + 1, updated_at = now()
  where id = new.confession_id
  returning user_id into author;

  if author is not null then perform public.add_points(author, 6); end if;
  return new;
end;
$$;

drop trigger if exists trg_like_insert on public.confession_likes;
create trigger trg_like_insert
  after insert on public.confession_likes
  for each row execute function public.on_like_insert();

-- Beğeni kaldırılınca: like_count -1, itiraf sahibinden -6 puan
create or replace function public.on_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions
  set like_count = greatest(0, like_count - 1), updated_at = now()
  where id = old.confession_id
  returning user_id into author;

  if author is not null then perform public.add_points(author, -6); end if;
  return old;
end;
$$;

drop trigger if exists trg_like_delete on public.confession_likes;
create trigger trg_like_delete
  after delete on public.confession_likes
  for each row execute function public.on_like_delete();

-- Yorum eklenince: comment_count +1, itiraf sahibine +3 puan
create or replace function public.on_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.confessions
  set comment_count = comment_count + 1, updated_at = now()
  where id = new.confession_id
  returning user_id into author;

  if author is not null then perform public.add_points(author, 3); end if;
  return new;
end;
$$;

drop trigger if exists trg_comment_insert on public.confession_comments;
create trigger trg_comment_insert
  after insert on public.confession_comments
  for each row execute function public.on_comment_insert();
