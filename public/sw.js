self.addEventListener('install', e=>{
  e.waitUntil(caches.open('v2-shell').then(c=>c.addAll(['/','/manifest.json'])));
});
self.addEventListener('fetch', e=>{
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
