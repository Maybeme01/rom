// Queen Rory Service Worker for PWA
const CACHE_NAME = 'pycode-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Pass through network requests without blocking
self.addEventListener('fetch', (e) => {
  // Let network handle directly
});

