/* ════════════════════════════════════════════════
   sw.js — 발전설비 PWA Service Worker
   MANMIN-Ver3.0  ·  NFTC 602 / NFPC 602
   Cache-First (정적) + Network-First (Navigate)
════════════════════════════════════════════════ */
'use strict';

const CACHE_S = 'genset-static-v3.1';   /* 정적 캐시 */
const CACHE_F = 'genset-fonts-v3.1';    /* 폰트 캐시 */

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/icon-96x96.png'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ── install ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_S)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── activate : 구버전 캐시 삭제 ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_S && k !== CACHE_F)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── fetch ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* 폰트 → Cache-First */
  if (FONT_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(cacheFirst(e.request, CACHE_F));
    return;
  }
  /* 정적 자산 → Cache-First */
  if (isStatic(url.pathname)) {
    e.respondWith(cacheFirst(e.request, CACHE_S));
    return;
  }
  /* HTML 내비게이션 → Network-First */
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
  }
});

function isStatic(p) {
  return /\.(png|ico|jpg|jpeg|svg|webp|gif|js|css|html|json|woff2?|ttf)(\?.*)?$/.test(p);
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.status === 200) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const c = await caches.open(CACHE_S);
      c.put(req, res.clone());
    }
    return res;
  } catch {
    return (await caches.match('./index.html')) || (await caches.match('./'));
  }
}

/* ── SKIP_WAITING 메시지 ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
