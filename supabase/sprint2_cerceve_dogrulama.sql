-- ============================================================================
-- SPRINT 2 — Premium çerçeve sunucu doğrulaması
--
-- Sorun: Çerçeve seçimi yalnızca UI'da kilitliydi; REST'ten PATCH ile herkes
-- her temayı yazabiliyordu. Bu dosya kuralı veritabanında zorlar.
--
-- Kurallar (lib/themes.ts ile birebir aynı):
--   • Rütbe çerçeveleri puanla açılır: bronze 0, silver 3000, gold 15000,
--     platinum 60000, diamond 1000000
--   • Diğer tüm çerçeveler (anim-*, prem-*) Ultra Plus veya admin ister
--   • Bilinmeyen tema id'si reddedilir; null = çerçevesiz (her zaman serbest)
--
-- Idempotent. Sonda mevcut geçersiz seçimleri temizleyen tek seferlik UPDATE var.
-- ============================================================================

begin;

create or replace function public.premium_theme_allowed(
  p_theme text,
  p_points integer,
  p_tier text,
  p_role text
) returns boolean
language sql immutable as $$
  select case
    when p_theme is null then true
    -- Rütbe çerçeveleri: puan eşiği
    when p_theme = 'bronze'   then coalesce(p_points, 0) >= 0
    when p_theme = 'silver'   then coalesce(p_points, 0) >= 3000
    when p_theme = 'gold'     then coalesce(p_points, 0) >= 15000
    when p_theme = 'platinum' then coalesce(p_points, 0) >= 60000
    when p_theme = 'diamond'  then coalesce(p_points, 0) >= 1000000
    -- Ultra Plus çerçeveleri (animasyonlu + vektörel premium)
    when p_theme in (
      'anim-amethyst','anim-dragon','anim-crown','anim-wings','anim-rose','anim-sapphire',
      'prem-neon','prem-laurel','prem-flame','prem-ice','prem-galaxy',
      'prem-obsidian','prem-emperor','prem-crystal','prem-emerald','prem-phoenix'
    ) then (p_tier = 'ultra_plus' or p_role = 'admin')
    -- Bilinmeyen id: reddet
    else false
  end;
$$;

create or replace function public.enforce_premium_theme()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Yalnızca tema değişiyorsa doğrula (diğer profil güncellemeleri etkilenmez).
  if tg_op = 'UPDATE' and new.premium_theme is not distinct from old.premium_theme then
    return new;
  end if;
  if not public.premium_theme_allowed(
    new.premium_theme, new.points, new.subscription_tier, new.role
  ) then
    raise exception 'Bu çerçeveyi kullanmak için gereken koşulları sağlamıyorsun.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_premium_theme on public.profiles;
create trigger trg_enforce_premium_theme
  before insert or update of premium_theme on public.profiles
  for each row execute function public.enforce_premium_theme();

-- Tek seferlik temizlik: hak edilmeden yazılmış mevcut seçimleri kaldır.
update public.profiles
   set premium_theme = null
 where premium_theme is not null
   and not public.premium_theme_allowed(premium_theme, points, subscription_tier, role);

commit;

-- Doğrulama (isteğe bağlı): 0 dönmeli
-- select count(*) from public.profiles
--  where premium_theme is not null
--    and not public.premium_theme_allowed(premium_theme, points, subscription_tier, role);
