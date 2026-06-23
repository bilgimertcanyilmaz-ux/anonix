-- ============================================================
-- Anonix · Sahte hesap tespiti ve temizliği
--
-- profiles.id -> auth.users(id) ON DELETE CASCADE olduğundan, her
-- profilin mutlaka bir auth.users kaydı vardır. Sahte hesaplar da
-- gerçek auth.users satırı olarak oluşturulmuş olmalı (panelden elle
-- veya admin API ile). Gerçek kullanıcıdan ayırmak için auth sinyallerine
-- bakıyoruz: e-posta, sağlayıcı, son giriş, oluşturulma zamanı.
--
-- İçerik tabloları profiles'a ON DELETE CASCADE bağlı; bir hesabı
-- silince itirafları, Gölge gönderileri, yorumları, mesajları,
-- takipleri vb. de silinir.
--
-- KULLANIM:
--   1) Önce AŞAMA 1'i (SELECT) çalıştır, çıktıyı incele.
--   2) Sahte hesapların imzasını belirle (genelde: last_sign_in_at NULL,
--      e-posta yok/sahte, hepsi aynı dakikada oluşturulmuş).
--   3) AŞAMA 2'de silinecek id listesini doldur, BİR KEZ çalıştır.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- AŞAMA 1 · TEŞHİS (salt-okunur, hiçbir şey silmez)
-- Tüm profilleri auth sinyalleri + içerik sayılarıyla listeler.
-- ─────────────────────────────────────────────────────────────
select
  p.id,
  p.username,
  p.is_plus,
  p.created_at                               as profil_olusturma,
  u.email,
  u.raw_app_meta_data ->> 'provider'         as saglayici,     -- email / google / apple ...
  u.last_sign_in_at                          as son_giris,      -- NULL ise hiç giriş yapmamış
  u.email_confirmed_at                       as eposta_onay,
  (select count(*) from public.confessions         c  where c.user_id  = p.id) as itiraf,
  (select count(*) from public.golge_posts         g  where g.user_id  = p.id) as golge,
  (select count(*) from public.confession_comments cc where cc.user_id = p.id) as yorum
from public.profiles p
left join auth.users u on u.id = p.id
order by u.last_sign_in_at nulls first, p.created_at;

-- İPUCU: Aynı dakikada toplu oluşturulmuş hesapları bulmak için:
-- select date_trunc('minute', created_at) dk, count(*)
-- from auth.users group by 1 having count(*) > 1 order by 2 desc;


-- ─────────────────────────────────────────────────────────────
-- AŞAMA 2 · İÇERİĞİ KORUYARAK SAHTE HESAPLARI SİL
--
-- İstek: yorumlar + Gölge + itiraf paylaşımları KALSIN, ama sahte
-- hesaplar gitsin. on delete cascade yüzünden hesabı doğrudan silmek
-- içeriği de siler. Bu yüzden ÖNCE içeriğin sahipliğini gerçek
-- kullanıcılara devrediyoruz, SONRA hesapları siliyoruz.
--
-- TESPİT (2026-06-22): 40 hesaptan 22'si sahte test hesabı; ortak
-- imza @example.com (msgtest/golge/eng/adm/sec/ref/tgl/fa/fb/home_demo
-- testleri). Gerçek 18 kullanıcının hiçbiri @example.com kullanmıyor.
-- ─────────────────────────────────────────────────────────────

-- 2a) ÖNCE BUNU ÇALIŞTIR — silinecek 22 sahte hesabı doğrula (salt-okunur).
--     22 satır dönmeli ve hepsinin e-postası @example.com olmalı.
select p.id, p.username, u.email,
       (select count(*) from public.confessions         c  where c.user_id  = p.id) as itiraf,
       (select count(*) from public.golge_posts         g  where g.user_id  = p.id) as golge,
       (select count(*) from public.confession_comments cc where cc.user_id = p.id)
       + (select count(*) from public.golge_comments    gc where gc.user_id = p.id) as yorum
from public.profiles p
join auth.users u on u.id = p.id
where u.email like '%@example.com'
order by u.created_at;

-- 2b) Yukarıdaki listeyi onayladıysan AŞAĞIDAKİ BLOĞU çalıştır.
--     Sahte hesapların İTİRAF / GÖLGE / YORUM içeriğini rastgele gerçek
--     kullanıcılara dağıtır, sonra sahte hesapları siler. İçerik kalır;
--     yalnızca test etkileşimleri (mesaj/takip/beğeni kaydı vb.) gider.
--     GERİ ALINAMAZ.
/*
begin;

-- updated_at / puan / bildirim tetikleyicileri devirde tetiklenmesin.
alter table public.confessions          disable trigger user;
alter table public.golge_posts          disable trigger user;
alter table public.confession_comments  disable trigger user;
alter table public.golge_comments       disable trigger user;

-- (1) İTİRAFLAR — sahte sahipleri rastgele gerçek kullanıcılara devret
with reals as (
  select p.id, row_number() over (order by random()) as rn
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email not like '%@example.com'
),
rc as (select count(*)::int as n from reals),
tgt as (
  select t.id as tid,
         ((row_number() over (order by random()) - 1) % (select n from rc)) + 1 as slot
  from public.confessions t
  where t.user_id in (select id from auth.users where email like '%@example.com')
)
update public.confessions t
set user_id = r.id
from tgt join reals r on r.rn = tgt.slot
where t.id = tgt.tid;

-- (2) GÖLGE GÖNDERİLERİ
with reals as (
  select p.id, row_number() over (order by random()) as rn
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email not like '%@example.com'
),
rc as (select count(*)::int as n from reals),
tgt as (
  select t.id as tid,
         ((row_number() over (order by random()) - 1) % (select n from rc)) + 1 as slot
  from public.golge_posts t
  where t.user_id in (select id from auth.users where email like '%@example.com')
)
update public.golge_posts t
set user_id = r.id
from tgt join reals r on r.rn = tgt.slot
where t.id = tgt.tid;

-- (3) İTİRAF YORUMLARI
with reals as (
  select p.id, row_number() over (order by random()) as rn
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email not like '%@example.com'
),
rc as (select count(*)::int as n from reals),
tgt as (
  select t.id as tid,
         ((row_number() over (order by random()) - 1) % (select n from rc)) + 1 as slot
  from public.confession_comments t
  where t.user_id in (select id from auth.users where email like '%@example.com')
)
update public.confession_comments t
set user_id = r.id
from tgt join reals r on r.rn = tgt.slot
where t.id = tgt.tid;

-- (4) GÖLGE YORUMLARI
with reals as (
  select p.id, row_number() over (order by random()) as rn
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email not like '%@example.com'
),
rc as (select count(*)::int as n from reals),
tgt as (
  select t.id as tid,
         ((row_number() over (order by random()) - 1) % (select n from rc)) + 1 as slot
  from public.golge_comments t
  where t.user_id in (select id from auth.users where email like '%@example.com')
)
update public.golge_comments t
set user_id = r.id
from tgt join reals r on r.rn = tgt.slot
where t.id = tgt.tid;

alter table public.confessions          enable trigger user;
alter table public.golge_posts          enable trigger user;
alter table public.confession_comments  enable trigger user;
alter table public.golge_comments       enable trigger user;

-- (5) Silmeyi engelleyebilecek tek RESTRICT FK'yi temizle (reports.reviewed_by)
update public.reports set reviewed_by = null
where reviewed_by in (select id from auth.users where email like '%@example.com');

-- (6) Sahte hesapları sil. İçerik artık gerçek kullanıcılarda; yalnızca
--     test etkileşimleri (mesaj/takip/beğeni kaydı/bildirim) cascade ile gider.
delete from auth.users where email like '%@example.com';

commit;
*/

-- 2c) (Opsiyonel) Devirden sonra doğrula: sahte hesapta İÇERİK KALMAMALI (0),
--     ve toplam itiraf/Gölge/yorum sayısı devirden önceki ile AYNI olmalı.
--     select count(*) from public.confessions;  -- vb.
