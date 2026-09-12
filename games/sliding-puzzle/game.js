const board=document.getElementById('puzzle'),movesEl=document.getElementById('moves'),bestEl=document.getElementById('best'),overlay=document.getElementById('overlay'),winText=document.getElementById('winText');
let tiles=[],moves=0,best=+(localStorage.getItem('arcade_best_puzzle')||0);bestEl.textContent=best||'—';
function solved(){return tiles.every((v,i)=>v===(i===15?0:i+1))}
function neighbors(i){let r=Math.floor(i/4),c=i%4,a=[];if(r>0)a.push(i-4);if(r<3)a.push(i+4);if(c>0)a.push(i-1);if(c<3)a.push(i+1);return a}
function render(){board.innerHTML='';tiles.forEach((v,i)=>{let b=document.createElement('button');b.className='tile'+(v===0?' empty':'');b.textContent=v||'';b.onclick=()=>move(i);board.appendChild(b)});movesEl.textContent=moves}
function move(i){let e=tiles.indexOf(0);if(!neighbors(e).includes(i))return;[tiles[e],tiles[i]]=[tiles[i],tiles[e]];moves++;render();if(solved())win()}
function shuffle(){tiles=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];let blank=15,last=-1;for(let n=0;n<220;n++){let opts=neighbors(blank).filter(i=>i!==last);let pick=opts[Math.floor(Math.random()*opts.length)];[tiles[blank],tiles[pick]]=[tiles[pick],tiles[blank]];last=blank;blank=pick}moves=0;overlay.classList.add('hidden');render()}
function win(){if(!best||moves<best){best=moves;localStorage.setItem('arcade_best_puzzle',best);bestEl.textContent=best}winText.textContent=`Bạn hoàn thành trong ${moves} bước. Kỷ lục: ${best} bước.`;overlay.classList.remove('hidden')}
document.getElementById('shuffle').onclick=shuffle;document.getElementById('again').onclick=shuffle;document.getElementById('hint').onclick=()=>alert('Chỉ các ô nằm ngay trên, dưới, trái hoặc phải ô trống mới di chuyển được. Hãy đưa các số về thứ tự 1–15.');shuffle();
