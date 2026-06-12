/**
 * profiles tablosundan istemcinin okuyabileceği kolonlar.
 *
 * NEDEN: Hassas kolonlar (iyzico_customer_id, banned_reason) kolon-bazlı
 * SELECT grant'i ile REST'e kapatıldı (supabase/sprint1_guvenlik_veri.sql).
 * Bu durumda `select("*")` PostgREST'te izin hatası verir — istemci her zaman
 * bu açık listeyi kullanmalı. Yeni kolon eklerken hem SQL grant'ine hem buraya ekle.
 */
export const PROFILE_SELECT = [
  "id",
  "username",
  "gender",
  "avatar_url",
  "is_anonymous",
  "is_plus",
  "points",
  "rank",
  "role",
  "is_banned",
  "plus_expires_at",
  "subscription_type",
  "subscription_tier",
  "plus_boosts",
  "streak_count",
  "last_active_date",
  "longest_streak",
  "referral_code",
  "referred_by",
  "theme_preference",
  "notification_sound_enabled",
  "message_sound_enabled",
  "premium_theme",
  "ghost_mode",
  "hide_online",
  "age_confirmed",
  "age_confirmed_at",
  "is_beta_user",
  "beta_invite_code",
  "created_at",
  "updated_at",
].join(", ");
