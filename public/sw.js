// QuoteKit Service Worker — basic offline indicator support
const CACHE_NAME = "quotekit-v1";

// Cache only essential static assets on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/icon.svg",
        "/offline.html",
      ])
    )
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy: try network, fall back to cache for navigations
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/offline.html")
      )
    );
  }
});
