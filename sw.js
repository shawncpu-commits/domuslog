// Service Worker per DomusLog - Versione Stabile Sandbox
const CACHE_NAME = 'domuslog-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Strategia pass-through per ambiente di sviluppo
  event.respondWith(fetch(event.request));
});