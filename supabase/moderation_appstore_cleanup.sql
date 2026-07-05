-- ════════════════════════════════════════════════════════════════════
-- APP STORE İÇERİK TEMİZLİĞİ — Guideline 1.1 (Objectionable Content)
-- ════════════════════════════════════════════════════════════════════
-- 2026-07-04 reddi: reviewer uygulamada "Fantezi 🔥" kategorisi + tutku/
-- buluşma temalı içerikleri gördü. Bu script:
--   1) "Fantezi" ve "Aldatma" kategorisindeki TÜM gönderileri gizler,
--   2) müstehcen/cinsel kelime içeren gönderileri gizler,
--   3) buluşma/eskort/uygunsuz teklif içeren gönderileri gizler.
--
-- moderation_status = 'rejected' yapılan kayıtlar feed sorgularında elenir
-- (silinmez; geri almak istersen 'approved' yapman yeterli).
--
-- KULLANIM: Supabase Dashboard → SQL Editor'da çalıştır.
--   • Önce (1)(2)(3) ÖNİZLEME SELECT'lerini çalıştırıp kaç kayıt göreceğini gör.
--   • Sonra (4)(5)(6)(7) UPDATE'leri çalıştır.
-- ════════════════════════════════════════════════════════════════════

-- Kaldırılan kategoriler (koddan da silindi: lib/categories.ts).
-- Müstehcen/cinsel regex (kelime sınırlı).
\set explicit_re '\\m(sikiş|sikiştik|sikişmek|sikiştim|sikti|siktim|düzüştük|düzüşmek|boşaldım|boşaldı|boşal|orgazm|mastürbasyon|otuzbir|azdım|azdırdı|amıma|amını|götten|sakso|klitoris|penisimi|vajinama|döl|meni|porno|pornografik|sevişirken|memelerini)\\M|31 çek|tahrik oldum|içime boşal|içine boşal|amına sok|göt deliği|anal seks|oral seks|seks yaptık|seks yaptım|göğüslerini emdim'

-- Buluşma / eskort / uygunsuz teklif regex.
\set solicit_re 'escort|eskort|sponsor arıyorum|sponsor aranıyor|sugar daddy|sugar baby|görüntülerimi para|görüntü karşılığı|video karşılığı para|para karşılığı görüş|ücretli görüş|seks partneri|cinsel partner|kaçamak arıyorum|kaçamak isteyen|gizli buluşalım|olan var ?mı\\?? ?\\+?[0-9]{2}\\+|\\+?18\\+ ?arayan'

-- ─────────────────────────────────────────────────────────────────────
-- 1) ÖNİZLEME — Fantezi / Aldatma kategorisindeki itiraflar
SELECT count(*) AS fantezi_aldatma_confessions
FROM public.confessions
WHERE (category IN ('Fantezi','Aldatma') OR mood_tag IN ('Fantezi','Aldatma'))
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 2) ÖNİZLEME — explicit/solicit içeren itiraflar
SELECT count(*) AS explicit_solicit_confessions
FROM public.confessions
WHERE (content ~* :'explicit_re' OR content ~* :'solicit_re')
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 3) ÖNİZLEME — etkilenen gölge gönderileri
SELECT count(*) AS golge_hits
FROM public.golge_posts
WHERE (
        mood_tag IN ('Fantezi','Aldatma')
        OR (coalesce(overlay_text,'') || ' ' || coalesce(caption,'')) ~* :'explicit_re'
        OR (coalesce(overlay_text,'') || ' ' || coalesce(caption,'')) ~* :'solicit_re'
      )
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- ─────────────────────────────────────────────────────────────────────
-- 4) UYGULA — Fantezi/Aldatma kategorisindeki itirafları gizle.
UPDATE public.confessions
SET moderation_status = 'rejected'
WHERE (category IN ('Fantezi','Aldatma') OR mood_tag IN ('Fantezi','Aldatma'))
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 5) UYGULA — explicit / solicit içeren itirafları gizle.
UPDATE public.confessions
SET moderation_status = 'rejected'
WHERE (content ~* :'explicit_re' OR content ~* :'solicit_re')
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 6) UYGULA — gölge gönderilerini gizle.
UPDATE public.golge_posts
SET moderation_status = 'rejected'
WHERE (
        mood_tag IN ('Fantezi','Aldatma')
        OR (coalesce(overlay_text,'') || ' ' || coalesce(caption,'')) ~* :'explicit_re'
        OR (coalesce(overlay_text,'') || ' ' || coalesce(caption,'')) ~* :'solicit_re'
      )
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- 7) UYGULA — yorumları temizle (kolon yoksa ilgili satırı atla).
UPDATE public.confession_comments
SET moderation_status = 'rejected'
WHERE (content ~* :'explicit_re' OR content ~* :'solicit_re')
  AND coalesce(moderation_status, 'approved') <> 'rejected';

UPDATE public.golge_comments
SET moderation_status = 'rejected'
WHERE (content ~* :'explicit_re' OR content ~* :'solicit_re')
  AND coalesce(moderation_status, 'approved') <> 'rejected';

-- ─────────────────────────────────────────────────────────────────────
-- 8) DOĞRULAMA — geriye kalan feed'de Fantezi/Aldatma kalmamalı (0 dönmeli).
SELECT count(*) AS kalan_gorunur_riskli
FROM public.confessions
WHERE (category IN ('Fantezi','Aldatma') OR mood_tag IN ('Fantezi','Aldatma'))
  AND coalesce(moderation_status, 'approved') <> 'rejected';
