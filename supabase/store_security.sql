-- =====================================================================
-- Anonix · Mağaza onayı & production güvenliği
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: profiles, confessions,
-- golge_posts, messages, conversations, reports, is_admin().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Hesap silme logları (yalnızca admin görür; insert service_role ile)
-- ---------------------------------------------------------------------
create table if not exists public.account_deletion_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  email      text,
  reason     text,
  deleted_at timestamptz not null default now()
);
alter table public.account_deletion_logs enable row level security;
drop policy if exists "Silme loglarini admin gorur" on public.account_deletion_logs;
create policy "Silme loglarini admin gorur"
  on public.account_deletion_logs for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Kullanıcı engelleme
-- ---------------------------------------------------------------------
create table if not exists public.blocked_users (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocked_users_blocker_idx on public.blocked_users (blocker_id);
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_id);

alter table public.blocked_users enable row level security;
drop policy if exists "Kullanici kendi engellerini gorur" on public.blocked_users;
create policy "Kullanici kendi engellerini gorur"
  on public.blocked_users for select using (auth.uid() = blocker_id);
drop policy if exists "Kullanici engelleme ekler" on public.blocked_users;
create policy "Kullanici engelleme ekler"
  on public.blocked_users for insert with check (auth.uid() = blocker_id);
drop policy if exists "Kullanici engeli kaldirir" on public.blocked_users;
create policy "Kullanici engeli kaldirir"
  on public.blocked_users for delete using (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------
-- 3) İçerik moderasyon durumu
-- ---------------------------------------------------------------------
alter table public.confessions add column if not exists moderation_status text not null default 'approved';
alter table public.golge_posts add column if not exists moderation_status text not null default 'approved';
create index if not exists confessions_modstatus_idx on public.confessions (moderation_status);
create index if not exists golge_modstatus_idx on public.golge_posts (moderation_status);

-- ---------------------------------------------------------------------
-- 4) Yaş onayı alanları
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists age_confirmed boolean not null default false;
alter table public.profiles add column if not exists age_confirmed_at timestamptz;

-- handle_new_user: referred_by (mevcut) + yaş onayı (yeni)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ref_code text; ref_id uuid; age_ok boolean;
begin
  ref_code := nullif(new.raw_user_meta_data ->> 'referred_by_code', '');
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code);
  end if;
  age_ok := coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false);

  insert into public.profiles (id, username, gender, is_anonymous, referred_by, age_confirmed, age_confirmed_at)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'kullanici_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'gender', ''), 'other'),
    coalesce((new.raw_user_meta_data ->> 'is_anonymous')::boolean, true),
    ref_id,
    age_ok,
    case when age_ok then now() else null end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Şikayet sonrası otomatik gizleme: 3 farklı kullanıcı → pending_review
-- ---------------------------------------------------------------------
create or replace function public.s_report_autohide()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt integer;
begin
  select count(distinct reporter_id) into cnt
    from public.reports
    where entity_type = new.entity_type and entity_id = new.entity_id and reporter_id is not null;
  if cnt >= 3 then
    if new.entity_type = 'confession' then
      update public.confessions set moderation_status = 'pending_review'
        where id = new.entity_id and moderation_status = 'approved';
    elsif new.entity_type = 'golge' then
      update public.golge_posts set moderation_status = 'pending_review'
        where id = new.entity_id and moderation_status = 'approved';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_report_autohide on public.reports;
create trigger trg_report_autohide after insert on public.reports
  for each row execute function public.s_report_autohide();

-- ---------------------------------------------------------------------
-- 6) Mesajlaşma engeli: engellenen taraflar birbirine mesaj/konuşma açamaz
--    (Plus/admin kuralı korunur; iki yönlü engel)
-- ---------------------------------------------------------------------
drop policy if exists "Plus üye konuşma başlatır" on public.conversations;
create policy "Plus üye konuşma başlatır"
  on public.conversations for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.is_plus or p.role = 'admin'))
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = sender_id and b.blocked_id = receiver_id)
         or (b.blocker_id = receiver_id and b.blocked_id = sender_id)
    )
  );

drop policy if exists "Plus üye mesaj gönderir" on public.messages;
create policy "Plus üye mesaj gönderir"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and char_length(btrim(content)) > 0
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.is_plus or p.role = 'admin'))
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.sender_id = auth.uid() or c.receiver_id = auth.uid())
    )
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = sender_id and b.blocked_id = receiver_id)
         or (b.blocker_id = receiver_id and b.blocked_id = sender_id)
    )
  );

-- ---------------------------------------------------------------------
-- 7) İçerik rate-limit trigger'ları (server-side; Gölge'dekiyle aynı kalıp)
-- ---------------------------------------------------------------------
-- İtiraf: saatte 10
create or replace function public.confession_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.confessions
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Çok fazla itiraf paylaştın. Lütfen biraz bekle.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_confession_rate on public.confessions;
create trigger trg_confession_rate before insert on public.confessions
  for each row execute function public.confession_rate_limit();

-- Yorum: 10 dakikada 30
create or replace function public.comment_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.confession_comments
      where user_id = new.user_id and created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Çok hızlı yorum yapıyorsun. Lütfen biraz bekle.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_comment_rate on public.confession_comments;
create trigger trg_comment_rate before insert on public.confession_comments
  for each row execute function public.comment_rate_limit();

-- Mesaj: dakikada 10
create or replace function public.message_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'Çok hızlı mesaj gönderiyorsun. Lütfen biraz bekle.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_message_rate on public.messages;
create trigger trg_message_rate before insert on public.messages
  for each row execute function public.message_rate_limit();

-- Şikayet: saatte 5
create or replace function public.report_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reporter_id is not null and (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Çok fazla şikayet gönderdin. Lütfen biraz bekle.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_report_rate on public.reports;
create trigger trg_report_rate before insert on public.reports
  for each row execute function public.report_rate_limit();
