// Keeps the 3D models and images on the phone after the first visit,
// so the demo still loads fast on a crowded or weak network.
const CACHE = "towers-v6";
const HEAVY = /\.(glb|usdz|jpg|jpeg|png|webp|mp4)$/i;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (HEAVY.test(url.pathname)) {
    // cache first: models and pictures rarely change
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200) c.put(req, res.clone());
      return res;
    }));
  } else if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    // network first for pages, so edits show at once; cached copy if offline
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req)));
  }
});
