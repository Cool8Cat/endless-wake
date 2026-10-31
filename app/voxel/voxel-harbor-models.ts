import { addBox, addVoxelSolid, addSteppedBeam, appendModel, type ModelVector } from "./voxel-model-kit";
import { harborPlan, type BuildingModule, type RoofStyle } from "./voxel-architecture";
import { PLANT_MODELS } from "./voxel-plants";
import { buildCargo } from "./voxel-life-models";

const timber=[.27,.16,.085] as const, oak=[.54,.34,.17] as const, plank=[.73,.54,.31] as const;
const stone=[.56,.57,.48] as const, brass=[.82,.60,.25] as const, glass=[.15,.37,.40] as const;
const walls = [[.88,.83,.68],[.67,.77,.70],[.77,.60,.42],[.61,.70,.73]] as const;
const roofs = [[.60,.23,.14],[.13,.37,.42],[.34,.40,.36],[.70,.38,.18]] as const;

function roofHeight(style: RoofStyle,x: number,z: number,w: number,d: number) {
  const across=1-Math.abs(x)/(w/2);
  return style==="gable" ? across*.72 : style==="hip" ? Math.min(across,(1-Math.abs(z)/(d/2))*1.4)*.73 : across*.5+(Math.abs(x)<w*.19?.26:0);
}

function roof(out: number[], width: number, depth: number, base: number, style: RoofStyle, tint: ModelVector) {
  const w=width+.28,d=depth+.31;
  addVoxelSolid(out,[-w/2,base,-d/2],[w/2,base+.86,d/2],.11,[tint,tint.map(v=>Math.min(1,v*1.17)) as [number,number,number],timber],(x,y,z)=>{
    const top=base+roofHeight(style,x,z,w,d)+.12;
    if(y>top||y<top-.15)return -1;
    return Math.abs(z)>d/2-.13?2:Math.floor((z+d/2)/.33)%3===0?1:0;
  });
  if(style!=="hip")addBox(out,[0,base+.80,0],[.15,.085,d+.08],tint);
  for(const side of [-1,1])addBox(out,[side*(width/2+.1),base+.015,0],[.1,.1,d],timber);
}

function window(out: number[],x: number,y: number,z: number,width: number) {
  addBox(out,[x,y,z],[width,.41,.035],timber);
  addBox(out,[x,y,z-.021],[width-.075,.34,.025],glass);
  addBox(out,[x,y,z-.039],[.035,.35,.025],plank);
  addBox(out,[x,y-.02,z-.042],[width-.065,.035,.025],plank);
  addBox(out,[x,y-.255,z-.055],[width+.13,.065,.15],stone);
  for(const sign of [-1,1])addBox(out,[x+sign*(width/2+.065),y,z-.023],[.09,.43,.055],[.16,.37,.33]);
}

export function buildBuilding(module: BuildingModule) {
  const out: number[]=[],w=module.width,d=module.depth,wallHeight=1.02+module.floors*.67,base=.50;
  addBox(out,[0,base+.06,0],[w+.18,.18,d+.18],stone);
  addBox(out,[0,base+wallHeight/2+.09,0],[w,wallHeight,d],walls[module.palette]);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])addBox(out,[x,base+wallHeight/2+.11,z],[.075,wallHeight,.075],timber);
  for(const y of [base+.2,base+.95,base+wallHeight-.05]) {
    addBox(out,[0,y,-d/2-.014],[w,.065,.04],timber);
    addBox(out,[0,y,d/2+.014],[w,.065,.04],timber);
  }
  addBox(out,[0,base+.48,d/2+.025],[.43,.86,.05],timber);
  for(let slat=-2;slat<=2;slat++)addBox(out,[slat*.073,base+.48,d/2+.061],[.065,.76,.025],oak);
  addBox(out,[.115,base+.44,d/2+.09],[.035,.055,.03],brass);
  addBox(out,[0,base+.06,d/2+.14],[.61,.1,.25],stone);
  for(const side of [-1,1]) {
    for(const floor of Array.from({length:module.floors},(_,i)=>i)) {
      const windows:number[]=[];
      window(windows,side*w*.28,base+.65+floor*.84,-d/2-.035,.35);
      appendModel(out,windows,[0,0,0]);appendModel(out,windows,[0,0,0],1,2);
    }
    const other: number[]=[];window(other,0,base+.74,-w/2-.04,.38);
    appendModel(out,other,[0,0,0],1,side>0?1:3);
    addBox(out,[side*(w/2+.07),base+wallHeight-.18,d*.12],[.16,.23,.21],oak);
  }
  if(module.kind==="warehouse") {
    for(let slat=0;slat<5;slat++)addBox(out,[-w/2-.018,base+.28+slat*.24,0],[.032,.19,d-.08],oak);
    addSteppedBeam(out,[-w/2,base+.32,d/2+.04],[w/2,base+wallHeight-.08,d/2+.04],.055,timber,.18);
  }
  const roofBase=base+wallHeight+.1;
  addVoxelSolid(out,[-w/2,roofBase,-d/2],[w/2,roofBase+.80,d/2],.11,[walls[module.palette],glass],(x,y,z)=>{
    if(y>roofBase+roofHeight(module.roof,x,z,w+.28,d+.31)-.08)return -1;
    return module.roof==="clerestory"&&y>roofBase+.43&&Math.abs(x)>w*.12?1:0;
  });
  roof(out,w,d,roofBase,module.roof,roofs[module.palette]);
  addBox(out,[w*.25,base+wallHeight+.56,-d*.2],[.21,.82,.25],stone);
  addBox(out,[w*.25,base+wallHeight+1.0,-d*.2],[.28,.075,.31],timber);
  return out;
}

function lantern(out: number[],x: number,y: number,z: number,scale=1) {
  addBox(out,[x,y,z],[.14*scale,.24*scale,.14*scale],[.95,.73,.35]);
  for(const sy of [-1,1])addBox(out,[x,y+sy*.14*scale,z],[.23*scale,.055*scale,.23*scale],timber);
  for(const sx of [-1,1])for(const sz of [-1,1])addBox(out,[x+sx*.08*scale,y,z+sz*.08*scale],[.025*scale,.27*scale,.025*scale],timber);
}

function barrel(out:number[],x:number,y:number,z:number) {
  addVoxelSolid(out,[x-.16,y,z-.16],[x+.16,y+.39,z+.16],.065,[oak,timber,plank],(px,py,pz)=>{
    const radius=.13+.025*Math.sin((py-y)/.39*Math.PI);
    return Math.hypot(px-x,pz-z)>radius?-1:py-y<.06||py-y>.30?1:2;
  });
}

export function buildHarbor(variant=0) {
  const out:number[]=[],plan=harborPlan(variant);
  for(const building of plan.buildings)appendModel(out,buildBuilding(building),[building.x,0,building.z]);
  for(const [start,end,z,width] of [[.9,7.05,.09,.94],[1.9,6.45,-1.48,.67]]) {
    addBox(out,[(start+end)/2,.245,z],[end-start,.15,width],timber);
    for(let x=start;x<end;x+=.20)addBox(out,[x+.095,.347,z],[.19,.065,width],Math.floor(x*5)%4?oak:plank);
    for(let x=start+.13;x<end;x+=1.03)for(const side of [-1,1]) {
      addBox(out,[x,-.07,z+side*(width/2-.08)],[.14,1.04,.14],timber);
      addBox(out,[x,.55,z+side*(width/2-.035)],[.12,.29,.12],oak);
      addBox(out,[x,.70,z+side*(width/2-.035)],[.18,.065,.18],brass);
      if(side>0)addSteppedBeam(out,[x-.25,.46,z+side*width/2],[x+.25,.46,z+side*width/2],.03,[.48,.44,.31],.18);
    }
  }
  const tx=-2.45,tz=1.91;
  addVoxelSolid(out,[tx-.65,.5,tz-.65],[tx+.65,3.5,tz+.65],.115,[walls[plan.roofPalette],stone,timber],(x,y,z)=>{
    const r=.60-(y-.5)*.09;
    if(Math.max(Math.abs(x-tx),Math.abs(z-tz))>r)return -1;
    return Math.floor((y-.5)/.43)%3===0?1:0;
  });
  addBox(out,[tx,3.54,tz],[1.22,.13,1.22],stone);
  for(const x of [-.48,.48])for(const z of [-.48,.48])addBox(out,[tx+x,3.85,tz+z],[.065,.62,.065],timber);
  if(plan.tower==="lantern")lantern(out,tx,3.89,tz,2.15);
  else {addBox(out,[tx,3.67,tz],[.79,.13,.79],oak);addBox(out,[tx,4.4,tz],[.045,1.12,.045],timber);addBox(out,[tx+.26,4.77,tz],[.52,.18,.025],roofs[plan.roofPalette]);}
  const top:number[]=[];roof(top,1.05,1.05,4.20,"hip",roofs[plan.roofPalette]);appendModel(out,top,[tx,0,tz]);
  window(out,tx,1.5,tz-.61,.27);
  for(let i=0;i<plan.stalls;i++) {
    const x=-1.25+i*1.02,z=-2.27;
    addBox(out,[x,.78,z],[.75,.43,.57],oak);addBox(out,[x,1.01,z],[.87,.065,.65],plank);
    for(const sx of [-.38,.38])for(const sz of [-.28,.28])addBox(out,[x+sx,1.15,z+sz],[.04,.99,.04],timber);
    for(let stripe=0;stripe<6;stripe++)addBox(out,[x-.40+stripe*.16,1.62,z],[.15,.065,.85],stripe%2?walls[plan.roofPalette]:roofs[(plan.roofPalette+i)%4]);
    for(let item=0;item<4;item++)addBox(out,[x-.24+item*.16,1.095,z],[.1,.085,.17],i%2?[.74,.4,.13]:[.30,.59,.59]);
  }
  addBox(out,[1,.96,1.61],[.15,1.86,.15],timber);addBox(out,[1,1.94,.74],[.13,.13,1.98],oak);
  addSteppedBeam(out,[1,1.06,1.61],[1,1.93,.31],.08,oak,.18);
  addBox(out,[1,1.92,-.12],[.18,.22,.10],brass);addBox(out,[1,.72,1.6],[.61,.13,.61],stone);
  const cargo=buildCargo();
  for(let i=0;i<3;i++) {
    const x=2.1+i*.54;appendModel(out,cargo,[x,.56,.10],.53);
    if(i!==1)barrel(out,x,.39,-1.46);
  }
  for(const x of [1.3,5.6]) {addBox(out,[x,1.04,.59],[.065,1.39,.065],timber);lantern(out,x,1.71,.59);}
  appendModel(out,PLANT_MODELS.palm[variant%2],[-3.38,.50,1.26],.86,variant%4);
  appendModel(out,PLANT_MODELS.palm[(variant+1)%2],[.35,.50,2.60],.75,(variant+1)%4);
  return out;
}
