-- =====================================================================
-- Anonix · Bakım & Veri Tutarlılığı (QA aşaması)
-- Bu dosya İKİ bölümden oluşur:
--   A) Eksik indeksler  -> güvenle çalıştırılır (idempotent, create if not exists)
--   B) Recount sorguları -> yalnızca sayaç sapması tespit edilince çalıştırın
-- =====================================================================

-- ---------------------------------------------------------------------
-- A) EKSİK İNDEKSLER (güvenli — istediğiniz zaman çalıştırın)
-- ---------------------------------------------------------------------
-- Mevcut olanlar (zaten kurulu): follows.follower_id, follows.following_id,
-- notifications.user_id, reports.status, messages(receiver_id) WHERE unread,
-- confessions.created_at, golge_posts.created_at, profiles.username vb.

-- Takip edilen kullanıcıların itiraflarını çekerken (.in('user_id', ids)) kullanılır:
create index if not exists confessions_user_idx on public.confessions (user_id);

-- Bir kullanıcının Gölge paylaşımlarını listelerken kullanılır:
create index if not exists golge_posts_user_idx on public.golge_posts (user_id);

-- Mesaj alıcısına göre genel sorgular (unread partial index'i tamamlar):
create index if not exists messages_receiver_idx on public.messages (receiver_id);

-- ---------------------------------------------------------------------
-- B) RECOUNT — yalnızca sayaçlar sapmışsa çalıştırın (idempotent, güvenli)
-- ---------------------------------------------------------------------

-- İtiraf beğeni sayacı (like_count) yeniden hesapla
update public.confessions c
set like_count = (
  select count(*) from public.confession_likes l where l.confession_id = c.id
)
where like_count <> (
  select count(*) from public.confession_likes l where l.confession_id = c.id
);

-- İtiraf yorum sayacı (comment_count) yeniden hesapla
update public.confessions c
set comment_count = (
  select count(*) from public.confession_comments cm where cm.confession_id = c.id
)
where comment_count <> (
  select count(*) from public.confession_comments cm where cm.confession_id = c.id
);

-- Gölge beğeni + yorum sayaçları
update public.golge_posts p
set like_count = (
  select count(*) from public.golge_likes gl where gl.golge_post_id = p.id
),
    comment_count = (
  select count(*) from public.golge_comments gc where gc.golge_post_id = p.id
);

-- ---------------------------------------------------------------------
-- TAKİP SAYILARI (followers_count / following_count)
-- ---------------------------------------------------------------------
-- NOT: Bu sayılar veritabanında DENORMALİZE EDİLMEMİŞTİR. Uygulama bunları
-- her seferinde follows tablosundan canlı sayar (lib/follows.ts getFollowCounts).
-- Bu yüzden ayrı bir "recount" gerekmez; sayılar her zaman tutarlıdır.
-- Doğrulamak isterseniz:
--   select following_id, count(*) as followers from public.follows group by following_id;
--   select follower_id,  count(*) as following  from public.follows group by follower_id;

-- ---------------------------------------------------------------------
-- PUANLAR (points) — ÖNERİ / DİKKATLİ KULLANIN
-- ---------------------------------------------------------------------
-- Puanlar tek bir tablodan türetilemez: itiraf(+150), beğeni(+6), yorum(+3),
-- Gölge(+200/+8/+4), referral(+250/+100), streak(+10/+25/+100) gibi çok
-- kaynaktan toplanır. Bu nedenle TAM ve güvenli bir otomatik recount YOKTUR.
--
-- Sapma şüphesi varsa önerilen yaklaşım:
--   1) Sapan kullanıcıyı tespit edin (örn. negatif/aşırı puan).
--   2) Etkileşim kaynaklarından YAKLAŞIK taban puanı hesaplayın:
--        confession*150 + (alınan beğeni)*6 + (alınan yorum)*3
--        + golge*200 + (golge beğeni)*8 + (golge yorum)*4
--   3) streak/referral bonuslarını ELLE ekleyin.
--   4) add_points(user_id, delta) RPC ile düzeltin (rütbeyi otomatik günceller).
-- Toplu otomatik üzerine yazma ÖNERİLMEZ (streak/referral puanını siler).

-- ---------------------------------------------------------------------
-- C) OPSİYONEL: itiraf/yorum rate-limit trigger'ları (Gölge'dekiyle paralel)
-- ---------------------------------------------------------------------
-- Şu an yalnızca Gölge paylaşımında DB rate-limit var (dakikada 5).
-- İstenirse itiraf için de eklenebilir. Varsayılan olarak KAPALI bırakıldı;
-- etkinleştirmek için aşağıyı yorumdan çıkarın.
--
-- create or replace function public.confession_rate_limit()
-- returns trigger language plpgsql security definer set search_path = public as $$
-- begin
--   if (select count(*) from public.confessions
--       where user_id = new.user_id and created_at > now() - interval '1 minute') >= 3 then
--     raise exception 'Çok hızlı itiraf paylaşıyorsunuz. Lütfen biraz bekleyin.'
--       using errcode = 'P0001';
--   end if;
--   return new;
-- end;
-- $$;
-- drop trigger if exists trg_confession_rate on public.confessions;
-- create trigger trg_confession_rate before insert on public.confessions
--   for each row execute function public.confession_rate_limit();
