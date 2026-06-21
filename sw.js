// Parla Italiano — Service Worker
// يخزّن كل حاجة (HTML + مكتبة Whisper + موديل + خطوط) بعد أول زيارة مع نت
// بعدها الأپ يشتغل أوفلاين بالكامل

const CACHE = 'parla-v1';

// ===== INSTALL =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // نحاول نحمّل مكتبة transformers مسبقاً لو عندنا نت
      c.add('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js')
       .catch(() => { /* لو مفيش نت، مش مشكلة */ })
    )
  );
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ===== FETCH — cache-first =====
// أي ريكويست: أول شوف في الكاش، لو مش موجود روح النت وخزّنه
self.addEventListener('fetch', e => {
  // بس نتعامل مع GET
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // استثنينا أي حاجة analytics أو tracking
  if (url.includes('google-analytics') || url.includes('analytics')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(resp => {
        // بس خزّن الردود الناجحة
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => {
        // أوفلاين ومش في الكاش
        return new Response(
          '<h2>📵 أوفلاين — افتح الأپ مرة واحدة بالنت الأول</h2>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
