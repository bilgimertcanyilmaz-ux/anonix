-- =====================================================================
-- Anonix · Soft launch & growth operasyon altyapısı
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: profiles, analytics_events,
-- reports, is_admin(), handle_new_user().
-- Not: "Yeni büyük özellik yok" — bunlar launch operasyonu için altyapıdır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Beta erişim alanları (profiles)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_beta_user boolean not null default false;
alter table public.profiles add column if not exists beta_invite_code text;
create index if not exists profiles_beta_idx on public.profiles (is_beta_user) where is_beta_user;

-- ---------------------------------------------------------------------
-- 2) Davet kodları (invite-only kayıt)
-- ---------------------------------------------------------------------
create table if not exists public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  label       text,                       -- ör. "TikTok dalga 1"
  max_uses    integer not null default 1, -- 0 = sınırsız
  used_count  integer not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles (id) on delete set null,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists invite_codes_code_idx on public.invite_codes (upper(code));
create index if not exists invite_codes_active_idx on public.invite_codes (is_active) where is_active;

alter table public.invite_codes enable row level security;
-- Herkes kodun geçerliliğini RPC ile kontrol eder; tabloyu yalnızca admin görür.
drop policy if exists "Davet kodlarini admin gorur" on public.invite_codes;
create policy "Davet kodlarini admin gorur"
  on public.invite_codes for select using (public.is_admin());
drop policy if exists "Davet kodu admin yonetir" on public.invite_codes;
create policy "Davet kodu admin yonetir"
  on public.invite_codes for all using (public.is_admin()) with check (public.is_admin());

-- Davet kodu geçerli mi? (anon erişim — kayıt öncesi kontrol). Bilgi sızdırmaz.
create or replace function public.check_invite_code(p_code text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.invite_codes ic
    where upper(ic.code) = upper(btrim(p_code))
      and ic.is_active
      and (ic.expires_at is null or ic.expires_at > now())
      and (ic.max_uses = 0 or ic.used_count < ic.max_uses)
  );
$$;
grant execute on function public.check_invite_code(text) to anon, authenticated;

-- Kod kullanımını artır (kayıt sonrası handle_new_user içinde çağrılır).
create or replace function public.consume_invite_code(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.invite_codes
     set used_count = used_count + 1
   where upper(code) = upper(btrim(p_code))
     and is_active
     and (expires_at is null or expires_at > now())
     and (max_uses = 0 or used_count < max_uses);
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Özellik bayrakları (feature flags)
-- ---------------------------------------------------------------------
create table if not exists public.feature_flags (
  key         text primary key,
  enabled     boolean not null default false,
  description text,
  rollout_pct integer not null default 100, -- 0-100 kademeli açılış
  updated_at  timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
-- Herkes okur (uygulama davranışını belirler); yalnızca admin değiştirir.
drop policy if exists "Bayraklari herkes okur" on public.feature_flags;
create policy "Bayraklari herkes okur"
  on public.feature_flags for select using (true);
drop policy if exists "Bayraklari admin yonetir" on public.feature_flags;
create policy "Bayraklari admin yonetir"
  on public.feature_flags for all using (public.is_admin()) with check (public.is_admin());

insert into public.feature_flags (key, enabled, description) values
  ('beta_mode',          false, 'Yalnızca davet kodu ile kayıt (invite-only)'),
  ('push_notifications', false, 'Web push bildirimleri (VAPID gerekli)'),
  ('ai_moderation',      true,  'Otomatik içerik moderasyonu'),
  ('ghost_mode',         true,  'Gölge (anonim foto) paylaşımı'),
  ('viral_feed',         true,  'Sana Özel / viral akış'),
  ('onboarding_v2',      true,  'Yeni kullanıcı onboarding akışı'),
  ('satisfaction_popup', true,  'Memnuniyet anketi pop-up'),
  ('referral_program',   true,  'Davet/referral büyüme programı')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 4) Geri bildirim & hata raporları
-- ---------------------------------------------------------------------
create table if not exists public.feedback_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  kind        text not null default 'feedback',  -- feedback | bug | idea | satisfaction
  rating      integer,                            -- 1-5 (memnuniyet)
  message     text,
  page        text,                               -- olayın oluştuğu sayfa
  meta        jsonb not null default '{}',        -- tarayıcı/sürüm vb (PII yok)
  status      text not null default 'new',        -- new | reviewing | resolved
  created_at  timestamptz not null default now(),
  check (rating is null or (rating between 1 and 5)),
  check (kind in ('feedback','bug','idea','satisfaction'))
);
create index if not exists feedback_kind_idx on public.feedback_reports (kind);
create index if not exists feedback_status_idx on public.feedback_reports (status);
create index if not exists feedback_created_idx on public.feedback_reports (created_at desc);

alter table public.feedback_reports enable row level security;
-- Herkes (anon dahil) kendi geri bildirimini ekler; yalnızca admin okur/yönetir.
drop policy if exists "Geri bildirim ekleme" on public.feedback_reports;
create policy "Geri bildirim ekleme"
  on public.feedback_reports for insert
  with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Geri bildirimi admin gorur" on public.feedback_reports;
create policy "Geri bildirimi admin gorur"
  on public.feedback_reports for select using (public.is_admin());
drop policy if exists "Geri bildirimi admin yonetir" on public.feedback_reports;
create policy "Geri bildirimi admin yonetir"
  on public.feedback_reports for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5) Kötüye kullanım tespiti — işaretlenen kullanıcılar
-- ---------------------------------------------------------------------
create table if not exists public.flagged_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,        -- spam | mass_report | rate_abuse | manual
  severity    text not null default 'low',  -- low | medium | high
  detail      jsonb not null default '{}',
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists flagged_users_user_idx on public.flagged_users (user_id);
create index if not exists flagged_users_unresolved_idx on public.flagged_users (resolved) where not resolved;

alter table public.flagged_users enable row level security;
drop policy if exists "Isaretlemeleri admin gorur" on public.flagged_users;
create policy "Isaretlemeleri admin gorur"
  on public.flagged_users for select using (public.is_admin());
drop policy if exists "Isaretlemeyi admin yonetir" on public.flagged_users;
create policy "Isaretlemeyi admin yonetir"
  on public.flagged_users for all using (public.is_admin()) with check (public.is_admin());

-- Otomatik işaretleme: bir kullanıcı 1 saatte 3+ kez şikayet edilirse flagged.
create or replace function public.s_flag_abused_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid; cnt integer;
begin
  -- Şikayet edilen içeriğin sahibini bul
  if new.entity_type = 'confession' then
    select user_id into target from public.confessions where id = new.entity_id;
  elsif new.entity_type = 'golge' then
    select user_id into target from public.golge_posts where id = new.entity_id;
  end if;
  if target is null then return new; end if;

  select count(distinct r.reporter_id) into cnt
    from public.reports r
    join public.confessions c on (r.entity_type = 'confession' and c.id = r.entity_id and c.user_id = target)
   where r.created_at > now() - interval '1 hour' and r.reporter_id is not null;

  if cnt >= 3 and not exists (
    select 1 from public.flagged_users f
    where f.user_id = target and not f.resolved and f.reason = 'mass_report'
      and f.created_at > now() - interval '6 hours'
  ) then
    insert into public.flagged_users (user_id, reason, severity, detail)
    values (target, 'mass_report', 'medium', jsonb_build_object('reports_1h', cnt));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_flag_abused_user on public.reports;
create trigger trg_flag_abused_user after insert on public.reports
  for each row execute function public.s_flag_abused_user();

-- ---------------------------------------------------------------------
-- 6) Performans izleme (yavaş istek / büyük görsel / hata logları)
-- ---------------------------------------------------------------------
create table if not exists public.perf_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  metric      text not null,        -- slow_query | large_image | failed_api | realtime_drop
  value_ms    integer,
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists perf_logs_metric_idx on public.perf_logs (metric);
create index if not exists perf_logs_created_idx on public.perf_logs (created_at desc);

alter table public.perf_logs enable row level security;
drop policy if exists "Perf log ekleme" on public.perf_logs;
create policy "Perf log ekleme"
  on public.perf_logs for insert
  with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Perf loglari admin gorur" on public.perf_logs;
create policy "Perf loglari admin gorur"
  on public.perf_logs for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 7) handle_new_user: davet kodu + beta işaretleme
--    (store_security.sql sürümünün üzerine yazar — beta_mode desteği ekler)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_code text; ref_id uuid; age_ok boolean;
  inv_code text; beta_on boolean; is_beta boolean := false;
begin
  ref_code := nullif(new.raw_user_meta_data ->> 'referred_by_code', '');
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code);
  end if;
  age_ok := coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false);

  -- Davet kodu: beta_mode açıkken kayıtla ilişkilendir + tüket
  inv_code := nullif(new.raw_user_meta_data ->> 'invite_code', '');
  select enabled into beta_on from public.feature_flags where key = 'beta_mode';
  if inv_code is not null and public.check_invite_code(inv_code) then
    is_beta := true;
    perform public.consume_invite_code(inv_code);
  end if;

  insert into public.profiles (
    id, username, gender, is_anonymous, referred_by, age_confirmed, age_confirmed_at,
    is_beta_user, beta_invite_code
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'kullanici_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'gender', ''), 'other'),
    coalesce((new.raw_user_meta_data ->> 'is_anonymous')::boolean, true),
    ref_id,
    age_ok,
    case when age_ok then now() else null end,
    is_beta,
    case when is_beta then upper(inv_code) else null end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 8) Growth metrikleri — admin için tek RPC (DAU/WAU/retention/churn vb)
--    analytics_events tablosundan türetilir.
-- ---------------------------------------------------------------------
create or replace function public.admin_growth_metrics()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Yetkin yok.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users',     (select count(*) from public.profiles),
    'beta_users',      (select count(*) from public.profiles where is_beta_user),
    'plus_users',      (select count(*) from public.profiles where is_plus),
    'new_users_24h',   (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'new_users_7d',    (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'dau',             (select count(distinct user_id) from public.analytics_events
                          where user_id is not null and created_at > now() - interval '1 day'),
    'wau',             (select count(distinct user_id) from public.analytics_events
                          where user_id is not null and created_at > now() - interval '7 days'),
    'mau',             (select count(distinct user_id) from public.analytics_events
                          where user_id is not null and created_at > now() - interval '30 days'),
    'confessions_24h', (select count(*) from public.confessions where created_at > now() - interval '1 day'),
    'golge_24h',       (select count(*) from public.golge_posts where created_at > now() - interval '1 day'),
    'open_feedback',   (select count(*) from public.feedback_reports where status = 'new'),
    'flagged_open',    (select count(*) from public.flagged_users where not resolved),
    'invites_active',  (select count(*) from public.invite_codes where is_active),
    'avg_satisfaction',(select round(avg(rating)::numeric, 2) from public.feedback_reports
                          where kind = 'satisfaction' and rating is not null),
    'install_rate',    (
      select case when opened = 0 then 0 else round(100.0 * completed / opened, 1) end
      from (
        select
          (select count(*) from public.analytics_events where event = 'install_prompt_opened') as opened,
          (select count(*) from public.analytics_events where event = 'install_completed') as completed
      ) s
    ),
    'd1_retention',    (
      -- Dün kayıt olanların bugün dönme oranı (yaklaşık)
      select case when base = 0 then 0 else round(100.0 * ret / base, 1) end
      from (
        select
          (select count(*) from public.profiles
             where created_at::date = (now() - interval '1 day')::date) as base,
          (select count(distinct ae.user_id) from public.analytics_events ae
             join public.profiles p on p.id = ae.user_id
            where p.created_at::date = (now() - interval '1 day')::date
              and ae.created_at::date = now()::date) as ret
      ) s
    )
  ) into result;

  return result;
end;
$$;
grant execute on function public.admin_growth_metrics() to authenticated;
