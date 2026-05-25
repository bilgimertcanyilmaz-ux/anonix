# Anonix

> Anonim kal, içini dök.

Anonim itiraf temalı modern sosyal platform. **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase** üzerine kuruludur; itiraf paylaşımı, Gölge (fotoğraflı paylaşım), beğeni/yorum, puan & rütbe, günlük görevler, rozetler, bildirimler, Plus üyelik (iyzico ödeme), özel mesajlaşma ve admin/moderasyon altyapısı içerir.

---

## İçindekiler
1. [Teknoloji](#teknoloji)
2. [Kurulum](#kurulum)
3. [Ortam değişkenleri](#ortam-değişkenleri)
4. [Supabase SQL çalıştırma sırası](#supabase-sql-çalıştırma-sırası)
5. [Admin oluşturma](#admin-oluşturma)
6. [Deploy (Vercel)](#deploy-vercel)
7. [Domain bağlama](#domain-bağlama)
8. [iyzico production geçişi](#iyzico-production-geçişi)
9. [Resend e-posta](#resend-e-posta)
10. [Supabase production checklist](#supabase-production-checklist)
11. [Vercel production checklist](#vercel-production-checklist)
12. [Final test planı](#final-test-planı)
13. [Performans](#performans)

---

## Teknoloji
- **Next.js 14** (App Router, server + client components, API routes)
- **TypeScript**, **Tailwind CSS** (koyu tema, mobil öncelikli)
- **Supabase** (Auth, Postgres + RLS, Storage, Realtime)
- **iyzico** (Plus abonelik ödemesi — modüler; Stripe eklenebilir)
- **Resend** (opsiyonel e-posta)

## Kurulum
```bash
git clone https://github.com/bilgimertcanyilmaz-ux/anonix.git
cd anonix
npm install
cp .env.local.example .env.local   # değerleri doldur
npm run dev                          # http://localhost:3000
```

## Ortam değişkenleri
`.env.local` (örnek için `.env.local.example`). Doğrulama: `lib/env.ts`.

| Değişken | Tip | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | public | Prod alan adı (SEO/sitemap/callback) |
| `SUPABASE_SERVICE_ROLE_KEY` | **private** | Yalnızca sunucu (ödeme aktivasyonu). Asla istemciye gitmez |
| `IYZIPAY_API_KEY` | **private** | iyzico API key |
| `IYZIPAY_SECRET_KEY` | **private** | iyzico secret |
| `IYZIPAY_BASE_URL` | private | sandbox: `https://sandbox-api.iyzipay.com`, prod: `https://api.iyzipay.com` |
| `RESEND_API_KEY` | private | (opsiyonel) e-posta |
| `FROM_EMAIL` / `ADMIN_EMAIL` | private | (opsiyonel) gönderen / yönetici e-posta |

> **Güvenlik:** `NEXT_PUBLIC_` öneki OLMAYAN değişkenler istemci bundle'ına dahil edilmez. `service_role` ve iyzico secret yalnızca API route'larında kullanılır.

## Supabase SQL çalıştırma sırası
Supabase Dashboard → SQL Editor'de **sırayla** çalıştır (`supabase/` klasörü):
1. `schema.sql` — profiles + auth trigger (Aşama 2)
2. `confessions.sql` — itiraf/beğeni/yorum + puan (Aşama 3)
3. `messaging.sql` — konuşma/mesaj + realtime (Aşama 4)
4. `golge.sql` — Gölge + storage bucket (Aşama 5)
5. `engagement.sql` — bildirim/görev/rozet (Aşama 6)
6. `admin.sql` — admin/şikayet/moderasyon (Aşama 7)
7. `payments.sql` — abonelik + güvenlik sertleştirme (Aşama 9)
8. `launch.sql` — canlıya hazırlık checklist (Aşama 11)

Hepsi idempotent'tir; tekrar çalıştırmak güvenlidir.

## Admin oluşturma
Kayıt olduktan sonra SQL Editor'de:
```sql
update profiles set role='admin' where username='KULLANICI_ADIN';
```
Navbar'da **Admin** linki belirir → `/admin`.

## Deploy (Vercel)
1. Repo'yu Vercel'e import et (framework otomatik: Next.js).
2. **Environment Variables** → yukarıdaki tüm değişkenleri ekle (Production + Preview ayrı).
3. `NEXT_PUBLIC_SITE_URL`'i prod domain'e ayarla.
4. Deploy → build loglarını kontrol et.
5. Supabase Auth → URL Configuration → Site URL ve Redirect URL'lere prod domain'i ekle.

## Domain bağlama
1. Vercel → Project → Settings → Domains → domain ekle.
2. DNS (alan kayıt sağlayıcısında):
   - **Apex** (`anonix.app`): A kaydı `76.76.21.21` (Vercel) veya Vercel'in verdiği değer.
   - **www**: CNAME → `cname.vercel-dns.com`.
3. `www` → apex (veya tersi) yönlendirmesini Vercel'de seç.
4. **SSL** otomatik (Let's Encrypt) — "Valid Configuration" olana kadar bekle.
5. `NEXT_PUBLIC_SITE_URL` apex domain ile eşleşmeli (canonical/OG/sitemap için).

## iyzico production geçişi
1. `IYZIPAY_BASE_URL` → `https://api.iyzipay.com` (prod).
2. Prod `IYZIPAY_API_KEY` / `IYZIPAY_SECRET_KEY`'i Vercel env'e gir.
3. Callback URL: `https://DOMAIN/api/payments/callback` (iyzico panelinde de tanımla).
4. Webhook URL: `https://DOMAIN/api/payments/webhook`.
5. Sandbox test ödeme kayıtlarını temizle (`payment_logs`, `subscriptions`).
6. Gerçek ödeme öncesi: küçük tutarla canlı test → `is_plus` aktifleşiyor mu, `plus_expires_at` doğru mu kontrol et.

## Resend e-posta
1. `npm i resend`.
2. Resend'de domain ekle → **SPF/DKIM** DNS kayıtlarını gir → doğrula.
3. `FROM_EMAIL` doğrulanmış domain'den olmalı (`Anonix <noreply@anonix.app>`).
4. `RESEND_API_KEY`'i env'e ekle.
5. Test maili gönder, **spam klasörünü** kontrol et.
> E-posta yapılandırılmamışsa `lib/email.ts` sessizce no-op döner.

## Supabase production checklist
- [ ] Tüm tablolarda **RLS aktif** ve politikalar doğru
- [ ] Storage `golge-media` bucket policy doğru (klasör izolasyonu)
- [ ] `service_role` anahtarı frontend'e sızmıyor (yalnızca server env)
- [ ] Auth **Redirect URL**'leri prod domain
- [ ] E-posta şablonlarındaki URL'ler prod domain
- [ ] Index'ler mevcut (created_at, user_id vb.)
- [ ] Backup planı (Supabase otomatik yedek + gerekirse manuel)

## Vercel production checklist
- [ ] Tüm env değişkenleri girildi (Production)
- [ ] Build başarılı
- [ ] Domain bağlandı, SSL aktif
- [ ] Preview/Prod env ayrıldı
- [ ] Webhook/callback URL'leri prod domain'e döndü

## Final test planı
**Auth:** kayıt · giriş · çıkış · şifre sıfırlama · profil güncelleme
**İtiraf:** paylaşma · beğeni · yorum · puan · rütbe · şikayet
**Gölge:** fotoğraf yükleme · overlay · beğeni · yorum · puan
**Plus:** ödeme başlat · başarılı ödeme · `is_plus` aktif · `plus_expires_at` · Plus rozeti · Plus olmayan mesaj atamaz
**Mesaj:** Plus atar · normal atamaz · kendine atamaz · realtime gelir
**Admin:** panel erişimi · normal kullanıcı giremez · şikayet yönetimi · ban · banlı içerik paylaşamaz · yasaklı kelime
**Güvenlik:** frontend'den `is_plus`/`role` değişmez · `service_role` sızmaz · RLS · rate limit · XSS · telefon/adres/TC filtresi

> Bu maddeler `/admin/launch-checklist` sayfasında interaktif olarak takip edilebilir.

## Performans
- Görseller `<img>` ile lazy yüklenir; Gölge akışı **sonsuz scroll** (12'lik sayfa).
- Feed query'leri `limit 50` ile sınırlı; trend istemci tarafında hesaplanır.
- Mesaj/bildirim **realtime** ile çekilir, gereksiz polling yok.
- Statik sayfalar (landing, yasal) prerender edilir; SEO metadata + sitemap/robots mevcut.
- Öneri: yoğun trafikte feed'lere keyset pagination ve görseller için CDN/Image optimizasyonu eklenebilir.

---

> **Not:** Yasal metinler (gizlilik, şartlar, topluluk kuralları) bilgilendirme amaçlıdır; yayına almadan önce bir hukuk uzmanına danışılması önerilir.
