// Buku Kelas — service worker minimal.
// Fungsinya cuma supaya browser mengizinkan "Install aplikasi" / tampilan
// layar penuh tanpa address bar. Tidak menyimpan/meng-cache data pengguna —
// semua data tetap ditangani oleh aplikasi sendiri (localStorage + Google
// Sheets), bukan oleh service worker ini.

const CACHE_NAME = 'buku-kelas-guru-shell-v2';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Network-first untuk halaman utama (supaya selalu dapat versi terbaru saat
// online), fallback ke cache kalau offline.
// PENTING: hanya tangani permintaan ke alamat KITA SENDIRI (github.io).
// Permintaan ke domain lain (script.google.com / Google Sheets) dilewatkan
// begitu saja tanpa disentuh — kalau ikut "ditangkap" di sini, browser bisa
// menolaknya karena aturan CORS, dan sinkronisasi ke Sheets jadi gagal.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var reqUrl = new URL(event.request.url);
  if (reqUrl.origin !== self.location.origin) return; // biarkan browser yang urus langsung

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }) // paksa lewati cache HTTP browser/CDN, selalu ambil yang terbaru
      .then(function (res) {
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resClone); });
        return res;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
