-- =====================================================================
-- Anonix · Supabase şeması (Aşama 7: Admin, Şikayet, Moderasyon)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles ek alanları
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists banned_reason text;

-- ---------------------------------------------------------------------
-- 2) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid references public.profiles (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  entity_type      text not null,
  entity_id        uuid not null,
  reason           text not null,
  description      text,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles (id),
  unique (reporter_id, entity_type, entity_id)
);

create table if not exists public.moderation_logs (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid references public.profiles (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  entity_type    text,
  entity_id      uuid,
  action         text not null,
  reason         text,
  created_at     timestamptz not null default now()
);

create table if not exists public.banned_words (
  id         uuid primary key default gen_random_uuid(),
  word       text not null unique,
  severity   text not null default 'medium',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists moderation_logs_idx on public.moderation_logs (created_at desc);

-- ---------------------------------------------------------------------
-- 3) Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_banned()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_banned);
$$;

-- ---------------------------------------------------------------------
-- 4) RLS: yeni tablolar
-- ---------------------------------------------------------------------
alter table public.reports enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.banned_words enable row level security;

-- reports
drop policy if exists "Kullanıcı şikayet oluşturur" on public.reports;
create policy "Kullanıcı şikayet oluşturur"
  on public.reports for insert with check (auth.uid() = reporter_id);

drop policy if exists "Şikayetleri sahibi veya admin görür" on public.reports;
create policy "Şikayetleri sahibi veya admin görür"
  on public.reports for select using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "Admin şikayet günceller" on public.reports;
create policy "Admin şikayet günceller"
  on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- moderation_logs (yalnızca admin)
drop policy if exists "Admin logları görür" on public.moderation_logs;
create policy "Admin logları görür"
  on public.moderation_logs for select using (public.is_admin());

drop policy if exists "Admin log ekler" on public.moderation_logs;
create policy "Admin log ekler"
  on public.moderation_logs for insert with check (public.is_admin() and auth.uid() = admin_id);

-- banned_words (yalnızca admin yönetir; okuma da admin)
drop policy if exists "Admin yasaklı kelimeleri görür" on public.banned_words;
create policy "Admin yasaklı kelimeleri görür"
  on public.banned_words for select using (public.is_admin());

drop policy if exists "Admin yasaklı kelime ekler" on public.banned_words;
create policy "Admin yasaklı kelime ekler"
  on public.banned_words for insert with check (public.is_admin());

drop policy if exists "Admin yasaklı kelime günceller" on public.banned_words;
create policy "Admin yasaklı kelime günceller"
  on public.banned_words for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin yasaklı kelime siler" on public.banned_words;
create policy "Admin yasaklı kelime siler"
  on public.banned_words for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5) Admin profil yönetimi (ban / rol) — kullanıcının kendi update'ine ek
-- ---------------------------------------------------------------------
drop policy if exists "Admin profilleri yönetir" on public.profiles;
create policy "Admin profilleri yönetir"
  on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6) Ban zorunluluğu: banlı kullanıcı içerik üretemez (insert politikaları yenilenir)
-- ---------------------------------------------------------------------
drop policy if exists "Giriş yapan itiraf paylaşır" on public.confessions;
create policy "Giriş yapan itiraf paylaşır"
  on public.confessions for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Giriş yapan beğeni ekler" on public.confession_likes;
create policy "Giriş yapan beğeni ekler"
  on public.confession_likes for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Giriş yapan yorum yapar" on public.confession_comments;
create policy "Giriş yapan yorum yapar"
  on public.confession_comments for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Giriş yapan gölge paylaşır" on public.golge_posts;
create policy "Giriş yapan gölge paylaşır"
  on public.golge_posts for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Giriş yapan gölge beğenir" on public.golge_likes;
create policy "Giriş yapan gölge beğenir"
  on public.golge_likes for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Giriş yapan gölge yorumlar" on public.golge_comments;
create policy "Giriş yapan gölge yorumlar"
  on public.golge_comments for insert with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "Plus üye konuşma başlatır" on public.conversations;
create policy "Plus üye konuşma başlatır"
  on public.conversations for insert with check (
    auth.uid() = sender_id and sender_id <> receiver_id and not public.is_banned()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_plus)
  );

drop policy if exists "Plus üye mesaj gönderir" on public.messages;
create policy "Plus üye mesaj gönderir"
  on public.messages for insert with check (
    auth.uid() = sender_id and sender_id <> receiver_id and not public.is_banned()
    and char_length(btrim(content)) > 0
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_plus)
    and exists (select 1 from public.conversations c where c.id = conversation_id and (c.sender_id = auth.uid() or c.receiver_id = auth.uid()))
  );

-- ---------------------------------------------------------------------
-- 7) Admin içerik silme yetkisi (sahibe ek olarak)
-- ---------------------------------------------------------------------
drop policy if exists "Kullanıcı kendi itirafını siler" on public.confessions;
create policy "İtiraf silme (sahip veya admin)"
  on public.confessions for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Kullanıcı kendi gölgesini siler" on public.golge_posts;
create policy "Gölge silme (sahip veya admin)"
  on public.golge_posts for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Kullanıcı kendi yorumunu siler" on public.confession_comments;
create policy "Yorum silme (sahip veya admin)"
  on public.confession_comments for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Kullanıcı kendi gölge yorumunu siler" on public.golge_comments;
create policy "Gölge yorum silme (sahip veya admin)"
  on public.golge_comments for delete using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- 8) Sunucu tarafı moderasyon trigger'ı (yasaklı kelime + 11 hane + telefon)
-- ---------------------------------------------------------------------
create or replace function public.content_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
declare txt text; w record;
begin
  if TG_TABLE_NAME = 'confessions' then txt := new.content;
  elsif TG_TABLE_NAME = 'confession_comments' then txt := new.content;
  elsif TG_TABLE_NAME = 'golge_posts' then txt := coalesce(new.overlay_text,'') || ' ' || coalesce(new.caption,'');
  elsif TG_TABLE_NAME = 'golge_comments' then txt := new.content;
  elsif TG_TABLE_NAME = 'messages' then txt := new.content;
  else txt := ''; end if;

  -- 11 haneli sayı dizisi (TC kimlik benzeri)
  if txt ~ '\d{11}' then
    raise exception 'Paylaşımınız topluluk kurallarına aykırı ifadeler içeriyor.' using errcode = 'P0001';
  end if;
  -- TR telefon kalıbı
  if txt ~ '(\+?90|0)?\s*5\d{2}[\s.\-]?\d{3}[\s.\-]?\d{2}[\s.\-]?\d{2}' then
    raise exception 'Paylaşımınız topluluk kurallarına aykırı ifadeler içeriyor.' using errcode = 'P0001';
  end if;
  -- Aktif yasaklı kelimeler (kelime sınırıyla)
  for w in select word from public.banned_words where is_active loop
    if txt ~* ('\m' || regexp_replace(w.word, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M') then
      raise exception 'Paylaşımınız topluluk kurallarına aykırı ifadeler içeriyor.' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_mod_confessions on public.confessions;
create trigger trg_mod_confessions before insert on public.confessions for each row execute function public.content_moderation();
drop trigger if exists trg_mod_confession_comments on public.confession_comments;
create trigger trg_mod_confession_comments before insert on public.confession_comments for each row execute function public.content_moderation();
drop trigger if exists trg_mod_golge_posts on public.golge_posts;
create trigger trg_mod_golge_posts before insert on public.golge_posts for each row execute function public.content_moderation();
drop trigger if exists trg_mod_golge_comments on public.golge_comments;
create trigger trg_mod_golge_comments before insert on public.golge_comments for each row execute function public.content_moderation();
drop trigger if exists trg_mod_messages on public.messages;
create trigger trg_mod_messages before insert on public.messages for each row execute function public.content_moderation();

-- ---------------------------------------------------------------------
-- 9) Seed: yasaklı kelimeler (örnek; admin panelinden genişletilebilir)
-- ---------------------------------------------------------------------
insert into public.banned_words (word, severity) values
  ('orospu', 'high'),
  ('piç', 'high'),
  ('yavşak', 'high'),
  ('gerizekalı', 'medium'),
  ('salak', 'low'),
  ('aptal', 'low'),
  ('öldüreceğim', 'high'),
  ('gebertirim', 'high')
on conflict (word) do nothing;
