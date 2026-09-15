(() => {
  const COIN_KEY = 'arcade_coins_v1';
  const OWNED_KEY = 'arcade_owned_skins_v1';
  const STARTING_COINS = 0;

  function n(v){ const x = Number(v); return Number.isFinite(x) ? x : 0; }
  function getCoins(){
    const raw = localStorage.getItem(COIN_KEY);
    if(raw === null){ localStorage.setItem(COIN_KEY, String(STARTING_COINS)); return STARTING_COINS; }
    return Math.max(0, Math.floor(n(raw)));
  }
  function setCoins(value){
    const coins = Math.max(0, Math.floor(n(value)));
    localStorage.setItem(COIN_KEY, String(coins));
    updateCoinUI();
    window.dispatchEvent(new CustomEvent('arcade-coins-change', { detail:{ coins } }));
    return coins;
  }
  function addCoins(amount, reason=''){ amount=Math.max(0,Math.floor(n(amount))); if(!amount) return 0; setCoins(getCoins()+amount); toast(`🪙 +${amount} coin${reason?` • ${reason}`:''}`); return amount; }
  function spendCoins(amount){ amount=Math.max(0,Math.floor(n(amount))); if(getCoins()<amount) return false; setCoins(getCoins()-amount); return true; }

  function loadOwned(){
    try { const data=JSON.parse(localStorage.getItem(OWNED_KEY)||'{}'); return data && typeof data==='object' ? data : {}; }
    catch { return {}; }
  }
  function saveOwned(data){ localStorage.setItem(OWNED_KEY, JSON.stringify(data)); window.dispatchEvent(new CustomEvent('arcade-owned-change')); }
  function isOwned(gameId, skinId){ if(!skinId) return false; if(skinId==='default') return true; const data=loadOwned(); return !!data?.[gameId]?.includes(skinId); }
  function grant(gameId, skinId){ const data=loadOwned(); const arr=new Set(data[gameId]||[]); arr.add(skinId); data[gameId]=[...arr]; saveOwned(data); return true; }

  function rewardForGame(game, score){
    score = Math.max(0, Number(score)||0);
    switch(game){
      case 'snake': return Math.max(1, Math.min(40, 2 + Math.floor(score/20)));
      case 'sky-flap': return Math.max(1, Math.min(40, 2 + Math.floor(score*1.7)));
      case 'dino-run': return Math.max(1, Math.min(45, 2 + Math.floor(score/18)));
      case 'sliding-puzzle': return Math.max(5, Math.min(35, 34 - Math.floor(score/8)));
      case 'block-drop': return Math.max(1, Math.min(45, 2 + Math.floor(score/150)));
      case 'racing': return Math.max(1, Math.min(45, 2 + Math.floor(score/45)));
      case 'chicken-crossing': return Math.max(1, Math.min(45, 2 + Math.floor(score/35)));
      case 'arcade-football': return Math.max(1, Math.min(45, 2 + Math.floor(score/120)));
      default: return 1;
    }
  }
  function awardFromGame(game, score){ const amount=rewardForGame(game,score); return addCoins(amount,'Phần thưởng trận'); }

  function updateCoinUI(){ document.querySelectorAll('[data-coin-balance]').forEach(el=>el.textContent=getCoins().toLocaleString('vi-VN')); }
  function ensureToast(){
    let box=document.getElementById('coinToast');
    if(box) return box;
    const style=document.createElement('style');
    style.textContent=`.coin-toast{position:fixed;left:50%;bottom:24px;z-index:1700;transform:translate(-50%,18px);opacity:0;pointer-events:none;background:#0b1527;color:#fff;border:1px solid #39517c;border-radius:999px;padding:10px 16px;font-weight:900;box-shadow:0 15px 45px rgba(0,0,0,.35);transition:.22s}.coin-toast.show{opacity:1;transform:translate(-50%,0)}.coin-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #394b6c;background:#111a2d;border-radius:12px;padding:9px 11px;font-weight:900;color:#ffe28a;white-space:nowrap}`;
    document.head.appendChild(style);
    box=document.createElement('div'); box.id='coinToast'; box.className='coin-toast'; document.body.appendChild(box); return box;
  }
  let toastTimer;
  function toast(text){ const box=ensureToast(); box.textContent=text; box.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove('show'),1800); }

  window.ArcadeEconomy={ getCoins,setCoins,addCoins,spendCoins,isOwned,grant,rewardForGame,awardFromGame,updateCoinUI,toast };
  document.addEventListener('DOMContentLoaded',()=>{ ensureToast(); updateCoinUI(); });
})();
