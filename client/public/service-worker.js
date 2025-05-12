// Service Worker with background sync capabilities
// This addresses the PWA Builder recommendation "Ensure user actions and content is always in sync"

const CACHE_NAME = 'blacksmith-traders-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_IMG = '/icons/offline.png';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/offline.png',
  '/icons/offline.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  // CSS and JavaScript files will be handled by Workbox
];

// Install event - cache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - provide offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.mode === 'navigate' || 
     (event.request.method === 'GET' && 
      event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }
  
  // For other requests, try the network first, then fall back to the cache
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful GET requests
            if (fetchResponse.ok && event.request.method === 'GET') {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          })
          .catch(() => {
            // For image requests, return the offline image
            if (event.request.destination === 'image') {
              return caches.match(OFFLINE_IMG);
            }
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

// Background sync
const syncJourneyData = async () => {
  const outbox = await getOutboxData();
  for (const item of outbox) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        // Remove successfully synced items from outbox
        await removeFromOutbox(item.id);
      }
    } catch (error) {
      console.error('Background sync failed:', error);
      // Keep item in outbox for next sync attempt
    }
  }
};

const getOutboxData = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['outbox'], 'readonly');
    const store = transaction.objectStore('outbox');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const removeFromOutbox = async (id) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['outbox'], 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blacksmith-sync-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-journey-data') {
    event.waitUntil(syncJourneyData());
  }
});

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data.url;
      
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});