const c = document.getElementById('game'), g = c.getContext('2d');
const scoreEl = document.getElementById('score'), crossEl = document.getElementById('crossings'), bestEl = document.getElementById('best');
const ov = document.getElementById('overlay'), ovT = document.getElementById('ovTitle'), ovX = document.getElementById('ovText'), btn = document.getElementById('startBtn');
const COLS=12, ROWS=10, CELL=65, lanes=[1,2,3,4,5,6,7,8];
// Mở lane từ gần người chơi ra xa: đầu game chỉ có 4 lane xe, sau đó tăng dần lên 8.
const unlockOrder=[7,6,5,4,3,2,1,0];
let chicken, cars, score, crossings, best=+(localStorage.getItem('arcade_best_chicken')||0), running=false, last=0, touchStart=null, bounce=0, elapsed=0, difficulty=0, lastMoveAt=0;
const MOVE_COOLDOWN_MS=75;
bestEl.textContent=best;

// V2.4.2: giảm tốc độ đầu game và tăng khoảng trống. Khó tăng dần theo thời gian + số lần qua đường.
const laneCfg=[
  {dir:1,speed:66,gap:690,color:'#5ac8fa'}, {dir:-1,speed:72,gap:730,color:'#ff6b6b'},
  {dir:1,speed:78,gap:710,color:'#ffd166'}, {dir:-1,speed:69,gap:750,color:'#b084ff'},
  {dir:1,speed:76,gap:700,color:'#62e6a7'}, {dir:-1,speed:84,gap:760,color:'#ff9f43'},
  {dir:1,speed:70,gap:720,color:'#ff77aa'}, {dir:-1,speed:82,gap:740,color:'#84a9ff'}
];
function skin(){ return window.ArcadeSkins?.get('chicken-crossing')?.colors || { body1:'#fffdf5', body2:'#ffe8b5', wing:'#fff6db', head:'#fff8e8', comb:'#ef3f45', beak:'#ffb33a', eye:'#172033', blush:'rgba(255,150,140,.45)', feet:'#f49a2c' }; }
function activeLaneCount(){
  if(difficulty < .22) return 4;
  if(difficulty < .42) return 5;
  if(difficulty < .62) return 6;
  if(difficulty < .82) return 7;
  return 8;
}
function laneActive(laneIndex){ return unlockOrder.slice(0,activeLaneCount()).includes(laneIndex); }
function reset(){
  chicken={col:5,row:9}; score=0; crossings=0; cars=[]; bounce=0; elapsed=0; difficulty=0; lastMoveAt=0;
  laneCfg.forEach((cfg,i)=>{
    // Chỉ 1-2 xe/lane với khoảng trống lớn, offset khác nhau để tránh tạo "bức tường" xe.
    for(let pos=-cfg.gap; pos<c.width+cfg.gap; pos+=cfg.gap){
      cars.push({lane:i,row:lanes[i],x:pos+(i*137)%360,w:68+(i%3)*8,h:38,cfg});
    }
  });
  scoreEl.textContent=0; crossEl.textContent=0; draw();
}
function start(){ if(running) return; running=true; window.ArcadeAudio?.startMusic(); last=performance.now(); lastMoveAt=0; ov.classList.add('hidden'); requestAnimationFrame(loop); }
function restart(){ running=false; reset(); start(); }
// Hitbox nhỏ hơn hình vẽ để va chạm công bằng hơn.
function chickenRectAt(col,row){ return {x:col*CELL+22,y:row*CELL+20,w:22,h:25}; }
function chickenRect(){ return chickenRectAt(chicken.col,chicken.row); }
function hit(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
function carRect(car){
  const y=car.row*CELL+(CELL-car.h)/2;
  return {x:car.x+7,y:y+3,w:Math.max(12,car.w-14),h:Math.max(12,car.h-6)};
}
function collidesAt(col,row){
  if(row<=0 || row>=ROWS-1) return false;
  const cr=chickenRectAt(col,row);
  for(const car of cars){
    if(!laneActive(car.lane) || car.row!==row) continue;
    if(hit(cr,carRect(car))) return true;
  }
  return false;
}
function move(dx,dy){
  if(!running) start();
  const now=performance.now();
  // Chặn spam input làm gà "dịch chuyển" qua nhiều lane giữa hai frame va chạm.
  if(now-lastMoveAt < MOVE_COOLDOWN_MS) return;
  lastMoveAt=now;
  const nc=Math.max(0,Math.min(COLS-1,chicken.col+dx)), nr=Math.max(0,Math.min(ROWS-1,chicken.row+dy));
  if(nc===chicken.col&&nr===chicken.row) return;
  // Kiểm tra va chạm NGAY tại ô đích trước khi cho phép bước đi.
  // Nhờ vậy spam ↑ liên tục vẫn bị xe tông nếu bước vào đúng vị trí xe.
  if(collidesAt(nc,nr)) return over();
  chicken.col=nc; chicken.row=nr;
  if(dy<0) score+=2;
  window.ArcadeAudio?.sfx('move');
  if(chicken.row===0){
    crossings++; score+=100; crossEl.textContent=crossings; window.ArcadeAudio?.sfx('win');
    chicken={col:5,row:9};
    // Không có "bất tử 1 giây" sau khi qua đường; hàng xuất phát vốn không có xe.
    lastMoveAt=performance.now();
  }
  scoreEl.textContent=score;
}
function over(){
  running=false; best=Math.max(best,score); localStorage.setItem('arcade_best_chicken',best); bestEl.textContent=best;
  window.ArcadeAudio?.sfx('crash'); ovT.textContent='Ôi! Gà bị tông';
  ovX.textContent=`Điểm: ${score} • Qua đường: ${crossings} lần • Kỷ lục: ${best}`;
  btn.textContent='Chơi lại'; ov.classList.remove('hidden');
  window.ArcadeLeaderboard?.show('chicken-crossing',score,{title:'Chicken Crossing'});
}
function loop(t){
  if(!running) return;
  const dt=Math.min(.033,(t-last)/1000); last=t; elapsed+=dt; bounce+=dt*12;
  // Khoảng 3 phút hoặc nhiều lần qua đường mới đạt độ khó tối đa.
  difficulty=Math.min(1,elapsed/180+crossings/18);
  const multi=.88+difficulty*.82;
  for(const car of cars){
    if(!laneActive(car.lane)) continue;
    car.x+=car.cfg.dir*car.cfg.speed*multi*dt;
    // Khoảng trống giảm nhẹ khi khó dần nhưng vẫn rộng hơn bản cũ.
    const wrapPad=250-difficulty*95;
    if(car.cfg.dir>0&&car.x>c.width+110) car.x=-car.w-wrapPad;
    if(car.cfg.dir<0&&car.x+car.w<-110) car.x=c.width+wrapPad;
  }
  const cr=chickenRect();
  for(const car of cars){
    if(!laneActive(car.lane)) continue;
    // Kiểm tra mỗi frame VÀ kiểm tra ngay lúc bấm di chuyển ở move().
    // Hai lớp này loại lỗi spam phím để xuyên xe.
    if(car.row===chicken.row&&hit(cr,carRect(car))) return over();
  }
  draw(); requestAnimationFrame(loop);
}
function drawChicken(){
  const s=skin(), cr={x:chicken.col*CELL+17,y:chicken.row*CELL+15,w:31,h:35}, cx=cr.x+cr.w/2, cy=cr.y+cr.h/2 + Math.sin(bounce)*1.3;
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
  for(const car of cars){
    if(!laneActive(car.lane)) continue;
    const y=car.row*CELL+(CELL-car.h)/2; g.fillStyle=car.cfg.color; g.beginPath(); g.roundRect(car.x,y,car.w,car.h,10); g.fill();
    g.fillStyle='#cfeeff'; g.fillRect(car.x+14,y+7,Math.max(12,car.w-28),10); g.fillStyle='#10151e'; g.fillRect(car.x+10,y+car.h-5,16,8); g.fillRect(car.x+car.w-26,y+car.h-5,16,8);
  }
  drawChicken();
}
function dir(name){ if(name==='up') move(0,-1); if(name==='down') move(0,1); if(name==='left') move(-1,0); if(name==='right') move(1,0); }
document.addEventListener('keydown',e=>{ let k=e.key.toLowerCase(); if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','r'].includes(k)) e.preventDefault(); if(k==='arrowup'||k==='w') dir('up'); if(k==='arrowdown'||k==='s') dir('down'); if(k==='arrowleft'||k==='a') dir('left'); if(k==='arrowright'||k==='d') dir('right'); if(k==='r') restart(); },{passive:false});
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); dir(b.dataset.move); }));
c.addEventListener('touchstart',e=>{ const t=e.changedTouches[0]; touchStart={x:t.clientX,y:t.clientY}; },{passive:true});
c.addEventListener('touchend',e=>{ if(!touchStart) return; const t=e.changedTouches[0], dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y; touchStart=null; if(Math.max(Math.abs(dx),Math.abs(dy))<18) return; if(Math.abs(dx)>Math.abs(dy)) dir(dx>0?'right':'left'); else dir(dy>0?'down':'up'); },{passive:true});
window.addEventListener('arcade-skin-change', e=>{ if(e.detail.gameId==='chicken-crossing') draw(); });
btn.onclick=()=>ovT.textContent.includes('tông')?restart():start(); reset();
