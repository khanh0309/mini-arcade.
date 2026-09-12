const CACHE='mini-arcade-v1';
const CORE=[
  './','./index.html','./games.json','./assets/styles.css','./assets/app.js','./assets/game-shell.css','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  './games/snake/','./games/snake/index.html','./games/snake/game.js',
  './games/sky-flap/','./games/sky-flap/index.html','./games/sky-flap/game.js',
  './games/dino-run/','./games/dino-run/index.html','./games/dino-run/game.js',
  './games/sliding-puzzle/','./games/sliding-puzzle/index.html','./games/sliding-puzzle/game.js',
  './games/block-drop/','./games/block-drop/index.html','./games/block-drop/game.js'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match('./index.html'))));});
