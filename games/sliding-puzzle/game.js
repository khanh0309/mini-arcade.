const board=document.getElementById('puzzle'),movesEl=document.getElementById('moves'),bestEl=document.getElementById('best'),levelEl=document.getElementById('level'),overlay=document.getElementById('overlay'),winText=document.getElementById('winText');
let tiles=[],moves=0,level=1,startedAt=0,best=+(localStorage.getItem('arcade_best_puzzle_score')||0);
bestEl.textContent=best?best.toLocaleString('vi-VN'):'—';
function solved(){return tiles.every((v,i)=>v===(i===15?0:i+1))}
function neighbors(i){let r=Math.floor(i/4),c=i%4,a=[];if(r>0)a.push(i-4);if(r<3)a.push(i+4);if(c>0)a.push(i-1);if(c<3)a.push(i+1);return a}
function render(){board.innerHTML='';tiles.forEach((v,i)=>{let b=document.createElement('button');b.className='tile'+(v===0?' empty':'');b.textContent=v||'';b.onclick=()=>move(i);board.appendChild(b)});movesEl.textContent=moves;levelEl.textContent=level}
function move(i){let e=tiles.indexOf(0);if(!neighbors(e).includes(i))return;[tiles[e],tiles[i]]=[tiles[i],tiles[e]];moves++;window.ArcadeAudio?.sfx('move');render();if(solved())win()}
function shuffle(){
  tiles=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
  let blank=15,last=-1;
  const shuffleSteps=Math.min(230,75+(level-1)*32);
  for(let n=0;n<shuffleSteps;n++){
    let opts=neighbors(blank).filter(i=>i!==last);
    let pick=opts[Math.floor(Math.random()*opts.length)];
    [tiles[blank],tiles[pick]]=[tiles[pick],tiles[blank]];last=blank;blank=pick;
  }
  moves=0;startedAt=performance.now();overlay.classList.add('hidden');render();
}
function win(){
  const elapsed=Math.max(1,(performance.now()-startedAt)/1000);
  const moveBonus=Math.max(0,12000-moves*70);
  const timeBonus=Math.max(0,6500-Math.round(elapsed*45));
  const levelBonus=(level-1)*3200;
  const points=Math.min(49000,12000+moveBonus+timeBonus+levelBonus);
  if(points>best){best=points;localStorage.setItem('arcade_best_puzzle_score',best);bestEl.textContent=best.toLocaleString('vi-VN')}
  window.ArcadeAudio?.sfx('win');
  winText.textContent=`Cấp ${level}: ${moves} bước • ${Math.round(elapsed)} giây • ${points.toLocaleString('vi-VN')} điểm. Ván sau sẽ khó hơn.`;
  overlay.classList.remove('hidden');
  window.ArcadeLeaderboard?.show('sliding-puzzle',points,{title:'Sliding Puzzle'});
  level=Math.min(8,level+1);
}
document.getElementById('shuffle').onclick=shuffle;
document.getElementById('again').onclick=shuffle;
document.getElementById('hint').onclick=()=>alert('Chỉ các ô nằm ngay trên, dưới, trái hoặc phải ô trống mới di chuyển được. Mỗi lần hoàn thành, cấp độ tăng và bàn sau được xáo khó hơn.');
shuffle();
window.ArcadeAudio?.startMusic();
