const CACHE_NAME = 'birwalidin-cache-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/script.js',
  './js/admin.js',
  './assets/images/logo.png',
  './assets/images/cover.png',
  './assets/images/Favicon.ico',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event (Stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Firebase/Blogger/YouTube)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
