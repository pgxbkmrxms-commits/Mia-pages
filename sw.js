// Service Worker for Offline Functionality
const CACHE_NAME = 'mia-pages-v3';
const OFFLINE_PAGE = './mia-optimized.html';
const NAVIGATION_NETWORK_TIMEOUT_MS = 4000;
const PRECACHE_ASSETS = [
  './mia-optimized.html',
  './images/giphy.gif',
  './images/image2.gif',
  './images/image3.gif',
  './images/image4.gif',
  './images/image5.gif',
  './images/image6.gif',
  './images/image7.gif',
  './libs/confetti.min.js'
];

const isCacheable = (response) => response && response.ok && (response.type === 'basic' || response.type === 'default');

const networkWithTimeout = async (request, timeoutMs = NAVIGATION_NETWORK_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await networkWithTimeout(request);
    if (isCacheable(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || cache.match(OFFLINE_PAGE);
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => undefined);
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return cache.match(OFFLINE_PAGE);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => (cacheName !== CACHE_NAME ? caches.delete(cacheName) : undefined))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'image' || requestUrl.pathname.endsWith('.gif')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (requestUrl.pathname.endsWith('/libs/confetti.min.js')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
