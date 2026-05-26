# Anonix · Güvenlik Denetim Raporu

Tarih: 2026-05-26 · Kapsam: production + App Store/Google Play hazırlığı

## 1. Kontrol edilen başlıklar
- Bağımlılık zafiyetleri (npm audit) ve client/server ayrımı
- Build & TypeScript & lint sağlığı
- HTTP güvenlik başlıkları (CSP/HSTS vb.)
- Hesap silme (uygulama içi, server-side)
- Kullanıcı engelleme (RLS + UI + mesaj engeli)
- Rate limit (server-side DB trigger'ları)
- Yaş onayı (17+)
- İçerik moderasyonu (PII/küfür/tehdit/cinsel aşağılama/ifşa)
- moderation_status + şikayetle otomatik gizleme + admin moderasyon
- RLS yetki sertleştirmesi (is_plus/role/is_banned/moderation_status)
- Sır yönetimi (service_role)

## 2. Bulgular & Durum

| Alan | Durum | Not |
|---|---|---|
| service_role sızıntısı | ✅ Yok | Yalnızca `lib/supabaseAdmin.ts` + API route'ları; `NEXT_PUBLIC_` yok |
| is_plus/role/is_banned değiştirme | ✅ Engelli | Kolon `revoke`/`grant` + admin RPC |
| moderation_status manipülasyonu | ✅ Engelli | Kullanıcıda UPDATE policy yok; yalnız `admin_set_moderation` RPC |
| XSS | ✅ Temiz | `dangerouslySetInnerHTML`/`eval` yok; React escape |
| Güvenlik başlıkları | ✅ Eklendi | CSP, X-Frame DENY, nosniff, Referrer, Permissions, HSTS(prod) |
| Hesap silme | ✅ Var | `/api/account/delete` (service_role) + cascade + log |
| Kullanıcı engelleme | ✅ Var | `blocked_users` RLS + mesaj RLS engeli + içerik gizleme |
| Rate limit | ✅ Server-side | DB trigger: itiraf/yorum/mesaj/şikayet/Gölge; login Supabase Auth |
| Yaş onayı | ✅ Var | Kayıtta 17+ zorunlu → `age_confirmed` |
| İçerik moderasyonu | ✅ Güçlü | PII/küfür/tehdit/cinsel aşağılama/ifşa/spam |
| Otomatik gizleme | ✅ Var | 3 farklı şikayet → `pending_review` |
| Admin moderasyon | ✅ Var | `/admin/pending` onayla/gizle/reddet/banla |

## 3. Düzeltilenler (bu denetimde)
- Admin moderasyon paneli (`/admin/pending`) + `admin_set_moderation` RPC eklendi.
- Güvenlik başlıkları (`next.config.mjs`) doğrulandı/aktif.
- Yasal sayfalara hesap silme/veri saklama/rızasız foto maddeleri eklendi.

## 4. Kalan riskler
- **Bağımlılık zafiyetleri (npm audit): 8 (4 orta, 4 yüksek).** Tamamı ya `iyzipay`
  (sunucu-only ödeme route'u) ya da `next/eslint/postcss` (build/dev) kaynaklı —
  **client bundle'a girmiyor.** `npm audit fix --force` paketleri kırdığı için
  uygulanmadı. Risk düşük; iyzipay upstream güncellemesi beklenmeli.
- **Native sarmalama yok**: Web app; Play(TWA)/App Store(Capacitor) sarmalama gerekir.
- **İnsan moderasyon süreci** (24 saat kuralı) operasyoneldir; araç hazır, süreç kurulmalı.
- **E-posta doğrulama**: kod hazır; Supabase Dashboard'dan "Confirm email" açılmalı.

## 5. Operasyonel yapılacaklar (kod dışı)
- Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `IYZIPAY_*`, Resend anahtarı
- Supabase: Confirm email aç, RLS gözden geçir, Storage policy doğrula
- Mağaza: 17+/Mature derecesi, Data Safety/Privacy formları, native build
- Admin hesabı + moderasyon süreci, test kullanıcılarını temizleme, yedekleme planı

## 6. Sonuç
Kod tarafı mağaza onayına **büyük ölçüde hazır**; kalan engeller operasyonel
(native sarmalama, mağaza formları, moderasyon süreci) ve kabul edilebilir
sunucu-only bağımlılık uyarılarıdır.
