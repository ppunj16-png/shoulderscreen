// Service Worker — ShoulderScreen+
const CACHE = 'shoulderscreen-pwa-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>c.addAll(['/','/index.html']))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Never cache Firebase, Anthropic API, or external auth
  if (['firebaseio.com','firebase.google.com','googleapis.com','api.anthropic.com','identitytoolkit.googleapis.com'].some(h=>u.hostname.includes(h))) {
    e.respondWith(fetch(e.request)); return;
  }
  if (u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{caches.open(CACHE).then(cc=>cc.put(e.request,r.clone()));return r;})));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    if(e.request.method==='GET'&&r.status===200)caches.open(CACHE).then(cc=>cc.put(e.request,r.clone()));
    return r;
  }).catch(()=>e.request.mode==='navigate'?caches.match('/index.html'):undefined)));
});
