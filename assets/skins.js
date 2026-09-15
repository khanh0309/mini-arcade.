(() => {
  const STORAGE_PREFIX = 'arcade_skin_';
  const DEFINITIONS = {
    snake: { title:'Neon Snake', options:[
      {id:'neon',name:'Neon Green',preview:'🐍',price:0,colors:{head:'#8effb8',face:'#59df89',body:'#45d874',tail:'#2fb864',eye:'#ffffff',pupil:'#14261d',tongue:'#ff7aa0',glow:'rgba(81,255,159,.45)'}},
      {id:'ocean',name:'Ocean Blue',preview:'🌀',price:55,colors:{head:'#8ad8ff',face:'#53b6ea',body:'#4bb6f2',tail:'#2589c2',eye:'#ffffff',pupil:'#0d2233',tongue:'#ff93b3',glow:'rgba(105,202,255,.42)'}},
      {id:'sunset',name:'Sunset',preview:'🌅',price:85,colors:{head:'#ffd29b',face:'#ffa960',body:'#ffb347',tail:'#ff814a',eye:'#ffffff',pupil:'#432113',tongue:'#ff5f96',glow:'rgba(255,172,84,.42)'}},
      {id:'grape',name:'Grape',preview:'🍇',price:120,colors:{head:'#d5b3ff',face:'#b879f2',body:'#b468f3',tail:'#8240c9',eye:'#ffffff',pupil:'#231133',tongue:'#ff90c5',glow:'rgba(192,126,255,.38)'}}
    ]},
    'sky-flap': { title:'Sky Flap', options:[
      {id:'chick',name:'Golden Chick',preview:'🐥',price:0,colors:{body1:'#ffe585',body2:'#ffbf3f',wingBack:'#f6a83c',wingFront:'#ffd05d',head:'#ffd15b',beak:'#ff8c42',beak2:'#f5702f',cheek:'rgba(255,144,120,.55)',eye:'#1d2533',tail:'#ff9450'}},
      {id:'bluebird',name:'Blue Bird',preview:'🩵',price:70,colors:{body1:'#bde7ff',body2:'#5db7ff',wingBack:'#4998db',wingFront:'#8ccfff',head:'#77c7ff',beak:'#ffb05a',beak2:'#ff9340',cheek:'rgba(255,255,255,.35)',eye:'#1c2d48',tail:'#4a9cff'}},
      {id:'parrot',name:'Parrot',preview:'🦜',price:115,colors:{body1:'#d4ff92',body2:'#4bc05f',wingBack:'#2da859',wingFront:'#8be35e',head:'#69d663',beak:'#ff7b44',beak2:'#ea5d26',cheek:'rgba(255,245,190,.35)',eye:'#14301d',tail:'#2dbf71'}}
    ]},
    'dino-run': { title:'Dino Run', options:[
      {id:'chrome',name:'Chrome Green',preview:'🦖',price:0,colors:{tail:'#1a9c62',body1:'#5df0a0',body2:'#2cb86d',belly:'#c8ffe0',head:'#5ef0a4',neck:'#41d685',spike:'#d4ff6a',eye:'#102117',outline:'#168451'}},
      {id:'purple',name:'Purple Rex',preview:'💜',price:80,colors:{tail:'#7f4ed8',body1:'#d4b2ff',body2:'#9e67ef',belly:'#f0e4ff',head:'#bf96ff',neck:'#ab79ff',spike:'#ffe77a',eye:'#291444',outline:'#6c41c6'}},
      {id:'lava',name:'Lava',preview:'🔥',price:125,colors:{tail:'#c85a12',body1:'#ffd285',body2:'#ff9642',belly:'#fff0ca',head:'#ffb062',neck:'#ff8742',spike:'#ffef74',eye:'#3e2010',outline:'#e36a1a'}}
    ]},
    'chicken-crossing': { title:'Chicken Crossing', options:[
      {id:'classic',name:'Classic White',preview:'🐔',price:0,colors:{body1:'#fffdf5',body2:'#ffe8b5',wing:'#fff6db',head:'#fff8e8',comb:'#ef3f45',beak:'#ffb33a',eye:'#172033',blush:'rgba(255,150,140,.45)',feet:'#f49a2c'}},
      {id:'brown',name:'Brown Hen',preview:'🤎',price:65,colors:{body1:'#ffe2c8',body2:'#c98b56',wing:'#efc7a6',head:'#f7d3ba',comb:'#d93b40',beak:'#ffb247',eye:'#221710',blush:'rgba(255,210,180,.25)',feet:'#ec9a2f'}},
      {id:'midnight',name:'Midnight',preview:'🌙',price:110,colors:{body1:'#d8dff5',body2:'#6b7ca7',wing:'#bcc7e6',head:'#e8eeff',comb:'#ff5d74',beak:'#ffc14f',eye:'#141a29',blush:'rgba(255,255,255,.18)',feet:'#ffb04d'}}
    ]},
    racing: { title:'Road Rush', options:[
      {id:'red',name:'Crimson Racer',preview:'🏎️',price:0,colors:{player:'#ff3b30',glass:'#7ee7ff',light:'#ffe86b'}},
      {id:'blue',name:'Blue Storm',preview:'🔵',price:90,colors:{player:'#2f7cff',glass:'#b7ecff',light:'#fff1a0'}},
      {id:'lime',name:'Lime Flash',preview:'🟢',price:135,colors:{player:'#31c96d',glass:'#d2fff0',light:'#fff49d'}}
    ]},
    'arcade-football': { title:'Arcade Football', options:[
      {id:'classic',name:'Red vs Blue',preview:'⚽',price:0,colors:{left:'#ef4457',right:'#4f7fff',left2:'#ffffff',right2:'#ffffff'}},
      {id:'neon',name:'Neon Derby',preview:'✨',price:100,colors:{left:'#42e887',right:'#c16cff',left2:'#0b1d18',right2:'#ffffff'}},
      {id:'sunset',name:'Sunset Cup',preview:'🌇',price:150,colors:{left:'#ff8c42',right:'#2fc6d0',left2:'#fff4cf',right2:'#e8ffff'}}
    ]}
  };

  function def(gameId){ return DEFINITIONS[gameId]; }
  function first(gameId){ return def(gameId)?.options?.[0] || null; }
  function find(gameId,id){ return def(gameId)?.options.find(s=>s.id===id) || null; }
  function owned(gameId,opt){ return !opt?.price || window.ArcadeEconomy?.isOwned(gameId,opt.id); }
  function get(gameId){ const d=def(gameId); if(!d) return null; const selected=localStorage.getItem(STORAGE_PREFIX+gameId); const opt=find(gameId,selected)||first(gameId); return owned(gameId,opt) ? opt : first(gameId); }
  function set(gameId,id){ const opt=find(gameId,id); if(!opt) return false; if(!owned(gameId,opt)) return false; localStorage.setItem(STORAGE_PREFIX+gameId,id); window.dispatchEvent(new CustomEvent('arcade-skin-change',{detail:{gameId,optionId:id,skin:opt}})); return true; }
  function buy(gameId,id){ const opt=find(gameId,id); if(!opt) return {ok:false,message:'Không tìm thấy skin.'}; if(owned(gameId,opt)){ set(gameId,id); return {ok:true,already:true}; } if(!window.ArcadeEconomy?.spendCoins(opt.price)) return {ok:false,message:`Bạn cần ${opt.price} coin.`}; window.ArcadeEconomy.grant(gameId,id); set(gameId,id); window.ArcadeEconomy.toast(`✅ Đã mua ${opt.name}`); return {ok:true}; }

  function ensureStyle(){ if(document.getElementById('arcadeSkinStyle')) return; const style=document.createElement('style'); style.id='arcadeSkinStyle'; style.textContent=`
    .skin-modal{position:fixed;inset:0;z-index:1500;background:rgba(4,8,16,.82);display:grid;place-items:center;padding:18px;backdrop-filter:blur(7px)}.skin-modal.hidden{display:none}
    .skin-card{width:min(680px,100%);max-height:90vh;overflow:auto;background:linear-gradient(160deg,#121c32,#09111f);border:1px solid #31466f;border-radius:24px;padding:18px;box-shadow:0 30px 90px rgba(0,0,0,.5)}
    .skin-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.skin-head h2{margin:0;font-size:26px}.skin-head p{margin:5px 0 0;color:#adc1db;font-size:13px}.skin-wallet{font-weight:900;color:#ffe28a;margin-top:6px}
    .skin-close{border:1px solid #30456e;background:#0b1426;color:#fff;width:40px;height:40px;border-radius:12px;font-size:24px;cursor:pointer}
    .skin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}.skin-option{border:1px solid #263a5b;background:#0b1527;border-radius:18px;padding:14px;color:#eaf1ff;text-align:left;min-height:150px;display:flex;flex-direction:column}.skin-option.active{border-color:#7c9cff;background:#111d39;box-shadow:0 0 0 2px rgba(124,156,255,.16) inset}.skin-option.locked{opacity:.88}
    .skin-preview{font-size:30px;margin-bottom:7px}.skin-name{font-weight:900}.skin-state{font-size:12px;color:#93a8c9;margin:4px 0 12px}.skin-option button{margin-top:auto;border:0;border-radius:11px;padding:9px 10px;font-weight:900;cursor:pointer;background:#6f82ff;color:white}.skin-option button.buy{background:#e7b744;color:#18130a}.skin-option button:disabled{opacity:.55;cursor:default}.skin-error{min-height:20px;color:#ff9aab;font-size:12px;margin-top:10px}
  `; document.head.appendChild(style); }
  function modal(){ ensureStyle(); let m=document.getElementById('arcadeSkinModal'); if(m) return m; m=document.createElement('div'); m.id='arcadeSkinModal'; m.className='skin-modal hidden'; m.innerHTML=`<div class="skin-card"><div class="skin-head"><div><h2 id="skinTitle">Shop skin</h2><p>Mua skin bằng coin kiếm được khi chơi game.</p><div class="skin-wallet">🪙 <span data-coin-balance>0</span> coin</div></div><button class="skin-close" id="skinClose">×</button></div><div class="skin-grid" id="skinGrid"></div><div class="skin-error" id="skinError"></div></div>`; document.body.appendChild(m); m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}); m.querySelector('#skinClose').onclick=()=>m.classList.add('hidden'); return m; }
  function open(gameId){ const d=def(gameId); if(!d) return; const m=modal(); m.classList.remove('hidden'); window.ArcadeEconomy?.updateCoinUI(); m.querySelector('#skinTitle').textContent=`🎨 ${d.title}`; const grid=m.querySelector('#skinGrid'), current=get(gameId)?.id, err=m.querySelector('#skinError'); err.textContent=''; grid.innerHTML=d.options.map(opt=>{ const isOwned=owned(gameId,opt), active=current===opt.id; return `<div class="skin-option ${active?'active':''} ${isOwned?'':'locked'}"><div class="skin-preview">${opt.preview}</div><div class="skin-name">${opt.name}</div><div class="skin-state">${active?'✓ Đang dùng':isOwned?'Đã sở hữu':`🔒 ${opt.price} coin`}</div><button data-action="${isOwned?'select':'buy'}" data-id="${opt.id}" class="${isOwned?'':'buy'}" ${active?'disabled':''}>${active?'Đang dùng':isOwned?'Chọn skin':`Mua • ${opt.price} 🪙`}</button></div>`; }).join('');
    grid.querySelectorAll('button[data-id]').forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.id; if(btn.dataset.action==='buy'){ const r=buy(gameId,id); if(!r.ok){err.textContent=r.message;return;} } else set(gameId,id); open(gameId); });
  }
  function bind(){ document.querySelectorAll('[data-skin-game]').forEach(btn=>{ if(btn.dataset.skinBound)return; btn.dataset.skinBound='1'; btn.onclick=()=>open(btn.dataset.skinGame); }); }
  window.ArcadeSkins={get,set,buy,open,defs:DEFINITIONS,isOwned:owned}; document.addEventListener('DOMContentLoaded',bind);
})();
