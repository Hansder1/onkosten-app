REGEL1
REGEL2 test — é
REGEL3/* Onkosten-app — service worker
   Houdt de app zelf offline beschikbaar. Uploads lopen NOOIT via deze cache:
   die zitten in de wachtrij in IndexedDB. */

const VERSION = 'onkosten-v1.0.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                               .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                       // uploads: altijd netwerk

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Drive/Nominatim: altijd netwerk

  // Netwerk eerst, cache als vangnet — zo krijg je updates zonder gedoe.
  e.respondWith(
    fetch(req)
      .then(function (res) {
        const copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
