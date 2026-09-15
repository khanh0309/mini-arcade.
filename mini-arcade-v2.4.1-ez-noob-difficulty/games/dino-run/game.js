
const c = document.getElementById('game'), g = c.getContext('2d');
const scoreEl = document.getElementById('score'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), btn = document.getElementById('startBtn');
const ground = 340;
let dino, obs, score, best = +(localStorage.getItem('arcade_best_dino') || 0), running = false, last = 0, nextSpawn = 0, speed = 280, tick = 0, elapsed = 0, difficulty = 0;
bestEl.textContent = best;
function skin(){ return window.ArcadeSkins?.get('dino-run')?.colors || { tail:'#1a9c62', body1:'#5df0a0', body2:'#2cb86d', belly:'#c8ffe0', head:'#5ef0a4', neck:'#41d685', spike:'#d4ff6a', eye:'#102117', outline:'#168451' }; }
function makeDino(){ return { x:95, y:ground-60, vy:0, baseW:56, baseH:60, w:56, h:60, duck:false, on:true, duckHold:false }; }
function reset(){ dino = makeDino(); obs=[]; score=0; speed=280; nextSpawn=1.2; tick=0; elapsed=0; difficulty=0; scoreEl.textContent=0; draw(); }
function start(){ if(!running){ running=true; window.ArcadeAudio?.startMusic(); last=performance.now(); ov.classList.add('hidden'); requestAnimationFrame(loop); } }
function restart(){ running=false; reset(); start(); }
function setDuck(on){ dino.duckHold = on; if(on && dino.on){ dino.duck=true; dino.h=34; dino.w=68; dino.y=ground-dino.h; } else if(!on){ dino.duck=false; dino.h=60; dino.w=56; dino.y=Math.min(dino.y, ground-dino.h); } }
function jump(){ if(!running) start(); if(dino.on){ dino.vy=-690; dino.on=false; setDuck(false); window.ArcadeAudio?.sfx('jump'); } }
function over(){ running=false; const finalScore=Math.floor(score); best=Math.max(best,finalScore); localStorage.setItem('arcade_best_dino',best); bestEl.textContent=best; window.ArcadeAudio?.sfx('gameover'); ovT.textContent='Game Over'; ovX.textContent=`Điểm: ${finalScore} • Kỷ lục: ${best}`; btn.textContent='Chơi lại'; ov.classList.remove('hidden'); window.ArcadeLeaderboard?.show('dino-run',finalScore,{title:'Dino Run'}); }
function hit(a,b){ return a.x+8<b.x+b.w&&a.x+a.w-8>b.x&&a.y+8<b.y+b.h&&a.y+a.h>b.y+5; }
function spawnObstacle(){
  const flyingChance = elapsed > 12 ? (.07 + difficulty*.34) : 0;
  if(Math.random() < flyingChance){
    const level = Math.random();
    let y;
    if(difficulty < .35) y = level < .6 ? ground-126 : ground-96;
    else y = level < (.16 + difficulty*.22) ? ground-60 : level < .72 ? ground-96 : ground-126;
    obs.push({ type:'bird', x:c.width+30, y, w:54, h:32, flap:Math.random()*Math.PI*2 });
  } else {
    const tall=Math.random() < (.35 + difficulty*.25);
    obs.push({ type:'cactus', x:c.width+30, y:ground-(tall?74:50), w:tall?34:30, h:tall?74:50 });
  }
  nextSpawn = (1.25 - difficulty*.58) + Math.random() * (.62 - difficulty*.18);
}
function loop(t){
  if(!running) return;
  const dt=Math.min(.033,(t-last)/1000); last=t; elapsed+=dt; tick+=dt*8; score += dt*10; scoreEl.textContent=Math.floor(score); difficulty=Math.min(1, elapsed/95 + score/1800); speed=280+difficulty*340;
  dino.vy += 1900*dt; dino.y += dino.vy*dt;
  if(dino.y >= ground-dino.h){ dino.y = ground-dino.h; dino.vy = 0; dino.on = true; if(dino.duckHold) setDuck(true); else setDuck(false); } else { dino.on = false; }
  nextSpawn -= dt; if(nextSpawn <= 0) spawnObstacle();
  obs.forEach(o => { o.x -= speed * dt; if(o.type==='bird') o.flap += dt*16; });
  obs = obs.filter(o => o.x + o.w > -30);
  const box = { x:dino.x, y:dino.y, w:dino.w, h:dino.h };
  for(const o of obs) if(hit(box,o)) return over();
  draw(); requestAnimationFrame(loop);
}
function drawCactus(o){ g.fillStyle='#596658'; g.fillRect(o.x,o.y,o.w,o.h); g.fillRect(o.x-8,o.y+18,8,12); g.fillRect(o.x+o.w,o.y+30,8,12); g.fillStyle='#879082'; g.fillRect(o.x+8,o.y+8,4,o.h-16); }
function drawBird(o, night){
  const wing = Math.sin(o.flap) * 5;
  g.save(); g.translate(o.x+o.w/2, o.y+o.h/2);
  g.fillStyle = night ? '#d9ebff' : '#49566f';
  g.beginPath(); g.ellipse(0,0,18,11,0,0,Math.PI*2); g.fill();
  g.fillStyle = night ? '#c1d4f0' : '#6f7f96';
  g.beginPath(); g.ellipse(-4, wing*0.35, 12, 7, -0.45, 0, Math.PI*2); g.fill();
  g.fillStyle = night ? '#f4f8ff' : '#5a6781';
  g.beginPath(); g.arc(11,-5,9,0,Math.PI*2); g.fill();
  g.fillStyle = '#ffb04d'; g.beginPath(); g.moveTo(18,-4); g.lineTo(30,0); g.lineTo(18,3); g.closePath(); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(13,-7,1.8,0,Math.PI*2); g.fill();
  g.restore();
}
function drawDino(){
  const s = skin();
  const xx=dino.x, yy=dino.y, bob=dino.on && !dino.duck ? Math.sin(tick*1.2)*1.2 : 0;
  g.save(); g.translate(xx,yy+bob);
  if(dino.duck){
    g.fillStyle=s.tail; g.beginPath(); g.moveTo(5,22); g.lineTo(-16,12); g.lineTo(2,8); g.closePath(); g.fill();
    const body=g.createLinearGradient(0,0,0,40); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
    g.fillStyle=body; g.beginPath(); g.roundRect(8,12,38,20,10); g.fill();
    g.fillStyle=s.belly; g.beginPath(); g.roundRect(17,17,17,10,6); g.fill();
    g.fillStyle=s.neck; g.beginPath(); g.roundRect(38,7,20,14,8); g.fill();
    g.fillStyle=s.head; g.beginPath(); g.arc(57,15,13,0,Math.PI*2); g.fill();
    g.fillStyle=s.spike; [[14,10],[21,7],[28,7],[35,9]].forEach(([sx,sy])=>{ g.beginPath(); g.moveTo(sx,sy+10); g.lineTo(sx+4,sy); g.lineTo(sx+9,sy+10); g.closePath(); g.fill(); });
    g.fillStyle='#fff'; g.beginPath(); g.arc(61,12,3.6,0,Math.PI*2); g.fill(); g.fillStyle=s.eye; g.beginPath(); g.arc(62,12.5,1.5,0,Math.PI*2); g.fill();
    g.strokeStyle=s.outline; g.lineWidth=2; g.beginPath(); g.arc(56,20,5,0,.85); g.stroke();
    g.fillStyle=s.body2; g.fillRect(18,29,9,6); g.fillRect(32,29,9,6);
  } else {
    g.fillStyle=s.tail; g.beginPath(); g.moveTo(9,40); g.lineTo(-14,28); g.lineTo(5,20); g.closePath(); g.fill();
    const body=g.createLinearGradient(0,0,0,dino.h); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
    g.fillStyle=body; g.beginPath(); g.roundRect(6,14,34,32,13); g.fill();
    g.fillStyle=s.belly; g.beginPath(); g.roundRect(16,21,17,18,9); g.fill();
    g.fillStyle=s.neck; g.beginPath(); g.roundRect(26,2,24,22,10); g.fill();
    g.fillStyle=s.head; g.beginPath(); g.arc(41,14,16,0,Math.PI*2); g.fill();
    g.fillStyle=s.spike; [[8,17],[13,11],[20,8],[28,7],[35,8]].forEach(([sx,sy])=>{ g.beginPath(); g.moveTo(sx,sy+12); g.lineTo(sx+4,sy); g.lineTo(sx+9,sy+12); g.closePath(); g.fill(); });
    g.fillStyle='#fff'; g.beginPath(); g.arc(45,12,3.8,0,Math.PI*2); g.fill(); g.fillStyle=s.eye; g.beginPath(); g.arc(46,12.5,1.6,0,Math.PI*2); g.fill();
    g.strokeStyle=s.outline; g.lineWidth=2; g.beginPath(); g.arc(40,20,5,0,.9); g.stroke();
    g.fillStyle=s.body2; g.fillRect(18,26,6,13); g.fillRect(27,28,6,11);
    const legOffset=dino.on?Math.sin(tick*1.5)*3:0; g.fillStyle=s.tail; g.fillRect(14,42,8,16+Math.max(0,legOffset)); g.fillRect(27,42,8,16+Math.max(0,-legOffset)); g.fillRect(12,56,12,5); g.fillRect(25,56,12,5);
  }
  g.restore();
}
function draw(){
  const night = Math.floor(score / 85) % 2 === 1;
  const bg = g.createLinearGradient(0,0,0,c.height);
  if(night){ bg.addColorStop(0,'#08142b'); bg.addColorStop(1,'#1c2744'); }
  else { bg.addColorStop(0,'#f6f0df'); bg.addColorStop(1,'#fff9ea'); }
  g.fillStyle=bg; g.fillRect(0,0,c.width,c.height);
  if(night){
    g.fillStyle='#f3f6ff'; g.beginPath(); g.arc(760,70,24,0,Math.PI*2); g.fill(); g.fillStyle='#1c2744'; g.beginPath(); g.arc(770,64,20,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<40;i++){ const sx=(i*137)%c.width, sy=(i*57)%120+18; g.fillRect(sx,sy,2,2); }
  } else {
    g.fillStyle='#ffeb8f'; g.beginPath(); g.arc(760,72,28,0,Math.PI*2); g.fill();
  }
  g.fillStyle = night ? 'rgba(221,232,255,.35)' : '#d7d0be';
  for(let i=0;i<9;i++){ const xx=(i*123+40)%c.width; g.fillRect(xx,80+(i%3)*35,25,3); }
  g.fillStyle = night ? '#9aa6bb' : '#7d7769'; g.fillRect(0,ground,c.width,4);
  obs.forEach(o=> o.type==='bird' ? drawBird(o, night) : drawCactus(o));
  drawDino();
}
function onKeyDown(e){ const k=e.key.toLowerCase(); if([' ','arrowup','arrowdown','s','r'].includes(k)) e.preventDefault(); if(e.code==='Space'||e.key==='ArrowUp') jump(); if(e.key==='ArrowDown'||k==='s') setDuck(true); if(k==='r') restart(); }
function onKeyUp(e){ const k=e.key.toLowerCase(); if(e.key==='ArrowDown'||k==='s') setDuck(false); }
document.addEventListener('keydown', onKeyDown, {passive:false}); document.addEventListener('keyup', onKeyUp, {passive:false});
c.addEventListener('pointerdown',e=>{ e.preventDefault(); jump(); });
const duckBtn=document.querySelector('[data-dino="duck"]'), jumpBtn=document.querySelector('[data-dino="jump"]');
if(jumpBtn) jumpBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); jump(); });
if(duckBtn){ duckBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); setDuck(true); }); ['pointerup','pointerleave','pointercancel'].forEach(ev=>duckBtn.addEventListener(ev,()=>setDuck(false))); }
window.addEventListener('arcade-skin-change', e=>{ if(e.detail.gameId==='dino-run') draw(); });
btn.onclick=()=>ovT.textContent==='Game Over'?restart():start(); reset();
