/**
 * Registers a service worker for offline support and PWA functionality
 */

// To match the existing import in main.tsx
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration);
        
        // Request notification permission (for push notifications)
        if ('Notification' in window) {
          Notification.requestPermission();
        }
        
        setupBackgroundSync(registration);
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
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