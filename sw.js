/* ════════════════════════════════════════════════
   sw.js — 발전설비 PWA Service Worker
   MANMIN-Ver5.0  ·  NFTC 602 / NFPC 602
   Cache-First (정적) + Network-First (Navigate)

   2026-08-31 — 캐시 버전 v3.1 → v5.0
   앱은 v5.0 인데 캐시명이 v3.1 로 남아 있어, activate 의
   "현재 캐시명과 다른 것만 삭제" 로직이 옛 캐시를 지우지 못했다.
   그 결과 기존 사용자에게 구버전 index.html 이 계속 제공됐다.
   캐시명을 올리면 activate 가 옛 캐시를 자동으로 정리한다.
════════════════════════════════════════════════ */
'use strict';

/* §17-1 (2026-09-02) — 도구 고유 접두어. 종전 필터는 같은 origin 의 39종 캐시를 전부 지웠다 */
const PREFIX  = 'genset-';
const CACHE_S = 'genset-static-v5.0.2';   /* 정적 캐시 */
const CACHE_F = 'genset-fonts-v5.0.2';    /* 폰트 캐시 */

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
        keys.filter(k => k !== CACHE_S && k !== CACHE_F && k.indexOf(PREFIX) === 0)
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
  /* ⛔ 2026-09-03 — HTML 내비게이션을 정적 자산보다 **먼저** 판정한다.
     종전에는 isStatic 이 먼저였고 그 정규식에 html 이 있어,
     `.../index.html` 로 열면 Cache-First 에 걸려 배포해도 구버전 화면이 계속 나왔다.
     (`/Emergency-Generator/` 슬래시 접근만 우연히 최신이 나왔다) */
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(networkFirst(e.request));
    return;
  }
  /* 정적 자산 → Cache-First */
  if (isStatic(url.pathname)) {
    e.respondWith(cacheFirst(e.request, CACHE_S));
    return;
  }
});

function isStatic(p) {
  /* html 제거 — 이중 안전장치. 문서는 위 navigate 분기가 처리한다 */
  return /\.(png|ico|jpg|jpeg|svg|webp|gif|js|css|json|woff2?|ttf)(\?.*)?$/.test(p);
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
