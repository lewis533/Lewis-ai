const CACHE = 'lewis-ai-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './ai-icon-192.png',
  './ai-icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Don't cache API calls — always go to network for those
  if (e.request.url.includes('/.netlify/functions/') ||
      e.request.url.includes('generativelanguage.googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
