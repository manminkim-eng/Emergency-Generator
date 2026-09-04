/* ════════════════════════════════════════════════
   S9 회차 2026-09-05 — R28 JPG v5.5 소제목 동반 이관 동반 캐시명 v5.0.7
   S4 회차 2026-09-04 — R1b #mm-print-stamp 인쇄 비표시 동반 캐시명 v5.0.6
   S3-0 회차 2026-09-04 — R27 html2canvas 클론 정화 동반 캐시명 v5.0.5
   S2 회차 2026-09-04 — index 소급(R1·R21·R26 등) 동반 캐시명 v5.0.4
   R25 회차 2026-09-04 — 자기 접두어 캐시 조회 · cors 프리캐시 · opaque 가드 · 캐시명 v5.0.3 (S10)
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
/* ═ R25 (2026-09-04) — SW 캐시 origin 오염 차단 (S10 · 지시서 §21-1 R25)
   전역 caches 의 match 는 origin 전체를 검색한다. manminkim-eng.github.io 는 34종이 한 origin 이라
   다른 도구 캐시의 opaque 응답이 <script crossorigin>(cors) 요청에 돌아가 스크립트가 폐기됐다
   (30 #root 빈 화면 · 40 html2canvas undefined). 자기 접두어 캐시만 조회하고, cross-origin
   프리캐시는 cors 로 받으며, opaque↔cors 불일치 시 캐시를 쓰지 않는다. */
const MM_EXCLUDE = [];   /* 내 접두어로 시작하지만 남의 캐시인 이름 (§17-1 충돌) */
const mmOwn   = (k) => k.indexOf(PREFIX) === 0 && !MM_EXCLUDE.some((x) => k.indexOf(x) === 0);
const mmReq   = (u) => (typeof u === 'string' && u.indexOf('http') === 0) ? new Request(u, { mode: 'cors' }) : u;
const mmMatch = (req, opt) => caches.keys()
  .then((ks) => ks.filter(mmOwn))
  .then((ks) => ks.reduce((p, k) => p.then((r) => r || caches.open(k).then((c) => c.match(req, opt))), Promise.resolve(undefined)))
  .then((r) => (r && r.type === 'opaque' && req && req.mode === 'cors') ? undefined : r);

const CACHE_S = 'genset-static-v5.0.7';   /* 정적 캐시 */
const CACHE_F = 'genset-fonts-v5.0.7';    /* 폰트 캐시 */

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
      .then(c => Promise.allSettled(PRECACHE.map((u) => c.add(mmReq(u)).catch((e) => console.warn('[SW] precache skip:', u, e)))))
      .then(() => self.skipWaiting())
  );
});

/* ── activate : 구버전 캐시 삭제 ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_S && k !== CACHE_F && mmOwn(k))
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
    return (await mmMatch('./index.html')) || (await mmMatch('./'));
  }
}

/* ── SKIP_WAITING 메시지 ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
