// Service Worker Stub - No-op caching
const CACHE_NAME = 'studiow-waitlist-v1';

// Install event - no-op
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - no-op
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - no-op (pass through)
self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching
  // This is a stub implementation
  return;
});

