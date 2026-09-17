const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const overlay=document.getElementById('footballOverlay'),panel=document.getElementById('footballPanel');
const scoreText=document.getElementById('scoreText'),modeText=document.getElementById('modeText'),timerText=document.getElementById('timerText');
const countdownBadge=document.getElementById('countdownBadge'),goalBadge=document.getElementById('goalBadge');
const touchPads=[...document.querySelectorAll('.touch-pad')];
const P=window.FootballPhysics;
let mode='menu',state=P.createState(),running=false,last=0,socket=null,onlineSide=null,roomCode='',serverConnected=false,resultHandled=false;
let localInputs={left:{left:false,right:false,jump:false,kick:false},right:{left:false,right:false,jump:false,kick:false}};
let onlineInput={left:false,right:false,jump:false,kick:false};
let previousPhase=state.phase;
const RATING_KEY='arcade_best_football';

function username(){return window.ArcadeLeaderboard?.getUsername?.()||localStorage.getItem('arcade_username')||'Player';}
function footballSkin(){return window.ArcadeSkins?.get('arcade-football')?.colors||{left:'#ff4f5e',right:'#5b8cff',left2:'#ffffff',right2:'#ffffff'};}
function setModeLabel(t){modeText.textContent=t;}
function resetInput(){localInputs={left:{left:false,right:false,jump:false,kick:false},right:{left:false,right:false,jump:false,kick:false}};onlineInput={left:false,right:false,jump:false,kick:false};}
function updateScore(){scoreText.textContent=`${state.score.left} - ${state.score.right}`;updateTimer();}
function updateTimer(){if(!timerText)return;timerText.textContent=state.overtime?'GOLDEN GOAL':`${Math.max(0,Math.ceil(state.timeLeft??60))}s`;}
function hideOverlay(){overlay.classList.add('hidden');}
function showOverlay(){overlay.classList.remove('hidden');}
function btn(label,id,extra=''){return `<button class="football-option" id="${id}">${extra}${label}</button>`;}
function showMainMenu(){
  stopCrowdAmbience();mode='menu';running=false;resetInput();setModeLabel('Menu');state=P.createState();state.phase='active';updateScore();showOverlay();
  panel.innerHTML=`<h2>⚽ Arcade Football</h2><p>Mỗi trận có <b>60 giây</b>. Ai ghi nhiều bàn hơn khi hết giờ sẽ thắng; nếu hòa sẽ vào <b>Golden Goal</b>.</p><div class="football-menu">
    ${btn('Practice vs CPU','practiceBtn','<span>🤖</span><small>Chơi ngay, không cần server.</small>')}
    ${btn('Local 2 Players','localBtn','<span>👥</span><small>Hai người trên cùng một máy.</small>')}
    ${btn('Online 1v1','onlineBtn','<span>🌐</span><small>Create Room / Join Room / Quick Match.</small>')}
  </div>`;
  document.getElementById('practiceBtn').onclick=()=>startLocal('cpu');
  document.getElementById('localBtn').onclick=()=>startLocal('local');
  document.getElementById('onlineBtn').onclick=showOnlineLobby;
  setTouchMode('single');draw();
}
function startLocal(kind){
  closeSocket();mode=kind;resultHandled=false;state=P.createState();previousPhase='countdown';setModeLabel(kind==='cpu'?'VS CPU':'Local 2P');updateScore();hideOverlay();running=true;last=performance.now();window.ArcadeAudio?.startMusic();startCrowdAmbience();footballCrowdCheer(.55,.65);setTouchMode(kind==='local'?'dual':'single');requestAnimationFrame(loop);
}
function setTouchMode(kind){touchPads[0].classList.remove('hidden');touchPads[1].classList.toggle('hidden',kind!=='dual');document.getElementById('touchP1Label').textContent=kind==='dual'?'P1':'Bạn';}
function getConfiguredServer(){return (localStorage.getItem('arcade_football_server')||window.MINI_ARCADE_FOOTBALL_SERVER||'').trim();}
function normalizeWs(url){url=String(url||'').trim().replace(/\/$/,'');if(url.startsWith('https://'))return 'wss://'+url.slice(8);if(url.startsWith('http://'))return 'ws://'+url.slice(7);return url;}
function showOnlineLobby(message=''){
  mode='online-lobby';running=false;setModeLabel('Online');showOverlay();setTouchMode('single');
  const current=getConfiguredServer();
  panel.innerHTML=`<h2>🌐 Football Online 1v1</h2><p>Trận đấu 60 giây. Hết giờ ai nhiều bàn hơn thắng; hòa thì Golden Goal. Tạo phòng, nhập mã hoặc tìm trận nhanh.</p>
    <div class="online-box"><div class="online-status" id="onlineStatus">${message||'Chưa kết nối máy chủ.'}</div>
      <div class="online-row"><button class="primary-online" id="quickBtn">⚡ Quick Match</button><button id="createBtn">➕ Create Room</button></div>
      <div class="online-row"><input id="roomInput" maxlength="6" placeholder="MÃ PHÒNG"><button id="joinBtn">Join Room</button></div>
      <div class="server-config"><label>SERVER REALTIME</label><div class="online-row"><input id="serverUrlInput" value="${escapeHtml(current)}" placeholder="https://mini-arcade-football.onrender.com"><button id="saveServerBtn">Lưu URL</button></div><small style="color:#8195b5">Sau khi bạn deploy Render, có thể dán URL ở đây để test. Bản public cuối cùng nên điền URL vào config.js.</small></div>
      <div class="online-row"><button id="backMenuBtn">← Menu Football</button></div></div>`;
  document.getElementById('backMenuBtn').onclick=showMainMenu;
  document.getElementById('saveServerBtn').onclick=()=>{const v=document.getElementById('serverUrlInput').value.trim().replace(/\/$/,'');localStorage.setItem('arcade_football_server',v);setStatus(v?'Đã lưu URL server trên thiết bị này.':'Đã xóa URL server.');closeSocket();};
  document.getElementById('createBtn').onclick=async()=>{if(await ensureConnected())send({type:'create'});};
  document.getElementById('quickBtn').onclick=async()=>{if(await ensureConnected()){setStatus('Đang tìm đối thủ...');send({type:'quick'});}};
  document.getElementById('joinBtn').onclick=async()=>{const code=document.getElementById('roomInput').value.trim().toUpperCase();if(code.length<4){setStatus('Nhập mã phòng trước.');return;}if(await ensureConnected())send({type:'join',code});};
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function setStatus(t){const el=document.getElementById('onlineStatus');if(el)el.textContent=t;}
function ensureConnected(){
  return new Promise(resolve=>{
    if(socket&&socket.readyState===WebSocket.OPEN){resolve(true);return;}
    const raw=getConfiguredServer();if(!raw){setStatus('Chưa có URL Render. Practice/Local vẫn chơi bình thường.');resolve(false);return;}
    closeSocket();setStatus('Đang kết nối / đánh thức server...');
    try{socket=new WebSocket(normalizeWs(raw));}catch{setStatus('URL server không hợp lệ.');resolve(false);return;}
    let done=false;const timer=setTimeout(()=>{if(!done){done=true;setStatus('Server phản hồi chậm. Thử lại sau vài giây.');resolve(false);}},18000);
    socket.onopen=()=>{serverConnected=true;send({type:'hello',username:username()});setStatus('✅ Đã kết nối server.');if(!done){done=true;clearTimeout(timer);resolve(true);}};
    socket.onerror=()=>{setStatus('Không kết nối được server realtime.');if(!done){done=true;clearTimeout(timer);resolve(false);}};
    socket.onclose=()=>{serverConnected=false;if(mode.startsWith('online'))setStatus('Mất kết nối server.');};
    socket.onmessage=e=>{try{handleServer(JSON.parse(e.data));}catch(err){console.warn(err);}};
  });
}
function send(data){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data));}
function closeSocket(){if(socket){try{socket.close();}catch{}socket=null;}serverConnected=false;}
function showWaiting(code,text){roomCode=code||roomCode;showOverlay();panel.innerHTML=`<h2>⏳ Chờ đối thủ</h2><p>${escapeHtml(text||'Đang chờ người chơi thứ hai...')}</p><div class="room-code">${escapeHtml(roomCode)}</div><p>Gửi mã này cho bạn của bạn rồi chọn <b>Join Room</b>.</p><div class="result-actions"><button id="copyRoom">📋 Copy mã</button><button id="cancelRoom">Hủy</button></div>`;document.getElementById('copyRoom').onclick=()=>navigator.clipboard?.writeText(roomCode);document.getElementById('cancelRoom').onclick=()=>{send({type:'leave'});showOnlineLobby();};}
function handleServer(msg){
  if(msg.type==='error'){setStatus('❌ '+msg.message);return;}
  if(msg.type==='waiting'){onlineSide=msg.side;showWaiting(msg.code,msg.message);return;}
  if(msg.type==='matched' || msg.type==='matchStart'){
    mode='online';onlineSide=msg.side;roomCode=msg.code||roomCode;state=msg.state||P.createState();resultHandled=false;previousPhase=state.phase;setModeLabel(`Online • ${onlineSide==='left'?'P1':'P2'}`);updateScore();hideOverlay();running=true;last=performance.now();window.ArcadeAudio?.startMusic();startCrowdAmbience();footballCrowdCheer(.55,.65);setTouchMode('single');requestAnimationFrame(loop);return;
  }
  if(msg.type==='snapshot'&&msg.state){state=msg.state;updateScore();handlePhaseEffects();return;}
  if(msg.type==='opponentLeft'){running=false;showOverlay();panel.innerHTML=`<h2>Đối thủ đã thoát</h2><p>Trận đấu kết thúc vì người kia mất kết nối.</p><div class="result-actions"><button class="primary" id="backOnline">Về Online Lobby</button></div>`;document.getElementById('backOnline').onclick=()=>showOnlineLobby();return;}
  if(msg.type==='rematchWaiting'){showResultPanel(msg.winner,true);return;}
  if(msg.type==='matchEnd'){state=msg.state||state;updateScore();finishMatch('online',msg.winner);return;}
}
function handlePhaseEffects(){
  if(state.phase!==previousPhase){if(state.phase==='goal'){window.ArcadeAudio?.sfx('win');showGoal();}if(state.phase==='ended'){window.ArcadeAudio?.sfx('gameover');}previousPhase=state.phase;}
}
function showGoal(){goalBadge.classList.remove('hidden');footballCrowdCheer(1.0,1.4);setTimeout(()=>goalBadge.classList.add('hidden'),850);}
function ratingAdd(amount){const next=Math.max(0,+(localStorage.getItem(RATING_KEY)||0)+amount);localStorage.setItem(RATING_KEY,String(next));return next;}
function finishMatch(kind,winner=state.winner){
  if(resultHandled)return;resultHandled=true;running=false;stopCrowdAmbience();footballCrowdCheer(1.15,1.8);const mySide=kind==='online'?onlineSide:'left';const won=winner===mySide;let coins=0,ratingGain=0;
  if(kind==='online'){coins=won?120:30;ratingGain=won?100:20;}else if(kind==='cpu'){coins=won?45:15;ratingGain=won?25:5;}else{coins=0;ratingGain=0;}
  if(coins)window.ArcadeEconomy?.addCoins(coins,won?'Thắng Football':'Hoàn thành Football');const rating=ratingAdd(ratingGain);showResultPanel(winner,false,{won,coins,ratingGain,rating,kind});
}
function showResultPanel(winner,waiting=false,meta={}){
  showOverlay();const won=meta.won??(winner===(mode==='online'?onlineSide:'left'));const title=waiting?'Đã yêu cầu đấu lại':(won?'🏆 Bạn thắng!':'😵 Bạn thua!');
  panel.innerHTML=`<h2>${title}</h2><div class="result-score">${state.score.left} - ${state.score.right}</div><p>${waiting?'Đang chờ đối thủ bấm Rematch...':`60 giây${state.overtime?' + Golden Goal':''} • ${meta.coins?`+${meta.coins} coin • `:''}${meta.ratingGain?`+${meta.ratingGain} Football Points`:''}`}</p><div class="result-actions">
    ${waiting?'':`<button class="primary" id="rematchBtn">🔁 Rematch</button>`}<button id="rankBtn">🏆 BXH Football</button><button id="menuBtn">Menu Football</button></div>`;
  document.getElementById('rankBtn').onclick=()=>window.ArcadeLeaderboard?.show('arcade-football',+(localStorage.getItem(RATING_KEY)||0),{title:'Arcade Football',suffix:' pts',awardCoins:false});
  document.getElementById('menuBtn').onclick=()=>{if(mode==='online')send({type:'leave'});showMainMenu();};
  document.getElementById('rematchBtn')?.addEventListener('click',()=>{if(mode==='online'){send({type:'rematch'});showResultPanel(winner,true,meta);}else startLocal(mode);});
}
function localStep(dt){
  if(mode==='cpu')localInputs.right=P.cpuInput(state,'right');P.update(state,localInputs,dt);updateScore();handlePhaseEffects();
  if(state.phase==='ended')finishMatch(mode,state.winner);
}
function sendOnlineInput(){send({type:'input',input:onlineInput});}
function loop(t){
  if(!running)return;const dt=Math.min(.033,(t-last)/1000||0);last=t;
  if(mode==='cpu'||mode==='local')localStep(dt);else if(mode==='online')sendOnlineInput();
  draw();updateBadges();updateTimer();requestAnimationFrame(loop);
}
function updateBadges(){
  if(state.phase==='countdown'){countdownBadge.textContent=Math.max(1,Math.ceil(state.phaseTimer||1));countdownBadge.classList.remove('hidden');}else countdownBadge.classList.add('hidden');
}
function drawCrowd(){
  const t=performance.now()*.003;ctx.save();
  const g=ctx.createLinearGradient(0,0,0,P.FIELD_TOP);g.addColorStop(0,'#08101f');g.addColorStop(1,'#17284b');ctx.fillStyle=g;ctx.fillRect(0,0,P.W,P.FIELD_TOP);
  ctx.fillStyle='#263a63';ctx.fillRect(0,18,P.W,16);ctx.fillStyle='#101a2d';ctx.fillRect(0,92,P.W,20);
  const colors=['#ffcf5b','#ff6677','#66b6ff','#73e6a0','#ffffff','#b58cff'];
  for(let row=0;row<4;row++)for(let col=0;col<48;col++){
    const x=10+col*20+(row%2?9:0),y=38+row*15+Math.sin(t+col*.55+row)*2.3;
    ctx.fillStyle=colors[(col+row*3)%colors.length];ctx.beginPath();ctx.arc(x,y,4.2,0,Math.PI*2);ctx.fill();
    if((col+row)%7===0){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-5,y+5);ctx.lineTo(x-8,y-2-Math.sin(t+col));ctx.moveTo(x+5,y+5);ctx.lineTo(x+8,y-2+Math.sin(t+col));ctx.stroke();}
  }
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText('MINI ARCADE STADIUM',P.W/2,28);ctx.restore();
}
function drawField(){
  const W=P.W,H=P.H,F=P.FLOOR,G=P.GOAL_TOP,T=P.FIELD_TOP;ctx.clearRect(0,0,W,H);drawCrowd();
  ctx.fillStyle='#66b94f';ctx.fillRect(0,T,W,H-T);ctx.fillStyle='#5aac47';for(let i=0;i<8;i++)ctx.fillRect(i*120,T,60,H-T);
  ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=5;ctx.strokeRect(18,T+5,W-36,F-(T+5));ctx.beginPath();ctx.moveTo(W/2,T+5);ctx.lineTo(W/2,F);ctx.stroke();ctx.beginPath();ctx.arc(W/2,294,78,0,Math.PI*2);ctx.stroke();
  // goals
  ctx.fillStyle='rgba(235,245,255,.18)';ctx.fillRect(0,G,76,F-G);ctx.fillRect(W-76,G,76,F-G);ctx.strokeStyle='#f2f5ff';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(72,G);ctx.lineTo(8,G);ctx.lineTo(8,F);ctx.stroke();ctx.beginPath();ctx.moveTo(W-72,G);ctx.lineTo(W-8,G);ctx.lineTo(W-8,F);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;for(let y=G+18;y<F;y+=20){ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(70,y);ctx.moveTo(W-70,y);ctx.lineTo(W-8,y);ctx.stroke();}
}
function drawPlayer(p,side){const s=footballSkin();const main=side==='left'?s.left:s.right,trim=side==='left'?s.left2:s.right2;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,p.r+10,p.r*.9,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=main;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();ctx.fillStyle=trim;ctx.fillRect(-20,-7,40,11);ctx.fillStyle='#ffe0bd';ctx.beginPath();ctx.arc(0,-22,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#14223a';ctx.beginPath();ctx.arc((p.facing||1)*5,-25,2.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillText(side==='left'?'P1':'P2',0,8);ctx.restore();}
function drawBall(b){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.spin||0);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#182238';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*9,Math.sin(a)*9,4.5,0,Math.PI*2);ctx.fill();}ctx.restore();}
function draw(){drawField();drawPlayer(state.players.left,'left');drawPlayer(state.players.right,'right');drawBall(state.ball);ctx.fillStyle='rgba(5,12,24,.86)';ctx.fillRect(350,118,260,58);ctx.fillStyle='#fff';ctx.font='1000 31px system-ui';ctx.textAlign='center';ctx.fillText(`${state.score.left}  -  ${state.score.right}`,440,157);ctx.fillStyle=state.overtime?'#ffe66a':'#8fe3ff';ctx.font='900 18px system-ui';ctx.textAlign='left';ctx.fillText(state.overtime?'GG':`${Math.max(0,Math.ceil(state.timeLeft??60))}s`,548,155);}
let crowdTimer=null,crowdCtx=null;
function footballCrowdCheer(intensity=.6,duration=.8){
  if(window.ArcadeAudio && !window.ArcadeAudio.enabled)return;
  try{
    crowdCtx=crowdCtx||new (window.AudioContext||window.webkitAudioContext)();if(crowdCtx.state==='suspended')crowdCtx.resume();
    const len=Math.max(1,Math.floor(crowdCtx.sampleRate*duration)),buf=crowdCtx.createBuffer(1,len,crowdCtx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++){const fade=Math.sin(Math.PI*i/len);d[i]=(Math.random()*2-1)*fade;}
    const src=crowdCtx.createBufferSource(),bp=crowdCtx.createBiquadFilter(),gain=crowdCtx.createGain();src.buffer=buf;bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.45;gain.gain.value=.035*intensity*(window.ArcadeAudio?.sfxVolume??1);src.connect(bp);bp.connect(gain);gain.connect(crowdCtx.destination);src.start();
  }catch{}
}
function startCrowdAmbience(){stopCrowdAmbience();crowdTimer=setInterval(()=>{if(running&&state.phase==='active')footballCrowdCheer(.18,.45)},4300);}
function stopCrowdAmbience(){if(crowdTimer)clearInterval(crowdTimer);crowdTimer=null;}
function keyAction(e,down){const k=e.key.toLowerCase();const prevent=['a','d','w','f',' ','arrowleft','arrowright','arrowup','enter'];if(prevent.includes(k))e.preventDefault();if(mode==='local'){
  if(k==='a')localInputs.left.left=down;if(k==='d')localInputs.left.right=down;if(k==='w')localInputs.left.jump=down;if(k==='f'||k===' ')localInputs.left.kick=down;
  if(k==='arrowleft')localInputs.right.left=down;if(k==='arrowright')localInputs.right.right=down;if(k==='arrowup')localInputs.right.jump=down;if(k==='enter')localInputs.right.kick=down;
}else if(mode==='cpu'){
  if(k==='a'||k==='arrowleft')localInputs.left.left=down;if(k==='d'||k==='arrowright')localInputs.left.right=down;if(k==='w'||k==='arrowup')localInputs.left.jump=down;if(k==='f'||k===' '||k==='enter')localInputs.left.kick=down;
}else if(mode==='online'){
  if(k==='a'||k==='arrowleft')onlineInput.left=down;if(k==='d'||k==='arrowright')onlineInput.right=down;if(k==='w'||k==='arrowup')onlineInput.jump=down;if(k==='f'||k===' '||k==='enter')onlineInput.kick=down;sendOnlineInput();
}}
document.addEventListener('keydown',e=>keyAction(e,true),{passive:false});document.addEventListener('keyup',e=>keyAction(e,false),{passive:false});
function bindTouch(){touchPads.forEach((pad,i)=>pad.querySelectorAll('[data-touch]').forEach(button=>{const act=button.dataset.touch;const set=v=>{button.classList.toggle('pressed',v);if(mode==='local'){const target=i===0?localInputs.left:localInputs.right;target[act]=v;}else if(mode==='cpu'){if(i===0)localInputs.left[act]=v;}else if(mode==='online'){if(i===0){onlineInput[act]=v;sendOnlineInput();}}};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);set(true)});button.addEventListener('pointerup',e=>{e.preventDefault();set(false)});button.addEventListener('pointercancel',()=>set(false));button.addEventListener('pointerleave',e=>{if(e.buttons===0)set(false)});}));}
bindTouch();window.addEventListener('arcade-skin-change',e=>{if(e.detail.gameId==='arcade-football')draw();});window.addEventListener('beforeunload',closeSocket);showMainMenu();draw();
