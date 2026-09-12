const fallbackGames = [
  {id:'snake',name:'Neon Snake',icon:'🐍',tag:'Arcade',description:'Ăn mồi, dài hơn và tránh va tường hoặc tự cắn mình.',path:'./games/snake/',accent:'#63e7b4',storageKey:'arcade_best_snake',scoreLabel:'Kỷ lục'},
  {id:'sky-flap',name:'Sky Flap',icon:'🐦',tag:'Reflex',description:'Chạm để bay và luồn qua các cặp cột càng lâu càng tốt.',path:'./games/sky-flap/',accent:'#7cc7ff',storageKey:'arcade_best_flap',scoreLabel:'Kỷ lục'},
  {id:'dino-run',name:'Dino Run',icon:'🦖',tag:'Runner',description:'Nhảy qua chướng ngại vật và sống sót khi tốc độ tăng dần.',path:'./games/dino-run/',accent:'#ffd166',storageKey:'arcade_best_dino',scoreLabel:'Kỷ lục'},
  {id:'sliding-puzzle',name:'Sliding Puzzle',icon:'🧩',tag:'Puzzle',description:'Sắp các ô số về đúng thứ tự với số bước di chuyển ít nhất.',path:'./games/sliding-puzzle/',accent:'#c89bff',storageKey:'arcade_best_puzzle',scoreLabel:'Ít bước nhất'},
  {id:'block-drop',name:'Block Drop',icon:'🧱',tag:'Classic',description:'Xếp các khối, hoàn thành hàng và đừng để chạm nóc.',path:'./games/block-drop/',accent:'#ff8aa5',storageKey:'arcade_best_blocks',scoreLabel:'Kỷ lục'}
];

const grid = document.getElementById('gameGrid');
const search = document.getElementById('search');
const installBtn = document.getElementById('installBtn');
let games = fallbackGames;
let deferredPrompt = null;

function scoreText(game){
  const v = localStorage.getItem(game.storageKey);
  if(v === null) return '—';
  return Number(v).toLocaleString('vi-VN');
}

function render(list){
  if(!list.length){ grid.innerHTML='<div class="empty">Không tìm thấy game phù hợp.</div>'; return; }
  grid.innerHTML = list.map(game => `
    <article class="game-card" style="--card-accent:${game.accent}">
      <div class="glow"></div>
      <div class="game-top">
        <div class="game-icon">${game.icon}</div>
        <div class="badge">${game.tag}</div>
      </div>
      <h2>${game.name}</h2>
      <p>${game.description}</p>
      <div class="game-meta">
        <div class="best">${game.scoreLabel}<strong>${scoreText(game)}</strong></div>
        <a class="play-btn" href="${game.path}">Chơi ngay <span>→</span></a>
      </div>
    </article>`).join('');
}

fetch('./games.json').then(r => r.ok ? r.json() : Promise.reject()).then(data => { games=data; render(games); }).catch(() => render(games));
search.addEventListener('input',()=>{
  const q=search.value.trim().toLowerCase();
  render(games.filter(g => `${g.name} ${g.tag} ${g.description}`.toLowerCase().includes(q)));
});
window.addEventListener('pageshow',()=>render(games));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false;});
installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.hidden=true;});
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
render(games);
