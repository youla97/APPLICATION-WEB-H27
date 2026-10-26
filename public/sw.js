// Service worker : programme des rites et documents disponibles hors ligne (réseau d'abord, cache en secours).
const CACHE = "hadj2027-v1";
const OFFLINE_PAGES = ["/accompagnement", "/espace", "/espace/badge", "/espace/fiche"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/accompagnement", "/icon.svg"]).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  const cacheable = OFFLINE_PAGES.includes(url.pathname) || url.pathname.startsWith("/recu/") || url.pathname.startsWith("/_next/static/");
  if (!cacheable) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/accompagnement"))),
  );
});
