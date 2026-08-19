/**
 * Cache-first service worker so the game runs offline once installed.
 *
 * Bump CACHE on every release: the old cache is dropped on activate, which is
 * what stops a returning player from being served a stale mix of new HTML and
 * old modules.
 */

const CACHE = 'sector-command-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './src/main.js',
  './src/ui.js',
  './src/engine/viewport.js',
  './src/engine/loop.js',
  './src/engine/input.js',
  './src/engine/scene.js',
  './src/engine/audio.js',
  './src/engine/storage.js',
  './src/game/config.js',
  './src/game/grid.js',
  './src/game/contacts.js',
  './src/game/background.js',
  './src/scenes/menu.js',
  './src/scenes/play.js',
  './src/scenes/gameover.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      // Cache same-origin successes so later navigations work offline too.
      if (res.ok && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
