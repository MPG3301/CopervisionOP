
const CACHE_NAME = 'cv-rewards-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event: Smart routing
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. DYNAMIC DATA SAFETY: Never cache Supabase API calls or Auth requests
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/auth/')) {
    return; // Let it go directly to the network
  }

  // 2. STATIC ASSETS: Stale-while-revalidate for local files and CDN resources
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache successful GET requests for non-API stuff
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached response if network fails (offline support)
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
