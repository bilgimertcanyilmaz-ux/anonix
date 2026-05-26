# Anonix · Production Hazırlık Kontrol Listesi

## Supabase
- [ ] **Auth → Confirm email AÇ** (sahte hesap/spam önleme)
- [ ] RLS tüm tablolarda aktif olduğunu doğrula (profiles, confessions, golge_posts,
      messages, conversations, follows, blocked_users, user_interactions, reports vb.)
- [ ] Storage `golge-media` policy doğrula (klasör izolasyonu, public read)
- [ ] Auth → URL Configuration → Redirect/Site URL = canlı alan adı
- [ ] Tüm SQL dosyaları sırayla uygulanmış (bkz. README "SQL çalıştırma sırası")

## SQL çalıştırma sırası (özet)
schema → confessions → messaging → golge → engagement → admin → payments →
launch → viral → follows → maintenance → sound_settings → interactions →
store_security → admin_moderation

## Vercel
- [ ] Gizli env: `SUPABASE_SERVICE_ROLE_KEY` (hesap silme ŞART), `IYZIPAY_*`, Resend
- [ ] Public env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `NEXT_PUBLIC_SITE_URL` = canlı alan adı
- [ ] `service_role` ASLA `NEXT_PUBLIC_` ile başlamaz (doğrulandı)

## Güvenlik
- [x] HTTP güvenlik başlıkları aktif (`next.config.mjs`)
- [ ] CSP'yi production domain'lerine göre gözden geçir (özel domain eklenirse)
- [x] service_role yalnızca sunucuda
- [x] is_plus/role/is_banned/moderation_status istemciden değiştirilemez

## Ödeme (iyzico)
- [ ] Production API anahtarları
- [ ] Callback/Webhook URL'leri canlı domain'e ayarlanmış
- [x] iyzipay yalnızca server route'larında (client bundle'da değil)

## E-posta (Resend)
- [ ] Domain doğrulama (SPF/DKIM)
- [ ] `lib/email.ts` stub → gerçek gönderim (npm i resend + anahtar)

## Operasyonel
- [ ] En az 1 admin hesabı (`update profiles set role='admin' ...`)
- [ ] Moderasyon süreci: `/admin/pending` kuyruğu 24 saat içinde incelensin
- [ ] Test kullanıcılarını temizle (ref_*, home_demo, fa_*, fb_* vb.)
- [ ] Yedekleme planı (Supabase otomatik yedek / dışa aktarma)

## Final
- [ ] `npm run build` temiz (doğrulandı)
- [ ] Mağaza için native sarmalama (TWA / Capacitor)
- [ ] Yaş derecesi + Data Safety/Privacy formları
