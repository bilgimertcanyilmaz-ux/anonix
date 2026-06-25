-- ════════════════════════════════════════════════════════════════════
-- EXPLICIT İÇERİK TEMİZLİĞİ — App Store Guideline 1.2 uyumu
-- ════════════════════════════════════════════════════════════════════
-- Amacı: feed'de görünen müstehcen / pornografik içerikleri gizlemek.
-- moderation_status = 'rejected' yapılan kayıtlar feed sorgularında elenir.
--
-- Kelime listesi lib/moderation.ts içindeki EXPLICIT_SEXUAL_WORDS ile aynı
-- niyeti taşır. Tam kelime sınırı için \m \M (Postgres word boundary) kullanılır.
--
-- KULLANIM: Supabase SQL Editor'da çalıştır. Önce SELECT ile kaç kayıt
-- etkilendiğini gör, sonra UPDATE'i çalıştır.
-- ════════════════════════════════════════════════════════════════════

-- Ortak explicit regex (büyük/küçük harf duyarsız, kelime sınırlı).
-- NOT: '31 çek', 'amına sok' gibi çok kelimeli kalıplar doğrudan aranır.
\set explicit_re '\\m(sikiş|sikiştik|sikişmek|sikiştim|sikti|siktim|düzüştük|düzüşmek|boşaldım|boşaldı|boşal|orgazm|mastürbasyon|otuzbir|azdım|azdırdı|amıma|amını|götten|sakso|klitoris|penisimi|vajinama|döl|meni|porno|pornografik|sevişirken|memelerini)\\M|31 çek|tahrik oldum|içime boşal|içine boşal|amına sok|göt deliği|anal seks|oral seks|seks yaptık|seks yaptım|göğüslerini emdim'

-- 1) ÖNİZLEME — kaç itiraf etkilenecek?
SELECT id, left(content, 80) AS onizleme, mood_tag
FROM public.confessions
WHERE content ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 2) ÖNİZLEME — kaç gölge gönderisi etkilenecek?
SELECT id, left(coalesce(overlay_text, '') || ' ' || coalesce(caption, ''), 80) AS onizleme
FROM public.golge_posts
WHERE (coalesce(overlay_text, '') || ' ' || coalesce(caption, '')) ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 3) UYGULA — itirafları gizle.
UPDATE public.confessions
SET moderation_status = 'rejected'
WHERE content ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 4) UYGULA — gölge gönderilerini gizle.
UPDATE public.golge_posts
SET moderation_status = 'rejected'
WHERE (coalesce(overlay_text, '') || ' ' || coalesce(caption, '')) ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 5) Yorumları da temizle (varsa moderation_status kolonu).
-- confession_comments / golge_comments tablolarında kolon yoksa bu adımları atla.
UPDATE public.confession_comments
SET moderation_status = 'rejected'
WHERE content ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';

UPDATE public.golge_comments
SET moderation_status = 'rejected'
WHERE content ~* :'explicit_re'
  AND coalesce(moderation_status, 'approved') <> 'rejected';
