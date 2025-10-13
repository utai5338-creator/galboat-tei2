self.addEventListener('install', e => {
  e.waitUntil(caches.open('galboat-tei').then(cache => cache.addAll(['/', '/index.html', '/style.css', '/app.js'])));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});
