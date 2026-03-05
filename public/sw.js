// Kill-switch service worker — unregisters itself and clears all caches.
// This replaces the old PWA service worker so that any browser that still
// has it installed will clean up on next load.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
  self.clients.claim();
});

