// Service Worker for BlackSmith Logistics App

const CACHE_NAME = 'blacksmith-app-v2';
const APP_SHELL_CACHE = 'app-shell-v2';
const DATA_CACHE_NAME = 'data-cache-v2';

// Assets to cache immediately during install
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  // Add more assets here including fonts, images, etc.
];

// URLs that should never be cached (API endpoints, Supabase calls)
const NEVER_CACHE_URLS = [
  /\/api\//,
  /supabase\.co/,
];

// Files that should always come from the network if possible
const NETWORK_FIRST_URLS = [
  /\/api\//,
  /supabase\.co/,
];

// Install event: Cache the application shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('[Service Worker] Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating');
  
  const currentCaches = [APP_SHELL_CACHE, DATA_CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          console.log('[Service Worker] Deleting old cache:', cacheToDelete);
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Helper function: Should this request be cached?
function shouldCache(url) {
  return !NEVER_CACHE_URLS.some(regex => regex.test(url.toString()));
}

// Helper function: Should this request use network-first strategy?
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST_URLS.some(regex => regex.test(url.toString()));
}

// Fetch event: Handle all fetch requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests to reduce the risk of cross-origin cache poisoning
  if (url.origin !== self.location.origin && !url.hostname.endsWith('supabase.co')) {
    return;
  }
  
  // Handle API/Supabase requests differently - network first, then cache
  if (shouldUseNetworkFirst(url)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For other requests, use cache first, then network
  event.respondWith(cacheFirstStrategy(event.request));
});

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the response if it's valid and the URL should be cached
    if (networkResponse.ok && shouldCache(request.url)) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, return a basic offline response
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/index.html');
    }
    
    // For other resources, return an empty response
    return new Response('Network error occurred', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response if it's valid and should be cached
    if (networkResponse.ok && shouldCache(request.url)) {
      const cache = await caches.open(request.url.includes('/api/') ? 
                                       DATA_CACHE_NAME : APP_SHELL_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails and it's a HTML request, return the cached home page
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/index.html');
    }
    
    // Otherwise return an error
    throw error;
  }
}

// Handle background sync for offline submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-expenses' || event.tag === 'sync-locations') {
    event.waitUntil(syncData(event.tag));
  }
});

// Function to sync offline data
async function syncData(syncTag) {
  // The implementation depends on how you handle offline data in your app
  console.log(`[Service Worker] Background syncing ${syncTag}`);
  
  // This would be implemented based on your app's specific needs
  // For example, reading from IndexedDB and sending to your API
  
  // Simplified example:
  if (syncTag === 'sync-expenses') {
    // Sync expenses from IndexedDB to server
    // ...
  } else if (syncTag === 'sync-locations') {
    // Sync location updates from IndexedDB to server
    // ...
  }
}

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/assets/logo.png',
    badge: '/assets/badge.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});