-- ============================================================
-- Anonix · Sahte hesapları sil, İÇERİĞİ KORU — DOĞRUDAN ÇALIŞTIR
-- Bu dosyanın tamamını Supabase SQL Editor'e yapıştırıp çalıştır.
-- Sarmal yorum (/* */) yok; "unterminated comment" hatası vermez.
--
-- Sahte hesaplar: e-postası @example.com olan 22 test hesabı.
-- İtiraf / Gölge / yorum içeriği rastgele gerçek kullanıcılara devredilir,
-- sonra sahte hesaplar silinir. GERİ ALINAMAZ.
-- ============================================================
begin;

alter table public.confessions          disable trigger user;
alter table public.golge_posts          disable trigger user;
alter table public.confession_comments  disable trigger user;
alter table public.golge_comments       disable trigger user;

-- (1) İTİRAFLAR
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

-- (5) Silmeyi engelleyebilecek tek RESTRICT FK'yi temizle
update public.reports set reviewed_by = null
where reviewed_by in (select id from auth.users where email like '%@example.com');

-- (6) Sahte hesapları sil (içerik artık gerçek kullanıcılarda)
delete from auth.users where email like '%@example.com';

commit;
