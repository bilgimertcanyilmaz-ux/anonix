# Anonix · Test Planı & QA Kontrol Listesi

Bu belge, production öncesi manuel ve fonksiyonel test senaryolarını içerir.
Her senaryo için **adımlar** ve **beklenen sonuç** belirtilmiştir.

> Ortam: `npm run dev` (yerel) veya canlı (https://anonix-jet.vercel.app).
> Test hesabı oluştururken e-posta onayı kapalı olduğundan `@example.com` ile kayıt olunabilir.

---

## 0. Build & Statik Kontrol

| Kontrol | Komut | Beklenen |
|---|---|---|
| Production build | `npm run build` | `✓ Compiled successfully`, TypeScript hatası yok |
| Tip kontrolü | build içinde | Hata yok |
| Kullanılmayan import | build/lint | Uyarı yok |

**Son durum:** Build temiz geçiyor; TypeScript hatası yok.

---

## 1. Auth

| # | Senaryo | Adımlar | Beklenen |
|---|---|---|---|
| 1.1 | Kayıt | `/register` → kullanıcı adı/e-posta/şifre/cinsiyet → Hesap oluştur | Profil oluşur, `/profile`'a yönlenir |
| 1.2 | Giriş | `/login` → e-posta/şifre | Oturum açılır, navbar kullanıcı moduna geçer |
| 1.3 | Çıkış | Navbar → Çıkış Yap | Oturum kapanır, `/`'a döner, GuestHome görünür |
| 1.4 | Şifremi unuttum | `/forgot-password` → e-posta | "Bağlantı gönderildi" mesajı |
| 1.5 | Session yenileme | Giriş yapıp sayfayı yenile | Oturum korunur (localStorage) |
| 1.6 | Korumalı sayfa | Çıkışken `/profile`, `/messages`, `/tasks`, `/for-you`, `/golge/new`, `/confessions/new` | `/login`'e yönlendirilir |
| 1.7 | Geçersiz giriş | Yanlış şifre | Türkçe hata mesajı |

---

## 2. Profil

| # | Senaryo | Beklenen |
|---|---|---|
| 2.1 | Profil bilgileri | Kullanıcı adı, cinsiyet, rütbe, puan doğru gelir |
| 2.2 | Cinsiyet rozeti | Erkek/Kadın/Belirtmek istemiyor rozeti görünür |
| 2.3 | Cinsiyet çerçevesi | Avatar çerçevesi cinsiyete göre renklidir (mavi/pembe/gökkuşağı) |
| 2.4 | Anonimlik toggle | Aç/kapat → `profiles.is_anonymous` güncellenir, anında yansır |
| 2.5 | Puan/rütbe | Hero kartında doğru puan + rütbe + sonraki rütbeye kalan |
| 2.6 | Plus rozeti | `is_plus` ise altın PLUS rozeti + glow çerçeve |
| 2.7 | Takipçi/Takip | "X Takipçi · Y Takip" doğru sayıları gösterir |

---

## 3. Anonimlik Veri Tutarlılığı (KRİTİK)

| # | Senaryo | Adımlar | Beklenen |
|---|---|---|---|
| 3.1 | İtiraf geçmiş tutarlılığı | Anonim modda itiraf paylaş → profilden anonimliği kapat → eski itirafa bak | Eski itiraf **hâlâ anonim** görünür |
| 3.2 | Yeni paylaşım | Anonimlik kapalıyken yeni itiraf paylaş | Yeni paylaşım **açık profil** (varsayılan profil tercihinden gelir, paylaşım anında override edilebilir) |
| 3.3 | Gölge geçmiş tutarlılığı | 3.1 senaryosunu Gölge için tekrarla | Eski Gölge hâlâ anonim |

**Teknik garanti:** Kartlar profil anlık değerini DEĞİL, paylaşımın kendi değerini kullanır
(`confessions.is_anonymous`, `golge_posts.is_anonymous`). Kod taramasında `profiles.is_anonymous`
gösterim mantığında kullanılmıyor.

---

## 4. Cinsiyet Görünürlüğü (anonimlikten bağımsız)

Cinsiyet rozeti + çerçeve **her yüzeyde** görünmelidir; anonimlik yalnızca kullanıcı adını gizler.

- [ ] İtiraf kartı (akış)
- [ ] İtiraf detay
- [ ] İtiraf yorumları
- [ ] Gölge kartı
- [ ] Gölge detay
- [ ] Mesaj listesi + sohbet başlığı (karşı tarafın cinsiyeti)
- [ ] Profil

**Uygulama:** Tümü tek `components/UserIdentity.tsx` bileşeninden beslenir (cinsiyet çerçevesi her zaman).

---

## 5. İtiraf Sistemi

| # | Senaryo | Beklenen |
|---|---|---|
| 5.1 | İtiraf paylaşma | `/confessions/new` → metin → paylaş → +150 puan |
| 5.2 | Boş içerik | Boş gönder | "En az 10 karakter" hatası |
| 5.3 | Min/Max | <10 veya >1000 karakter | Türkçe sınır hatası |
| 5.4 | Beğeni ekle | Kalp → like_count +1, sahibine +6 puan |
| 5.5 | Beğeni kaldır | Tekrar kalp → like_count −1, −6 puan |
| 5.6 | Yorum ekle | Yorum → comment_count +1, +3 puan |
| 5.7 | Rütbe güncelleme | Puan eşiği aşılınca rütbe değişir |
| 5.8 | Şikayet | Şikayet butonu → rapor oluşur (aynı içeriğe tekrar şikayet engellenir) |

---

## 6. Gölge Sistemi

| # | Senaryo | Beklenen |
|---|---|---|
| 6.1 | Görsel yükleme | `/golge/new` → görsel seç (≤10MB, image) → paylaş → +200 puan |
| 6.2 | Geçersiz dosya | Görsel olmayan / >10MB | Türkçe hata |
| 6.3 | Overlay yazı | Stil + konum seç → önizleme canlı |
| 6.4 | Anonim/açık | Toggle → `golge_posts.is_anonymous` doğru kaydedilir |
| 6.5 | Beğeni / Yorum | Sayaçlar + puan (+8 / +4) güncellenir |
| 6.6 | Rate limit | Dakikada >5 paylaşım | "Çok hızlı paylaşım" hatası |
| 6.7 | Storage policy | Başka kullanıcının klasörüne yazma | RLS engeller |

---

## 7. Takip Sistemi

| # | Senaryo | Beklenen |
|---|---|---|
| 7.1 | Takip et | Açık yazarın detayında "Takip Et" → "Takip Ediliyor" |
| 7.2 | Takipten çık | Tekrar bas → "Takip Et" |
| 7.3 | Kendini takip | Kendi içeriğinde buton **görünmez** |
| 7.4 | Tekrar takip | Aynı kişiyi 2. kez takip | DB `unique(follower_id,following_id)` engeller |
| 7.5 | Sayılar | Takipçi/takip sayıları profilde doğru |
| 7.6 | Ana sayfa | Takip edilenlerin son itirafları AuthHome "Takip ettiklerin"de görünür |
| 7.7 | Anonim koruması | Anonim paylaşımda takip butonu çıkmaz (kimlik gizli) |
| 7.8 | Takipçi listesi | `/profile/followers` — beni takip edenler |
| 7.9 | Takip edilen listesi | `/profile/following` — takip ettiklerim |
| 7.10 | Liste anonimlik | Listede anonim kullanıcı "Anonim Kullanıcı + cinsiyet", açık kullanıcı @username |
| 7.11 | Açık profil | `/users/[username]` — açık kullanıcı: kimlik+cinsiyet+rütbe+takip butonu+açık itirafları |
| 7.12 | Anonim profil gizli | Anonim kullanıcının `/users/[username]` sayfası "gizli (anonim)" durumu gösterir (yalnızca cinsiyet) |
| 7.13 | Tıklanabilirlik | Açık yazarlar (kart/yorum/liste) `/users/[username]`'e linklenir; anonim yazarlar tıklanamaz |

> Profildeki "X Takipçi · Y Takip" sayıları bu listelere tıklanabilir bağlantıdır.

---

## 8. Mesaj Sistemi

| # | Senaryo | Beklenen |
|---|---|---|
| 8.1 | Plus mesaj | Plus kullanıcı mesaj gönderebilir |
| 8.2 | Plus olmayan | "Plus üye olmalısınız" uyarısı, gönderemez |
| 8.3 | Kendine mesaj | Kendi içeriğinden mesaj başlatılamaz |
| 8.4 | Conversation | İlk mesajda konuşma oluşur |
| 8.5 | Realtime | Karşı taraftan gelen mesaj anında görünür |
| 8.6 | Unread | Okunmamış sayacı doğru, okununca sıfırlanır |
| 8.7 | Anonimlik | Sohbette kimlik gizli; yalnızca cinsiyet görünür |

---

## 9. Bildirim Sistemi

| # | Senaryo | Beklenen |
|---|---|---|
| 9.1 | Beğeni bildirimi | İtiraf sahibine bildirim |
| 9.2 | Yorum bildirimi | İtiraf sahibine bildirim |
| 9.3 | Rozet bildirimi | Rozet kazanınca bildirim |
| 9.4 | Görev bildirimi | Görev tamamlanınca |
| 9.5 | Mesaj bildirimi | Mesaj gelince alıcıya bildirim (`s6_message_notify`) |
| 9.6 | Takip bildirimi | Biri takip edince "Yeni bir takipçin var 👤" (`s_follow_notify`) |
| 9.7 | Okunmamış sayısı | Navbar zil + bottom nav badge doğru |
| 9.8 | Tümünü okundu | `/notifications` → okundu işaretle |

---

## 10. Admin Panel

| # | Senaryo | Beklenen |
|---|---|---|
| 10.1 | Normal kullanıcı | `/admin`'e erişemez (RLS + yönlendirme) |
| 10.2 | Admin erişim | `role='admin'` ise panel açılır, navbar'da Admin linki |
| 10.3 | Şikayet yönetimi | Raporları görüntüle/çöz |
| 10.4 | Ban / ban kaldır | `admin_set_ban` RPC ile (security definer) |
| 10.5 | Yasaklı kelime | Ekle → moderasyon trigger'ı kullanır |
| 10.6 | İçerik silme | Admin içerik silebilir |
| 10.7 | Moderation log | İşlemler `moderation_logs`'a düşer |

**Güvenlik notu:** Admin verisi DB seviyesinde `is_admin()` ile korunur; `/admin` sayfası
client-side yönlendirme yalnızca UX içindir.

---

## 11. Ban Sistemi

Banlı kullanıcı (`is_banned=true`) şunları YAPAMAZ (RLS `not is_banned()`):

- [ ] İtiraf paylaşma
- [ ] Yorum yapma
- [ ] Gölge paylaşma
- [ ] Takip etme
- [ ] (Mesaj/beğeni: istemci tarafı kontrol + RLS)

---

## 12. Rate Limit

| Akış | Mekanizma | Durum |
|---|---|---|
| Login | Supabase Auth (yerleşik) | ✅ sağlayıcı tarafı |
| Gölge paylaşımı | DB trigger (dk'da 5) | ✅ |
| İtiraf | — | ⚠️ opsiyonel (bkz. `maintenance.sql` C bölümü) |
| Yorum / Mesaj / Şikayet | Supabase global API limitleri + RLS | ⚠️ özel trigger yok |
| Contact form | İstemci doğrulama | ⚠️ |

> Üretimde ek koruma istenirse `supabase/maintenance.sql` içindeki opsiyonel itiraf
> rate-limit trigger'ı etkinleştirilebilir.

---

## 13. UI / Responsive

- [ ] Mobil bottom nav 5 öğe hizalı: Keşfet · Gölge · **İtiraf (orta)** · Bildirim · Profil
- [ ] "İtiraf" butonu tam ortada, yükseltilmiş gradient
- [ ] "Çıkış Yap" tek parça (mobilde ikon-only, taşma/kırılma yok)
- [ ] Profil cinsiyet çerçeveleri taşmıyor
- [ ] Kartlar mobilde düzgün, yazılar okunur
- [ ] Loading skeleton'lar var (ana sayfa, akışlar, profil)
- [ ] Empty state'ler var (boş akış, takip yok, rozet yok)

---

## 14. Güvenlik

| Kontrol | Durum |
|---|---|
| `is_plus` frontend'den değiştirilemez | ✅ `revoke update` + kolon grant (payments.sql) |
| `role` frontend'den değiştirilemez | ✅ yalnızca `admin_set_role` RPC |
| `is_banned` frontend'den değiştirilemez | ✅ yalnızca `admin_set_ban` RPC |
| RLS tüm tablolarda aktif | ✅ |
| `service_role` key client bundle'a girmiyor | ✅ yalnızca `lib/supabaseAdmin.ts` + API route'ları |
| XSS | ✅ `dangerouslySetInnerHTML` yok; React metni escape eder |
| Telefon/adres/TC filtresi | ✅ `lib/moderation.ts moderateText` + DB moderasyon trigger'ı |

---

## 15. Veri Tutarlılığı (SQL)

- **like_count / comment_count (itiraf & Gölge):** trigger'larla güncel; sapma olursa
  `supabase/maintenance.sql` (B bölümü) recount sorguları.
- **Takipçi/takip sayıları:** denormalize değil, canlı sayılır → recount gerekmez.
- **points:** çok kaynaklı; otomatik toplu recount önerilmez (bkz. maintenance.sql açıklaması).

---

## 16. Eksik İndeksler (uygulandı)

`supabase/maintenance.sql` (A bölümü) ile eklendi:
- `confessions_user_idx` (confessions.user_id)
- `golge_posts_user_idx` (golge_posts.user_id)
- `messages_receiver_idx` (messages.receiver_id)

Zaten mevcut: follows(follower_id, following_id), notifications(user_id), reports(status) vb.

---

## Kritik Çıkış (Go-Live) Kontrol Listesi

- [ ] `npm run build` temiz
- [ ] Vercel gizli env: `SUPABASE_SERVICE_ROLE_KEY`, `IYZIPAY_*`, Resend anahtarı eklendi
- [ ] Supabase Auth redirect URL = canlı alan adı
- [ ] En az 1 admin kullanıcı atandı (`update profiles set role='admin' ...`)
- [ ] Prod'da e-posta onayı (Confirm email) yeniden açılması değerlendirildi
- [ ] Tüm SQL dosyaları uygulandı (schema → confessions → messaging → golge →
      engagement → admin → payments → launch → viral → follows → maintenance)
- [ ] RLS izolasyon testi (başka kullanıcının verisini değiştirememe) geçti
- [ ] Anonimlik geçmiş tutarlılığı (3.1 / 3.3) doğrulandı
