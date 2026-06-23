-- ============================================================
-- Anonix — App Store incelemesi öncesi RİSKLİ İÇERİĞİ GİZLE
--
-- Apple App Review Guidelines'a göre KESİN RET sebebi olan içerikleri
-- moderation_status='rejected' yaparak feed'den gizler.
-- (Silmez — istenirse geri alınabilir: 'approved' yapmak yeterli.)
--
-- Feed sorguları yalnız moderation_status='approved' olanları gösterir,
-- dolayısıyla bu kayıtlar Keşfet/Gölge'de görünmez olur.
--
-- Supabase SQL Editor > yapıştır > RUN.
-- ============================================================
begin;

-- ── İTİRAFLAR ────────────────────────────────────────────────
-- f974e6bf : 17 yaşında reşit-olmayan cinsel içerik (Apple 1.1 + yasal)
-- a032b506 : rıza dışı cinsel eylem tarifi (uyurken dokunma)
-- 9aebbc24 : partnere rıza dışı şiddet / acıdan zevk
-- b8599fb2 : ensest temalı içerik
update public.confessions
set moderation_status = 'rejected'
where id in (
  'f974e6bf-0ddd-40cc-9eb2-a71a2449419c',
  'a032b506-6291-414e-9cc7-38092f5ffb33',
  '9aebbc24-2e1c-4a55-975a-4cc25168aa4c',
  'b8599fb2-ed2d-4657-9f62-fe5d2b43775e'
);

-- ── GÖLGE ────────────────────────────────────────────────────
-- d70370b7 : online kumar (slot) ekran görüntüsü (Apple 1.1 + TR yasa)
update public.golge_posts
set moderation_status = 'rejected'
where id = 'd70370b7-6751-4cab-8bc8-e38f896410cf';

-- Kontrol: kaç kayıt gizlendi?
do $$
declare c int; g int;
begin
  select count(*) into c from public.confessions where moderation_status='rejected';
  select count(*) into g from public.golge_posts where moderation_status='rejected';
  raise notice 'Gizlenen itiraf (toplam rejected): %, Gizlenen gölge: %', c, g;
end $$;

commit;

-- ── GERİ ALMAK İSTERSEN (çalıştırma, sadece referans):
-- update public.confessions set moderation_status='approved'
--   where id in ('f974e6bf-...','a032b506-...','9aebbc24-...','b8599fb2-...');
-- update public.golge_posts set moderation_status='approved'
--   where id='d70370b7-6751-4cab-8bc8-e38f896410cf';
