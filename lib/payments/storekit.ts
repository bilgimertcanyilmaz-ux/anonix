/**
 * Apple StoreKit IAP — RevenueCat wrapper (iOS native subscription billing).
 *
 * NEDEN RevenueCat:
 *  - Apple/Google billing API'lerini tek SDK ile soyutlar
 *  - Receipt validation backend tarafında otomatik (verifyReceipt yazmaya gerek yok)
 *  - Subscription state Supabase'e webhook'la sync edilir
 *  - 50K USD/ay altında ücretsiz
 *
 * KURULUM (kullanıcı tarafı — App Store Connect):
 *  1. App Store Connect > In-App Purchases > "+ Subscription Group" → "Anonix Premium"
 *  2. İki product oluştur:
 *      - com.anonix.app.plus_monthly       (Aylık Plus, 49.99 TRY)
 *      - com.anonix.app.ultra_plus_monthly (Aylık Ultra Plus, 99.99 TRY)
 *  3. RevenueCat dashboard'da iOS app'i bağla, App Store shared secret gir
 *  4. RC dashboard'da "Entitlement" oluştur: "premium" → 2 product'ı bağla
 *  5. Apple App Store Connect → "App Information" → public API key'i RC'a ver
 *  6. Aşağıdaki NEXT_PUBLIC_REVENUECAT_IOS_KEY env var'ı .env.local'a ekle
 */

import { getPlatform } from "@/lib/native";

const APPLE_PRODUCT_IDS = {
  plus_monthly: "com.anonix.app.plus_monthly",
  ultra_plus_monthly: "com.anonix.app.ultra_plus_monthly",
} as const;

export type ApplePlanId = keyof typeof APPLE_PRODUCT_IDS;

let _configured = false;
let _userId: string | null = null;

async function getRC() {
  const mod = await import("@revenuecat/purchases-capacitor");
  return mod.Purchases;
}

/**
 * RevenueCat SDK'sını başlat. AuthProvider içinde, user oturum açtığında çağrılır.
 * userId: Supabase user.id (aynı kullanıcının farklı cihazlardaki aboneliklerini eşler).
 */
export async function configureStoreKit(userId: string) {
  if ((await getPlatform()) !== "ios") return;
  if (_configured && _userId === userId) return;

  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY;
  if (!apiKey) {
    console.warn("[storekit] NEXT_PUBLIC_REVENUECAT_IOS_KEY tanımlı değil — IAP devre dışı.");
    return;
  }

  const Purchases = await getRC();
  if (!_configured) {
    await Purchases.configure({ apiKey, appUserID: userId });
    _configured = true;
  } else if (_userId !== userId) {
    await Purchases.logIn({ appUserID: userId });
  }
  _userId = userId;
}

/** Kullanıcı logout olunca RC'da da temizle. */
export async function logoutStoreKit() {
  if ((await getPlatform()) !== "ios") return;
  if (!_configured) return;
  const Purchases = await getRC();
  await Purchases.logOut();
  _userId = null;
}

/**
 * Apple'dan canlı ürün bilgilerini al (lokal fiyat + para birimi).
 * Apple App Store kullanıcının ülkesine göre fiyatı bize verir.
 */
export async function fetchAppleOfferings(): Promise<{
  plus?: { priceString: string; product: unknown };
  ultraPlus?: { priceString: string; product: unknown };
}> {
  if ((await getPlatform()) !== "ios") return {};
  if (!_configured) return {};
  const Purchases = await getRC();
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return {};

  const result: { plus?: { priceString: string; product: unknown }; ultraPlus?: { priceString: string; product: unknown } } = {};
  for (const pkg of current.availablePackages) {
    const id = pkg.product.identifier;
    const entry = { priceString: pkg.product.priceString, product: pkg.product };
    if (id === APPLE_PRODUCT_IDS.plus_monthly) result.plus = entry;
    else if (id === APPLE_PRODUCT_IDS.ultra_plus_monthly) result.ultraPlus = entry;
  }
  return result;
}

/**
 * Satın alma akışı — native sheet açılır, kullanıcı parmak izi ile onaylar.
 * Başarılıysa RevenueCat → Supabase webhook ile premium_tier güncellenir.
 * Frontend zaten Supabase realtime ile profili tazeler.
 */
export async function purchaseApplePlan(planId: ApplePlanId): Promise<{ success: boolean; error?: string }> {
  if ((await getPlatform()) !== "ios") {
    return { success: false, error: "Bu özellik sadece iOS uygulamasında kullanılabilir." };
  }
  if (!_configured) return { success: false, error: "Mağaza başlatılamadı." };

  const Purchases = await getRC();
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, error: "Ürünler şu an alınamıyor." };

    const productId = APPLE_PRODUCT_IDS[planId];
    const pkg = current.availablePackages.find((p) => p.product.identifier === productId);
    if (!pkg) return { success: false, error: "Paket bulunamadı." };

    const purchase = await Purchases.purchasePackage({ aPackage: pkg });
    // RevenueCat customerInfo.entitlements.active["premium"] varsa abonelik aktif
    const active = purchase.customerInfo.entitlements.active["premium"];
    return { success: !!active };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { success: false, error: "Satın alma iptal edildi." };
    return { success: false, error: err?.message ?? "Satın alma başarısız." };
  }
}

/** "Restore Purchases" — Apple zorunlu butonu. Eski aboneliği yeni cihaza taşır. */
export async function restoreApplePurchases(): Promise<{ active: boolean; error?: string }> {
  if ((await getPlatform()) !== "ios") return { active: false };
  if (!_configured) return { active: false, error: "Mağaza başlatılamadı." };
  const Purchases = await getRC();
  try {
    const info = await Purchases.restorePurchases();
    return { active: !!info.customerInfo.entitlements.active["premium"] };
  } catch (e: unknown) {
    return { active: false, error: (e as Error)?.message ?? "Geri yükleme başarısız." };
  }
}
