
const c = document.getElementById('game'), x = c.getContext('2d');
const S = 30, C = c.width / S;
const scoreEl = document.getElementById('score'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), startBtn = document.getElementById('startBtn');
let snake, food, dir, next, score = 0, best = +(localStorage.getItem('arcade_best_snake') || 0), run = false, pause = false, timer, delay = 150, elapsed = 0;
bestEl.textContent = best;

function skin(){ return window.ArcadeSkins?.get('snake')?.colors || { head:'#8effb8', face:'#59df89', body:'#45d874', tail:'#2fb864', eye:'#ffffff', pupil:'#14261d', tongue:'#ff7aa0', glow:'rgba(81,255,159,.45)' }; }
function reset(){ snake=[{x:14,y:15},{x:13,y:15},{x:12,y:15},{x:11,y:15}]; dir=next={x:1,y:0}; score=0; delay=150; elapsed=0; spawn(); hud(); draw(); }
function spawn(){ do{ food={x:Math.floor(Math.random()*S), y:Math.floor(Math.random()*S)}; }while(snake.some(p=>p.x===food.x&&p.y===food.y)); }
function hud(){ scoreEl.textContent=score; bestEl.textContent=best; }
function start(){ clearTimeout(timer); if(!run){ run=true; pause=false; window.ArcadeAudio?.startMusic(); ov.classList.add('hidden'); tickSoon(); } }
function restart(){ clearTimeout(timer); reset(); run=true; pause=false; ov.classList.add('hidden'); tickSoon(); }
function tickSoon(){ if(run && !pause) timer=setTimeout(tick,delay); }
function tick(){
  elapsed += delay / 1000;
  const difficulty=Math.min(1, elapsed/90 + score/900);
  delay=Math.max(60, Math.round(150 - difficulty*90));
  dir=next;
  const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(h.x<0||h.x>=S||h.y<0||h.y>=S||snake.some((p,i)=>i<snake.length-1&&p.x===h.x&&p.y===h.y)) return over();
  snake.unshift(h);
  if(h.x===food.x&&h.y===food.y){ score+=10; best=Math.max(best,score); localStorage.setItem('arcade_best_snake',best); window.ArcadeAudio?.sfx('eat'); spawn(); }
  else snake.pop();
  hud(); draw(); tickSoon();
}
function over(){ run=false; clearTimeout(timer); window.ArcadeAudio?.sfx('gameover'); ovT.textContent='Game Over'; ovX.textContent=`Điểm: ${score} • Kỷ lục: ${best}`; startBtn.textContent='Chơi lại'; ov.classList.remove('hidden'); window.ArcadeLeaderboard?.show('snake',score,{title:'Neon Snake'}); }
function toggle(){ if(!run) return; pause=!pause; clearTimeout(timer); if(pause){ ovT.textContent='Tạm dừng'; ovX.textContent='Nhấn P hoặc nút tiếp tục.'; startBtn.textContent='Tiếp tục'; ov.classList.remove('hidden'); } else { ov.classList.add('hidden'); tickSoon(); } }
function setDir(dx,dy){ if(!run) start(); if(dx===-dir.x&&dy===-dir.y) return; next={x:dx,y:dy}; }
function drawBackground(){ x.fillStyle='#07110c'; x.fillRect(0,0,c.width,c.height); x.strokeStyle='rgba(120,180,145,.08)'; for(let i=1;i<S;i++){ let p=i*C; x.beginPath(); x.moveTo(p,0); x.lineTo(p,c.height); x.stroke(); x.beginPath(); x.moveTo(0,p); x.lineTo(c.width,p); x.stroke(); } }
function drawFood(){ const fx=food.x*C+C/2, fy=food.y*C+C/2; x.save(); x.shadowColor='#ff6c85'; x.shadowBlur=14; x.fillStyle='#ff647f'; x.beginPath(); x.arc(fx,fy,7,0,Math.PI*2); x.fill(); x.fillStyle='#ffdce3'; x.beginPath(); x.arc(fx-2,fy-2,1.9,0,Math.PI*2); x.fill(); x.strokeStyle='#71ffa3'; x.lineWidth=2.3; x.beginPath(); x.moveTo(fx+1,fy-7); x.quadraticCurveTo(fx+6,fy-12,fx+10,fy-10); x.stroke(); x.restore(); }
function drawSnake(){
  const s = skin();
  snake.forEach((p,i)=>{
    const cx=p.x*C+C/2, cy=p.y*C+C/2;
    if(i===0){
      x.save();
      x.shadowColor=s.glow; x.shadowBlur=18; x.fillStyle=s.head; x.beginPath();
      if(dir.x!==0) x.ellipse(cx,cy,C*.43,C*.36,0,0,Math.PI*2); else x.ellipse(cx,cy,C*.36,C*.43,0,0,Math.PI*2);
      x.fill(); x.restore();
      x.fillStyle=s.face; x.beginPath();
      if(dir.x!==0) x.ellipse(cx-(dir.x*2),cy,C*.18,C*.30,0,0,Math.PI*2); else x.ellipse(cx,cy-(dir.y*2),C*.30,C*.18,0,0,Math.PI*2);
      x.fill();
      x.fillStyle=s.eye;
      const eyes = dir.x!==0 ? [{x:cx+dir.x*4,y:cy-5},{x:cx+dir.x*4,y:cy+5}] : [{x:cx-5,y:cy+dir.y*4},{x:cx+5,y:cy+dir.y*4}];
      eyes.forEach(e=>{ x.beginPath(); x.arc(e.x,e.y,3,0,Math.PI*2); x.fill(); });
      x.fillStyle=s.pupil;
      eyes.forEach(e=>{ x.beginPath(); x.arc(e.x+(dir.x*1.2),e.y+(dir.y*1.2),1.4,0,Math.PI*2); x.fill(); });
      x.strokeStyle=s.tongue; x.lineWidth=1.6; const mx=cx+dir.x*10, my=cy+dir.y*10;
      x.beginPath(); x.moveTo(mx,my); x.lineTo(mx+dir.x*6,my+dir.y*6); x.stroke();
      x.beginPath(); x.moveTo(mx+dir.x*6,my+dir.y*6); x.lineTo(mx+dir.x*10+(dir.y?3:0),my+dir.y*10+(dir.x?3:0)); x.moveTo(mx+dir.x*6,my+dir.y*6); x.lineTo(mx+dir.x*10-(dir.y?3:0),my+dir.y*10-(dir.x?3:0)); x.stroke();
    } else {
      const scale=Math.max(.44,.78-i*.018);
      x.save(); x.shadowColor='rgba(55,220,116,.18)'; x.shadowBlur=8; x.fillStyle=i===snake.length-1?s.tail:s.body; x.beginPath(); x.arc(cx,cy,C*(scale*.43),0,Math.PI*2); x.fill(); x.fillStyle='rgba(255,255,255,.28)'; x.beginPath(); x.arc(cx-2,cy-2,C*(scale*.16),0,Math.PI*2); x.fill(); x.restore();
    }
  });
}
function draw(){ drawBackground(); drawFood(); drawSnake(); }
document.addEventListener('keydown',e=>{ let k=e.key.toLowerCase(); if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','p','r',' '].includes(k)) e.preventDefault(); if(k==='arrowup'||k==='w') setDir(0,-1); if(k==='arrowdown'||k==='s') setDir(0,1); if(k==='arrowleft'||k==='a') setDir(-1,0); if(k==='arrowright'||k==='d') setDir(1,0); if(k==='p'||k===' ') toggle(); if(k==='r') restart(); },{passive:false});
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); let d=b.dataset.dir; if(d==='up') setDir(0,-1); if(d==='down') setDir(0,1); if(d==='left') setDir(-1,0); if(d==='right') setDir(1,0); }));
window.addEventListener('arcade-skin-change', e=>{ if(e.detail.gameId==='snake') draw(); });
startBtn.onclick=()=>run&&pause?toggle():ovT.textContent==='Game Over'?restart():start(); reset();
