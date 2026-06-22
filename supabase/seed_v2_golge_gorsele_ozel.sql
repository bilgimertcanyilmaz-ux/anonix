-- ============================================================
-- Anonix — SON 30 GÖLGE paylaşımına GÖRSELE ÖZEL, BENZERSİZ yorum + beğeni
--
--   * Her yorum, gönderinin GERÇEK görseline bakılarak elle yazıldı.
--     (manzara, kedi, köpek, Kız Kulesi, rakı sofrası, plaj vb.)
--   * Hiçbir yorum tekrar etmez; hepsi o fotoğrafa özeldir.
--   * Beğeniler golge_posts.like_count'a eklenir.
--   * Yorum yazarı rastgele profillerden seçilir (gönderi sahibi hariç).
--   * Mevcut verilere EKLENİR, hiçbir şey silinmez.
--
-- Supabase SQL Editor > New query > yapıştır > RUN.  BİR KEZ çalıştırın.
-- ============================================================
begin;

alter table public.golge_comments disable trigger user;

-- ─────────────────────────────────────────────────────────────
-- 1) GÖRSELE ÖZEL YORUMLAR
-- ─────────────────────────────────────────────────────────────
insert into public.golge_comments (golge_post_id, user_id, content, created_at)
select
  x.pid,
  (select p.id from public.profiles p where p.id <> gp.user_id order by random() limit 1),
  x.txt,
  gp.created_at + random() * (now() - gp.created_at)
from (values
  -- g01 — deniz + şehir manzarası (çatılar, mavi gökyüzü)
  ('2736712f-9c89-47f4-802a-7af12ef8a64c'::uuid, $c$Çatıların arasından bu deniz manzarası tam huzur, balkondan çekmişsin sanırım.$c$),
  ('2736712f-9c89-47f4-802a-7af12ef8a64c'::uuid, $c$Gökyüzünün mavisiyle denizin rengi birbirine karışmış, kapak olur resmen.$c$),
  ('2736712f-9c89-47f4-802a-7af12ef8a64c'::uuid, $c$Burası İzmir kıyısı gibi geldi, deniz tertemiz görünüyor maşallah.$c$),

  -- g02 — beyaz kedi, yeşil göz, siyah kuyruk
  ('c8fdcbc8-84ae-47c1-b443-faab839d6aa4'::uuid, $c$Patilerini birleştirip oturuşu resmen lord gibi, çok asil bir kedi maşallah.$c$),
  ('c8fdcbc8-84ae-47c1-b443-faab839d6aa4'::uuid, $c$Yeşil gözleri bir noktaya kilitlenmiş, kesin tavandaki sineği izliyor.$c$),
  ('c8fdcbc8-84ae-47c1-b443-faab839d6aa4'::uuid, $c$Kuyruğunun ucu kömür gibi simsiyah, beyaz tüylerine çok yakışmış.$c$),

  -- g03 — gece, ağaçtan yenidünya toplayan genç
  ('f3adb258-e523-4c61-a193-1cb84829207e'::uuid, $c$Gece gece ağaca dadanmışsın, yenidünya mı o, tam mevsimi valla.$c$),
  ('f3adb258-e523-4c61-a193-1cb84829207e'::uuid, $c$Komşunun ağacı değildir umarım, ekoseli gömlekle olayı tatlı yapmışsın.$c$),
  ('f3adb258-e523-4c61-a193-1cb84829207e'::uuid, $c$Bu saatte meyve toplama enerjisi başka, afiyet olsun şimdiden.$c$),

  -- g04 — beyaz çamurlu pickup (Ford Ranger), kırsal
  ('e7b0a6b6-241d-4158-ab3e-f14c454bb835'::uuid, $c$Ranger çamuru görmüş belli ki, direkt off-road yapmışsın.$c$),
  ('e7b0a6b6-241d-4158-ab3e-f14c454bb835'::uuid, $c$Tepedeki ledli bar ile tam arazi canavarı olmuş, helal.$c$),
  ('e7b0a6b6-241d-4158-ab3e-f14c454bb835'::uuid, $c$Beyaza çamur değişik yakışıyor, bu araç yola değil toprağa doğmuş.$c$),

  -- g05 — araba aynasından kırsal yeşil tarla
  ('98f695c7-cc67-4c78-b48b-2dbd67485638'::uuid, $c$Aynada yağmur damlaları, dışarıda yeşillik... tam yol keyfi karesi.$c$),
  ('98f695c7-cc67-4c78-b48b-2dbd67485638'::uuid, $c$Şu tarlaların yeşili insanın içini açıyor, nereye gidiyordun böyle?$c$),
  ('98f695c7-cc67-4c78-b48b-2dbd67485638'::uuid, $c$Cam kenarı bu manzara varsa yol ne kadar uzun olsa dert değil.$c$),

  -- g06 — sevimli yavru köpek (çoban köpeği), saksılar
  ('63dfa5c4-0464-4758-9752-1376eb667d2c'::uuid, $c$Bu surat ne ya, kalbim eridi resmen, kaç günlük bu minik?$c$),
  ('63dfa5c4-0464-4758-9752-1376eb667d2c'::uuid, $c$Kulakları yeni yeni dikiliyor, çoban köpeği yavrusu gibi duruyor maşallah.$c$),
  ('63dfa5c4-0464-4758-9752-1376eb667d2c'::uuid, $c$Saksıların önünde öyle masum oturmuş ki, hemen sahiplenesim geldi.$c$),
  ('63dfa5c4-0464-4758-9752-1376eb667d2c'::uuid, $c$Adı ne bunun, pati pati her şeyiyle harika olmuş vallahi.$c$),

  -- g07 — Kız Kulesi gece, İstanbul Boğaz
  ('cd7732d8-f0a0-4740-b364-6e6926ace199'::uuid, $c$Kız Kulesi gece bambaşka, suya vuran ışığı tam kadraja oturtmuşsun.$c$),
  ('cd7732d8-f0a0-4740-b364-6e6926ace199'::uuid, $c$Arkada Süleymaniye de seçiliyor, İstanbul''un en güzel hali bu.$c$),
  ('cd7732d8-f0a0-4740-b364-6e6926ace199'::uuid, $c$Bu manzaraya bakıp aşık olmamak imkansız, eline sağlık.$c$),

  -- g08 — tepeden gece şehir ışıkları
  ('f3481fe3-0585-4d39-ad57-95bdbaa422ae'::uuid, $c$Şehrin ışıkları yıldız gibi yayılmış, tepeden bakınca her şey küçülüyor.$c$),
  ('f3481fe3-0585-4d39-ad57-95bdbaa422ae'::uuid, $c$Aşağıda binlerce hayat, sen yukarıda izliyorsun; fotoğraf bunu hissettiriyor.$c$),
  ('f3481fe3-0585-4d39-ad57-95bdbaa422ae'::uuid, $c$Gece böyle bir manzaraya karşı oturmak paha biçilemez, çok huzurlu.$c$),

  -- g09 — açık kitap + buzlu kahve, palmiye, gün batımı
  ('957b5034-133e-46d1-a8df-46d04d802a2d'::uuid, $c$Kitap, buzlu kahve, deniz kenarı ve gün batımı... huzurun tarifi bu işte.$c$),
  ('957b5034-133e-46d1-a8df-46d04d802a2d'::uuid, $c$Palmiyelerin arasından süzülen ışık muhteşem, hangi kitap bu merak ettim.$c$),
  ('957b5034-133e-46d1-a8df-46d04d802a2d'::uuid, $c$Bu kareyi görünce direkt tatile gitmek istedim, çok dingin bir an.$c$),

  -- g10 — gece liman, ışıklı iskele, tekne SERENAY
  ('451e1f91-5b7e-4743-a48d-b8e942f0fcf5'::uuid, $c$İskelenin yeşil-mor ışıkları suya vurmuş, tekne de tam ortada poz vermiş.$c$),
  ('451e1f91-5b7e-4743-a48d-b8e942f0fcf5'::uuid, $c$SERENAY 55 demiş, kaptan abimize selam olsun, gece limanı bambaşka güzel.$c$),
  ('451e1f91-5b7e-4743-a48d-b8e942f0fcf5'::uuid, $c$Bu ışıklandırma şenlik gibi olmuş, sahil akşamları başka diyar.$c$),

  -- g11 — gün batımı, mavi bisiklet yolu, cadde
  ('41aa368e-0fec-423d-898e-f00539af9fca'::uuid, $c$Gökyüzü turuncuya dönmüş, o mavi bisiklet yolu fotoğrafı tamamlamış.$c$),
  ('41aa368e-0fec-423d-898e-f00539af9fca'::uuid, $c$Akşamüstü bu cadde bomboşken yürüyüş yapmanın keyfi ayrı olsa gerek.$c$),
  ('41aa368e-0fec-423d-898e-f00539af9fca'::uuid, $c$Bulutların arasından sızan ışık tam o "günün bittiği" hissini veriyor.$c$),

  -- g12 — TV önünde, akşam keyfi
  ('1ae8f100-80dc-44cd-87de-a189db4f6184'::uuid, $c$Film başlamış, ortam hazırlanmış, tam keyif modundasın belli ki.$c$),
  ('1ae8f100-80dc-44cd-87de-a189db4f6184'::uuid, $c$Kol saati de şık duruyor bu arada, akşamın tadını çıkar.$c$),
  ('1ae8f100-80dc-44cd-87de-a189db4f6184'::uuid, $c$Arkada film, önde sakin bir akşam... klasik kafa dinleme havası.$c$),

  -- g13 — online casino slot (KUMAR — UYARI)
  ('d70370b7-6751-4cab-8bc8-e38f896410cf'::uuid, $c$Bu slot oyunları kazandırıyor gibi görünür ama uzun vadede hep ev kazanır, dikkat et.$c$),
  ('d70370b7-6751-4cab-8bc8-e38f896410cf'::uuid, $c$"Mega Kazanç" yazısına aldanma, o ekran herkese aynı tuzağı kuruyor, paranı koru.$c$),
  ('d70370b7-6751-4cab-8bc8-e38f896410cf'::uuid, $c$Açıkçası bu siteler çok tehlikeli, küçük başlar büyük biter, kendine iyi bak.$c$),

  -- g14 — "10 DAKİKAYA GELİYORUM İNŞALLAH" notu (komik)
  ('d0c1eda9-90c9-47df-82c8-994e208bd55d'::uuid, $c$Esnaf mizahının zirvesi bu, "inşallah" kısmı her şeyi anlatıyor.$c$),
  ('d0c1eda9-90c9-47df-82c8-994e208bd55d'::uuid, $c$O 10 dakika Türkiye''de en az 2 saat demek, hepimiz biliyoruz.$c$),
  ('d0c1eda9-90c9-47df-82c8-994e208bd55d'::uuid, $c$Bu notu asan abimiz kesin efsane biridir, güldüm valla.$c$),

  -- g15 — balkondan şehir manzarası, bulutlar
  ('1720b86b-c988-46e7-8aa9-859955cbc207'::uuid, $c$Bulutlar resmen tabloya dönmüş, bu balkonda kahve içmek ayrıcalık.$c$),
  ('1720b86b-c988-46e7-8aa9-859955cbc207'::uuid, $c$Arkada dağlar, önde şehir... sıradan bir balkon değil bu, keyifli yer.$c$),
  ('1720b86b-c988-46e7-8aa9-859955cbc207'::uuid, $c$Gökyüzünün hali çok güzel, fırtına öncesi o sessizlik gibi.$c$),

  -- g16 — beyaz araba kapısından göl gün batımı
  ('3206a7d3-6b9e-408c-8eb8-ede10e35a4b4'::uuid, $c$Arabayı kenara çekip bu gün batımını izlemek, anın tadını çıkarmışsın.$c$),
  ('3206a7d3-6b9e-408c-8eb8-ede10e35a4b4'::uuid, $c$Göle vuran güneş ve o sessizlik, şehirden kaçmak böyle bir şey olsa gerek.$c$),
  ('3206a7d3-6b9e-408c-8eb8-ede10e35a4b4'::uuid, $c$Beyaz araba, turuncu gökyüzü, sakin su... kapak gibi kare olmuş.$c$),

  -- g17 — kırmızı ışıklı oda, galaksi projektör
  ('e97a7ec0-a7e2-4c7e-9c19-f515359b1121'::uuid, $c$Galaksi lambası odayı bambaşka yapmış, tam chill atmosferi olmuş.$c$),
  ('e97a7ec0-a7e2-4c7e-9c19-f515359b1121'::uuid, $c$Kırmızı ışık huzur veriyor resmen, müzik açıp dalmalık bir an.$c$),
  ('e97a7ec0-a7e2-4c7e-9c19-f515359b1121'::uuid, $c$Bu ışıklarla oda bambaşka olmuş, yalnız başına kafa dinleme havası güzel.$c$),

  -- g18 — araç içinden trafik, Adana (01 plaka)
  ('29ff81ce-409d-44e5-82bb-1025a176f95d'::uuid, $c$01 plaka Adana sıcağı belli oluyor, gökyüzü bembeyaz parlıyor.$c$),
  ('29ff81ce-409d-44e5-82bb-1025a176f95d'::uuid, $c$Trafikte cam kenarından çekilen kareler bir tuhaf güzel oluyor valla.$c$),
  ('29ff81ce-409d-44e5-82bb-1025a176f95d'::uuid, $c$Öndeki Renault''la araya mesafe koy abi, fotoğraf çekerken bile dikkat.$c$),

  -- g19 — rakı sofrası, meze, sigara, TV müzik
  ('308f796a-341f-4edf-963a-0d844938c8c1'::uuid, $c$Sofra tam kurulmuş, meze yerini almış; akşam uzun sürecek belli ki.$c$),
  ('308f796a-341f-4edf-963a-0d844938c8c1'::uuid, $c$Kavun peyniri görünce iş tamam dedim, klasik keyif sofrası, afiyet olsun.$c$),
  ('308f796a-341f-4edf-963a-0d844938c8c1'::uuid, $c$TV''de müzik, masada meze... düzeni kuran adam belli ki keyfini biliyor.$c$),

  -- g20 — sahilde Efes XTRA bira
  ('5dd30df7-0aa6-4a68-b73f-fd6c6f29df8a'::uuid, $c$Sıcakta sahil kenarı soğuk içecek, yazın en rahatlatıcı anlarından biri.$c$),
  ('5dd30df7-0aa6-4a68-b73f-fd6c6f29df8a'::uuid, $c$Deniz manzarasına karşı bu kare çok yazlık olmuş, serinlik buradan geliyor.$c$),
  ('5dd30df7-0aa6-4a68-b73f-fd6c6f29df8a'::uuid, $c$Kumda, güneşin altında... ilk yudumun keyfi gözünden okunuyor sanki.$c$),

  -- g21 — göl manzarası, elde İstanblue vodka
  ('0d5304b1-7a90-472f-991c-377044bea993'::uuid, $c$Göl kenarı, sakin su... kafa dağıtmak için birebir mekan seçmişsin.$c$),
  ('0d5304b1-7a90-472f-991c-377044bea993'::uuid, $c$Manzara güzel de tek başına mı bu keyif, biraz buruk geldi açıkçası.$c$),
  ('0d5304b1-7a90-472f-991c-377044bea993'::uuid, $c$Doğayla baş başa böyle oturmak iyi gelir, abartmadan tabii.$c$),

  -- g22 — Bell's viski + enerji içeceği + Ülker bitter çikolata
  ('2c20ba41-4e18-4baf-b03c-5ba006dbd293'::uuid, $c$Viskinin yanına bitter çikolata, kombini bilen adamsın belli ki.$c$),
  ('2c20ba41-4e18-4baf-b03c-5ba006dbd293'::uuid, $c$Açık havada bu sofra fena değil, gökyüzü de tertemiz çıkmış.$c$),
  ('2c20ba41-4e18-4baf-b03c-5ba006dbd293'::uuid, $c$%80 bitter seçimi ayrı bir olgunluk, damak tadın sağlam.$c$),

  -- g23 — göl/nehir, palmiyeler (Adana Seyhan)
  ('cb36c8cf-240e-401b-829d-0233cf357a87'::uuid, $c$Burası Adana Seyhan baraj gölü değil mi? Palmiyeleriyle tam tanıdık geldi.$c$),
  ('cb36c8cf-240e-401b-829d-0233cf357a87'::uuid, $c$Suyun turkuaza çalan rengi çok güzel, şehrin içinde böyle bir yer büyük şans.$c$),
  ('cb36c8cf-240e-401b-829d-0233cf357a87'::uuid, $c$Yürüyüş yolu, palmiyeler, göl... sabah sporu için bundan iyisi yok.$c$),

  -- g24 — gece sahil, Johnnie Walker Red Label, şehir ışıkları
  ('2b9bdc75-6170-432b-b687-1a7fdeaae135'::uuid, $c$Gece sahili, uzakta şehir ışıkları, kırmızı etiket... film sahnesi gibi kare.$c$),
  ('2b9bdc75-6170-432b-b687-1a7fdeaae135'::uuid, $c$Kumsalda gece bu manzaraya karşı oturmak ayrı bir huzur, çok iyi yansımış.$c$),
  ('2b9bdc75-6170-432b-b687-1a7fdeaae135'::uuid, $c$Dalga sesi geliyordur şimdi kulağına, tadını çıkar ama abartma derim.$c$),

  -- g25 — plaj, elde sigara, şişme bot, kalabalık
  ('746a2a87-f6a2-4174-8547-485a1f62c077'::uuid, $c$Yaz, deniz, kalabalık plaj... şu şişme bot çocukluğumu hatırlattı resmen.$c$),
  ('746a2a87-f6a2-4174-8547-485a1f62c077'::uuid, $c$Kumda oturup denizi izlemek var ya, en sevdiğim yaz aktivitesi bu.$c$),
  ('746a2a87-f6a2-4174-8547-485a1f62c077'::uuid, $c$Arkada millet denize girmiş, sen sahilden keyfine bakıyorsun, anı iyi yakalamışsın.$c$),

  -- g26 — plaj şezlong, deniz, şemsiyeler
  ('2ecb309e-b24c-43ff-886f-dd715cb548e3'::uuid, $c$Şezlongdan deniz manzarası, şemsiyeler dizili... tam "tatil modu açık" karesi.$c$),
  ('2ecb309e-b24c-43ff-886f-dd715cb548e3'::uuid, $c$Bacakları uzatıp denizi izlemek, dünyanın en güzel tembelliği bu.$c$),
  ('2ecb309e-b24c-43ff-886f-dd715cb548e3'::uuid, $c$Şortundaki "JUST DO" yazısı olayı tamamlamış, keyfine diyecek yok.$c$),

  -- g27 — akşam otopark, Tefal bilboard, Ankara (06)
  ('72a54c1e-7a98-4383-b2f9-2aee7d2a9d71'::uuid, $c$Tefal indirimleri başlamış demek, Efsane Cuma havası bilbordlardan akıyor.$c$),
  ('72a54c1e-7a98-4383-b2f9-2aee7d2a9d71'::uuid, $c$Akşamüstü otopark, lambalar yanmış, sıradan ama huzurlu bir Ankara karesi.$c$),
  ('72a54c1e-7a98-4383-b2f9-2aee7d2a9d71'::uuid, $c$06 plakalar dizilmiş, gökyüzünün o lacivert hali çok güzel çıkmış.$c$),

  -- g28 — araç içi, taksimetre 925 TL, kırmızı kapitone tavan
  ('49f208e1-f5f3-4a37-9bb7-719251cf2f7f'::uuid, $c$925 TL''lik yol epey uzunmuş, kırmızı kapitone tavan arabaya başka hava katmış.$c$),
  ('49f208e1-f5f3-4a37-9bb7-719251cf2f7f'::uuid, $c$Tavanı kapitoneyle kaplamak emek işi, araca el değmiş belli oluyor.$c$),
  ('49f208e1-f5f3-4a37-9bb7-719251cf2f7f'::uuid, $c$17.5 km''de 925 TL... fiyatlar uçmuş valla, bu yol pahalıya patlamış.$c$),

  -- g29 — placeholder görsel
  ('35ed9ab9-6670-43b1-aa49-78d49549e45d'::uuid, $c$Sade bir paylaşım olmuş, bazen kelimesiz kareler daha çok şey anlatıyor.$c$),
  ('35ed9ab9-6670-43b1-aa49-78d49549e45d'::uuid, $c$Renkleri güzel yakalamışsın, neyi anlatmak istediğini merak ettim açıkçası.$c$),

  -- g30 — placeholder + "Anılar biriktiriyorum"
  ('7cf04b7c-9ca1-4fae-9b66-e3aaf460d30c'::uuid, $c$"Anılar biriktiriyorum" demişsin, en kıymetli koleksiyon o zaten, devam et.$c$),
  ('7cf04b7c-9ca1-4fae-9b66-e3aaf460d30c'::uuid, $c$Bu söz çok güzel, anılar biriktikçe insan gerçekten zenginleşiyor.$c$),
  ('7cf04b7c-9ca1-4fae-9b66-e3aaf460d30c'::uuid, $c$Kelimeler kareden daha çok şey anlatmış bu sefer, çok hoş bir bakış açısı.$c$)
) as x(pid, txt)
join public.golge_posts gp on gp.id = x.pid;

-- ─────────────────────────────────────────────────────────────
-- 2) GÖRSELE/AĞIRLIĞA GÖRE BEĞENİ DAĞILIMI
-- ─────────────────────────────────────────────────────────────
update public.golge_posts gp
set like_count = like_count + v.add
from (values
  ('2736712f-9c89-47f4-802a-7af12ef8a64c'::uuid, 52),
  ('c8fdcbc8-84ae-47c1-b443-faab839d6aa4'::uuid, 88),
  ('f3adb258-e523-4c61-a193-1cb84829207e'::uuid, 19),
  ('e7b0a6b6-241d-4158-ab3e-f14c454bb835'::uuid, 34),
  ('98f695c7-cc67-4c78-b48b-2dbd67485638'::uuid, 27),
  ('63dfa5c4-0464-4758-9752-1376eb667d2c'::uuid, 96),
  ('cd7732d8-f0a0-4740-b364-6e6926ace199'::uuid, 73),
  ('f3481fe3-0585-4d39-ad57-95bdbaa422ae'::uuid, 41),
  ('957b5034-133e-46d1-a8df-46d04d802a2d'::uuid, 67),
  ('451e1f91-5b7e-4743-a48d-b8e942f0fcf5'::uuid, 38),
  ('41aa368e-0fec-423d-898e-f00539af9fca'::uuid, 45),
  ('1ae8f100-80dc-44cd-87de-a189db4f6184'::uuid, 16),
  ('d70370b7-6751-4cab-8bc8-e38f896410cf'::uuid, 4),
  ('d0c1eda9-90c9-47df-82c8-994e208bd55d'::uuid, 61),
  ('1720b86b-c988-46e7-8aa9-859955cbc207'::uuid, 31),
  ('3206a7d3-6b9e-408c-8eb8-ede10e35a4b4'::uuid, 49),
  ('e97a7ec0-a7e2-4c7e-9c19-f515359b1121'::uuid, 22),
  ('29ff81ce-409d-44e5-82bb-1025a176f95d'::uuid, 18),
  ('308f796a-341f-4edf-963a-0d844938c8c1'::uuid, 29),
  ('5dd30df7-0aa6-4a68-b73f-fd6c6f29df8a'::uuid, 33),
  ('0d5304b1-7a90-472f-991c-377044bea993'::uuid, 21),
  ('2c20ba41-4e18-4baf-b03c-5ba006dbd293'::uuid, 25),
  ('cb36c8cf-240e-401b-829d-0233cf357a87'::uuid, 47),
  ('2b9bdc75-6170-432b-b687-1a7fdeaae135'::uuid, 36),
  ('746a2a87-f6a2-4174-8547-485a1f62c077'::uuid, 30),
  ('2ecb309e-b24c-43ff-886f-dd715cb548e3'::uuid, 44),
  ('72a54c1e-7a98-4383-b2f9-2aee7d2a9d71'::uuid, 23),
  ('49f208e1-f5f3-4a37-9bb7-719251cf2f7f'::uuid, 26),
  ('35ed9ab9-6670-43b1-aa49-78d49549e45d'::uuid, 12),
  ('7cf04b7c-9ca1-4fae-9b66-e3aaf460d30c'::uuid, 28)
) as v(pid, add)
where gp.id = v.pid;

-- ─────────────────────────────────────────────────────────────
-- 3) comment_count senkronizasyonu
-- ─────────────────────────────────────────────────────────────
update public.golge_posts gp
set comment_count = (
  select count(*) from public.golge_comments gc where gc.golge_post_id = gp.id
)
where gp.id in (
  '2736712f-9c89-47f4-802a-7af12ef8a64c','c8fdcbc8-84ae-47c1-b443-faab839d6aa4',
  'f3adb258-e523-4c61-a193-1cb84829207e','e7b0a6b6-241d-4158-ab3e-f14c454bb835',
  '98f695c7-cc67-4c78-b48b-2dbd67485638','63dfa5c4-0464-4758-9752-1376eb667d2c',
  'cd7732d8-f0a0-4740-b364-6e6926ace199','f3481fe3-0585-4d39-ad57-95bdbaa422ae',
  '957b5034-133e-46d1-a8df-46d04d802a2d','451e1f91-5b7e-4743-a48d-b8e942f0fcf5',
  '41aa368e-0fec-423d-898e-f00539af9fca','1ae8f100-80dc-44cd-87de-a189db4f6184',
  'd70370b7-6751-4cab-8bc8-e38f896410cf','d0c1eda9-90c9-47df-82c8-994e208bd55d',
  '1720b86b-c988-46e7-8aa9-859955cbc207','3206a7d3-6b9e-408c-8eb8-ede10e35a4b4',
  'e97a7ec0-a7e2-4c7e-9c19-f515359b1121','29ff81ce-409d-44e5-82bb-1025a176f95d',
  '308f796a-341f-4edf-963a-0d844938c8c1','5dd30df7-0aa6-4a68-b73f-fd6c6f29df8a',
  '0d5304b1-7a90-472f-991c-377044bea993','2c20ba41-4e18-4baf-b03c-5ba006dbd293',
  'cb36c8cf-240e-401b-829d-0233cf357a87','2b9bdc75-6170-432b-b687-1a7fdeaae135',
  '746a2a87-f6a2-4174-8547-485a1f62c077','2ecb309e-b24c-43ff-886f-dd715cb548e3',
  '72a54c1e-7a98-4383-b2f9-2aee7d2a9d71','49f208e1-f5f3-4a37-9bb7-719251cf2f7f',
  '35ed9ab9-6670-43b1-aa49-78d49549e45d','7cf04b7c-9ca1-4fae-9b66-e3aaf460d30c'
);

alter table public.golge_comments enable trigger user;

commit;
