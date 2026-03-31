/* ═══════════════════════════════════════════
   Service Worker — 발전설비 · MANMIN-Ver3.0
   Cache-First(로컬) + Network-First(폰트)
   버전 변경 → 구캐시 자동 삭제
═══════════════════════════════════════════ */
'use strict';
const CACHE = 'generator-v3-1-0';
const MAIN  = './index.html';
const PRE   = ['./', './index.html', './manifest.json',
               './icons/icon-192x192.png', './icons/icon-512x512.png',
               './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.protocol==='chrome-extension:')return;
  if(u.hostname.includes('fonts.google')||u.hostname.includes('fonts.gstatic'))
    {e.respondWith(netFirst(e.request));return;}
  if(u.origin===self.location.origin){e.respondWith(cacheFirst(e.request));return;}
  e.respondWith(netFirst(e.request));
});
function cacheFirst(req){
  return caches.match(req).then(cached=>{
    const fresh=fetch(req).then(res=>{
      if(res&&res.status===200&&res.type!=='opaque')
        caches.open(CACHE).then(c=>c.put(req,res.clone()));
      return res;
    }).catch(()=>{});
    return cached||fresh;
  }).catch(()=>caches.match(MAIN));
}
function netFirst(req){
  return fetch(req).then(res=>{
    if(res&&res.status===200)caches.open(CACHE).then(c=>c.put(req,res.clone()));
    return res;
  }).catch(()=>caches.match(req).then(c=>c||caches.match(MAIN)));
}
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
