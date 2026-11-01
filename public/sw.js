/* Hand-written service worker: precaches the app shell, then serves everything offline.
   - Install: fetch "/", find the hashed /_next/static assets it references (and fonts inside CSS) and cache them.
   - Hashed assets are immutable, so they are cache-first.
   - Pages and other files are stale-while-revalidate: instant offline, refreshed in the background.
   Bump VERSION to force old caches to be dropped. */
const VERSION = "v4";
const CACHE = `pera-${VERSION}`;
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/logos/cimb.webp",
  "/logos/gcash.webp",
  "/logos/gotyme.webp",
  "/logos/landbank.webp",
  "/logos/maribank.webp",
  "/logos/maya.webp",
  "/logos/metrobank.webp",
  "/logos/pnb.webp",
  "/logos/rcbc.webp",
  "/logos/securitybank.webp",
  "/logos/tonik.webp",
  "/logos/unionbank.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      const html = await (await cache.match("/")).text();
      const assets = new Set(html.match(/\/_next\/static\/[^"'\s\\)]+/g) || []);
      for (const url of [...assets]) {
        if (!url.endsWith(".css")) continue;
        try {
          const css = await (await fetch(url)).text();
          for (const m of css.matchAll(/url\((\/_next\/static\/[^)"']+)\)/g)) assets.add(m[1]);
        } catch {}
      }
      await Promise.all(
        [...assets].map((url) => cache.add(url).catch(() => undefined)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("pera-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === "navigate" ? "/" : req;
      const hit = await cache.match(key, { ignoreSearch: true });
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => undefined);
      if (hit) {
        event.waitUntil(refresh);
        return hit;
      }
      return (await refresh) || (await cache.match("/")) || Response.error();
    }),
  );
});
