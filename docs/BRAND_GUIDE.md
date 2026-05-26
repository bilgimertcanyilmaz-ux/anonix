# Anonix · Marka Kılavuzu

## Logo
- Ana logo: `public/logo.png` (mor amblem). Favicon: `app/icon.png`, iOS: `app/apple-icon.png`.
- Kullanım: koyu zeminde doğrudan; açık zeminde yumuşak gölge ile. Min. boyut 24px.
- Logoyu deforme etme, rengini değiştirme, gölge/efekt ekleme (shadow-glow hariç).

## Renkler (kaynak: `styles/colors.ts`)
**Dark mode**
- Zemin: ink-950 `#06060b` → ink-900 `#0a0a14`
- Marka mor: brand-500 `#7c3aed` (neon: brand-400 `#9163f3`)
- Elektrik mavi accent: accent-500 `#3b6fe0`
- Premium altın: gold-400 `#fbbf24`
- Metin: beyaz / slate-400 (#94a3b8)

**Light mode**
- Zemin: lavanta beyaz `#f5f3ff`, yüzey beyaz
- Pastel/koyu mor accent: brand-600 `#6d28d9`
- Metin: slate-900 `#0f172a` / slate-600

**Marka gradyanı:** `linear-gradient(135deg,#7c3aed,#4c1d95,#1e1b4b)` (`bg-brand-gradient`)

## Tipografi (kaynak: `styles/typography.ts`)
- Aile: **Inter** (`--font-inter`)
- Başlık: extrabold, tracking-tight · Gövde: 14px, rahat satır yüksekliği
- Vurgu: `.text-gradient` (mor→mavi)

## İkon stili
- İnce çizgi (stroke 1.8), yuvarlak uçlu, currentColor — `components/ui/icons.tsx`
- Anonim avatar: maske ikonu; marka logosu ayrıdır (karıştırma).

## UI sistemi (kaynak: `styles/theme.ts`)
- **Radius:** kartlar 2xl (1.5rem), butonlar/chip full
- **Shadow:** `shadow-glow` (mor parıltı), `shadow-card`
- **Buton:** primary (gradient + glow + active:scale-95), ghost (beyaz/5)
- **Kart:** `.card` (border-white/5 + bg-white/[0.03])
- **Spacing:** 4/8/16/24/32 ölçeği

## Motion
- `animate-fade-up` (giriş), `animate-float` (rozet), `active:scale-95` (basış)
- Geçişler yumuşak (200–300ms), abartısız; premium/sakin his.

## Ton & dil
- Türkçe, samimi ama saygılı. Anonimlik + güvenlik vurgusu.
- Sloganlar: `lib/slogans.ts` ("Anonim kal. İçini dök." vb.)
