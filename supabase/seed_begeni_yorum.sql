-- ============================================================
-- Anonix - İtiraflara ve Gölge paylaşımlarına İÇERİKLE İLGİLİ
-- sahte beğeni + yorum ekler.
--
--   * Yorumlar her gönderinin KATEGORİSİNE (itiraf) / MOOD etiketine
--     (Gölge) göre seçilir -> yazı veya görselle alakalı olur.
--   * Beğeniler ilgili tablonun like_count kolonuna organik olarak eklenir
--     (uygulama feed'i bu kolonu okur).
--   * Mevcut gönderilere EKLENİR, hiçbir şey silinmez.
--
-- Supabase SQL Editor > New query içine yapıştırıp BİR KEZ çalıştırın.
-- Tekrar çalıştırırsanız yorumlar/beğeniler ikiye katlanır.
-- Bağımlılık: profiles, confessions, confession_comments, golge_posts,
--             golge_comments (Aşama 2/3/5).
-- ============================================================
begin;

-- Profil yoksa yorumlara yazar atanamaz; erken çık.
do $$
begin
  if not exists (select 1 from public.profiles) then
    raise exception 'profiles tablosu boş. Önce en az birkaç profil oluşturun.';
  end if;
end $$;

-- Sayaç/puan/bildirim tetikleyicileri devre dışı: sayaçları elle yönetiyoruz,
-- gönderi sahiplerine yüzlerce sahte bildirim gitmesin.
alter table public.confession_comments disable trigger user;
alter table public.golge_comments      disable trigger user;

-- ─────────────────────────────────────────────────────────────
-- 1) İTİRAFLAR — kategoriye göre yorum + beğeni
-- ─────────────────────────────────────────────────────────────
do $$
declare
  rec    record;
  pool   text[];
  pick   text[];
  n      int;
  added  int;
  toplam int := 0;

  -- Genel (kategori bilinmeyen / 'Diğer') havuz
  g_genel text[] := array[
    'Paylaştığın için teşekkürler, çok içten gelmiş.',
    'Bu duyguyu fazlasıyla anlıyorum, yalnız değilsin.',
    'Yüreğine sağlık, taş gibi çok güzel anlatmışsın.',
    'Okurken resmen içime işledi bu satırlar.',
    'İçini dökmen iyi olmuş, hafiflemişsindir.',
    'Çok samimi bir itiraf, kaleme alışına hayran kaldım.',
    'Hepimiz buradayız, bu yükü tek başına taşıma.',
    'Bunu okumak bana iyi geldi, gerçekten teşekkürler.'
  ];
begin
  for rec in
    select id, category, mood_tag, created_at, comment_count
    from public.confessions
  loop
    -- Yorumlar gönderinin KONUSUNA göre seçilir -> yazıyla alakalı olur.
    pool := case coalesce(rec.category, rec.mood_tag, 'Diğer')

      when 'Aşk' then array[
        'Bu kadar saf bir aşkı okumak içimi ısıttı.',
        'Aşk tam da böyle bir şey işte, ellerine sağlık.',
        'Kalbim cızz etti, umarım mutlu sonla biter.',
        'Bence ona açıl, hayat kısa, pişman olma.',
        'İçimdeki kelebekleri hatırlattın resmen.',
        'Bu satırları direkt ona gönder bence.',
        'Umarım o da seni aynı şekilde seviyordur.',
        'İlk aşkın heyecanı sarmış seni, çok tatlı.',
        'Karşılıksız değil bu, sen de bir adım at.',
        'Gerçek aşk hâlâ varmış demek ki, ne güzel.',
        'Bu hisleri yaşayabilmek büyük şans, kıymetini bil.',
        'Okurken gülümsedim, aşkın bu hâli çok değerli.'
      ]

      when 'Fantezi' then array[
        'Evliliğe heyecan katmak işte tam böyle olur.',
        'Rutini kırmışsınız, ellerinize sağlık.',
        'Bunu ben de denemeliyim, ilham oldun resmen.',
        'Tutkuyu canlı tutmanın sırrı buymuş demek.',
        'Okurken bile heyecanlandım, çok cesursun.',
        'Çiftlere örnek bir paylaşım olmuş doğrusu.',
        'Bu fikri not aldım, harika bir sürpriz.',
        'Aşkın yeniden alevlendiği o an çok güzel anlatılmış.',
        'İlişkiye tam da bu enerji lazımdı, helal.',
        'Romantizm hâlâ yaşıyormuş, kanıtı bu itiraf.'
      ]

      when 'Aldatma' then array[
        'Çok ağır bir itiraf, içini dökmen yine de iyi olmuş.',
        'Doğruyu söylemek en zoru, bu cesaret istedi.',
        'Bu yükü taşımak hiç kolay değil, geçmiş olsun.',
        'Herkes hata yapar ama itiraf etmek başka bir şey.',
        'Umarım bir gün kendini affedebilirsin.',
        'Okurken üzüldüm, umarım dersini almışsındır.',
        'Karşı taraf için çok üzüldüm açıkçası.',
        'Pişmanlık her şeyi düzeltmez ama bir başlangıçtır.',
        'Bu kadar açık yazabilmen başlı başına cesaret.',
        'Zor bir durum, kendine de fazla yüklenme.'
      ]

      when 'Aile' then array[
        'Aile meselesi gerçekten yıpratıyor, dayan.',
        'Bu satırlarda kendimi gördüm, yalnız değilsin.',
        'Kan bağı her zaman kolay değil maalesef.',
        'Umarım zamanla her şey yoluna girer, sabret.',
        'Bunu yaşamak çok zor, yüreğine sağlık.',
        'Konuşarak çözülür umarım, iletişim çok önemli.',
        'Senin suçun yok, sakın kendini suçlama.',
        'Aynı dertten ben de muzdaribim, anlıyorum seni.',
        'Bu yükü paylaşman bile büyük bir adım.',
        'Umarım huzuru bulursun, fazlasıyla hak ediyorsun.'
      ]

      when 'Korku' then array[
        'Tüylerim diken diken oldu okurken.',
        'Gece yarısı okumamalıydım bunu, çok ürpertici.',
        'İnanması güç ama anlatımın çok etkileyici.',
        'Bu gerçekten başına mı geldi, korkunç.',
        'Okurken nefesimi tuttum resmen.',
        'İçim ürperdi, gerilimi çok iyi vermişsin.',
        'Bunu yaşamak çok korkutucu olmalı, geçmiş olsun.',
        'Kapıyı iki kez kontrol ettim şimdi.',
        'Aman kendine çok dikkat et, tekinsiz iş bu.',
        'Tam bir kâbus, anlatımına hayran kaldım.'
      ]

      when 'Pişmanlık' then array[
        'Pişmanlık en ağır duygu, seni çok iyi anlıyorum.',
        'Geçmişi değiştiremeyiz ama ders alabiliriz.',
        'Kendini affet, sonuçta hepimiz hata yapıyoruz.',
        'Bu satırlar çok içten, yüreğine sağlık.',
        'Keşkelerle yaşamak zor, kendine iyi bak.',
        'Geç olduğunu düşünme, telafi şansı hep vardır.',
        'İçini dökmen iyi olmuş, hafiflemişsindir.',
        'Aynı pişmanlığı ben de taşıyorum maalesef.',
        'Zaman her yarayı sarar derler, umarım öyle olur.',
        'Bu dersi unutma yeter, gözün hep ileride olsun.'
      ]

      when 'Dram' then array[
        'Gözlerim doldu okurken, çok dokunaklı.',
        'Ne kadar zor bir hikâye, sakın pes etme.',
        'Yüreğine sağlık, hepimizin taşıdığı bir derdi var.',
        'Bu satırlar çok ağır geldi, geçmiş olsun.',
        'Güçlüsün, bunları yazabilmek bile cesaret ister.',
        'Umarım daha güzel günler seni bekliyordur.',
        'İçten içe ağladım resmen, çok etkileyici.',
        'Hayat bazen çok acımasız olabiliyor, dayan.',
        'Bu kadar dürüst paylaşımın için teşekkürler.',
        'Yalnız değilsin, hepimiz tam da buradayız.'
      ]

      when 'Utanç' then array[
        'Utanacak bir şey yok, sonuçta hepimiz insanız.',
        'Bunu yazman bile büyük cesaret, takma kafana.',
        'Herkesin böyle anıları vardır, yalnız değilsin.',
        'Gülümsedim okurken, o kadar da kötü değil.',
        'Zamanla unutulur bunlar, hiç dert etme.',
        'Bu kadar dürüst olabilmen takdire değer.',
        'İçini dökmen iyi olmuş, rahatlamışsındır.',
        'Hepimizin dolabında böyle iskeletler var.',
        'Kendine bu kadar yüklenme, geçer bunlar.',
        'Cesurca bir itiraf, bence gurur duymalısın.'
      ]

      when 'İş Hayatı' then array[
        'İş yeri stresi gerçekten yıpratıyor, dayan.',
        'Aynı şeyleri ben de yaşıyorum, anlıyorum seni.',
        'Patron faktörü işte, geçmiş olsun.',
        'Hakkını ara derim, sakın sessiz kalma.',
        'İş hayatı bazen çok adaletsiz olabiliyor.',
        'Bu ortamda çalışmak kolay değil, güçlü ol.',
        'Kariyer mi huzur mu, gerçekten zor seçim.',
        'Umarım daha iyi bir fırsat çıkar karşına.',
        'Mesai stresini çok iyi anlatmışsın.',
        'Bu yükü taşımak zor, kendine iyi bak.'
      ]

      when 'Okul' then array[
        'Okul yılları işte, en güzeli de en zoru da.',
        'Bunu ben de lisede aynen yaşamıştım.',
        'Öğretmen faktörü hayat değiştiriyor gerçekten.',
        'Sınav stresi hepimizi benzer yapıyor.',
        'Okul anıları hiç unutulmuyor, çok tatlı.',
        'Keşke o günlerin kıymetini bilseymişiz.',
        'Aynı sınıfta olsak kesin arkadaş olurduk.',
        'Gençlik işte, hatasıyla güzeliyle.'
      ]

      when 'Komik' then array[
        'Kahkahayı bastım resmen, ellerine sağlık.',
        'Çok komiksin, günümü güzelleştirdin.',
        'Gülmekten karnım ağrıdı valla.',
        'Bu benim de başıma gelmişti, ölüyorum gülmekten.',
        'Komedi dehası olmuşsun, helal.',
        'Çay burnumdan geldi okurken.',
        'İşte güne böyle başlamak lazım, güldürdün.',
        'Efsane anlatım, kahkaha garantili.'
      ]

      else g_genel
    end;

    -- Konuya uygun havuzdan 4-7 FARKLI yorum seç.
    n := 4 + floor(random() * 4)::int;                 -- 4..7
    if n > array_length(pool, 1) then n := array_length(pool, 1); end if;

    pick := (
      select array_agg(x)
      from (select unnest(pool) as x order by random() limit n) q
    );

    insert into public.confession_comments
      (confession_id, user_id, content, is_anonymous, like_count, created_at)
    select
      rec.id,
      (select id from public.profiles order by random() limit 1),  -- her yorum farklı yazar
      s.content,
      true,
      floor(random() * 40)::int,                        -- yoruma 0..39 organik beğeni
      rec.created_at + random() * (now() - rec.created_at)
    from unnest(pick) as s(content);

    added := coalesce(array_length(pick, 1), 0);

    -- Sayaçları elle güncelle: yorum +added, beğeni organik artış.
    update public.confessions
      set comment_count = comment_count + added,
          like_count    = like_count
                         + added * (2 + floor(random() * 4)::int)  -- yorum başına 2-5 beğeni
                         + floor(random() * 15)::int,              -- +0..14 taban
          updated_at    = now()
      where id = rec.id;

    toplam := toplam + added;
  end loop;

  raise notice 'İtiraflara eklenen yorum sayısı: %', toplam;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 2) GÖLGE — mood etiketine göre (GÖRSEL + duygu) yorum + beğeni
-- ─────────────────────────────────────────────────────────────
do $$
declare
  rec    record;
  pool   text[];
  pick   text[];
  n      int;
  added  int;
  toplam int := 0;

  -- Genel (mood bilinmeyen) havuz — görsele dair
  g_genel text[] := array[
    'Bu kareyi çok beğendim, ellerine sağlık.',
    'Fotoğraf çok etkileyici, gözümü alamadım.',
    'Bu görsel atmosferiyle resmen beni içine çekti.',
    'Çok özel bir kare olmuş, paylaştığın için teşekkürler.',
    'Bu fotoğrafa bayıldım, kelimeler yetmez.',
    'Yazıyla görseli birleştirmen harika olmuş.'
  ];
begin
  for rec in
    select id, mood_tag, created_at, comment_count
    from public.golge_posts
  loop
    -- Yorumlar gönderinin MOOD etiketine göre -> görselle/duyguyla alakalı.
    pool := case rec.mood_tag

      when 'Sessizlik' then array[
        'Bu karedeki sessizlik resmen hissediliyor.',
        'Fotoğraf öyle sakin ki, içim huzur buldu.',
        'Bu kareye bakınca sesim kısılıyor sanki.',
        'Atmosfer çok dingin, gözümü alamadım.',
        'Bu fotoğraf bin kelimeden fazlasını anlatıyor.',
        'Sessizliğin bu kadar güzel görseli olur mu.'
      ]
      when 'Kaos' then array[
        'Karede bir karmaşa var ama çok etkileyici.',
        'Bu görsel içimdeki kaosu anlatmış resmen.',
        'Karmakarışık ama tam da bu yüzden güzel.',
        'Fotoğraftaki enerji insanı içine çekiyor.',
        'Bu kare tam kafamın içi gibi, çok iyi.',
        'Kaosun bile bir estetiği varmış, kanıtı bu.'
      ]
      when 'Aşk' then array[
        'Bu karede resmen aşk var, çok romantik.',
        'Fotoğraf bile sevgiyle çekilmiş belli.',
        'Bu görsele bakınca içim ısındı.',
        'Aşkı tek bir kareye sığdırmışsın, helal.',
        'Çok tatlı bir an yakalamışsın.',
        'Bu fotoğraf sevdiğimi hatırlattı bana.'
      ]
      when 'Yalnızlık' then array[
        'Bu karedeki yalnızlık yüreğime dokundu.',
        'Fotoğraf tam şu anki ruh hâlimi anlatıyor.',
        'Bu kareye bakınca içim burkuldu.',
        'Yalnız ama huzurlu, tam da öyle hissettim.',
        'Bu fotoğrafta kendimi gördüm sanki.',
        'Yalnızlığın bu kadar güzel hâli olmaz.'
      ]
      when 'Huzur' then array[
        'Bu kareye bakınca resmen rahatladım.',
        'Fotoğraftaki huzur bana da geçti.',
        'Gözlerim dinlendi, çok huzurlu bir kare.',
        'Bu görsel meditasyon gibi, çok güzel.',
        'İçimi bir ferahlık kapladı, ellerine sağlık.',
        'Tam da ihtiyacım olan sakinlik bu kare.'
      ]
      when 'Doğa' then array[
        'Doğanın bu hâline doyum olmaz, harika kare.',
        'Bu manzaraya bakmaya doyamadım.',
        'Fotoğraf nefes aldırdı resmen, çok güzel.',
        'Doğanın huzuru bu karede saklanmış.',
        'Bu yeşillik içimi açtı, teşekkürler.',
        'Manzara muhteşem, keşke orada olsam.'
      ]
      when 'Cesaret' then array[
        'Bu kareyi paylaşman bile cesaret, harika.',
        'Fotoğrafta bir duruş var, çok etkileyici.',
        'Cesaretin kareye yansımış resmen.',
        'Bu görsel bana ilham verdi, teşekkürler.',
        'Dik duruşun fotoğrafa bile yansımış.',
        'Bu kare insana güç veriyor, çok güzel.'
      ]
      when 'Anı' then array[
        'Bu kare bende bir anıyı canlandırdı.',
        'Fotoğraf nostaljik bir his bıraktı.',
        'Bu görsel eski günleri hatırlattı bana.',
        'Anılar böyle saklanır işte, çok güzel kare.',
        'Bu fotoğrafa bakınca geçmişe gittim.',
        'Bir anıyı ölümsüzleştirmişsin, helal.'
      ]
      when 'Özlem' then array[
        'Bu karede özlem var, içim cızz etti.',
        'Fotoğraf birini özletti bana resmen.',
        'Özlemin bu kadar güzel hâli olur mu.',
        'Bu görsele bakınca boğazım düğümlendi.',
        'Özlediklerimi hatırlattın, çok dokunaklı.',
        'Bu kare tam da o özlem hissini veriyor.'
      ]
      when 'Umut' then array[
        'Bu kare umut doluydu, içim aydınlandı.',
        'Fotoğraftaki ışık umut gibi, çok güzel.',
        'Bu görsele bakınca içime umut doldu.',
        'Yarına dair umut veren bir kare, teşekkürler.',
        'Karanlıkta bir ışık gibi bu fotoğraf.',
        'Umudu hatırlattın bana, ellerine sağlık.'
      ]
      when 'Nostalji' then array[
        'Bu kare resmen nostalji kokuyor.',
        'Fotoğraf eski zamanlara götürdü beni.',
        'Nostaljik atmosfer çok güzel yakalanmış.',
        'Bu görsel çocukluğumu hatırlattı.',
        'Eski film karesi gibi, çok özel olmuş.',
        'Bu fotoğrafta geçmişin izleri var.'
      ]
      when 'Kayboluş' then array[
        'Bu karede kaybolmak isterdim resmen.',
        'Fotoğraf insanı içine çekip kaybediyor.',
        'Bu görselde kendimi kaybettim, çok güzel.',
        'Kaybolmanın bile güzel hâli bu kare.',
        'Bu atmosferde yıllarca kalabilirim.',
        'Gözlerim karenin içinde kayboldu.'
      ]
      when 'Gece' then array[
        'Gecenin bu hâli büyülü, harika kare.',
        'Bu fotoğraf tam gece moduna uygun.',
        'Gece atmosferi çok güzel yansımış.',
        'Bu kareye gece bakmak bambaşka.',
        'Gecenin sessizliği bu fotoğrafta saklanmış.',
        'Bu görsel gece ruhuma iyi geldi.'
      ]
      when 'Şehir' then array[
        'Şehrin bu hâlini çok sevdim, harika kare.',
        'Bu fotoğrafta şehrin ruhu var.',
        'Şehir ışıkları çok güzel yakalanmış.',
        'Bu kare metropol yalnızlığını anlatıyor.',
        'Kalabalığın içinde bir sakinlik bu fotoğraf.',
        'Bu görsel şehre olan aşkımı hatırlattı.'
      ]

      else g_genel
    end;

    -- Mood havuzundan 3-6 FARKLI yorum seç.
    n := 3 + floor(random() * 4)::int;                 -- 3..6
    if n > array_length(pool, 1) then n := array_length(pool, 1); end if;

    pick := (
      select array_agg(x)
      from (select unnest(pool) as x order by random() limit n) q
    );

    insert into public.golge_comments
      (golge_post_id, user_id, content, created_at)
    select
      rec.id,
      (select id from public.profiles order by random() limit 1),  -- her yorum farklı yazar
      s.content,
      rec.created_at + random() * (now() - rec.created_at)
    from unnest(pick) as s(content);

    added := coalesce(array_length(pick, 1), 0);

    update public.golge_posts
      set comment_count = comment_count + added,
          like_count    = like_count
                         + added * (3 + floor(random() * 5)::int)  -- yorum başına 3-7 beğeni
                         + floor(random() * 20)::int,              -- +0..19 taban
          updated_at    = now()
      where id = rec.id;

    toplam := toplam + added;
  end loop;

  raise notice 'Gölge paylaşımlarına eklenen yorum sayısı: %', toplam;
end $$;

-- Tetikleyicileri geri aç.
alter table public.confession_comments enable trigger user;
alter table public.golge_comments      enable trigger user;

commit;
