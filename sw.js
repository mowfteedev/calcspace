const RELEASE = "editor-20261023-2";
const CACHE_NAME = `calcspace-${RELEASE}`;
const ASSETS = [
  "./",
  "./index.html",
  `./css/utilities.css?v=${RELEASE}`,
  `./css/style.css?v=${RELEASE}`,
  `./js/audio.js?v=${RELEASE}`,
  `./js/calculator.js?v=${RELEASE}`,
  `./js/ip-calc.js?v=${RELEASE}`,
  `./js/converter.js?v=${RELEASE}`,
  `./js/app.js?v=${RELEASE}`,
  "./manifest.json",
  "./icon.svg",
];
const isAppCache = (name) =>
  name.startsWith("calcspace-") || name.startsWith("fx570-");

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Bypass HTTP cache as well as the previous service worker's Cache Storage.
      await cache.addAll(
        ASSETS.map((url) => new Request(url, { cache: "reload" })),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const oldCaches = (await caches.keys()).filter(
        (name) => isAppCache(name) && name !== CACHE_NAME,
      );
      await Promise.all(oldCaches.map((name) => caches.delete(name)));
      await self.clients.claim();
      // Legacy pages lack update listeners. Refresh them once when migrating their
      // cache so an old HTML document cannot remain paired with new scripts.
      if (oldCaches.length) {
        const windows = await self.clients.matchAll({ type: "window" });
        windows.forEach((client) => {
          const url = new URL(client.url);
          if (!url.href.startsWith(self.registration.scope)) return;
          url.searchParams.set("v", RELEASE);
          // Do not await navigation inside activate: its fetch waits for activation.
          client.navigate(url.href).catch(() => {});
        });
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Navigation must revalidate HTML; versioned CSS/JS cannot reuse an old release.
        const response = await fetch(
          request,
          request.mode === "navigate" ? { cache: "no-cache" } : undefined,
        );
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(cache.put(request, copy));
          if (request.mode === "navigate") {
            const indexCopy = response.clone();
            event.waitUntil(
              cache.put(
                new URL("./index.html", self.registration.scope),
                indexCopy,
              ),
            );
          }
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === "navigate")
          return (await cache.match("./index.html")) || Response.error();
        return Response.error();
      }
    })(),
  );
});
