(() => {
  const W = 960, H = 540, FLOOR = 478, GOAL_TOP = 338, PLAYER_R = 31, BALL_R = 18;
  const MOVE_ACCEL = 1550, MAX_SPEED = 315, JUMP_SPEED = 650, PLAYER_GRAVITY = 1780;
  const BALL_GRAVITY = 980, KICK_POWER = 690, KICK_UP = 390;

  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const approach = (v,target,amount) => v < target ? Math.min(target,v+amount) : Math.max(target,v-amount);

  function makePlayer(side){
    return { side, x: side==='left'?190:770, y:FLOOR-PLAYER_R, vx:0, vy:0, r:PLAYER_R, grounded:true, facing:side==='left'?1:-1, kickCooldown:0 };
  }
  function resetPositions(s){
    s.players.left = makePlayer('left'); s.players.right = makePlayer('right');
    s.ball = {x:W/2,y:245,vx:0,vy:0,r:BALL_R,spin:0};
  }
  function createState(){
    const s={ width:W,height:H,floor:FLOOR,goalTop:GOAL_TOP,players:{},ball:null,score:{left:0,right:0},phase:'countdown',phaseTimer:3.15,winner:null,lastGoal:null };
    resetPositions(s); return s;
  }
  function scoreGoal(s,scorer){
    s.score[scorer] += 1; s.lastGoal=scorer;
    if(s.score[scorer] >= 3){ s.winner=scorer; s.phase='ended'; s.phaseTimer=0; return; }
    s.phase='goal'; s.phaseTimer=1.35;
  }
  function collidePlayers(a,b){
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy)||1, min=a.r+b.r-3;
    if(d>=min) return;
    const nx=dx/d, overlap=min-d;
    a.x-=nx*overlap*.5; b.x+=nx*overlap*.5;
    const av=a.vx, bv=b.vx; a.vx=bv*.35; b.vx=av*.35;
  }
  function applyPlayer(p,input,dt){
    const dir=(input?.right?1:0)-(input?.left?1:0);
    if(dir){ p.vx=approach(p.vx,dir*MAX_SPEED,MOVE_ACCEL*dt); p.facing=dir; }
    else p.vx=approach(p.vx,0,1200*dt);
    if(input?.jump && p.grounded){ p.vy=-JUMP_SPEED; p.grounded=false; }
    p.vy += PLAYER_GRAVITY*dt; p.x += p.vx*dt; p.y += p.vy*dt;
    p.x=clamp(p.x,PLAYER_R+20,W-PLAYER_R-20);
    if(p.y+p.r>=FLOOR){ p.y=FLOOR-p.r; p.vy=0; p.grounded=true; }
    p.kickCooldown=Math.max(0,p.kickCooldown-dt);
  }
  function playerBall(p,b,input){
    const dx=b.x-p.x, dy=b.y-p.y, dist=Math.hypot(dx,dy)||1, min=p.r+b.r;
    if(dist<min){
      const nx=dx/dist, ny=dy/dist, overlap=min-dist;
      b.x+=nx*overlap; b.y+=ny*overlap;
      const rel=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;
      if(rel<0){ b.vx-=1.15*rel*nx; b.vy-=1.15*rel*ny; }
      b.vx += p.vx*.18;
    }
    if(input?.kick && p.kickCooldown<=0 && dist<96){
      const toward = p.facing || (dx>=0?1:-1);
      b.vx = toward*KICK_POWER + p.vx*.42;
      b.vy = Math.min(b.vy,-KICK_UP);
      p.kickCooldown=.36;
    }
  }
  function applyBall(s,dt){
    const b=s.ball; b.vy+=BALL_GRAVITY*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.spin+=b.vx*dt*.018;
    b.vx*=Math.pow(.996,dt*60);
    if(b.y+b.r>=FLOOR){ b.y=FLOOR-b.r; if(b.vy>0)b.vy=-b.vy*.68; if(Math.abs(b.vy)<26)b.vy=0; b.vx*=.985; }
    if(b.y-b.r<20){ b.y=20+b.r; b.vy=Math.abs(b.vy)*.72; }

    const inMouth=b.y+b.r>GOAL_TOP;
    if(inMouth && b.x-b.r<=16){ scoreGoal(s,'right'); return; }
    if(inMouth && b.x+b.r>=W-16){ scoreGoal(s,'left'); return; }

    if(b.x-b.r<16){ b.x=16+b.r; b.vx=Math.abs(b.vx)*.78; }
    if(b.x+b.r>W-16){ b.x=W-16-b.r; b.vx=-Math.abs(b.vx)*.78; }

    // Crossbar collisions.
    for(const gx of [72,W-72]){
      const dx=b.x-gx, dy=b.y-GOAL_TOP, d=Math.hypot(dx,dy)||1;
      if(d<b.r+8){ const nx=dx/d, ny=dy/d, overlap=b.r+8-d; b.x+=nx*overlap; b.y+=ny*overlap; const v=b.vx*nx+b.vy*ny; if(v<0){b.vx-=1.6*v*nx;b.vy-=1.6*v*ny;} }
    }
  }
  function update(s,inputs,dt){
    dt=Math.min(.033,Math.max(0,dt||0));
    if(s.phase==='ended') return s;
    if(s.phase==='countdown' || s.phase==='goal'){
      s.phaseTimer-=dt;
      if(s.phaseTimer<=0){ if(s.phase==='goal') resetPositions(s); s.phase='active'; s.phaseTimer=0; }
      return s;
    }
    const L=s.players.left,R=s.players.right;
    applyPlayer(L,inputs?.left||{},dt); applyPlayer(R,inputs?.right||{},dt);
    collidePlayers(L,R);
    playerBall(L,s.ball,inputs?.left||{}); playerBall(R,s.ball,inputs?.right||{});
    applyBall(s,dt);
    return s;
  }
  function cpuInput(s,side='right'){
    const p=s.players[side], b=s.ball, ownGoal=side==='right'?W:0;
    const defend = side==='right' ? b.x>625 : b.x<335;
    const targetX = defend ? (side==='right'?790:170) : b.x + (side==='right'?42:-42);
    const left=targetX<p.x-14, right=targetX>p.x+14;
    const jump=b.y<p.y-44 && Math.abs(b.x-p.x)<115 && p.grounded;
    const facingOK=side==='right'?b.x<p.x:b.x>p.x;
    const kick=Math.abs(b.x-p.x)<90 && Math.abs(b.y-p.y)<80 && facingOK;
    // Don't own-goal while defending if ball is already behind the player.
    if(defend && Math.abs(b.x-ownGoal)<78) return {left:side==='right',right:side==='left',jump,kick:false};
    return {left,right,jump,kick};
  }
  function cloneState(s){ return JSON.parse(JSON.stringify(s)); }
  window.FootballPhysics={W,H,FLOOR,GOAL_TOP,PLAYER_R,BALL_R,createState,update,cpuInput,cloneState};
})();
