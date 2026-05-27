-- =====================================================================
-- Anonix · İki paketli abonelik (Plus / Ultra Plus) — Stage 16
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: profiles, subscriptions.
-- Not: Mevcut is_plus / ödeme akışı KORUNUR. Yalnızca tier + boost eklenir.
-- =====================================================================

-- 1) profiles: paket + boost alanları
alter table public.profiles add column if not exists subscription_tier text not null default 'free';
alter table public.profiles add column if not exists plus_boosts integer not null default 0;

-- 2) index
create index if not exists profiles_subscription_tier_idx on public.profiles (subscription_tier);

-- 3) Geriye dönük migration: mevcut is_plus kullanıcılarını 'plus' yap
--    (Ultra Plus geçmişe dönük ayırt edilemez; mevcut Plus üyeler 'plus' kabul edilir.)
update public.profiles
   set subscription_tier = 'plus',
       plus_boosts = greatest(plus_boosts, 1)
 where is_plus = true and coalesce(subscription_tier, 'free') = 'free';

update public.profiles
   set subscription_tier = 'free', plus_boosts = 0
 where is_plus = false and subscription_tier is distinct from 'free';

-- 4) Kolon-güvenliği: authenticated yalnızca güvenli kolonları günceller.
--    (subscription_tier / plus_boosts / is_plus YAZILAMAZ — yalnız service_role.)
--    Stage 15 düzeltmesi: age_confirmed alanları da eklendi (profil tamamlama için).
grant update (
  username, gender, avatar_url, is_anonymous, theme_preference,
  notification_sound_enabled, message_sound_enabled,
  age_confirmed, age_confirmed_at, updated_at
) on public.profiles to authenticated;

-- 5) Abonelik süresi dolanları kapat — tier 'free' + boost 0
create or replace function public.expire_subscriptions()
returns integer language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update public.subscriptions set status = 'expired', updated_at = now()
    where status = 'active' and expires_at is not null and expires_at < now();

  update public.profiles
    set is_plus = false, subscription_tier = 'free', plus_boosts = 0, subscription_type = null
    where is_plus = true and plus_expires_at is not null and plus_expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;
