// Service Worker for SenseMinds 360 PWA
// Version 1.0.0

const CACHE_NAME = 'senseminds-360-v1';
const STATIC_CACHE_NAME = 'senseminds-360-static-v1';
const DYNAMIC_CACHE_NAME = 'senseminds-360-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/sensors/current',
  '/api/system/health',
  '/api/alerts/recent'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }
  
  // Default: network-first strategy
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy (good for API calls and dynamic content)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response and return it
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's an API request and we have no cache, return a meaningful error
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Network unavailable', 
          message: 'This data is not available offline',
          offline: true 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For other requests, throw the error
    throw error;
  }
}

// Cache-first strategy (good for static assets)
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Cache miss, try network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Navigation strategy (for page requests)
async function navigationStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Network failed, try to return cached page or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page if available
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort: return a basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - SenseMinds 360</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>SenseMinds 360 is not available right now. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Helper function to determine if a path is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.includes('/icons/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync offline data when connection is restored
    console.log('Service Worker: Performing background sync');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'New alert from SenseMinds 360',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Alert',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SenseMinds 360', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});