-- =====================================================================
-- Anonix · Supabase şeması (Aşama 12: Viral Büyüme — Streak, Referral, vb.)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles ek alanları (streak + referral)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists streak_count integer not null default 0;
alter table public.profiles add column if not exists last_active_date date;
alter table public.profiles add column if not exists longest_streak integer not null default 0;
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles (id) on delete set null;

-- Mevcut kullanıcılara referral kodu üret
update public.profiles
  set referral_code = upper(substr(md5(id::text || random()::text), 1, 8))
  where referral_code is null;

-- Yeni profillerde referral kodu otomatik üret
create or replace function public.set_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substr(md5(new.id::text || random()::text), 1, 8));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code before insert on public.profiles
  for each row execute function public.set_referral_code();

-- Güvenli kolon listesini genişlet (Aşama 9 sertleştirmesiyle uyumlu)
grant update (username, gender, avatar_url, is_anonymous, updated_at) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2) confessions: kaybolan (temporary) itiraf
-- ---------------------------------------------------------------------
alter table public.confessions add column if not exists expires_at timestamptz;
alter table public.confessions add column if not exists is_temporary boolean not null default false;
create index if not exists confessions_expiry_idx on public.confessions (expires_at) where is_temporary;

-- ---------------------------------------------------------------------
-- 3) referrals tablosu
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid references public.profiles (id) on delete cascade,
  referred_user_id uuid references public.profiles (id) on delete cascade unique,
  referral_code    text not null,
  created_at       timestamptz not null default now(),
  check (referrer_id <> referred_user_id)
);

alter table public.referrals enable row level security;
drop policy if exists "Referralları taraflar/admin görür" on public.referrals;
create policy "Referralları taraflar/admin görür"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- 4) push_subscriptions tablosu (şimdilik mock altyapı)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Kullanıcı kendi push aboneliği" on public.push_subscriptions;
create policy "Kullanıcı kendi push aboneliği"
  on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Kullanıcı push aboneliği ekler" on public.push_subscriptions;
create policy "Kullanıcı push aboneliği ekler"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "Kullanıcı push aboneliği siler" on public.push_subscriptions;
create policy "Kullanıcı push aboneliği siler"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5) handle_new_user v2: referral kodundan referred_by ayarla
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ref_code text; ref_id uuid;
begin
  ref_code := nullif(new.raw_user_meta_data ->> 'referred_by_code', '');
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code);
  end if;

  insert into public.profiles (id, username, gender, is_anonymous, referred_by)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'kullanici_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'gender', ''), 'other'),
    coalesce((new.raw_user_meta_data ->> 'is_anonymous')::boolean, true),
    ref_id
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Günlük streak RPC (istemciden app açılışında çağrılır)
-- ---------------------------------------------------------------------
create or replace function public.record_daily_streak()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  last_d date; cur integer; longest integer;
  new_streak integer; reward integer := 0; today date := current_date;
begin
  if uid is null then return json_build_object('ok', false); end if;
  select last_active_date, streak_count, longest_streak into last_d, cur, longest
    from public.profiles where id = uid;

  if last_d = today then
    return json_build_object('ok', true, 'changed', false, 'streak', cur);
  end if;

  if last_d = today - 1 then new_streak := cur + 1; else new_streak := 1; end if;
  longest := greatest(coalesce(longest, 0), new_streak);

  update public.profiles
    set streak_count = new_streak, last_active_date = today, longest_streak = longest
    where id = uid;

  reward := 10;
  if new_streak = 3 then reward := reward + 25; end if;
  if new_streak = 7 then reward := reward + 100; end if;
  perform public.add_points(uid, reward);
  if new_streak = 30 then perform public.award_badge(uid, '30 Gün Streak'); end if;

  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (uid, uid, 'streak', 'streak',
    'Günlük giriş! ' || new_streak || ' günlük streak · +' || reward || ' puan 🔥');

  return json_build_object('ok', true, 'changed', true, 'streak', new_streak, 'reward', reward);
end;
$$;
grant execute on function public.record_daily_streak() to authenticated;

-- ---------------------------------------------------------------------
-- 7) İlk itiraftan sonra referral aktivasyonu (abuse koruması)
--    Davet eden +250, yeni kullanıcı +100; her kullanıcı bir kez.
-- ---------------------------------------------------------------------
create or replace function public.s12_referral_on_first_confession()
returns trigger language plpgsql security definer set search_path = public as $$
declare ref_by uuid; ref_code text; cnt integer;
begin
  select referred_by, p.referral_code into ref_by, ref_code from public.profiles p where p.id = new.user_id;
  if ref_by is null then return new; end if;

  -- Zaten referral kaydı var mı / bu ilk itiraf mı?
  if exists (select 1 from public.referrals where referred_user_id = new.user_id) then
    return new;
  end if;
  select count(*) into cnt from public.confessions where user_id = new.user_id;
  if cnt > 1 then return new; end if;

  insert into public.referrals (referrer_id, referred_user_id, referral_code)
  values (ref_by, new.user_id, coalesce(ref_code, 'REF'))
  on conflict (referred_user_id) do nothing;

  perform public.add_points(ref_by, 250);
  perform public.add_points(new.user_id, 100);
  perform public.award_badge(ref_by, 'İlk Davet');

  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (ref_by, new.user_id, 'referral', 'referral', 'Davetin kabul edildi! +250 puan 🎉');
  insert into public.notifications (user_id, actor_id, type, entity_type, message)
  values (new.user_id, ref_by, 'referral', 'referral', 'Davet bonusu! +100 puan 🎁');

  return new;
end;
$$;
drop trigger if exists trg_s12_referral on public.confessions;
create trigger trg_s12_referral after insert on public.confessions
  for each row execute function public.s12_referral_on_first_confession();

-- ---------------------------------------------------------------------
-- 8) Kaybolan itirafları temizle (pg_cron ile)
-- ---------------------------------------------------------------------
create or replace function public.delete_expired_confessions()
returns integer language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  with done as (
    delete from public.confessions
      where is_temporary and expires_at is not null and expires_at < now()
      returning 1
  ) select count(*) into affected from done;
  return affected;
end;
$$;

do $$
begin
  perform cron.schedule('anonix-expire-confessions', '*/15 * * * *', 'select public.delete_expired_confessions();');
exception when others then
  raise notice 'pg_cron yok; delete_expired_confessions manuel/edge ile zamanlanmalı.';
end;
$$;

-- ---------------------------------------------------------------------
-- 9) Yeni rozetler
-- ---------------------------------------------------------------------
insert into public.badges (name, description, icon, required_points, badge_type) values
  ('30 Gün Streak', '30 gün üst üste aktif oldun.', '🔥', 0, 'streak'),
  ('Viral İtiraf', 'İtirafın çok etkileşim aldı.', '🚀', 0, 'special'),
  ('Alev Alan', 'İçeriğin alev aldı.', '⚡', 0, 'special'),
  ('Gece Kuşu', 'Gece saatlerinde aktifsin.', '🦉', 0, 'special'),
  ('İlk Davet', 'İlk arkadaşını davet ettin.', '🤝', 0, 'milestone'),
  ('Sosyal Yayıcı', 'Birçok kişiyi davet ettin.', '📣', 0, 'special')
on conflict (name) do nothing;
