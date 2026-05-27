-- =====================================================================
-- Anonix · Kategori sistemi (Stage 15)
-- Idempotent. SQL Editor'de çalıştırın. Bağımlılık: confessions.
-- Not: mood_tag KORUNUR. category yeni temiz alandır; geriye dönük uyumluluk
--      için eski mood_tag verileri category'ye taşınır.
-- =====================================================================

-- 1) category alanı (nullable)
alter table public.confessions add column if not exists category text;

-- 2) index
create index if not exists confessions_category_idx on public.confessions (category);

-- 3) Geriye dönük taşıma: category boşsa mevcut mood_tag'i kopyala
update public.confessions
   set category = mood_tag
 where category is null and mood_tag is not null;
