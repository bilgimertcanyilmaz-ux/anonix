-- =====================================================================
-- Anonix · Growth analytics + install ödülü
-- Idempotent. Bağımlılık: profiles, badges, user_badges, add_points, award_badge, is_admin().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) analytics_events
-- ---------------------------------------------------------------------
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  event      text not null,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_event_idx on public.analytics_events (event);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;
-- Herkes (anon dahil) kendi/anonim olayını ekleyebilir; yalnızca admin okur.
drop policy if exists "Analytics olay ekleme" on public.analytics_events;
create policy "Analytics olay ekleme"
  on public.analytics_events for insert
  with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Analytics olaylarini admin gorur" on public.analytics_events;
create policy "Analytics olaylarini admin gorur"
  on public.analytics_events for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) "İlk Destekçiler" rozeti + install ödülü
-- ---------------------------------------------------------------------
insert into public.badges (name, description, icon, required_points, badge_type) values
  ('İlk Destekçiler', 'Anonix''i uygulama olarak yükledi.', '🚀', 0, 'special')
on conflict (name) do nothing;

-- Kullanıcı PWA yükleyince bir kez çağrılır: rozet + bonus XP (yalnızca ilk kez)
create or replace function public.claim_install_reward()
returns void language plpgsql security definer set search_path = public as $$
declare bid uuid; already boolean;
begin
  if auth.uid() is null then return; end if;
  select id into bid from public.badges where name = 'İlk Destekçiler';
  if bid is null then return; end if;
  select exists(select 1 from public.user_badges where user_id = auth.uid() and badge_id = bid) into already;
  if not already then
    perform public.award_badge(auth.uid(), 'İlk Destekçiler');
    perform public.add_points(auth.uid(), 50);  -- kurulum bonusu
  end if;
end;
$$;
grant execute on function public.claim_install_reward() to authenticated;
