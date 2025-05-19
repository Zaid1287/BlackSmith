/**
 * Registers a service worker for offline support and PWA functionality
 */

// To match the existing import in main.tsx
export function register() {
  if ('serviceWorker' in navigator) {
    // Delay service worker registration until after app has initialized
    // This prevents interference with the authentication flow
    window.addEventListener('load', () => {
      // Delay registration to ensure authentication completes first
      setTimeout(async () => {
        try {
          // Check if we're on an authentication page and skip registration if so
          const isAuthPage = window.location.pathname.includes('/auth') || 
                            window.location.pathname === '/' && !document.cookie.includes('connect.sid');
          
          if (isAuthPage) {
            console.log('Service Worker registration deferred on auth page');
            return;
          }
          
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
            // Don't update the service worker until the window is reloaded
            // This prevents interruptions during user sessions
            updateViaCache: 'none'
          });
          
          console.log('Service Worker registered successfully:', registration);
          
          // Only request notification permission when needed, not on initial load
          // This improves the initial user experience
          if ('Notification' in window && localStorage.getItem('enableNotifications') === 'true') {
            Notification.requestPermission();
          }
          
          setupBackgroundSync(registration);
          
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }, 2000); // 2-second delay to ensure authentication completes first
    });
  }
}

/**
 * Sets up background sync to handle offline data submission
 */
async function setupBackgroundSync(registration: ServiceWorkerRegistration) {
  if ('sync' in registration) {
    try {
      // Request permission for background sync
      await navigator.permissions.query({
        name: 'periodic-background-sync' as any
      });
      
      console.log('Background sync is available');
    } catch (error) {
      console.log('Background sync is not available:', error);
    }
  }
}

/**
 * Adds data to the outbox for background syncing when offline
 */
export async function addToOutbox(url: string, method: string, data: any) {
  if (!('indexedDB' in window)) {
    return false;
  }
  
  try {
    const db = await openDatabase();
    await addItemToOutbox(db, { url, method, data, timestamp: Date.now() });
    
    // Request sync if online
    if (navigator.onLine && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        try {
          // Type assertion needed as TypeScript doesn't have built-in types for all modern APIs
          const syncManager = (registration as any).sync;
          await syncManager.register('sync-journey-data');
        } catch (error) {
          console.error('Failed to register sync:', error);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to add to outbox:', error);
    return false;
  }
}

/**
 * Open the IndexedDB database for background sync
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blacksmith-sync-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add an item to the outbox store
 */
function addItemToOutbox(db: IDBDatabase, item: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['outbox'], 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.add(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// The service worker is registered in main.tsx
// No need to call register() here