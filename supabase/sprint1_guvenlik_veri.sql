-- ============================================================================
-- SPRINT 1 — Güvenlik & Veri Bütünlüğü Paketi
--
-- ⚠️ SIRALAMA ÖNEMLİ: Önce kodu deploy edin (main'e push → Vercel "Ready"),
--    SONRA bu dosyayı çalıştırın. Yeni kod eski izinlerle de çalışır; ama bu
--    SQL eski koddaki select("*") çağrılarını kırar (açık sekmeler sayfa
--    yenileyene kadar profil yükleyemez — düşük trafik saatinde çalıştırın).
--
-- Bağımlılıklar (daha önce çalıştırılmış olmalı): schema.sql, confessions.sql,
--   golge.sql, comment_likes.sql, viral.sql (is_temporary/expires_at),
--   admin.sql (is_admin()).
--
-- İçerik:
--   A) profiles hassas kolon sızıntısı kapatılır (iyzico_customer_id, banned_reason)
--   B) Süresi geçen 24s itiraflar + onların yorum/beğenileri RLS ile gizlenir
--   C) Yorum silinince comment_count düşer (itiraf + Gölge) — eksik trigger
--   D) Eksik performans indeksleri          (transaction DIŞI — kilit penceresi kısa)
--   E) comment_count gerçek yorum sayısıyla senkron (like_count'a DOKUNULMAZ)
--
-- Idempotent: dosya tekrar çalıştırılabilir.
-- NOT: seed_confessions*.sql dosyalarını bundan sonra TEKRAR ÇALIŞTIRMAYIN —
--      şişirilmiş comment_count değerleriyle E bölümünün düzeltmesini geri bozarlar.
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- A) PROFİL GİZLİLİĞİ — kolon bazlı SELECT
--    Tablo geneli SELECT geri alınır; hassas iki kolon DIŞINDA kalan tüm
--    kolonlara kolon-bazlı SELECT verilir (liste dinamik üretilir; şema
--    kaymasında eksik/yanlış kolon riski yok).
--    DİKKAT: Bundan sonra istemcide profiles için select("*") ÇALIŞMAZ —
--    uygulama lib/profileColumns.ts'teki açık listeyi kullanır (kod güncellendi).
--    Yeni kolon eklerseniz: grant select (yeni_kolon) on public.profiles
--    to anon, authenticated;  (+ lib/profileColumns.ts)
--    BİLİNÇLİ KISIT: Bu engel admin kullanıcıları da kapsar (PostgREST'te
--    onlar da `authenticated` rolüdür). Admin panelin ileride banned_reason
--    göstermesi gerekirse service_role kullanan bir API route yazılmalı.
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name not in ('iyzico_customer_id', 'banned_reason');

  execute 'revoke select on table public.profiles from anon, authenticated';
  execute format(
    'grant select (%s) on table public.profiles to anon, authenticated', cols
  );
end $$;

-- service_role tam erişimini korur (ödeme/admin sunucu işlemleri etkilenmez).
grant select on table public.profiles to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- B) GEÇİCİ İTİRAF RLS — süresi geçen 24s itiraflar REST'ten okunamaz.
--    İstisna: sahibi görür; admin her şeyi görür.
--    (select auth.uid()) / (select is_admin()) biçimi: InitPlan'a çevrilir,
--    satır başına değil sorgu başına 1 kez çalışır (Supabase RLS lint önerisi).
-- ────────────────────────────────────────────────────────────────────────────
drop policy if exists "İtiraflar herkese açık" on public.confessions;
create policy "İtiraflar herkese açık"
  on public.confessions for select
  using (
    coalesce(is_temporary, false) = false
    or expires_at > now()
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

-- Yorum ve beğeniler ebeveyn itirafın görünürlüğüne bağlanır: itiraf bu
-- kullanıcıya görünmüyorsa (süresi dolmuş geçici itiraf) yorum/beğeni de
-- REST'ten okunamaz. RLS alt sorgusu sorgulayanın yetkisiyle çalışır,
-- yukarıdaki politika otomatik uygulanır.
drop policy if exists "Yorumlar herkese açık" on public.confession_comments;
create policy "Yorumlar herkese açık"
  on public.confession_comments for select
  using (
    exists (select 1 from public.confessions c where c.id = confession_id)
  );

drop policy if exists "Beğeniler herkese açık" on public.confession_likes;
create policy "Beğeniler herkese açık"
  on public.confession_likes for select
  using (
    exists (select 1 from public.confessions c where c.id = confession_id)
  );

-- ────────────────────────────────────────────────────────────────────────────
-- C) YORUM SİLME SAYAÇLARI — silinen yorum comment_count'u düşürür.
--    (Beğeni tarafında decrement zaten vardı; yorumda eksikti.)
--    Notlar:
--    • Yorum eklerken verilen +3 puan bilinçli olarak geri ALINMAZ.
--    • İtiraf silindiğinde yorumlar FK cascade ile silinir; trigger silinmiş
--      ebeveyne no-op UPDATE atar (0 satır) — zararsız, bilinçli kabul.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.on_confession_comment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.confessions
     set comment_count = greatest(0, comment_count - 1), updated_at = now()
   where id = old.confession_id;
  return old;
end $$;

drop trigger if exists trg_comment_delete on public.confession_comments;
create trigger trg_comment_delete
  after delete on public.confession_comments
  for each row execute function public.on_confession_comment_delete();

create or replace function public.on_golge_comment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.golge_posts
     set comment_count = greatest(0, comment_count - 1), updated_at = now()
   where id = old.golge_post_id;
  return old;
end $$;

drop trigger if exists trg_golge_comment_delete on public.golge_comments;
create trigger trg_golge_comment_delete
  after delete on public.golge_comments
  for each row execute function public.on_golge_comment_delete();

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- D) EKSİK İNDEKSLER — bilinçli olarak transaction DIŞINDA: her index kendi
--    kısa kilidini alır-bırakır; A-B-C'nin atomikliğini de etkilemez.
-- ════════════════════════════════════════════════════════════════════════════
create index if not exists confession_likes_user_idx    on public.confession_likes (user_id);
create index if not exists golge_likes_user_idx         on public.golge_likes (user_id);
create index if not exists comment_likes_user_idx       on public.comment_likes (user_id);
create index if not exists confessions_like_count_idx   on public.confessions (like_count desc);
create index if not exists confessions_comment_cnt_idx  on public.confessions (comment_count desc);
create index if not exists confessions_user_created_idx on public.confessions (user_id, created_at desc);
create index if not exists golge_posts_like_count_idx   on public.golge_posts (like_count desc);
create index if not exists golge_posts_comment_cnt_idx  on public.golge_posts (comment_count desc);
create index if not exists profiles_points_idx          on public.profiles (points desc);

-- ════════════════════════════════════════════════════════════════════════════
-- E) SAYAÇ SENKRONU — comment_count = gerçek yorum sayısı.
--    like_count bilinçli olarak DEĞİŞTİRİLMEZ. Transaction dışı + yalnızca
--    farklı satırlara dokunur (is distinct from) → tekrar çalıştırmak ucuz.
-- ════════════════════════════════════════════════════════════════════════════
update public.confessions c
   set comment_count = coalesce(x.n, 0)
  from (
    select confession_id, count(*)::int as n
      from public.confession_comments
     group by confession_id
  ) x
 where x.confession_id = c.id
   and c.comment_count is distinct from coalesce(x.n, 0);

update public.confessions c
   set comment_count = 0
 where c.comment_count <> 0
   and not exists (
     select 1 from public.confession_comments cc where cc.confession_id = c.id
   );

update public.golge_posts g
   set comment_count = coalesce(x.n, 0)
  from (
    select golge_post_id, count(*)::int as n
      from public.golge_comments
     group by golge_post_id
  ) x
 where x.golge_post_id = g.id
   and g.comment_count is distinct from coalesce(x.n, 0);

update public.golge_posts g
   set comment_count = 0
 where g.comment_count <> 0
   and not exists (
     select 1 from public.golge_comments gc where gc.golge_post_id = g.id
   );

-- ── Doğrulama (isteğe bağlı) ────────────────────────────────────────────────
-- select count(*) from public.confessions
--   where comment_count <> (select count(*) from public.confession_comments cc
--                            where cc.confession_id = confessions.id);  -- 0 olmalı
