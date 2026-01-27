// Service Worker for caching static assets
const CACHE_NAME = 'imi-app-v1'
const STATIC_ASSETS = [
  '/',
  '/favicon and mini sidebar logo.png',
  '/full logo.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip non-GET requests and external URLs
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          // Only cache static assets
          if (
            event.request.url.includes('/_next/static/') ||
            event.request.url.includes('/_next/image') ||
            STATIC_ASSETS.some((asset) => event.request.url.includes(asset))
          ) {
            cache.put(event.request, responseToCache)
          }
        })

        return response
      })
    })
  )
})
