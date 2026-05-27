-- =====================================================================
-- Anonix · Premium özellik altyapısı (Stage 17)
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: profiles, confessions,
-- messages, confession_likes, notifications, is_admin().
-- Mevcut sistem KORUNUR — yalnızca ek kolon/tablo/RPC eklenir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles: premium tema + hayalet mod + çevrimiçi gizleme
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists premium_theme text;
alter table public.profiles add column if not exists ghost_mode boolean not null default false;
alter table public.profiles add column if not exists hide_online boolean not null default false;

-- Kullanıcı bu kolonları kendisi güncelleyebilsin (kolon-güvenliği ile uyumlu)
grant update (premium_theme, ghost_mode, hide_online) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2) confessions: boost + plus oda alanları
-- ---------------------------------------------------------------------
alter table public.confessions add column if not exists boosted_until timestamptz;
alter table public.confessions add column if not exists boost_score integer not null default 0;
alter table public.confessions add column if not exists plus_room_type text;
create index if not exists confessions_boosted_idx on public.confessions (boosted_until);
create index if not exists confessions_plus_room_idx on public.confessions (plus_room_type);

-- ---------------------------------------------------------------------
-- 3) messages: kaybolan mesaj alanları
-- ---------------------------------------------------------------------
alter table public.messages add column if not exists is_disappearing boolean not null default false;
alter table public.messages add column if not exists expires_at timestamptz;
create index if not exists messages_expires_idx on public.messages (expires_at);

-- ---------------------------------------------------------------------
-- 4) profile_views — profil görüntülemeleri (Ultra Plus özelliği)
-- ---------------------------------------------------------------------
create table if not exists public.profile_views (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,  -- görüntülenen
  viewer_id  uuid references public.profiles (id) on delete set null,          -- görüntüleyen
  created_at timestamptz not null default now()
);
create index if not exists profile_views_profile_idx on public.profile_views (profile_id, created_at desc);

alter table public.profile_views enable row level security;
-- Yalnızca görüntülenen kullanıcı kendi ziyaretçilerini görür (Ultra Plus UI'da gösterir).
drop policy if exists "Profil sahibi ziyaretlerini gorur" on public.profile_views;
create policy "Profil sahibi ziyaretlerini gorur"
  on public.profile_views for select using (auth.uid() = profile_id);
-- Insert yalnızca RPC (security definer) ile yapılır — doğrudan insert kapalı.

-- ---------------------------------------------------------------------
-- 5) boost_logs — boost kullanım kaydı (günlük kota için)
-- ---------------------------------------------------------------------
create table if not exists public.boost_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  confession_id uuid references public.confessions (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists boost_logs_user_idx on public.boost_logs (user_id, created_at desc);

alter table public.boost_logs enable row level security;
drop policy if exists "Kullanici kendi boostlarini gorur" on public.boost_logs;
create policy "Kullanici kendi boostlarini gorur"
  on public.boost_logs for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6) RPC: profil görüntüleme kaydı (+ Ultra Plus'a bildirim)
--    - kendi profilini görüntüleme sayılmaz
--    - görüntüleyen hayalet moddaysa kayıt atılmaz
--    - 1 saat içinde aynı ziyaretçi tekrar sayılmaz (spam önleme)
-- ---------------------------------------------------------------------
create or replace function public.record_profile_view(p_profile uuid)
returns void language plpgsql security definer set search_path = public as $$
declare viewer uuid; viewer_ghost boolean; viewed_tier text; viewed_isplus boolean;
begin
  viewer := auth.uid();
  if viewer is null or viewer = p_profile then return; end if;

  select ghost_mode into viewer_ghost from public.profiles where id = viewer;
  if coalesce(viewer_ghost, false) then return; end if;

  if exists (
    select 1 from public.profile_views
    where profile_id = p_profile and viewer_id = viewer
      and created_at > now() - interval '1 hour'
  ) then return; end if;

  insert into public.profile_views (profile_id, viewer_id) values (p_profile, viewer);

  select subscription_tier, is_plus into viewed_tier, viewed_isplus
    from public.profiles where id = p_profile;
  if coalesce(viewed_isplus, false) and viewed_tier = 'ultra_plus' then
    insert into public.notifications (user_id, actor_id, type, entity_type, message)
    values (p_profile, viewer, 'profile_view', 'profile', 'Profilin görüntülendi.');
  end if;
end;
$$;
grant execute on function public.record_profile_view(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 7) RPC: boost (kota kontrolü + boosted_until/boost_score güncelle)
--    Plus: günlük 1, Ultra Plus / admin: günlük 3, Free: 0
-- ---------------------------------------------------------------------
create or replace function public.boost_confession(p_confession uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare owner uuid; tier text; isplus boolean; isadmin boolean; quota int; used int;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli.' using errcode = '42501'; end if;

  select user_id into owner from public.confessions where id = p_confession;
  if owner is null then raise exception 'İçerik bulunamadı.' using errcode = 'P0001'; end if;
  if owner <> auth.uid() then
    raise exception 'Yalnızca kendi paylaşımını boostlayabilirsin.' using errcode = '42501';
  end if;

  select subscription_tier, is_plus, (role = 'admin')
    into tier, isplus, isadmin from public.profiles where id = auth.uid();

  quota := case
    when isadmin then 3
    when coalesce(isplus, false) and tier = 'ultra_plus' then 3
    when coalesce(isplus, false) and tier = 'plus' then 1
    else 0 end;

  if quota = 0 then
    raise exception 'Boost için Plus veya Ultra Plus gerekli.' using errcode = '42501';
  end if;

  select count(*) into used from public.boost_logs
    where user_id = auth.uid() and created_at::date = now()::date;
  if used >= quota then
    raise exception 'Bugünkü boost hakkın doldu.' using errcode = 'P0001';
  end if;

  insert into public.boost_logs (user_id, confession_id) values (auth.uid(), p_confession);
  update public.confessions
    set boosted_until = now() + interval '6 hours', boost_score = boost_score + 1
    where id = p_confession;

  return jsonb_build_object('ok', true, 'quota', quota, 'used', used + 1, 'remaining', quota - used - 1);
end;
$$;
grant execute on function public.boost_confession(uuid) to authenticated;
