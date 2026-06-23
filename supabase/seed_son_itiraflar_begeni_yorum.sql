-- ============================================================
-- Anonix - SADECE EN SON eklenen itiraflara içerikle ilgili
-- sahte beğeni + yorum ekler. (Gölge'ye DOKUNMAZ.)
--
--   * En yeni 10 itiraf hedeflenir (created_at desc). Sayıyı
--     aşağıdaki "limit 10" değerinden değiştirebilirsiniz.
--   * Yorumlar itirafın KATEGORİSİNE göre seçilir -> yazıyla alakalı.
--   * Beğeni like_count kolonuna organik eklenir (feed bunu okur).
--   * EKLENİR, hiçbir şey silinmez. BİR KEZ çalıştırın.
-- ============================================================
begin;

do $$
begin
  if not exists (select 1 from public.profiles) then
    raise exception 'profiles tablosu boş. Önce en az birkaç profil oluşturun.';
  end if;
end $$;

alter table public.confession_comments disable trigger user;

do $$
declare
  rec    record;
  pool   text[];
  pick   text[];
  n      int;
  added  int;
  toplam int := 0;

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
  -- SADECE en yeni itiraflar (az önce attıkların en üstte olur).
  for rec in
    select id, category, mood_tag, created_at, comment_count
    from public.confessions
    order by created_at desc
    limit 10                                            -- <<< kaç itiraf? burayı değiştir
  loop
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
      (select id from public.profiles order by random() limit 1),
      s.content,
      true,
      floor(random() * 40)::int,
      rec.created_at + random() * (now() - rec.created_at)
    from unnest(pick) as s(content);

    added := coalesce(array_length(pick, 1), 0);

    update public.confessions
      set comment_count = comment_count + added,
          like_count    = like_count
                         + added * (2 + floor(random() * 4)::int)
                         + floor(random() * 15)::int,
          updated_at    = now()
      where id = rec.id;

    toplam := toplam + added;
  end loop;

  raise notice 'Hedeflenen itiraflara eklenen yorum sayısı: %', toplam;
end $$;

alter table public.confession_comments enable trigger user;

commit;
