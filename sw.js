// Provo River Fishing Intelligence — Service Worker v1.0

const CACHE = 'provo-v1';

const STATIC = [
  './',
  './index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isData = /open-meteo\.com|usgs\.gov/.test(url);
  const isCDN  = /unpkg\.com|jsdelivr\.net|fonts\.|cartocdn\.com/.test(url);

  if (isData) {
    // Network-first: fresh data, fall back to cache when offline
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
  } else if (isCDN) {
    // Cache-first: CDN assets rarely change
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request).then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r;
        }))
    );
  } else {
    // Stale-while-revalidate for app shell
    e.respondWith(
      caches.match(e.request).then(cached => {
        const net = fetch(e.request).then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
});
