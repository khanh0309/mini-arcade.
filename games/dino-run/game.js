
const c = document.getElementById('game'), g = c.getContext('2d');
const scoreEl = document.getElementById('score'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), btn = document.getElementById('startBtn');
const ground = 340;
let dino, obs, score, best = +(localStorage.getItem('arcade_best_dino') || 0), running = false, last = 0, nextSpawn = 0, speed = 280, tick = 0, elapsed = 0, difficulty = 0, jumpBuffer = 0, coyote = 0;
bestEl.textContent = best;
function skin(){ return window.ArcadeSkins?.get('dino-run')?.colors || { tail:'#1a9c62', body1:'#5df0a0', body2:'#2cb86d', belly:'#c8ffe0', head:'#5ef0a4', neck:'#41d685', spike:'#d4ff6a', eye:'#102117', outline:'#168451' }; }
function makeDino(){ return { x:95, y:ground-60, vy:0, baseW:56, baseH:60, w:56, h:60, duck:false, on:true, duckHold:false }; }
function reset(){ dino = makeDino(); obs=[]; score=0; speed=280; nextSpawn=1.2; tick=0; elapsed=0; difficulty=0; jumpBuffer=0; coyote=.09; scoreEl.textContent=0; draw(); }
function start(){ if(!running){ running=true; window.ArcadeAudio?.startMusic(); last=performance.now(); ov.classList.add('hidden'); requestAnimationFrame(loop); } }
function restart(){ running=false; reset(); start(); }
function setDuck(on){ dino.duckHold = on; if(on && dino.on){ dino.duck=true; dino.h=34; dino.w=68; dino.y=ground-dino.h; } else if(!on){ dino.duck=false; dino.h=60; dino.w=56; dino.y=Math.min(dino.y, ground-dino.h); } }
function doJump(){ dino.vy=-700; dino.on=false; coyote=0; jumpBuffer=0; setDuck(false); window.ArcadeAudio?.sfx('jump'); }
function jump(){ if(!running) start(); jumpBuffer=.16; if(dino.on || coyote>0) doJump(); }
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
  // Giữ khoảng cách tối thiểu đủ để đáp đất rồi nhảy tiếp; độ khó vẫn tăng theo tốc độ.
  nextSpawn = (1.20 - difficulty*.38) + Math.random() * (.55 - difficulty*.10);
}
function loop(t){
  if(!running) return;
  const dt=Math.min(.033,(t-last)/1000); last=t; elapsed+=dt; tick+=dt*8; score += dt*10; scoreEl.textContent=Math.floor(score); difficulty=Math.min(1, elapsed/95 + score/1800); speed=280+difficulty*340;
  jumpBuffer=Math.max(0,jumpBuffer-dt);
  if(dino.on) coyote=.09; else coyote=Math.max(0,coyote-dt);
  dino.vy += 1900*dt; dino.y += dino.vy*dt;
  if(dino.y >= ground-dino.h){
    dino.y = ground-dino.h; dino.vy = 0; dino.on = true;
    if(dino.duckHold) setDuck(true); else setDuck(false);
    // Jump buffer: bấm nhảy hơi sớm trước lúc chạm đất vẫn bật lên ngay khi vừa đáp.
    if(jumpBuffer>0) doJump();
  } else { dino.on = false; }
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
  const xx=dino.x, yy=dino.y, bob=dino.on && !dino.duck ? Math.sin(tick*1.2)*1.1 : 0;
  g.save(); g.translate(xx,yy+bob); g.lineJoin='round'; g.lineCap='round';

  if(dino.duck){
    // Đuôi dài và thân thấp khi cúi.
    g.fillStyle=s.tail; g.beginPath(); g.moveTo(9,23); g.quadraticCurveTo(-7,17,-20,8); g.quadraticCurveTo(-9,25,7,29); g.closePath(); g.fill();
    const body=g.createLinearGradient(0,4,0,36); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
    g.fillStyle=body; g.beginPath(); g.roundRect(5,11,43,23,11); g.fill();
    g.fillStyle=s.belly; g.beginPath(); g.ellipse(25,25,14,7,0,0,Math.PI*2); g.fill();
    g.fillStyle=s.neck; g.beginPath(); g.roundRect(37,8,18,17,8); g.fill();
    g.fillStyle=s.head; g.beginPath(); g.roundRect(45,5,25,22,8); g.fill();
    // Mõm/snout rõ hơn.
    g.fillStyle=s.body1; g.beginPath(); g.roundRect(58,13,17,11,5); g.fill();
    g.fillStyle='#fff'; g.beginPath(); g.arc(58,11,3.7,0,Math.PI*2); g.fill(); g.fillStyle=s.eye; g.beginPath(); g.arc(59,11.4,1.55,0,Math.PI*2); g.fill();
    g.fillStyle=s.outline; g.beginPath(); g.arc(68,16,1.3,0,Math.PI*2); g.fill();
    g.strokeStyle=s.outline; g.lineWidth=2; g.beginPath(); g.moveTo(59,21); g.lineTo(72,21); g.stroke();
    // Gai lưng.
    g.fillStyle=s.spike; [[12,9],[20,6],[28,5],[36,7]].forEach(([sx,sy])=>{ g.beginPath(); g.moveTo(sx,sy+10); g.lineTo(sx+4,sy); g.lineTo(sx+9,sy+10); g.closePath(); g.fill(); });
    // Chân và móng.
    g.fillStyle=s.tail; g.fillRect(16,29,9,6); g.fillRect(34,29,9,6); g.fillStyle=s.outline; g.fillRect(15,34,13,2); g.fillRect(33,34,13,2);
  } else {
    // Đuôi cong tự nhiên hơn.
    g.fillStyle=s.tail; g.beginPath(); g.moveTo(10,41); g.quadraticCurveTo(-7,36,-19,25); g.quadraticCurveTo(-7,24,8,29); g.closePath(); g.fill();
    const body=g.createLinearGradient(0,0,0,dino.h); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
    g.fillStyle=body; g.beginPath(); g.roundRect(5,17,36,31,13); g.fill();
    g.fillStyle=s.belly; g.beginPath(); g.ellipse(23,34,11,13,0,0,Math.PI*2); g.fill();
    // Cổ + đầu tách khối để nhìn giống khủng long hơn.
    g.fillStyle=s.neck; g.beginPath(); g.roundRect(28,5,20,28,9); g.fill();
    g.fillStyle=s.head; g.beginPath(); g.roundRect(34,2,23,24,9); g.fill();
    g.fillStyle=s.body1; g.beginPath(); g.roundRect(48,11,17,12,5); g.fill();
    // Gai lưng.
    g.fillStyle=s.spike; [[7,16],[13,10],[20,7],[27,6],[34,7]].forEach(([sx,sy])=>{ g.beginPath(); g.moveTo(sx,sy+12); g.lineTo(sx+4,sy); g.lineTo(sx+9,sy+12); g.closePath(); g.fill(); });
    // Mắt, lỗ mũi, miệng.
    g.fillStyle='#fff'; g.beginPath(); g.arc(47,9,3.9,0,Math.PI*2); g.fill(); g.fillStyle=s.eye; g.beginPath(); g.arc(48,9.5,1.65,0,Math.PI*2); g.fill();
    g.fillStyle=s.outline; g.beginPath(); g.arc(59,15,1.25,0,Math.PI*2); g.fill();
    g.strokeStyle=s.outline; g.lineWidth=2; g.beginPath(); g.moveTo(50,20); g.quadraticCurveTo(57,23,64,20); g.stroke();
    // Tay nhỏ có 2 móng.
    g.strokeStyle=s.outline; g.lineWidth=3; g.beginPath(); g.moveTo(34,29); g.lineTo(44,34); g.lineTo(49,31); g.stroke();
    g.lineWidth=1.6; g.beginPath(); g.moveTo(48,31); g.lineTo(52,29); g.moveTo(48,32); g.lineTo(52,34); g.stroke();
    // Chấm da nhẹ tạo chiều sâu.
    g.fillStyle='rgba(255,255,255,.22)'; [[14,25],[20,20],[26,28]].forEach(([px,py])=>{ g.beginPath(); g.arc(px,py,2,0,Math.PI*2); g.fill(); });
    // Chân chạy + bàn chân/móng.
    const legOffset=dino.on?Math.sin(tick*1.5)*3:0;
    g.fillStyle=s.tail; g.fillRect(13,43,9,13+Math.max(0,legOffset)); g.fillRect(28,43,9,13+Math.max(0,-legOffset));
    g.fillStyle=s.body2; g.beginPath(); g.roundRect(10,55,16,6,3); g.fill(); g.beginPath(); g.roundRect(25,55,16,6,3); g.fill();
    g.fillStyle=s.spike; [14,19,29,34].forEach(px=>{ g.beginPath(); g.moveTo(px,60); g.lineTo(px+3,57); g.lineTo(px+5,60); g.closePath(); g.fill(); });
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
