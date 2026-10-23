/* SongVault Studio — offline shell only. Private song data stays in IndexedDB. */
const CACHE='songvault-shell-v3-20261023';
const ASSETS=['./','./index.html','./phase3.js','./phase3.css','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('songvault-shell-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Only same-origin files inside app directory. Never cache third-party content or music downloads.
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL('./',self.registration.scope).pathname))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>res.ok?res:Promise.reject(Error('Offline'))).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit || fetch(req)));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
