const CACHE_NAME = "calcspace-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./css/utilities.css",
  "./css/style.css",
  "./js/audio.js",
  "./js/calculator.js",
  "./js/ip-calc.js",
  "./js/converter.js",
  "./js/app.js",
  "./manifest.json",
  "./icon.svg",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith("calcspace-") || key.startsWith("fx570-")) &&
                key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  // Network first keeps deployments fresh; cached assets remain available offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return caches.match("./index.html");
        return Response.error();
      }),
  );
});
