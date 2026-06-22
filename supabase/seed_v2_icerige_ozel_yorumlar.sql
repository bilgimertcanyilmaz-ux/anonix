-- ============================================================
-- Anonix — SON 30 İTİRAFA İÇERİĞE ÖZEL, BENZERSİZ yorum + beğeni
--
--   * Her yorum, ilgili gönderinin GERÇEK metnine göre elle yazıldı.
--     Hiçbir yorum tekrar etmez, hepsi o itirafa özeldir.
--   * Beğeniler like_count'a eklenir (feed bu kolonu okur).
--   * Yorum yazarı rastgele profillerden seçilir (gönderi sahibi hariç).
--   * Yorum tarihleri gönderi tarihi ile şimdi arasına dağıtılır.
--   * Mevcut verilere EKLENİR, hiçbir şey silinmez.
--
-- Supabase SQL Editor > New query > yapıştır > RUN.  BİR KEZ çalıştırın.
-- ============================================================
begin;

-- Bildirim/sayaç tetikleyicilerini kapat (gönderi sahibine spam gitmesin).
alter table public.confession_comments disable trigger user;

-- ─────────────────────────────────────────────────────────────
-- 1) İÇERİĞE ÖZEL YORUMLAR
-- ─────────────────────────────────────────────────────────────
insert into public.confession_comments
  (confession_id, user_id, content, is_anonymous, like_count, created_at)
select
  x.cid,
  (select p.id from public.profiles p where p.id <> c.user_id order by random() limit 1),
  x.txt,
  true,
  floor(random() * 14)::int,
  c.created_at + random() * (now() - c.created_at)
from (values
  -- b796b101 — kuzenin dul arkadaşı, ona benzeyenleri seçme
  ('b796b101-aa48-40a2-9d61-532b51f44064'::uuid, $c$Ona benzeyen kızları özellikle seçmen olayı resmen takıntı boyutuna gelmiş, bunu bir uzmanla konuşsan iyi olur.$c$),
  ('b796b101-aa48-40a2-9d61-532b51f44064'::uuid, $c$"Ablacım" demesi aslında her şeyi açıklıyor, sen kafanda bambaşka bir senaryo kurmuşsun.$c$),
  ('b796b101-aa48-40a2-9d61-532b51f44064'::uuid, $c$Dul olması ilgini çekiyor diyorsun ama bence ulaşamadığın için bu kadar istiyorsun.$c$),
  ('b796b101-aa48-40a2-9d61-532b51f44064'::uuid, $c$Bu kadar hayal kurup kendini yıpratacağına net konuşsan, reddedilsen bile rahatlarsın.$c$),

  -- 5156cc5f — arkadaşının nişanını bitirdi, aldatma kanıtı
  ('5156cc5f-b334-4c69-8e28-914d0f0e8652'::uuid, $c$İyi ki o videoları çekip göndermişsin, o çocuk senin sayende ömür boyu sürecek bir kabustan kurtulmuş.$c$),
  ('5156cc5f-b334-4c69-8e28-914d0f0e8652'::uuid, $c$2 sene boyunca o çocuğu kullanan birine "arkadaşım" demek bin şahit ister, doğru olanı yapmışsın.$c$),
  ('5156cc5f-b334-4c69-8e28-914d0f0e8652'::uuid, $c$Çocuğun görücü usulü mutlu olmasına sevinmen kalbinin temiz olduğunu gösteriyor.$c$),
  ('5156cc5f-b334-4c69-8e28-914d0f0e8652'::uuid, $c$Tuvalete gidiyorum deyip kalkman tam zamanlamaydı resmen, herkese nasip olmaz bu refleks.$c$),

  -- 9c402378 — 51 yaş, arkadaşının 24 yaşındaki oğlu
  ('9c402378-0688-4dfd-a7ed-97fe1089286c'::uuid, $c$Arkadaşının oğlu olması işin en kırılgan yeri, ortaya çıkarsa o dostluk bir anda biter.$c$),
  ('9c402378-0688-4dfd-a7ed-97fe1089286c'::uuid, $c$Annesine yalan söyleyip 2-3 gün kalması bir noktada mutlaka patlak verecek gibi duruyor.$c$),
  ('9c402378-0688-4dfd-a7ed-97fe1089286c'::uuid, $c$Mutlu olmana sevindim ama bu hikayenin sonu pek tatlı bitmez gibi, hazırlıklı ol.$c$),

  -- 5b12fc57 — köle fantezisi + eşin gaz problemi
  ('5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03'::uuid, $c$Fantezi kısmını geçtim ama gaz meselesinde resmen yıkıldım, kahkahayı bastım kusura bakma.$c$),
  ('5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03'::uuid, $c$Bu bağırsak gazı utanılacak değil tıbbi bir durum, bir dahiliyeciye görünmesi gerçekten lazım.$c$),
  ('5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03'::uuid, $c$Bakliyatı kestin de bir ara probiyotik dene, bazen bağırsak florası bu işi çözüyor.$c$),
  ('5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03'::uuid, $c$Vibratör derken bir anda osuruk muhabbetine bağlanması cidden beklenmedikti valla.$c$),

  -- f974e6bf — 17 yaşında, sexting, riskli ilişki (KORUYUCU TON)
  ('f974e6bf-0ddd-40cc-9eb2-a71a2449419c'::uuid, $c$17 yaşındasın ve bu kişi seni tuvalete, inşaata götürüyor — bu seni kullanıyor, lütfen kendini koru.$c$),
  ('f974e6bf-0ddd-40cc-9eb2-a71a2449419c'::uuid, $c$Bu yaşta korunmasız ilişki çok riskli, en kısa sürede bir sağlık kontrolünden geç lütfen.$c$),
  ('f974e6bf-0ddd-40cc-9eb2-a71a2449419c'::uuid, $c$Bağımlılık dediğin şey aslında ilgi açlığı olabilir, güvendiğin bir yetişkinle konuşman çok önemli.$c$),

  -- aa04614a — 40 yaş evli kadın, porno + stajyer
  ('aa04614a-257c-48b8-999c-ce848b9b60a1'::uuid, $c$Günde 3-4 kez artık alışkanlık değil bağımlılık seviyesi, bırakmak istesen bile kolay olmayacak.$c$),
  ('aa04614a-257c-48b8-999c-ce848b9b60a1'::uuid, $c$Stajyerle başlaması işi iyice tehlikeye atmış, hem işin hem evliliğin aynı anda risk altında.$c$),
  ('aa04614a-257c-48b8-999c-ce848b9b60a1'::uuid, $c$Eski sevgiliyi özlemen aslında kocanla konuşman gereken o boşluğu işaret ediyor olabilir.$c$),

  -- e3c15ec5 — 38 anne, komşunun oğlu
  ('e3c15ec5-3be1-4dd6-9d14-d380d148b2ff'::uuid, $c$Kocan yanında uyurken bunları düşünmen aranızdaki mesafenin ne kadar açıldığını gösteriyor.$c$),
  ('e3c15ec5-3be1-4dd6-9d14-d380d148b2ff'::uuid, $c$"Cinsel hayatımız ölü" dediğin yer asıl üzerine gidilmesi gereken yer, gerisi onun yan etkisi.$c$),
  ('e3c15ec5-3be1-4dd6-9d14-d380d148b2ff'::uuid, $c$Komşu çocuğu olunca her bahçe karşılaşması kabusa döner, çok dikkatli ol.$c$),

  -- a032b506 — eşini zorla ikna, uyurken dokunma (RIZA İHLALİ — UYARI)
  ('a032b506-6291-414e-9cc7-38092f5ffb33'::uuid, $c$Eşin acı çekerken senin tahrik olman çok ciddi bir durum, mutlaka profesyonel destek al.$c$),
  ('a032b506-6291-414e-9cc7-38092f5ffb33'::uuid, $c$Uyurken rızası olmadan dokunmak tacizdir, bunu normalleştirme lütfen, bir uzmanla görüş.$c$),
  ('a032b506-6291-414e-9cc7-38092f5ffb33'::uuid, $c$Kontrol edemiyorum demek yardım istemenin ilk adımı, bunu ciddiye al ve harekete geç.$c$),

  -- 0ef3a41e — 28 erkek, escort, vahşi arayış (UYARI)
  ('0ef3a41e-8f51-417c-a6ec-f42e08a180de'::uuid, $c$Karşındaki ağlarken durmamanı normal görmen, ciddi bir empati problemine işaret ediyor.$c$),
  ('0ef3a41e-8f51-417c-a6ec-f42e08a180de'::uuid, $c$Porno toleransı sürekli yükseltir, her seferinde daha vahşisini aramanın sebebi tam da bu.$c$),
  ('0ef3a41e-8f51-417c-a6ec-f42e08a180de'::uuid, $c$Bu gidişatı tek başına durduramazsın, bir bağımlılık uzmanıyla konuşman gerekiyor.$c$),

  -- 9aebbc24 — 28, boğaz sıkma, acıdan zevk (UYARI)
  ('9aebbc24-2e1c-4a55-975a-4cc25168aa4c'::uuid, $c$Partnerinin acı çekmesinden zevk alıp rızasını almıyorsan bu çok tehlikeli bir sınır.$c$),
  ('9aebbc24-2e1c-4a55-975a-4cc25168aa4c'::uuid, $c$Bu düşüncelerle yatıp kalkıyorum diyorsun, ciddiyim, bir terapistle konuşman şart.$c$),
  ('9aebbc24-2e1c-4a55-975a-4cc25168aa4c'::uuid, $c$"Kabul etmezse ne yaparım bilmiyorum" cümlen en çok endişelendiren kısım, lütfen yardım al.$c$),

  -- b8599fb2 — ensest temalı (HASSAS — YÖNLENDİRİCİ)
  ('b8599fb2-ed2d-4657-9f62-fe5d2b43775e'::uuid, $c$Kendinden iğrenmen aslında değerlerinle çatıştığını gösteriyor, bu yüzden bir uzmana gitmen iyi olur.$c$),
  ('b8599fb2-ed2d-4657-9f62-fe5d2b43775e'::uuid, $c$Bağımlılık seni gitmek istemediğin yere sürüklüyor, bununla tek başına savaşma.$c$),

  -- a31f6a3b — gizli BDSM, eşi habersiz
  ('a31f6a3b-6160-418d-8a1b-6123b4da2636'::uuid, $c$Kelepçeyi hediye edip şaka sanması aslında ona açıkça anlatman gerektiğinin işareti.$c$),
  ('a31f6a3b-6160-418d-8a1b-6123b4da2636'::uuid, $c$"Bağlasam nasıl tepki verir" diye uyurken izlemek çok tehlikeli bir çizgi, rıza olmadan asla.$c$),
  ('a31f6a3b-6160-418d-8a1b-6123b4da2636'::uuid, $c$Bu fantezileri paylaşmak ilişkini güçlendirebilir de bitirebilir de ama gizli taşımak en kötüsü.$c$),

  -- eab8526f — tanışma ilanı (yanlış platform)
  ('eab8526f-78e3-4f1b-9a8d-c03f01605d45'::uuid, $c$Reis burası tanışma sitesi değil itiraf platformu, sanırım yanlış kapıyı çaldın.$c$),
  ('eab8526f-78e3-4f1b-9a8d-c03f01605d45'::uuid, $c$Mersinli olduğunu anladık da bu tarz şeyler için bambaşka uygulamalar var.$c$),
  ('eab8526f-78e3-4f1b-9a8d-c03f01605d45'::uuid, $c$İtiraf bekliyorduk, ilan geldi; yine de hoş geldin diyelim bari.$c$),

  -- 726cc93d — askerde tanıştığı erkeğe hisler
  ('726cc93d-03aa-471a-b694-8c372811f242'::uuid, $c$Ailenin baskısıyla evlenmek ikinizi de mutsuz eder, önce kendine zaman tanı.$c$),
  ('726cc93d-03aa-471a-b694-8c372811f242'::uuid, $c$Bu hisleri spor yapıp işe dalarak bastıramazsın, önce kendine dürüst olman gerekiyor.$c$),
  ('726cc93d-03aa-471a-b694-8c372811f242'::uuid, $c$Ona açılmak bağı koparır diye korkuyorsun ama bu yükü tek başına taşımak daha ağır.$c$),
  ('726cc93d-03aa-471a-b694-8c372811f242'::uuid, $c$İçtiğin gece anlatmak isteyip vazgeçmen çok tanıdık, acele etme ama kendini de inkar etme.$c$),

  -- 97b1e07c — sigorta dolandırıcılığı
  ('97b1e07c-ca21-48ac-8f9a-8682dee500a7'::uuid, $c$İlk seferinde yakalanmadın diye ikincisinde de paçayı kurtaracağın anlamına gelmez, sigorta şirketleri bu işi biliyor.$c$),
  ('97b1e07c-ca21-48ac-8f9a-8682dee500a7'::uuid, $c$Vicdanın rahat değilse bu zaten cevabın kendisi, ikinci kazadan vazgeç.$c$),
  ('97b1e07c-ca21-48ac-8f9a-8682dee500a7'::uuid, $c$Karın sana güveniyorsa kaybedeceğin en büyük şey o güven olur, para gelir gider.$c$),

  -- 702f7482 — eski sevgiliyi 2 yıl takip
  ('702f7482-8fec-4e34-b014-31738953cd39'::uuid, $c$Arabayla arkalarından gitmen artık takip etmenin ötesine geçmiş, lütfen kendine gel.$c$),
  ('702f7482-8fec-4e34-b014-31738953cd39'::uuid, $c$2 yıl olmuş hâlâ her gün profilini kontrol ediyorsan bu sevgi değil takıntı.$c$),
  ('702f7482-8fec-4e34-b014-31738953cd39'::uuid, $c$Psikoloğa görünmek utanılacak değil tam tersine atabileceğin en mantıklı adım.$c$),

  -- 47c76417 — patronun karısı
  ('47c76417-2036-4fb8-ab92-aa142e365960'::uuid, $c$Patronun iyi adam diyorsun ama karısıyla mesajlaşarak ona zaten ihanet ediyorsun.$c$),
  ('47c76417-2036-4fb8-ab92-aa142e365960'::uuid, $c$Bu işin sonu hem işini hem itibarını aynı anda kaybetmek olabilir, çok iyi düşün.$c$),
  ('47c76417-2036-4fb8-ab92-aa142e365960'::uuid, $c$Kadın sana ilk adımı attıysa onun için sadece bir oyun olabilirsin, dikkatli ol.$c$),

  -- 001c65d4 — mahalledeki dul kadın
  ('001c65d4-a811-4f46-8f1c-c7dfd6f6d427'::uuid, $c$Daha başlamadan mahalle dedikodusundan korkuyorsan içinde zaten bir tereddüt var demektir.$c$),
  ('001c65d4-a811-4f46-8f1c-c7dfd6f6d427'::uuid, $c$Bir kahve ikramına bu kadar anlam yüklemeden, acele etmeden ilerlemekte fayda var.$c$),
  ('001c65d4-a811-4f46-8f1c-c7dfd6f6d427'::uuid, $c$Onun kendisini mi yoksa "dul" fikrini mi istediğini bir düşün derim.$c$),

  -- 769b9cc7 — taksici, müşteriye aşık
  ('769b9cc7-898c-4892-a79d-adba2f97c3b4'::uuid, $c$Her akşam aynı durakta binen biri için rotanı değiştirmen çok romantik ama o evli, zor iş.$c$),
  ('769b9cc7-898c-4892-a79d-adba2f97c3b4'::uuid, $c$El sallaması seni uçurmuş resmen ama bu tek taraflı kalırsa çok daha fazla yıpranırsın.$c$),
  ('769b9cc7-898c-4892-a79d-adba2f97c3b4'::uuid, $c$Adını sorduğunda dünyanın durması kısmı çok güzeldi ama iki çocuğu var, kendini koru.$c$),

  -- 11593dc3 — kız kardeşinin arkadaşı
  ('11593dc3-81cb-44dc-af73-2aff22d96139'::uuid, $c$Kardeşinin en yakın arkadaşı olması işi çok karıştırır, üstelik yaz bitince herkes dağılacak.$c$),
  ('11593dc3-81cb-44dc-af73-2aff22d96139'::uuid, $c$Dizine dokunması büyük ihtimalle sadece samimiyet, fazla anlam yükleme derim.$c$),
  ('11593dc3-81cb-44dc-af73-2aff22d96139'::uuid, $c$O dostluk kalıcı, bu yazlık bir heves olabilir; riske değer mi iyi tart.$c$),

  -- ca410221 — kumar borcu 1.2 milyon
  ('ca410221-486b-4aca-9ffd-d81400bcb75a'::uuid, $c$Kumarın dibi yoktur, evi satıp borcu kapatsan bile durmazsan yine aynı çukura düşersin.$c$),
  ('ca410221-486b-4aca-9ffd-d81400bcb75a'::uuid, $c$Karına söylemek şu an cehennem gibi gelir ama bu yükü tek taşıdıkça daha hızlı batıyorsun.$c$),
  ('ca410221-486b-4aca-9ffd-d81400bcb75a'::uuid, $c$AMATEM''in kumar bağımlılığı birimleri var, ciddiyim, asıl atman gereken adım o.$c$),
  ('ca410221-486b-4aca-9ffd-d81400bcb75a'::uuid, $c$Borcu kapatmaya değil önce kumarı bırakmaya odaklan, yoksa sıfırlasan da baştan başlarsın.$c$),

  -- 22cb4ed2 — iş yerinde evli kadın
  ('22cb4ed2-3e0a-4d20-a69a-78c8a5362f10'::uuid, $c$Kocası gece vardiyada diye yalnız olması seni davet ettiği anlamına gelmemeli.$c$),
  ('22cb4ed2-3e0a-4d20-a69a-78c8a5362f10'::uuid, $c$Ertesi gün hiçbir şey olmamış gibi davranması, bunun onun için sıradan olabileceğini gösteriyor.$c$),
  ('22cb4ed2-3e0a-4d20-a69a-78c8a5362f10'::uuid, $c$"Bitirmek istiyorum ama özlüyorum" dediğin yer tam da bağımlılığın tarifi.$c$),

  -- cf098b61 — 18 yaş, fantezi listesi
  ('cf098b61-3606-487d-bf53-ecb8d5d78992'::uuid, $c$Fantezi dünyan gerçekten rengarenkmiş, üstelik madde madde sıralaman ayrı güzel olmuş.$c$),
  ('cf098b61-3606-487d-bf53-ecb8d5d78992'::uuid, $c$Hiç sevgilin olmamış ama hayal gücün full kapasite çalışıyor, bu yaşta gayet normal.$c$),
  ('cf098b61-3606-487d-bf53-ecb8d5d78992'::uuid, $c$Uzun boylulara bakman maddesinde fena güldüm, gözlem yeteneğin gelişmiş belli ki.$c$),

  -- defc7f4d — ayda 2000 TL yaşam
  ('defc7f4d-1177-4e58-a9bf-0f37e9888052'::uuid, $c$Memnunsan kimseye hesap verme ama 27 yaşında tamamen aileye bağımlı olman ileride sorun olur.$c$),
  ('defc7f4d-1177-4e58-a9bf-0f37e9888052'::uuid, $c$Spora 1000 ayırıp kalanla oyun alman fena değil de, o 2000 bir gün kesilirse B planın ne?$c$),
  ('defc7f4d-1177-4e58-a9bf-0f37e9888052'::uuid, $c$Açıkçası ben de böyle yaşamak isterdim ama anne baba sonsuza kadar yanında olmayacak, o kısmı düşün.$c$),
  ('defc7f4d-1177-4e58-a9bf-0f37e9888052'::uuid, $c$Herkes "işe gir" diyorsa belki azıcık haklılardır, part-time bir şeyle başlasan oyun bütçen de büyür.$c$),

  -- 0a859708 — gizli ikinci hesap/hayat
  ('0a859708-82e3-46cd-9fe1-d74b85ec6ddd'::uuid, $c$İki kişilik arasında gidip gelmek çok yorucu, asıl soru gerçek hayatta bu ilgiyi neden bulamadığın.$c$),
  ('0a859708-82e3-46cd-9fe1-d74b85ec6ddd'::uuid, $c$Buluşmaktan son anda vazgeçmen aslında hâlâ bir sınırın olduğunu gösteriyor, bu iyi bir şey.$c$),
  ('0a859708-82e3-46cd-9fe1-d74b85ec6ddd'::uuid, $c$O hesapta özgür hissetmen, gerçek hayatında bir şeylerin eksik kaldığını anlatıyor.$c$),

  -- 96fe6ede — patronla ilişki, maaş 2 katı
  ('96fe6ede-8b0a-4889-b89f-3cd505fd7e1b'::uuid, $c$Maaşını iki katına çıkarıp karşılığında sessizlik istemesi, bunu daha önce de yaşadığını düşündürüyor.$c$),
  ('96fe6ede-8b0a-4889-b89f-3cd505fd7e1b'::uuid, $c$Karısının yanında seni "iş arkadaşı" diye tanıtması, onun için ne kadar değerli olduğunu söylüyor.$c$),
  ('96fe6ede-8b0a-4889-b89f-3cd505fd7e1b'::uuid, $c$Bu oyun heyecanlı gelebilir ama ortaya çıktığında kaybeden hep alttaki olur, yani sen.$c$),

  -- fb0346ec — eş kaybı 7 ay, bina yöneticisi
  ('fb0346ec-5cf3-47aa-84d4-66edccb90108'::uuid, $c$7 ay çok kısa bir süre, yalnızlığını aşkla karıştırıyor olabilirsin, kendine acele ettirme.$c$),
  ('fb0346ec-5cf3-47aa-84d4-66edccb90108'::uuid, $c$"Boşanacağım" cümlesi dünyanın en eski cümlelerinden, evli biri için çok dikkatli ol.$c$),
  ('fb0346ec-5cf3-47aa-84d4-66edccb90108'::uuid, $c$Eşinin gözleri hâlâ aklına geliyorsa henüz hazır değilsin, bu çok normal, kendine zaman ver.$c$),

  -- 8fecaa43 — geçmişte görüntü satma, şimdi Bim müdürü
  ('8fecaa43-d07e-4b8f-bc5c-6b352ff3547c'::uuid, $c$Geçmişin seni tanımlamaz, asıl önemli olan o günden bugüne kendini ne kadar değiştirdiğin.$c$),
  ('8fecaa43-d07e-4b8f-bc5c-6b352ff3547c'::uuid, $c$Şube müdürlüğüne kadar yükselmen gerçek karakterini gösteriyor, bununla gurur duymalısın.$c$),
  ('8fecaa43-d07e-4b8f-bc5c-6b352ff3547c'::uuid, $c$Söylemek ya da söylememek ona ne kadar güvendiğine bağlı, gerçek sevgi geçmişe takılmaz.$c$),

  -- 406dd00d — kabinde izlenme fantezisi
  ('406dd00d-24c5-4c5e-8d2f-4f2bd7f6309c'::uuid, $c$İzlenmekten hoşlanman utanılacak bir şey değil ama mutlaka güvenli sınırlar içinde olmalı.$c$),
  ('406dd00d-24c5-4c5e-8d2f-4f2bd7f6309c'::uuid, $c$Aynadaki açıları ayarladığını söylediğin yerde olayın ciddiyetini anladım, kendine dikkat et.$c$),
  ('406dd00d-24c5-4c5e-8d2f-4f2bd7f6309c'::uuid, $c$Bu hissi güvendiğin bir partnerle yaşamak, yabancıların önünde riske girmekten çok daha iyi.$c$),

  -- 5d60da88 — karşı binadaki adam izliyor (KORKU)
  ('5d60da88-93a7-4cda-996a-b00011c85df9'::uuid, $c$Telefonu karanlıkta sana doğru tuttuysa bu kesinlikle kuruntu değil, lütfen ciddiye al.$c$),
  ('5d60da88-93a7-4cda-996a-b00011c85df9'::uuid, $c$Polise gitmekten çekinme, seni deli yerine koymazlar; taciz şikayeti çok ciddi bir şeydir.$c$),
  ('5d60da88-93a7-4cda-996a-b00011c85df9'::uuid, $c$Perdeleri kalınıyla değiştir, kilitleri kontrol et ve yaşadıklarını tarih tarih not al, kanıt olur.$c$),
  ('5d60da88-93a7-4cda-996a-b00011c85df9'::uuid, $c$Mümkünse bir komşunu durumdan haberdar et, yalnız hissetmemen ve tanık olması önemli.$c$)
) as x(cid, txt)
join public.confessions c on c.id = x.cid;

-- ─────────────────────────────────────────────────────────────
-- 2) İÇERİĞE/AĞIRLIĞA GÖRE GERÇEKÇİ BEĞENİ DAĞILIMI
--    (şok/dram/korku → yüksek; problemli içerik → düşük)
-- ─────────────────────────────────────────────────────────────
update public.confessions c
set like_count = like_count + v.add
from (values
  ('b796b101-aa48-40a2-9d61-532b51f44064'::uuid, 23),
  ('5156cc5f-b334-4c69-8e28-914d0f0e8652'::uuid, 94),
  ('9c402378-0688-4dfd-a7ed-97fe1089286c'::uuid, 38),
  ('5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03'::uuid, 71),
  ('f974e6bf-0ddd-40cc-9eb2-a71a2449419c'::uuid, 9),
  ('aa04614a-257c-48b8-999c-ce848b9b60a1'::uuid, 31),
  ('e3c15ec5-3be1-4dd6-9d14-d380d148b2ff'::uuid, 27),
  ('a032b506-6291-414e-9cc7-38092f5ffb33'::uuid, 6),
  ('0ef3a41e-8f51-417c-a6ec-f42e08a180de'::uuid, 8),
  ('9aebbc24-2e1c-4a55-975a-4cc25168aa4c'::uuid, 7),
  ('b8599fb2-ed2d-4657-9f62-fe5d2b43775e'::uuid, 6),
  ('a31f6a3b-6160-418d-8a1b-6123b4da2636'::uuid, 33),
  ('eab8526f-78e3-4f1b-9a8d-c03f01605d45'::uuid, 14),
  ('726cc93d-03aa-471a-b694-8c372811f242'::uuid, 58),
  ('97b1e07c-ca21-48ac-8f9a-8682dee500a7'::uuid, 29),
  ('702f7482-8fec-4e34-b014-31738953cd39'::uuid, 41),
  ('47c76417-2036-4fb8-ab92-aa142e365960'::uuid, 47),
  ('001c65d4-a811-4f46-8f1c-c7dfd6f6d427'::uuid, 26),
  ('769b9cc7-898c-4892-a79d-adba2f97c3b4'::uuid, 63),
  ('11593dc3-81cb-44dc-af73-2aff22d96139'::uuid, 35),
  ('ca410221-486b-4aca-9ffd-d81400bcb75a'::uuid, 44),
  ('22cb4ed2-3e0a-4d20-a69a-78c8a5362f10'::uuid, 30),
  ('cf098b61-3606-487d-bf53-ecb8d5d78992'::uuid, 49),
  ('defc7f4d-1177-4e58-a9bf-0f37e9888052'::uuid, 77),
  ('0a859708-82e3-46cd-9fe1-d74b85ec6ddd'::uuid, 36),
  ('96fe6ede-8b0a-4889-b89f-3cd505fd7e1b'::uuid, 40),
  ('fb0346ec-5cf3-47aa-84d4-66edccb90108'::uuid, 55),
  ('8fecaa43-d07e-4b8f-bc5c-6b352ff3547c'::uuid, 43),
  ('406dd00d-24c5-4c5e-8d2f-4f2bd7f6309c'::uuid, 24),
  ('5d60da88-93a7-4cda-996a-b00011c85df9'::uuid, 66)
) as v(cid, add)
where c.id = v.cid;

-- ─────────────────────────────────────────────────────────────
-- 3) comment_count'u gerçek yorum sayısına göre senkronize et
-- ─────────────────────────────────────────────────────────────
update public.confessions c
set comment_count = (
  select count(*) from public.confession_comments cc where cc.confession_id = c.id
)
where c.id in (
  'b796b101-aa48-40a2-9d61-532b51f44064','5156cc5f-b334-4c69-8e28-914d0f0e8652',
  '9c402378-0688-4dfd-a7ed-97fe1089286c','5b12fc57-e1a4-4bb8-a91f-5a8c6a628b03',
  'f974e6bf-0ddd-40cc-9eb2-a71a2449419c','aa04614a-257c-48b8-999c-ce848b9b60a1',
  'e3c15ec5-3be1-4dd6-9d14-d380d148b2ff','a032b506-6291-414e-9cc7-38092f5ffb33',
  '0ef3a41e-8f51-417c-a6ec-f42e08a180de','9aebbc24-2e1c-4a55-975a-4cc25168aa4c',
  'b8599fb2-ed2d-4657-9f62-fe5d2b43775e','a31f6a3b-6160-418d-8a1b-6123b4da2636',
  'eab8526f-78e3-4f1b-9a8d-c03f01605d45','726cc93d-03aa-471a-b694-8c372811f242',
  '97b1e07c-ca21-48ac-8f9a-8682dee500a7','702f7482-8fec-4e34-b014-31738953cd39',
  '47c76417-2036-4fb8-ab92-aa142e365960','001c65d4-a811-4f46-8f1c-c7dfd6f6d427',
  '769b9cc7-898c-4892-a79d-adba2f97c3b4','11593dc3-81cb-44dc-af73-2aff22d96139',
  'ca410221-486b-4aca-9ffd-d81400bcb75a','22cb4ed2-3e0a-4d20-a69a-78c8a5362f10',
  'cf098b61-3606-487d-bf53-ecb8d5d78992','defc7f4d-1177-4e58-a9bf-0f37e9888052',
  '0a859708-82e3-46cd-9fe1-d74b85ec6ddd','96fe6ede-8b0a-4889-b89f-3cd505fd7e1b',
  'fb0346ec-5cf3-47aa-84d4-66edccb90108','8fecaa43-d07e-4b8f-bc5c-6b352ff3547c',
  '406dd00d-24c5-4c5e-8d2f-4f2bd7f6309c','5d60da88-93a7-4cda-996a-b00011c85df9'
);

-- Tetikleyicileri geri aç.
alter table public.confession_comments enable trigger user;

commit;
