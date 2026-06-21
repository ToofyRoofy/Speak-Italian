// Parla Italiano — Service Worker v2
const CACHE = 'parla-v2';

// المواقع اللي عايزين نخزّنها للأوفلاين
const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'huggingface.co',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ===== INSTALL =====
self.addEventListener('install', e => {
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
  // امسح الكاش القديم
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // ① صفحة HTML: دايمًا من النت (network-first)
  //    لو مفيش نت، نرجع النسخة المخزّنة
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp.ok) {
            caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ② CDN (Whisper + مكتبات + خطوط): cache-first
  //    بعد أول تحميل، يشتغل أوفلاين بالكامل
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          }
          return resp;
        });
      })
    );
    return;
  }

  // ③ أي حاجة تانية: عدّيها عادي بدون تدخّل
});
