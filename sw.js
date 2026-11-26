// Zaki service worker : code toujours frais (réseau d'abord), gros fichiers en cache (renouvelés à chaque version)
const VERSION = 'zaki-20261126153447';
const CORE = ['./', 'index.html', 'game.js', 'ui.js', 'manifest.json', 'lib/three.min.js', 'lib/gltfloader.js', 'lib/buffergeometryutils.js', 'lib/mqtt.min.js', 'fonts/lilita.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FRESH = /(\/|\.html|\.js|\.json|\.css)$/;
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate' || FRESH.test(url.pathname)) {
    // réseau d'abord : on a toujours la dernière version, le cache sert seulement hors ligne
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // gros fichiers (modèles, images, son) : cache d'abord, vidé à chaque nouvelle version
  e.respondWith(caches.open(VERSION).then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
});
