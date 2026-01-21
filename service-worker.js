const CACHE_NAME = 'listenfreely-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/listenfreely.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
        return null;
      }));
      await self.clients.claim();
    })()
  );
});

// Network-first fetch: try network, fall back to cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Put a copy in cache
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
  );
});

// Let pages tell the worker to skip waiting
self.addEventListener('message', (event) => {
  try {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  } catch (e) {
    // ignore
  }
});
