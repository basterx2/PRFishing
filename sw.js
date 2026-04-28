// ============================================================
// SERVICE WORKER — Provo River Fishing Index PWA
// ============================================================

const CACHE_NAME = 'provo-fishing-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/solunar.js',
  '/js/usgs.js',
  '/js/weather.js',
  '/js/fishingIndex.js',
  '/js/map.js',
  '/js/charts.js',
  '/js/ui.js',
  '/js/app.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls — network first, fallback to cache
  if (url.hostname.includes('waterservices.usgs.gov') ||
      url.hostname.includes('api.weather.gov')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
