/* Anonix Service Worker — temel PWA: app shell cache + offline fallback */
const CACHE = "anonix-v1";
const APP_SHELL = ["/offline", "/manifest.json", "/logo.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Yalnızca kendi origin'imiz; Supabase/3p istekleri dokunma
  if (url.origin !== self.location.origin) return;

  // Sayfa gezinmeleri: network-first → başarısızsa cache → offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline")))
    );
    return;
  }

  // Statik asset'ler (logo/ikon): cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname === "/logo.png") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }
  // Diğerleri: ağ (Next kendi cache'ini yönetir)
});
