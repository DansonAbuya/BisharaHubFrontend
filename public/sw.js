/* BiasharaHub PWA - minimal service worker for installability and cache */
const CACHE_NAME = 'biasharahub-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Do not intercept navigation (page load) requests. Let the browser load the document
// from the network so the live site always loads normally. The SW remains for PWA installability.
// (Previously we served "You're Offline" when the SW's fetch failed, which could happen even when online.)
