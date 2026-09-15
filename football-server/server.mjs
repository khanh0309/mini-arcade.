import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createState, update } from './physics.mjs';

const PORT=Number(process.env.PORT||3000),HOST='0.0.0.0';
const FRONTEND_URL=String(process.env.FRONTEND_URL||'').replace(/\/$/,'');
const rooms=new Map();const clients=new Map();let quickWaiting=null;
const cleanName=v=>String(v||'Player').normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu,'').replace(/\s+/g,' ').trim().slice(0,18)||'Player';
const safeSend=(ws,data)=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));};
const makeCode=()=>{for(let i=0;i<30;i++){const c=crypto.randomBytes(3).toString('hex').slice(0,4).toUpperCase();if(!rooms.has(c))return c;}return String(Math.floor(1000+Math.random()*9000));};
const countOnline=()=>[...clients.keys()].filter(ws=>ws.readyState===WebSocket.OPEN).length;

const server=http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');
  if(req.url==='/health'||req.url==='/'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,service:'mini-arcade-football',online:countOnline(),rooms:rooms.size}));return;}
  res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify({error:'Not found'}));
});
const wss=new WebSocketServer({noServer:true});
server.on('upgrade',(req,socket,head)=>{
  const origin=String(req.headers.origin||'').replace(/\/$/,'');
  const local=/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if(FRONTEND_URL&&origin&&origin!==FRONTEND_URL&&!local){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
});

function roomPublic(r){return{code:r.code,state:r.state};}
function broadcast(r,data){r.players.forEach(p=>p&&safeSend(p.ws,data));}
function clearFromRoom(ws,notify=true){
  const meta=clients.get(ws);if(!meta?.room)return;const r=rooms.get(meta.room);meta.room=null;meta.side=null;if(!r)return;
  const idx=r.players.findIndex(p=>p?.ws===ws);if(idx>=0)r.players[idx]=null;
  if(notify)r.players.forEach(p=>p&&safeSend(p.ws,{type:'opponentLeft'}));
  if(!r.players.some(Boolean))rooms.delete(r.code);else{r.status='waiting';r.state=createState();r.rematch.clear();}
}
function createRoom(ws){clearFromRoom(ws);const meta=clients.get(ws),code=makeCode();const r={code,players:[{ws,username:meta.username,side:'left'},null],inputs:{left:{},right:{}},state:createState(),status:'waiting',rematch:new Set(),lastEnded:false};rooms.set(code,r);meta.room=code;meta.side='left';safeSend(ws,{type:'waiting',code,side:'left',message:'Phòng đã tạo. Chờ người thứ hai...'});}
function joinRoom(ws,code){code=String(code||'').trim().toUpperCase();const r=rooms.get(code);if(!r){safeSend(ws,{type:'error',message:'Không tìm thấy phòng.'});return;}if(r.players[1]){safeSend(ws,{type:'error',message:'Phòng đã đủ 2 người.'});return;}clearFromRoom(ws);const meta=clients.get(ws);r.players[1]={ws,username:meta.username,side:'right'};meta.room=code;meta.side='right';r.status='playing';r.state=createState();r.inputs={left:{},right:{}};r.rematch.clear();r.lastEnded=false;safeSend(r.players[0].ws,{type:'matched',code,side:'left',opponent:meta.username,state:r.state});safeSend(ws,{type:'matched',code,side:'right',opponent:r.players[0].username,state:r.state});}
function quickMatch(ws){
  if(quickWaiting&&quickWaiting!==ws&&quickWaiting.readyState===WebSocket.OPEN){const other=quickWaiting;quickWaiting=null;createRoom(other);const code=clients.get(other)?.room;joinRoom(ws,code);return;}
  quickWaiting=ws;safeSend(ws,{type:'waiting',code:'QUICK',side:'left',message:'Đang tìm một người chơi khác...'});
}
function handleRematch(ws){const meta=clients.get(ws),r=rooms.get(meta?.room);if(!r||!r.players[0]||!r.players[1])return;r.rematch.add(meta.side);if(r.rematch.size<2){safeSend(ws,{type:'rematchWaiting',winner:r.state.winner});return;}r.state=createState();r.inputs={left:{},right:{}};r.status='playing';r.rematch.clear();r.lastEnded=false;r.players.forEach(p=>safeSend(p.ws,{type:'matchStart',code:r.code,side:p.side,state:r.state}));}

wss.on('connection',ws=>{
  clients.set(ws,{username:'Player',room:null,side:null});
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw);}catch{return;}const meta=clients.get(ws);if(!meta)return;
    if(m.type==='hello'){meta.username=cleanName(m.username);safeSend(ws,{type:'hello',username:meta.username});return;}
    if(m.type==='create'){if(quickWaiting===ws)quickWaiting=null;createRoom(ws);return;}
    if(m.type==='join'){if(quickWaiting===ws)quickWaiting=null;joinRoom(ws,m.code);return;}
    if(m.type==='quick'){clearFromRoom(ws);quickMatch(ws);return;}
    if(m.type==='leave'){if(quickWaiting===ws)quickWaiting=null;clearFromRoom(ws);return;}
    if(m.type==='rematch'){handleRematch(ws);return;}
    if(m.type==='input'){
      const r=rooms.get(meta.room);if(!r||r.status!=='playing'||!meta.side)return;const x=m.input||{};r.inputs[meta.side]={left:!!x.left,right:!!x.right,jump:!!x.jump,kick:!!x.kick};return;
    }
  });
  ws.on('close',()=>{if(quickWaiting===ws)quickWaiting=null;clearFromRoom(ws);clients.delete(ws);});
});

let tick=0,last=Date.now();setInterval(()=>{const now=Date.now(),dt=Math.min(.033,(now-last)/1000);last=now;tick++;
  for(const r of rooms.values()){
    if(r.status!=='playing'||!r.players[0]||!r.players[1])continue;update(r.state,r.inputs,dt);
    if(tick%3===0)broadcast(r,{type:'snapshot',state:r.state});
    if(r.state.phase==='ended'&&!r.lastEnded){r.lastEnded=true;r.status='ended';broadcast(r,{type:'matchEnd',winner:r.state.winner,state:r.state});}
  }
},1000/60);

server.listen(PORT,HOST,()=>console.log(`Mini Arcade Football server listening on http://${HOST}:${PORT}`));
