/* Aktenzeichen — Service Worker (network-first für Seite, Skript und Daten) */
const CACHE="aktenzeichen-v5";
const SHELL=["./","./index.html","./cases.js","./manifest.json","./icon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys()
 .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data==="skipWaiting")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 const req=e.request;if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.hostname.endsWith("supabase.co"))return;
 const live=req.mode==="navigate"||/\.(html|js|json)$/.test(url.pathname)||url.pathname.endsWith("/");
 if(live){e.respondWith(fetch(req).then(res=>{const c=res.clone();
   caches.open(CACHE).then(x=>x.put(req,c)).catch(()=>{});return res})
  .catch(()=>caches.match(req).then(h=>h||caches.match("./index.html"))))}
 else{e.respondWith(caches.match(req).then(h=>h||fetch(req).then(res=>{const c=res.clone();
   caches.open(CACHE).then(x=>x.put(req,c)).catch(()=>{});return res})))}
});
