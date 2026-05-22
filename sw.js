const CACHE_NAME = 'birwalidin-cache-v8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './css/style.css?v=8',
  './js/script.js?v=8',
  './js/admin.js',
  './assets/images/logo.png',
  './assets/images/cover.png',
  './assets/images/Favicon.ico',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active update immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  self.clients.claim(); // Take control of pages immediately
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

  // Bypass cache for admin panel files to prevent caching issues for the administrator
  if (event.request.url.includes('admin.html') || 
      event.request.url.includes('js/admin.js') || 
      event.request.url.includes('css/admin.css')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Clone the response immediately (synchronously) before it is returned and consumed
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
