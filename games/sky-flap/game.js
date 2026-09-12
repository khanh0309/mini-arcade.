
const c = document.getElementById('game'), g = c.getContext('2d');
const scoreEl = document.getElementById('score'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), btn = document.getElementById('startBtn');
let bird, pipes, score, best = +(localStorage.getItem('arcade_best_flap') || 0), running = false, last = 0, spawnT = 0, speed = 185, wingTick = 0;
bestEl.textContent = best;
function skin(){ return window.ArcadeSkins?.get('sky-flap')?.colors || { body1:'#ffe585', body2:'#ffbf3f', wingBack:'#f6a83c', wingFront:'#ffd05d', head:'#ffd15b', beak:'#ff8c42', beak2:'#f5702f', cheek:'rgba(255,144,120,.55)', eye:'#1d2533', tail:'#ff9450' }; }
function reset(){ bird={x:150,y:250,vy:0,r:16}; pipes=[]; score=0; spawnT=0; speed=185; wingTick=0; scoreEl.textContent=0; draw(); }
function start(){ if(!running){ running=true; window.ArcadeAudio?.startMusic(); last=performance.now(); ov.classList.add('hidden'); requestAnimationFrame(loop); } }
function restart(){ running=false; reset(); start(); }
function flap(){ if(!running) start(); bird.vy=-330; window.ArcadeAudio?.sfx('flap'); }
function spawn(){ const gap=Math.max(118,155-score*1.2), top=60+Math.random()*(c.height-gap-140); pipes.push({x:c.width+35,w:66,top,gap,passed:false}); }
function over(){ running=false; best=Math.max(best,score); localStorage.setItem('arcade_best_flap',best); bestEl.textContent=best; window.ArcadeAudio?.sfx('gameover'); ovT.textContent='Game Over'; ovX.textContent=`Bạn vượt ${score} cặp cột. Kỷ lục: ${best}.`; btn.textContent='Chơi lại'; ov.classList.remove('hidden'); window.ArcadeLeaderboard?.show('sky-flap',score,{title:'Sky Flap'}); }
function loop(t){ if(!running) return; const dt=Math.min(.033,(t-last)/1000); last=t; wingTick+=dt*12; spawnT+=dt; speed=Math.min(300,185+score*4); if(spawnT>1.45){ spawnT=0; spawn(); } bird.vy+=950*dt; bird.y+=bird.vy*dt; pipes.forEach(p=>p.x-=speed*dt); pipes=pipes.filter(p=>p.x+p.w>-20); for(const p of pipes){ if(!p.passed&&p.x+p.w<bird.x){ p.passed=true; score++; scoreEl.textContent=score; window.ArcadeAudio?.sfx('point'); } if(bird.x+bird.r>p.x&&bird.x-bird.r<p.x+p.w&&(bird.y-bird.r<p.top||bird.y+bird.r>p.top+p.gap)) return over(); } if(bird.y+bird.r>c.height-24||bird.y-bird.r<0) return over(); draw(); requestAnimationFrame(loop); }
function drawBird(){
  const s = skin();
  g.save();
  g.translate(bird.x,bird.y);
  g.rotate(Math.max(-.45,Math.min(.65,bird.vy/650)));
  const wing= Math.sin(wingTick)*8 - Math.min(0,bird.vy*.015);
  g.fillStyle=s.tail; g.beginPath(); g.moveTo(-16,0); g.lineTo(-28,-9); g.lineTo(-26,7); g.closePath(); g.fill();
  g.fillStyle=s.wingBack; g.beginPath(); g.ellipse(-3,wing*0.35,11,16,Math.PI/5,0,Math.PI*2); g.fill();
  const body=g.createRadialGradient(-3,-7,4,0,0,24); body.addColorStop(0,s.body1); body.addColorStop(1,s.body2);
  g.fillStyle=body; g.beginPath(); g.ellipse(0,0,18,15,0,0,Math.PI*2); g.fill();
  g.fillStyle='rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(3,-4,6,4,0,0,Math.PI*2); g.fill();
  g.fillStyle='#fff2c3'; g.beginPath(); g.ellipse(1,4,8,7,0,0,Math.PI*2); g.fill();
  g.fillStyle=s.wingFront; g.beginPath(); g.ellipse(1,wing*0.42,10,14,Math.PI/7,0,Math.PI*2); g.fill();
  g.fillStyle=s.head; g.beginPath(); g.arc(10,-10,10,0,Math.PI*2); g.fill();
  g.fillStyle=s.cheek; g.beginPath(); g.arc(13,-7,3,0,Math.PI*2); g.fill();
  g.fillStyle='#fff'; g.beginPath(); g.arc(14,-13,3.8,0,Math.PI*2); g.fill();
  g.fillStyle=s.eye; g.beginPath(); g.arc(15,-13,1.6,0,Math.PI*2); g.fill();
  g.fillStyle='#fff'; g.beginPath(); g.arc(15.7,-13.8,0.8,0,Math.PI*2); g.fill();
  g.fillStyle=s.beak; g.beginPath(); g.moveTo(18,-8); g.lineTo(31,-4); g.lineTo(18,1); g.closePath(); g.fill();
  g.fillStyle=s.beak2; g.fillRect(19,-4,8,2.4);
  g.restore();
}
function draw(){
  const sky=g.createLinearGradient(0,0,0,c.height); sky.addColorStop(0,'#163b68'); sky.addColorStop(.6,'#64b8ef'); sky.addColorStop(1,'#d5f4ff'); g.fillStyle=sky; g.fillRect(0,0,c.width,c.height);
  g.fillStyle='rgba(255,255,255,.34)';
  for(let i=0;i<6;i++){ const xx=(i*157+70)%c.width, yy=55+(i%3)*75; g.beginPath(); g.ellipse(xx,yy,46,15,0,0,Math.PI*2); g.fill(); g.beginPath(); g.ellipse(xx+25,yy+6,29,11,0,0,Math.PI*2); g.fill(); }
  for(const p of pipes){ g.fillStyle='#43bf6f'; g.fillRect(p.x,0,p.w,p.top); g.fillRect(p.x,p.top+p.gap,p.w,c.height-(p.top+p.gap)-24); g.fillStyle='#7be89a'; g.fillRect(p.x-6,p.top-18,p.w+12,18); g.fillRect(p.x-6,p.top+p.gap,p.w+12,18); }
  g.fillStyle='#d7b46a'; g.fillRect(0,c.height-24,c.width,24);
  drawBird();
}
document.addEventListener('keydown',e=>{ if(e.code==='Space'){ e.preventDefault(); flap(); } if(e.key.toLowerCase()==='r') restart(); },{passive:false});
c.addEventListener('pointerdown',e=>{ e.preventDefault(); flap(); });
window.addEventListener('arcade-skin-change', e=>{ if(e.detail.gameId==='sky-flap') draw(); });
btn.onclick=()=>ovT.textContent==='Game Over'?restart():start(); reset();
