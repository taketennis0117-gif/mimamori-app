/* 見守り君:オフライン起動用。アプリ本体のファイルだけをキャッシュする(生徒データは扱わない) */
const CACHE = 'mimamori-dist-v1';
const FILES = ['mimamori-kun.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// オンラインなら最新版を取得してキャッシュを更新、つながらなければキャッシュから起動
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !FILES.some(f => url.pathname.endsWith('/' + f))) return;
  const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000));
  e.respondWith(Promise.race([net, timeout]).catch(() => caches.match(req, { ignoreSearch: true })));
});
