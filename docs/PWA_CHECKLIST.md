# Anonix · PWA / Mobil Hazırlık Kontrol Listesi

## Lighthouse PWA / Installability
- [x] **Web App Manifest** (`public/manifest.json`): name, short_name, description,
      start_url, scope, display=standalone, orientation=portrait, lang=tr,
      background_color, theme_color, kategoriler
- [x] **İkonlar**: 192x192, 512x512, maskable 512x512 (`public/icons/`),
      apple-touch-icon (`app/apple-icon.png`), favicon (`app/icon.png`)
- [x] **Service Worker** (`public/sw.js`): app shell cache + offline fallback +
      navigation network-first + statik cache-first (yalnızca production'da kayıt)
- [x] **Offline fallback sayfası** (`/offline`)
- [x] **theme-color** (`#06060b`) + manifest theme_color/background_color
- [x] **viewport** + `viewport-fit=cover` (çentik/safe-area)
- [x] **apple-web-app** capable + status bar style + title (iOS splash/standalone)
- [x] **mobile-web-app-capable: yes**
- [ ] **HTTPS** — production (Vercel) otomatik HTTPS sağlar (yerel `localhost` istisnadır)
- [x] **installable** — beforeinstallprompt yakalanır, "Uygulama gibi yükle" istemi

## Mobil deneyim
- [x] Bottom nav **safe-area-inset-bottom** padding (iOS home bar çakışması yok)
- [x] Navbar **safe-area-inset-top** padding (çentik çakışması yok)
- [x] Install istemi reddedilince tekrar gösterilmez (localStorage)
- [x] Install istemi standalone modda gösterilmez

## Push bildirim hazırlığı
- [x] İzin isteme butonu (profil → Ses ayarları → "Push bildirimlerine izin ver")
- [x] `push_subscriptions` tablosu + `lib/push.ts` (şimdilik mock endpoint)
- [ ] Gerçek Web Push: VAPID anahtarları + SW `push`/`notificationclick` event +
      sunucu tarafı gönderim (`web-push`) — ileride eklenebilir

## Splash / ikon notları
- iOS: `app/apple-icon.png` + theme/background renkleri ile açılış görünümü.
- Android (TWA): `manifest.json` ikonları + theme_color kullanılır.

## Bilinen sınırlar / öneriler
- **İkon boyutu**: `logo.png` ve `icons/*` 1024px (~1.4MB). PWA çalışır ama
  192/512 için optimize edilmiş (küçük boyutlu) PNG'ler üretmek performans için önerilir.
- Service worker yalnızca **production build**'de aktif (dev cache sorunlarını önlemek için).
- TWA (Google Play) / Capacitor (App Store) sarmalama bu PWA üzerine kurulabilir.

## Manuel test (production'da)
1. Mobil tarayıcıda siteyi aç → "Ana ekrana ekle" / "Uygulama gibi yükle" çıkıyor mu
2. Yüklü uygulamayı aç → standalone (adres çubuğu yok), splash + tema rengi doğru
3. Uçak moduna al → gezinmede `/offline` sayfası geliyor mu
4. Çentikli cihazda navbar/bottom nav içerikle çakışmıyor mu
5. Profil → Push izni → tarayıcı izin sorar, kabul edilince kayıt oluşur
