-- =====================================================================
-- Anonix · Supabase şeması (Aşama 9: Plus Abonelik & Ödeme — iyzico)
-- SQL Editor > New query içine yapıştırıp çalıştırın. Idempotent'tir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles ek alanları
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists plus_expires_at timestamptz;
alter table public.profiles add column if not exists subscription_type text;
alter table public.profiles add column if not exists iyzico_customer_id text;

-- ---------------------------------------------------------------------
-- 2) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  provider                 text not null,
  provider_subscription_id text,
  subscription_type        text not null,
  status                   text not null default 'active',
  started_at               timestamptz not null default now(),
  expires_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists public.payment_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete set null,
  provider      text not null,
  payment_id    text,
  amount        numeric not null,
  currency      text not null default 'TRY',
  status        text not null default 'pending',
  raw_response  jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists payment_logs_user_idx on public.payment_logs (user_id, created_at desc);
create index if not exists payment_logs_payment_idx on public.payment_logs (payment_id);

-- ---------------------------------------------------------------------
-- 3) RLS (yazma yalnızca service_role / sunucu tarafında)
-- ---------------------------------------------------------------------
alter table public.subscriptions enable row level security;
alter table public.payment_logs enable row level security;

drop policy if exists "Kullanıcı kendi aboneliklerini görür" on public.subscriptions;
create policy "Kullanıcı kendi aboneliklerini görür"
  on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Kullanıcı kendi ödemelerini görür" on public.payment_logs;
create policy "Kullanıcı kendi ödemelerini görür"
  on public.payment_logs for select using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- 4) GÜVENLİK SERTLEŞTİRME
--    Kullanıcı frontend'den is_plus / role / ban / puan gibi hassas
--    kolonları DEĞİŞTİREMEZ. Yalnızca güvenli kolonları güncelleyebilir.
--    Hassas kolonlar: security definer fonksiyonlar (admin RPC, add_points)
--    veya service_role (ödeme sunucusu) tarafından güncellenir.
-- ---------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (username, gender, avatar_url, is_anonymous, updated_at)
  on public.profiles to authenticated;

-- Admin işlemleri artık güvenli RPC'lerle yapılır (column grant'i definer ile aşar)
create or replace function public.admin_set_ban(target uuid, banned boolean, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Yetkisiz işlem.' using errcode = '42501'; end if;
  update public.profiles
    set is_banned = banned, banned_reason = case when banned then reason else null end
    where id = target;
end;
$$;
grant execute on function public.admin_set_ban(uuid, boolean, text) to authenticated;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Yetkisiz işlem.' using errcode = '42501'; end if;
  if new_role not in ('user', 'admin') then raise exception 'Geçersiz rol.'; end if;
  update public.profiles set role = new_role where id = target;
end;
$$;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Abonelik süresi dolanları kapat (pg_cron ile periyodik çalıştırılır)
-- ---------------------------------------------------------------------
create or replace function public.expire_subscriptions()
returns integer language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update public.subscriptions set status = 'expired', updated_at = now()
    where status = 'active' and expires_at is not null and expires_at < now();

  with done as (
    update public.profiles
      set is_plus = false, subscription_type = null
      where is_plus = true and plus_expires_at is not null and plus_expires_at < now()
      returning 1
  )
  select count(*) into affected from done;
  return affected;
end;
$$;

-- pg_cron varsa 30 dakikada bir çalıştır (yoksa sessizce atla)
do $$
begin
  perform cron.schedule('anonix-expire-subscriptions', '*/30 * * * *', 'select public.expire_subscriptions();');
exception when others then
  raise notice 'pg_cron mevcut değil; expire_subscriptions manuel/edge function ile zamanlanmalı.';
end;
$$;
