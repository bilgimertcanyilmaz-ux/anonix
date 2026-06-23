# Anonix → App Store Yayın Checklist'i

Bu döküman, kodun yapamayacağı **manuel App Store Connect / Apple Developer adımlarını** içerir. Sıra ile yap.

---

## 1. Apple Developer Portal — Bundle ID & Capabilities

🔗 https://developer.apple.com/account → **Certificates, IDs & Profiles → Identifiers**

1. **+** → App IDs → App → **Continue**
2. **Description:** `Anonix`
3. **Bundle ID (Explicit):** `com.anonix.app`
4. **Capabilities** (kutucukları işaretle):
   - ✅ **Sign In with Apple**
   - ✅ **Push Notifications**
   - ✅ **In-App Purchase**
   - ✅ **Associated Domains** (universal link için — sonra anonix.digital eklenecek)
5. **Register**

---

## 2. App Store Connect — App Record

🔗 https://appstoreconnect.apple.com/apps → **+** → **New App**

| Alan | Değer |
|---|---|
| Platforms | iOS |
| Name | `Anonix` |
| Primary Language | Turkish (Türkçe) |
| Bundle ID | `com.anonix.app` (dropdown'da görünür) |
| SKU | `ANONIX-IOS-001` |
| User Access | Full Access |

---

## 3. App Information sekmesi

- **Category:** Primary → `Social Networking`, Secondary → `Lifestyle`
- **Content Rights:** "Does your app contain, show, or access third-party content?" → **No**
- **Age Rating** (Edit → soruları cevapla):
  - Profanity or Crude Humor → **Frequent/Intense** (anonim itiraflar küfür içerebilir)
  - Sexual Content / Nudity → **Infrequent/Mild** (Fantezi kategorisi var)
  - User-Generated Content / Unrestricted Web Access / Gambling → **Yes** (UGC)
  - **Expected rating: 17+**

- **License Agreement:** Apple's Standard EULA (varsayılan) **veya** `https://www.anonix.digital/terms` (kendi terms sayfan)
- **Privacy Policy URL:** `https://www.anonix.digital/privacy-policy`

---

## 4. Pricing & Availability

- **Price:** Free (uygulamanın kendisi ücretsiz, premium IAP üzerinden)
- **Availability:** All territories (veya sadece Türkiye)

---

## 5. In-App Purchases — Plus & Ultra Plus

🔗 App → **Monetization → In-App Purchases & Subscriptions**

### Subscription Group oluştur:
- **Reference Name:** `Anonix Premium`

### Subscription #1 — Plus
| Alan | Değer |
|---|---|
| Reference Name | `Plus Monthly` |
| Product ID | `com.anonix.app.plus_monthly` |
| Duration | 1 Month |
| Subscription Level | Level 1 (lower) |
| Price (Türkiye) | ₺49.99 → diğer ülkeler otomatik hesaplanır |
| Display Name (TR) | `Anonix Plus` |
| Description (TR) | `Reklamsız deneyim, premium çerçeveler, 1 günlük boost.` |
| Display Name (EN) | `Anonix Plus` |
| Description (EN) | `Ad-free experience, premium frames, 1 daily boost.` |
| Review Screenshot | 1242x2208 PNG (Plus paywall ekran görüntüsü) |

### Subscription #2 — Ultra Plus
| Alan | Değer |
|---|---|
| Reference Name | `Ultra Plus Monthly` |
| Product ID | `com.anonix.app.ultra_plus_monthly` |
| Duration | 1 Month |
| Subscription Level | Level 2 (higher — upgrade target) |
| Price (Türkiye) | ₺99.99 |
| Display Name (TR) | `Anonix Ultra Plus` |
| Description (TR) | `Hayalet mod, kimler baktı, tüm temalar, 3 günlük boost, özel rozetler.` |
| Display Name (EN) | `Anonix Ultra Plus` |
| Description (EN) | `Ghost mode, profile viewers, all themes, 3 daily boosts, exclusive badges.` |

---

## 6. App Privacy (Privacy Nutrition Labels)

🔗 App → **App Privacy → Get Started**

| Data Type | Linked to User | Used for Tracking | Purposes |
|---|---|---|---|
| Email Address | ✅ | ❌ | App Functionality, Authentication |
| Name (username) | ✅ | ❌ | App Functionality |
| User Content (confessions, messages) | ✅ | ❌ | App Functionality |
| Purchase History | ✅ | ❌ | App Functionality |
| Crash Data | ❌ | ❌ | App Functionality, Analytics |
| Product Interaction | ❌ | ❌ | Analytics |

---

## 7. Version 1.0 — Prepare for Submission

### 7.1 Screenshots
Şu boyutlarda 3-5 adet PNG gerekli (Anonix temel ekranlarından):

| Cihaz | Boyut | Önerilen ekranlar |
|---|---|---|
| **iPhone 6.7"** (zorunlu) | 1290 × 2796 | Keşfet, Profil, Plus paywall, Mesajlar, Gölge |
| **iPhone 6.5"** (zorunlu) | 1242 × 2688 | aynısı |
| iPad Pro 12.9" (opsiyonel) | 2048 × 2732 | aynısı |

> Hızlı üretim: `www.anonix.digital`'i iPhone 14 Pro Max görünümünde aç (Chrome DevTools → Toggle Device → iPhone 14 Pro Max) → ekran görüntüsü al.

### 7.2 App Description (Türkçe)

```
Anonix — Anonim İtiraflar, Gerçek Hisler 💜

Söyleyemediklerini paylaş, dinlenmek istediğinde dinlen.
Anonix, anonim kalmanı sağlayan modern bir sosyal ağ.

✦ Tamamen anonim itiraflar
✦ Gece İtirafları — gecenin sessizliğinde derin paylaşımlar
✦ Kategoriler: Aşk, Pişmanlık, Komik, Korku, Fantezi ve daha fazlası
✦ Gölge — kaybolan paylaşımlar
✦ Premium çerçeveler ve rütbe sistemi (Bronze → Diamond)
✦ Özel mesajlar
✦ Mood'una göre keşfet

Anonix Plus & Ultra Plus ile:
• Reklamsız deneyim
• Hayalet mod — sessizce gez
• Kimler baktı görüntüleyici
• Tüm premium çerçeveler ve temalar
• Günlük boost hakları
• Özel premium rozetler

İtiraflar gerçek. İnsanlar gerçek. Sadece sen anonimsin.
```

### 7.3 Keywords (max 100 char, virgülle ayır)

```
anonim,itiraf,sosyal ağ,gizli,paylaşım,gece,fantezi,aşk,pişmanlık,türkiye,anonymous
```

### 7.4 Support URL: `https://www.anonix.digital/contact`
### 7.5 Marketing URL: `https://www.anonix.digital`

### 7.6 Sign-In Information (Apple reviewer için)
Apple reviewer test edebilmeli:
- **Test Account:** test-reviewer@anonix.digital / `<güçlü-şifre>` (önceden oluştur)
- **Demo Notes:**
  ```
  1. "Apple ile devam et" veya "Test e-posta ile giriş" yap.
  2. Keşfet sekmesinde itiraflar görünür.
  3. Profil → Plus'a Geç → satın al butonu Apple StoreKit sheet'i açar.
  4. Hesap silme: Profil → Hesap Ayarları → Hesabımı Sil.
  ```

---

## 8. TestFlight — Internal Testing

1. **TestFlight → Internal Testing → +**
2. **Group Name:** `Anonix Internal Testers`
3. Kendini tester olarak ekle (e-postanla)
4. Codemagic ilk build'i yükleyince TestFlight'ta görünür (~5 dk içinde "Processing")
5. Email gelir → iPhone'da TestFlight app'iyle test et

## 9. External Testing (opsiyonel ama tavsiye edilir)

- **External Group** oluştur, 25-100 dış tester ekle
- Apple Beta App Review'dan geçer (~24 saat)
- 90 günlük test süresi
- **Feedback topla, App Store submission'dan önce buglara düzelt**

## 10. App Store Review Submission

**Hazır olduğunda:**
1. App version → **Submit for Review**
2. Export Compliance: "No, uses only standard encryption"
3. Content Rights: "No third-party content"
4. Advertising Identifier: "Does not use IDFA" (Anonix tracking yapmıyor)
5. **Submit**

Apple review **24-72 saat** sürer. Reddedilirse "Resolution Center"da neden + nasıl düzelteceğini gösterirler.

---

## 11. Sık Karşılaşılan Ret Sebepleri (önceden çöz)

- ❌ **Guideline 4.2 (Minimum Functionality)** — "thin web view"
  - ✅ Anonix'te çözüldü: native splash, status bar, push, share, IAP, Sign in with Apple
- ❌ **Guideline 1.2 (UGC)** — Report/block/EULA eksik
  - ✅ Anonix'te var: hesap silme, report, block, EULA checkbox
- ❌ **Guideline 3.1.1 (In-App Purchase)** — Web ödeme linki var
  - ✅ Anonix'te: iOS'ta sadece StoreKit, iyzico web/Android'de kalır
- ❌ **Guideline 5.1.1 (Privacy)** — Privacy Manifest yok
  - ✅ Anonix'te: `ios/App/App/PrivacyInfo.xcprivacy` oluşturuldu
- ❌ **Guideline 4.8 (Sign in with Apple)** — Google var, Apple yok
  - ✅ Anonix'te: native Apple Sign-In SDK entegre

---

## 12. RevenueCat Setup (IAP backend)

🔗 https://app.revenuecat.com → Sign up → New Project

1. **Project name:** `Anonix`
2. **+ Add App** → iOS → Bundle ID: `com.anonix.app`
3. **App Store Connect Shared Secret:** App Store Connect → Users → Keys → "+" → App-Specific Shared Secret kopyala, RC'a yapıştır
4. **Products** sekmesi:
   - **+ New** → Apple App Store → product ID gir:
     - `com.anonix.app.plus_monthly`
     - `com.anonix.app.ultra_plus_monthly`
5. **Entitlements** → **+ New** → identifier: `premium`
   - Her iki product'ı bu entitlement'a bağla
6. **Offerings** → **+** → identifier: `default`
   - 2 product'ı pakete ekle (RevenueCat bunu fetch eder)
7. **Project Settings → API Keys** → iOS public key'i kopyala
8. `.env.local` dosyana ekle:
   ```
   NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxx
   ```
9. **Integrations → Supabase** → webhook URL: `https://www.anonix.digital/api/payments/webhook?source=revenuecat`
   (mevcut webhook endpoint'ini RC payload'ını da kabul edecek şekilde güncelle)

---

## Son Söz

Bu checklist tamamlanırsa Anonix App Store'a tam uyumlu hazır. **Tahmini timeline:**

| Adım | Süre |
|---|---|
| Apple Developer + Bundle ID | 1 saat |
| App Store Connect record + IAP + RevenueCat | 3-4 saat |
| Screenshots + metadata | 2-3 saat |
| Codemagic first build | 30 dk |
| TestFlight internal test | 1-2 gün |
| Apple review | 1-3 gün |
| **Toplam: 1-2 hafta canlı** | |
