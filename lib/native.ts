/**
 * Native bridge — Capacitor 8.
 *
 * Web/Browser ortamında bütün fonksiyonlar no-op veya web API'sine fallback eder.
 * Capacitor (iOS/Android) ortamında ise native plugin'leri kullanır.
 *
 * Hangi platform'da çalıştığımızı `isNative()` ile öğrenebilirsin.
 */

let _platform: "ios" | "android" | "web" | null = null;

/** İlk çağrıda Capacitor'ı dynamic import eder; SSR-safe. */
async function getCap() {
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("@capacitor/core");
    return mod.Capacitor;
  } catch {
    return null;
  }
}

/** Native shell (iOS veya Android) içinde mi çalışıyor? */
export async function isNative(): Promise<boolean> {
  const c = await getCap();
  return !!c && c.isNativePlatform();
}

/** Platform: "ios" | "android" | "web" */
export async function getPlatform(): Promise<"ios" | "android" | "web"> {
  if (_platform) return _platform;
  const c = await getCap();
  _platform = (c?.getPlatform() as "ios" | "android" | "web") ?? "web";
  return _platform;
}

/* ─────────────────────────────────────────────────────────
   APP LIFECYCLE — back button, foreground/background events
   ───────────────────────────────────────────────────────── */
export async function initAppLifecycle(handlers?: {
  onResume?: () => void;
  onPause?: () => void;
  onBackButton?: () => boolean; // return true to suppress default back
}) {
  if (!(await isNative())) return;
  const { App } = await import("@capacitor/app");
  if (handlers?.onResume) App.addListener("resume", handlers.onResume);
  if (handlers?.onPause) App.addListener("pause", handlers.onPause);
  if (handlers?.onBackButton) {
    App.addListener("backButton", ({ canGoBack }) => {
      const consumed = handlers.onBackButton!();
      if (!consumed && !canGoBack) App.exitApp();
      else if (!consumed) window.history.back();
    });
  }
}

/* ─────────────────────────────────────────────────────────
   SPLASH SCREEN — gizle (uygulama hazır olduktan sonra)
   ───────────────────────────────────────────────────────── */
export async function hideSplash(delayMs = 0) {
  if (!(await isNative())) return;
  const { SplashScreen } = await import("@capacitor/splash-screen");
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  await SplashScreen.hide({ fadeOutDuration: 240 });
}

/* ─────────────────────────────────────────────────────────
   STATUS BAR — uygulama temasına uydur
   ───────────────────────────────────────────────────────── */
export async function setStatusBarTheme(theme: "dark" | "light") {
  if (!(await isNative())) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
}

/* ─────────────────────────────────────────────────────────
   SHARE — native share sheet (Web Share API fallback)
   ───────────────────────────────────────────────────────── */
export async function shareNative(opts: { title?: string; text?: string; url?: string; dialogTitle?: string }) {
  if (await isNative()) {
    const { Share } = await import("@capacitor/share");
    return Share.share(opts);
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      return await navigator.share(opts);
    } catch {
      /* user cancelled */
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard && opts.url) {
    await navigator.clipboard.writeText(opts.url);
  }
}

/* ─────────────────────────────────────────────────────────
   IN-APP BROWSER — SFSafariViewController (App Store policy uyumlu)
   ───────────────────────────────────────────────────────── */
export async function openBrowserNative(url: string) {
  if (await isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ─────────────────────────────────────────────────────────
   PREFERENCES — secure key-value store
   ───────────────────────────────────────────────────────── */
export async function prefsSet(key: string, value: string) {
  if (await isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
    return;
  }
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
}

export async function prefsGet(key: string): Promise<string | null> {
  if (await isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    return (await Preferences.get({ key })).value;
  }
  if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  return null;
}

/* ─────────────────────────────────────────────────────────
   PUSH NOTIFICATIONS — APNs / FCM register
   ───────────────────────────────────────────────────────── */
export async function registerPushNotifications(onToken: (token: string) => void) {
  if (!(await isNative())) return;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return;
  await PushNotifications.register();
  PushNotifications.addListener("registration", (t) => onToken(t.value));
  PushNotifications.addListener("registrationError", (err) => {
    console.error("Push registration error:", err);
  });
}

/* ─────────────────────────────────────────────────────────
   SIGN IN WITH APPLE — native (iOS) → identity token alır
   Web'de null döner; çağıran taraf Supabase OAuth redirect'e fallback eder.
   ───────────────────────────────────────────────────────── */
export interface AppleSignInResult {
  identityToken: string;
  nonce: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}

export async function signInWithAppleNative(): Promise<AppleSignInResult | null> {
  if ((await getPlatform()) !== "ios") return null;
  const mod = await import("@capacitor-community/apple-sign-in");
  const SignInWithApple = mod.SignInWithApple;
  // Supabase'in beklediği nonce: base64-url SHA256 + raw value
  const rawNonce = crypto.randomUUID() + crypto.randomUUID();
  const res = await SignInWithApple.authorize({
    clientId: "com.anonix.app",
    redirectURI: "https://www.anonix.digital/auth/callback",
    scopes: "email name",
    nonce: rawNonce,
  });
  const r = res.response;
  if (!r?.identityToken) return null;
  return {
    identityToken: r.identityToken,
    nonce: rawNonce,
    email: r.email,
    givenName: r.givenName,
    familyName: r.familyName,
  };
}

/* ─────────────────────────────────────────────────────────
   NETWORK — connectivity status
   ───────────────────────────────────────────────────────── */
export async function getNetworkStatus(): Promise<{ connected: boolean; type: string }> {
  if (await isNative()) {
    const { Network } = await import("@capacitor/network");
    const s = await Network.getStatus();
    return { connected: s.connected, type: s.connectionType };
  }
  return {
    connected: typeof navigator !== "undefined" ? navigator.onLine : true,
    type: "unknown",
  };
}
