// Wedding Photo PWA Service Worker
const CACHE_NAME = 'wedding-photos-v1';
const OFFLINE_CACHE = 'wedding-photos-offline-v1';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/photos',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.png',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle photo uploads - always try network first for API calls
  if (event.request.url.includes('/api/photos')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // If offline, store the request for later sync
          return storeOfflineUpload(event.request);
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/photos');
        }
      })
  );
});

// Store failed uploads for background sync
async function storeOfflineUpload(request) {
  const formData = await request.formData();
  const offlineUploads = JSON.parse(localStorage.getItem('offlineUploads') || '[]');
  
  // Convert FormData to storable format
  const uploadData = {};
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Convert file to base64 for storage
      uploadData[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
        data: await fileToBase64(value)
      };
    } else {
      uploadData[key] = value;
    }
  }
  
  offlineUploads.push({
    url: request.url,
    method: request.method,
    data: uploadData,
    timestamp: Date.now()
  });
  
  localStorage.setItem('offlineUploads', JSON.stringify(offlineUploads));
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: 'Upload queued for when you\'re back online' 
    }),
    { 
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-photos') {
    event.waitUntil(syncOfflineUploads());
  }
});

async function syncOfflineUploads() {
  const offlineUploads = JSON.parse(localStorage.getItem('offlineUploads') || '[]');
  
  for (let i = offlineUploads.length - 1; i >= 0; i--) {
    const upload = offlineUploads[i];
    
    try {
      // Reconstruct FormData from stored data
      const formData = new FormData();
      for (let [key, value] of Object.entries(upload.data)) {
        if (value && typeof value === 'object' && value.data) {
          // Convert base64 back to file
          const response = await fetch(value.data);
          const blob = await response.blob();
          const file = new File([blob], value.name, { type: value.type });
          formData.append(key, file);
        } else {
          formData.append(key, value);
        }
      }
      
      // Attempt to upload
      const response = await fetch(upload.url, {
        method: upload.method,
        body: formData
      });
      
      if (response.ok) {
        // Remove successful upload from queue
        offlineUploads.splice(i, 1);
        console.log('[SW] Offline upload synced successfully');
      }
    } catch (error) {
      console.log('[SW] Failed to sync upload:', error);
    }
  }
  
  localStorage.setItem('offlineUploads', JSON.stringify(offlineUploads));
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_UPLOADS') {
    syncOfflineUploads();
  }
});