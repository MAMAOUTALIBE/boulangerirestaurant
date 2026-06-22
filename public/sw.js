// Service worker minimal : cache du shell + repli hors-ligne pour le menu.
const CACHE = "restaurant-v1";
const SHELL = ["/", "/menu"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // On ne gère que la navigation GET (pages), en stale-while-revalidate léger.
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin))
    return;
  // Ne pas intercepter les routes API / admin (toujours réseau).
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin"))
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match("/menu")),
        ),
    );
  }
});
