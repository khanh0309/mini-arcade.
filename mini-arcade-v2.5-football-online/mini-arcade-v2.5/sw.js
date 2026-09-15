const CACHE='mini-arcade-v10-football-online';
const CORE=[
  './','./index.html','./games.json','./assets/styles.css','./assets/app.js','./assets/game-shell.css','./assets/audio.js','./assets/economy.js','./assets/leaderboard.js','./assets/skins.js','./assets/shop.js','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  './games/snake/','./games/snake/index.html','./games/snake/game.js',
  './games/sky-flap/','./games/sky-flap/index.html','./games/sky-flap/game.js',
  './games/dino-run/','./games/dino-run/index.html','./games/dino-run/game.js',
  './games/sliding-puzzle/','./games/sliding-puzzle/index.html','./games/sliding-puzzle/game.js',
  './games/block-drop/','./games/block-drop/index.html','./games/block-drop/game.js',
  './games/racing/','./games/racing/index.html','./games/racing/game.js',
  './games/chicken-crossing/','./games/chicken-crossing/index.html','./games/chicken-crossing/game.js',
  './games/arcade-football/','./games/arcade-football/index.html','./games/arcade-football/football.css','./games/arcade-football/config.js','./games/arcade-football/physics.js','./games/arcade-football/game.js'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.pathname.startsWith('/.netlify/functions/')){e.respondWith(fetch(e.request));return}
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html'))));
    return;
  }
  if(/\.(?:js|json)$/.test(url.pathname)){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})));
});
