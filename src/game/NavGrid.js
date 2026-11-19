import {canOccupy,moveWithCollision,PLAYER_BOUNDS,PLAYER_RADIUS,APARTMENT_BLOCKERS} from './CombatMath.js';

// Small deterministic A* grid; used for one actor, recalculated sparingly.
const STEP=.24;
const minX=PLAYER_BOUNDS.minX+PLAYER_RADIUS;
const minZ=PLAYER_BOUNDS.minZ+PLAYER_RADIUS;
const maxX=PLAYER_BOUNDS.maxX-PLAYER_RADIUS;
const maxZ=PLAYER_BOUNDS.maxZ-PLAYER_RADIUS;
const nx=Math.floor((maxX-minX)/STEP)+1;
const nz=Math.floor((maxZ-minZ)/STEP)+1;
const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
const key=(x,z)=>z*nx+x;
const point=(ix,iz)=>({x:minX+ix*STEP,z:minZ+iz*STEP});
const valid=(ix,iz,blockers)=>ix>=0&&iz>=0&&ix<nx&&iz<nz&&
  canOccupy(minX+ix*STEP,minZ+iz*STEP,PLAYER_RADIUS,blockers);
function closest(location,blockers){
  let best=null,dist=Infinity;
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
    if(!valid(ix,iz,blockers))continue;
    const v=point(ix,iz),d=(v.x-location.x)**2+(v.z-location.z)**2;
    if(d<dist){dist=d;best={ix,iz};}
  }
  return best;
}
export function findNavigationPath(from,to,blockers=APARTMENT_BLOCKERS){
  const start=closest(from,blockers),end=closest(to,blockers);
  if(!start||!end)return[];
  const first=key(start.ix,start.iz),goal=key(end.ix,end.iz);
  if(first===goal)return [point(end.ix,end.iz)];
  const open=[first],cost=new Map([[first,0]]),score=new Map([[first,0]]),
        came=new Map(),closed=new Set();
  const heuristic=(k)=>{
    const x=k%nx,z=Math.floor(k/nx);
    return Math.hypot(end.ix-x,end.iz-z);
  };
  score.set(first,heuristic(first));
  let loops=0;
  while(open.length&&loops++<1500){
    open.sort((a,b)=>(score.get(a)??Infinity)-(score.get(b)??Infinity));
    const current=open.shift();
    if(current===goal)break;
    if(closed.has(current))continue;
    closed.add(current);
    const cx=current%nx,cz=Math.floor(current/nx);
    for(const [dx,dz] of dirs){
      const x=cx+dx,z=cz+dz;
      if(!valid(x,z,blockers))continue;
      // Never cut diagonally through a corner, even if the destination is clear.
      if(dx&&dz&&(!valid(cx+dx,cz,blockers)||!valid(cx,cz+dz,blockers)))continue;
      const next=key(x,z),g=(cost.get(current)??Infinity)+(dx&&dz?1.4142:1);
      if(g>=(cost.get(next)??Infinity))continue;
      came.set(next,current);cost.set(next,g);score.set(next,g+heuristic(next));
      if(!closed.has(next)&&!open.includes(next))open.push(next);
    }
  }
  if(!came.has(goal))return[];
  const result=[];let cursor=goal;
  while(cursor!==first&&result.length<1500){
    const ix=cursor%nx,iz=Math.floor(cursor/nx);
    result.push(point(ix,iz));cursor=came.get(cursor);
    if(cursor===undefined)return[];
  }
  result.reverse();
  return result;
}
export function navigateStep(position,goal,speed,dt,blockers=APARTMENT_BLOCKERS){
  const vx=goal.x-position.x,vz=goal.z-position.z,dist=Math.hypot(vx,vz);
  if(dist<.001)return position;
  const step=Math.min(speed*dt,dist);
  return moveWithCollision(position.x,position.z,vx/dist*step,vz/dist*step,PLAYER_RADIUS,blockers);
}
