-- =====================================================================
-- Anonix · Ses ayarları (bildirim/mesaj sesi tercihi)
-- Idempotent. SQL Editor'de çalıştırın.
-- =====================================================================

alter table public.profiles
  add column if not exists notification_sound_enabled boolean not null default true;
alter table public.profiles
  add column if not exists message_sound_enabled boolean not null default true;

-- Kullanıcı kendi ses tercihlerini güncelleyebilsin (Aşama 9 kolon sertleştirmesiyle uyumlu)
grant update (
  username, gender, avatar_url, is_anonymous, theme_preference,
  notification_sound_enabled, message_sound_enabled, updated_at
) on public.profiles to authenticated;
