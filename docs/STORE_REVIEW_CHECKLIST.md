# Anonix · Mağaza Onayı Kontrol Listesi (App Store / Google Play)

> Anonix bir web uygulamasıdır. Mağazaya çıkmak için sarmalama gerekir:
> **Google Play** → TWA/Bubblewrap · **App Store** → Capacitor/WKWebView.

## App Store — Kullanıcı İçerikleri (Guideline 1.2 & 5.1.1)
- [x] Objectionable içerik filtresi (otomatik moderasyon: PII/küfür/tehdit/cinsel/ifşa)
- [x] İçerik şikayet mekanizması (ReportButton)
- [x] Kötüye kullanan kullanıcıyı **engelleme** (BlockButton + `/settings/blocked-users`)
- [x] Şikayet sonrası hızlı gizleme (3 şikayet → pending_review) + admin inceleme
- [x] **Uygulama içi hesap silme** (5.1.1(v)) — `/settings/account`
- [ ] 24 saat içinde moderasyon aksiyonu (operasyonel süreç — araç hazır: `/admin/pending`)
- [ ] Yaş derecesi: **17+** (anonim UGC + olası müstehcen dil)
- [x] Gizlilik politikası bağlantısı uygulamada erişilebilir

## Google Play — Kullanıcı İçerikleri (UGC Policy)
- [x] İçerik moderasyonu + şikayet + engelleme + hesap silme
- [x] Rızasız fotoğraf / kişisel veri yasağı (kurallar + UGC onay kutusu)
- [ ] **Data Safety formu** (aşağıdaki veri türleriyle doldurulacak)
- [ ] İçerik derecelendirme anketi: **Mature 17+**
- [x] Çocuk güvenliği politikası (Topluluk Kuralları)

## Hesap silme kontrolü
- [x] Uygulama içinden, geri alınamaz, onaylı (HESABIMI SİL)
- [x] Server-side (`/api/account/delete`, service_role), cascade silme + log

## Kullanıcı engelleme kontrolü
- [x] Profil/detay/mesaj üzerinden engelle-engeli kaldır
- [x] Engelli kullanıcı mesaj gönderemez (RLS); içerikleri gizlenir

## Şikayet sistemi kontrolü
- [x] Her içerik/yorumda şikayet; aynı içeriğe tekrar şikayet engellenir
- [x] 3 farklı şikayet → otomatik gizleme + admin kuyruğu

## Yaş derecelendirme önerisi
- **17+ / Mature** — anonim kullanıcı içeriği, mesajlaşma, olası müstehcen dil.

## Gizlilik politikası kontrolü (sayfalarda mevcut)
- [x] Hesap silme yöntemi, veri saklama, toplanan veri türleri, silme hakkı

## Veri güvenliği formu — toplanan veri türleri
- E-posta (kimlik doğrulama)
- Kullanıcı içerikleri (itiraf, Gölge, yorum)
- Mesajlaşma içeriği (Plus)
- Kullanım/etkileşim verisi (kişiselleştirme)
- Şikayet & moderasyon kayıtları
- (Konum, kişiler, sağlık, finans verisi TOPLANMAZ)

## Rızasız fotoğraf & kişisel veri yasağı
- [x] Gölge yüklemede zorunlu onay kutusu
- [x] Kurallar/Şartlar metinlerinde açık yasak

## E-posta doğrulama
- [ ] Supabase Dashboard → Auth → "Confirm email" **production'da açılacak**
- [x] Kod hazır: doğrulanmamış kullanıcı oturum alamaz → içerik paylaşamaz
