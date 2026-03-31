/* ═══════════════════════════════════════════════════
   sw.js — 발전설비 PWA Service Worker
   MANMIN-Ver3.0  |  NFTC 602 / NFPC 602
   캐시 전략: Cache-First (정적 자산) + Network-First (API)
═══════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME    = 'genset-v3.0.0';
const CACHE_STATIC  = 'genset-static-v3.0.0';

/* 오프라인에서 반드시 사용 가능해야 할 핵심 파일 */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico'
];

/* Google Fonts 캐시 패턴 */
const FONT_ORIGINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ── install : 핵심 파일 사전 캐시 ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      console.log('[SW] Precaching core assets');
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── activate : 구버전 캐시 정리 ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_STATIC && k !== CACHE_NAME; })
          .map(function(k) {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── fetch : 요청 가로채기 ── */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* 1. Google Fonts → Cache-First */
  if (FONT_ORIGINS.some(function(o) { return url.hostname.includes(o); })) {
    event.respondWith(fontCacheFirst(event.request));
    return;
  }

  /* 2. 정적 자산(.png/.ico/.js/.css/.html/.json) → Cache-First */
  if (isStaticAsset(url)) {
    event.respondWith(staticCacheFirst(event.request));
    return;
  }

  /* 3. Navigate (HTML 페이지) → Network-First, 실패시 캐시 */
  if (event.request.mode === 'navigate') {
    event.respondWith(navigateNetworkFirst(event.request));
    return;
  }

  /* 4. 기타 → 기본 fetch */
});

/* ── 전략 함수들 ── */
function fontCacheFirst(request) {
  return caches.open(CACHE_NAME).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

function staticCacheFirst(request) {
  return caches.open(CACHE_STATIC).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        /* 오프라인 fallback */
        return caches.match('./index.html');
      });
    });
  });
}

function navigateNetworkFirst(request) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      caches.open(CACHE_STATIC).then(function(c) { c.put(request, response.clone()); });
    }
    return response;
  }).catch(function() {
    return caches.match('./index.html') || caches.match('./');
  });
}

function isStaticAsset(url) {
  return /\.(png|ico|jpg|jpeg|svg|webp|gif|js|css|html|json|woff2?|ttf)(\?.*)?$/.test(url.pathname);
}

/* ── 메시지 : SKIP_WAITING (업데이트 강제 적용) ── */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
