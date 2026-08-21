/**
 * Offline is a courtesy. The vessel was designed to work on a train, in a
 * tunnel, in a country whose network the three peoples were not consulted
 * about. Cache-first for the shell; the shell is the whole application.
 */
const CACHE = 'zhaelim-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/vessel.css',
  './assets/icon.svg',
  './src/main.js',
  './src/core/hex.js',
  './src/core/rng.js',
  './src/core/emitter.js',
  './src/core/storage.js',
  './src/core/haptics.js',
  './src/audio/voice.js',
  './src/game/castes.js',
  './src/game/lattice.js',
  './src/game/simulation.js',
  './src/game/solver.js',
  './src/game/songs.js',
  './src/render/palette.js',
  './src/render/glyph.js',
  './src/render/lattice-view.js',
  './src/culture/lexicon.js',
  './src/culture/tongue.js',
  './src/culture/lore.js',
  './src/culture/rites.js',
  './src/ui/dom.js',
  './src/ui/app.js',
  './src/ui/screen-threshold.js',
  './src/ui/screen-weave.js',
  './src/ui/screen-play.js',
  './src/ui/screen-codex.js',
  './src/ui/screen-tongue.js',
  './src/ui/screen-rite.js',
  './src/ui/screen-nest.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ??
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
