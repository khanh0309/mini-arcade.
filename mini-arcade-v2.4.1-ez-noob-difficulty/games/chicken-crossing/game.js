
const c = document.getElementById('game'), g = c.getContext('2d');
const scoreEl = document.getElementById('score'), crossEl = document.getElementById('crossings'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), btn = document.getElementById('startBtn');
const COLS=12, ROWS=10, CELL=65, lanes=[1,2,3,4,5,6,7,8];
let chicken, cars, score, crossings, best=+(localStorage.getItem('arcade_best_chicken')||0), running=false, last=0, touchStart=null, bounce=0, elapsed=0, difficulty=0;
bestEl.textContent=best;
const laneCfg=[
  {dir:1,speed:88,gap:440,color:'#5ac8fa'}, {dir:-1,speed:102,gap:470,color:'#ff6b6b'},
  {dir:1,speed:118,gap:510,color:'#ffd166'}, {dir:-1,speed:94,gap:455,color:'#b084ff'},
  {dir:1,speed:110,gap:490,color:'#62e6a7'}, {dir:-1,speed:132,gap:540,color:'#ff9f43'},
  {dir:1,speed:98,gap:465,color:'#ff77aa'}, {dir:-1,speed:120,gap:505,color:'#84a9ff'}
];
function skin(){ return window.ArcadeSkins?.get('chicken-crossing')?.colors || { body1:'#fffdf5', body2:'#ffe8b5', wing:'#fff6db', head:'#fff8e8', comb:'#ef3f45', beak:'#ffb33a', eye:'#172033', blush:'rgba(255,150,140,.45)', feet:'#f49a2c' }; }
function reset(){ chicken={col:5,row:9}; score=0; crossings=0; cars=[]; bounce=0; elapsed=0; difficulty=0; laneCfg.forEach((cfg,i)=>{ for(let pos=-cfg.gap; pos<c.width+cfg.gap; pos+=cfg.gap){ cars.push({lane:i,row:lanes[i],x:pos+(i%2)*120,w:76+(i%3)*10,h:40,cfg}); } }); scoreEl.textContent=0; crossEl.textContent=0; draw(); }
function start(){ if(running) return; running=true; window.ArcadeAudio?.startMusic(); last=performance.now(); ov.classList.add('hidden'); requestAnimationFrame(loop); }
function restart(){ running=false; reset(); start(); }
function move(dx,dy){ if(!running) start(); const nc=Math.max(0,Math.min(COLS-1,chicken.col+dx)), nr=Math.max(0,Math.min(ROWS-1,chicken.row+dy)); if(nc===chicken.col&&nr===chicken.row) return; chicken.col=nc; chicken.row=nr; if(dy<0) score+=2; window.ArcadeAudio?.sfx('move'); if(chicken.row===0){ crossings++; score+=100; crossEl.textContent=crossings; window.ArcadeAudio?.sfx('win'); chicken={col:5,row:9}; } scoreEl.textContent=score; }
function chickenRect(){ return {x:chicken.col*CELL+17,y:chicken.row*CELL+15,w:31,h:35}; }
function hit(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
function over(){ running=false; best=Math.max(best,score); localStorage.setItem('arcade_best_chicken',best); bestEl.textContent=best; window.ArcadeAudio?.sfx('crash'); ovT.textContent='Ôi! Gà bị tông'; ovX.textContent=`Điểm: ${score} • Qua đường: ${crossings} lần • Kỷ lục: ${best}`; btn.textContent='Chơi lại'; ov.classList.remove('hidden'); window.ArcadeLeaderboard?.show('chicken-crossing',score,{title:'Chicken Crossing'}); }
function loop(t){
  if(!running) return;
  const dt=Math.min(.033,(t-last)/1000); last=t; elapsed+=dt; bounce+=dt*12;
  difficulty=Math.min(1,elapsed/120+crossings/12);
  const multi=.95+difficulty*.75;
  for(const car of cars){
    car.x+=car.cfg.dir*car.cfg.speed*multi*dt;
    const wrapPad=145-difficulty*45;
    if(car.cfg.dir>0&&car.x>c.width+100) car.x=-car.w-wrapPad;
    if(car.cfg.dir<0&&car.x+car.w<-100) car.x=c.width+wrapPad;
  }
  const cr=chickenRect();
  for(const car of cars){ const y=car.row*CELL+(CELL-car.h)/2; if(car.row===chicken.row&&hit(cr,{x:car.x,y,w:car.w,h:car.h})) return over(); }
  draw(); requestAnimationFrame(loop);
}
function drawChicken(){
  const s=skin(), cr=chickenRect(), cx=cr.x+cr.w/2, cy=cr.y+cr.h/2 + Math.sin(bounce)*1.3;
  g.save(); g.translate(cx,cy);
  g.fillStyle='rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(0,17,15,5,0,0,Math.PI*2); g.fill();
  const body=g.createRadialGradient(-2,-4,4,0,0,22); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
  g.fillStyle=body; g.beginPath(); g.arc(0,5,17,0,Math.PI*2); g.fill();
  g.fillStyle=s.wing; g.beginPath(); g.ellipse(-5,5,8,10,.2,0,Math.PI*2); g.fill();
  g.fillStyle=s.head; g.beginPath(); g.arc(9,-10,11,0,Math.PI*2); g.fill();
  g.fillStyle=s.comb; [{x:1,y:-22,r:4.2},{x:7,y:-25,r:4.7},{x:13,y:-23,r:4.2}].forEach(p=>{ g.beginPath(); g.arc(p.x,p.y,p.r,0,Math.PI*2); g.fill(); });
  g.fillStyle=s.beak; g.beginPath(); g.moveTo(18,-10); g.lineTo(31,-6); g.lineTo(18,-2); g.closePath(); g.fill();
  g.fillStyle=s.eye; g.beginPath(); g.arc(11,-12,1.9,0,Math.PI*2); g.fill();
  g.fillStyle=s.blush; g.beginPath(); g.arc(13,-6,2.5,0,Math.PI*2); g.fill();
  g.strokeStyle=s.feet; g.lineWidth=2.2; [[-6,18], [4,18]].forEach(([lx,ly])=>{ g.beginPath(); g.moveTo(lx,ly); g.lineTo(lx,24); g.stroke(); g.beginPath(); g.moveTo(lx,24); g.lineTo(lx-4,27); g.moveTo(lx,24); g.lineTo(lx+4,27); g.stroke(); });
  g.restore();
}
function draw(){
  for(let r=0;r<ROWS;r++){
    if(r===0||r===9) g.fillStyle=r===0?'#2f8d52':'#3c9b59'; else g.fillStyle=r%2?'#30343b':'#292e35';
    g.fillRect(0,r*CELL,c.width,CELL);
    if(r>0&&r<9){ g.strokeStyle='rgba(255,255,255,.18)'; g.setLineDash([26,22]); g.beginPath(); g.moveTo(0,r*CELL); g.lineTo(c.width,r*CELL); g.stroke(); g.setLineDash([]); }
  }
  g.fillStyle='rgba(255,255,255,.16)'; for(let px=20;px<c.width;px+=90){ g.beginPath(); g.arc(px,28,4,0,Math.PI*2); g.fill(); g.beginPath(); g.arc(px+38,c.height-25,4,0,Math.PI*2); g.fill(); }
  for(const car of cars){ const y=car.row*CELL+(CELL-car.h)/2; g.fillStyle=car.cfg.color; g.beginPath(); g.roundRect(car.x,y,car.w,car.h,10); g.fill(); g.fillStyle='#cfeeff'; g.fillRect(car.x+14,y+7,car.w-28,10); g.fillStyle='#10151e'; g.fillRect(car.x+10,y+car.h-5,16,8); g.fillRect(car.x+car.w-26,y+car.h-5,16,8); }
  drawChicken();
}
function dir(name){ if(name==='up') move(0,-1); if(name==='down') move(0,1); if(name==='left') move(-1,0); if(name==='right') move(1,0); }
document.addEventListener('keydown',e=>{ let k=e.key.toLowerCase(); if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','r'].includes(k)) e.preventDefault(); if(k==='arrowup'||k==='w') dir('up'); if(k==='arrowdown'||k==='s') dir('down'); if(k==='arrowleft'||k==='a') dir('left'); if(k==='arrowright'||k==='d') dir('right'); if(k==='r') restart(); },{passive:false});
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); dir(b.dataset.move); }));
c.addEventListener('touchstart',e=>{ const t=e.changedTouches[0]; touchStart={x:t.clientX,y:t.clientY}; },{passive:true});
c.addEventListener('touchend',e=>{ if(!touchStart) return; const t=e.changedTouches[0], dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y; touchStart=null; if(Math.max(Math.abs(dx),Math.abs(dy))<18) return; if(Math.abs(dx)>Math.abs(dy)) dir(dx>0?'right':'left'); else dir(dy>0?'down':'up'); },{passive:true});
window.addEventListener('arcade-skin-change', e=>{ if(e.detail.gameId==='chicken-crossing') draw(); });
btn.onclick=()=>ovT.textContent.includes('tông')?restart():start(); reset();
