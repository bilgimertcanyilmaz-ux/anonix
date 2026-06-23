import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Anonix iOS / Android shell — Capacitor 8.
 *
 * Strateji: Native WebView içinde anonix.digital'ı yükler.
 * Native özellikler (push, share, IAP, biometric, deep link) Capacitor plugin'leriyle sağlanır.
 * Bu sayede Apple "thin wrapper" eleştirisi düşer — App Store guideline 4.2 uyumlu.
 *
 * webDir: offline fallback HTML (ağ yoksa "Bağlantı yok" ekranı).
 * server.url: production'da anonix.digital'a yönlendir. Geliştirmede local IP kullan.
 */
const config: CapacitorConfig = {
  appId: "com.anonix.app",
  appName: "Anonix",
  webDir: "mobile-shell/dist",

  server: {
    url: "https://www.anonix.digital",
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    // Aşağıdaki domain'lere navigasyon native WebView'da kalır (popup açmaz).
    allowNavigation: [
      "www.anonix.digital",
      "anonix.digital",
      "*.supabase.co",
      "*.iyzipay.com", // Web/Android için iyzico ödeme akışı (iOS'ta IAP)
      "*.iyzico.com",
    ],
  },

  ios: {
    // Splash zamanlamasını native side'da kontrol etmek için
    contentInset: "always",
    // Statik bar overlay edilmesin → Hero header'larımız status bar'ın altında kalır
    backgroundColor: "#0f0a1f", // ink-950 — uygulamayla uyumlu koyu mor
    // Universal Link / deep linking için Associated Domains
    scheme: "Anonix",
    // Apple Sign In + IAP için zorunlu Capabilities config'i Xcode'da elle yapılır
    // (overrideUserInterfaceStyle Info.plist içinde 'UIUserInterfaceStyle = Dark' olarak ayarlanır)
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false, // JS tarafından kontrol edilir (network ready olunca hide)
      launchFadeOutDuration: 240,
      backgroundColor: "#0f0a1f",
      androidSplashResourceName: "splash",
      iosSpinnerStyle: "small",
      spinnerColor: "#a855f7",
      showSpinner: true,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK", // overlayed dark glass — dark mode için
      backgroundColor: "#0f0a1f",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Anonix renkleri ile haptic feedback
    Haptics: {},
    // Reader app exception için: web checkout linkleri Safari'de açılır
    Browser: {
      // iOS SFSafariViewController kullanır — App Store policy uyumlu
    },
  },
};

export default config;
