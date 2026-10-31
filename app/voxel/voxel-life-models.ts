import { addBox, addVoxelSolid, addSteppedBeam, type ModelVector } from "./voxel-model-kit";

const wood = [.43,.25,.12] as const, lightWood = [.72,.51,.28] as const, darkWood = [.22,.12,.065] as const;
const brass = [.83,.59,.25] as const, iron = [.16,.22,.23] as const, ivory = [.93,.87,.7] as const;

export function buildSeaLife(kind: "fish" | "turtle" | "ray" | "octopus") {
  const out: number[] = [];
  if (kind === "fish") {
    for (let i=0;i<7;i++) {
      const cx=(i%3)*.54-.54, cz=Math.floor(i/3)*.5-.5;
      addVoxelSolid(out,[cx-.25,-.1,cz-.1],[cx+.25,.1,cz+.1],.035,
        [[.23,.57,.63],[.56,.84,.81],[.14,.33,.43]],(x,y,z)=>{
          const t=(x-cx)/.25;
          if (t*t+(y/.09)**2+((z-cz)/.09)**2>1) return -1;
          return y>.025?0:y<-.025?1:2;
        });
      for(const side of [-1,1]) {
        addBox(out,[cx+.15,.025,cz+side*.072],[.045,.045,.025],[.055,.1,.12]);
        addSteppedBeam(out,[cx-.19,0,cz],[cx-.34,0,cz+side*.12],.035,[.24,.56,.58],.06);
      }
      addBox(out,[cx-.015,.102,cz],[.13,.055,.025],[.16,.41,.49]);
    }
  } else if (kind === "turtle") {
    addVoxelSolid(out,[-.48,-.12,-.57],[.48,.31,.57],.065,
      [[.21,.43,.27],[.36,.53,.29],[.12,.29,.21],[.57,.62,.36]],(x,y,z)=>{
        if((x/.47)**2+((y+.025)/.33)**2+(z/.56)**2>1)return -1;
        if(y<-.01)return 3;
        return Math.abs((x+.9)% .23)<.04 || Math.abs((z+.9)% .26)<.045 ? 2 : y>.16?1:0;
      });
    addVoxelSolid(out,[-.17,-.02,-.86],[.17,.2,-.48],.055,[[.40,.58,.34],[.26,.44,.28]],(x,y,z)=>
      (x/.16)**2+((y-.085)/.12)**2+((z+.68)/.2)**2<1?(y>.12?0:1):-1);
    for(const side of [-1,1]) {
      addBox(out,[side*.137,.13,-.735],[.025,.04,.045],[.065,.12,.10]);
      for(const front of [-1,1]) addVoxelSolid(out,[side<0?-.93:.32,-.11,front<0?-.38:.25],[side<0?-.32:.93,.01,front<0?-.03:.51],.065,
        [[.28,.48,.31],[.46,.6,.35]],(x,_y,z)=>Math.abs(x)<.88-Math.abs(z-(front<0?-.2:.38))?Math.abs(x)>.7?1:0:-1);
    }
    addSteppedBeam(out,[0,-.055,.5],[0,-.08,.73],.065,[.30,.46,.27],.08);
  } else if(kind === "ray") {
    addVoxelSolid(out,[-1,-.12,-.62],[1,.14,.61],.065,
      [[.20,.42,.50],[.33,.57,.61],[.62,.70,.62]],(x,y,z)=>{
        const wing = 1 - Math.abs(z+.08)/.77;
        const thickness=.035+.08*(1-Math.abs(x));
        if(Math.abs(x)>wing||Math.abs(y)>thickness)return -1;
        return y<-.02?2:Math.abs(x)>.55?1:0;
      });
    for(const side of [-1,1]) addBox(out,[side*.15,.145,-.30],[.045,.035,.06],[.045,.13,.17]);
    addSteppedBeam(out,[0,-.015,.39],[.06,-.04,1.03],.045,[.16,.35,.43],.10);
    addSteppedBeam(out,[.06,-.04,1.03],[.2,-.015,1.42],.025,[.16,.35,.43],.10);
  } else {
    addVoxelSolid(out,[-.35,-.13,-.35],[.35,.56,.35],.065,
      [[.59,.24,.36],[.74,.35,.42],[.41,.15,.28]],(x,y,z)=>{
        const radius=.32*(.85+.15*Math.sin(y*6));
        if((x/radius)**2+((y-.21)/.34)**2+(z/radius)**2>1)return -1;
        return y>.35?1:2;
      });
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      const p: ModelVector=[Math.cos(a)*.22,-.09,Math.sin(a)*.22];
      const q: ModelVector=[Math.cos(a+.14)*.57,-.18,Math.sin(a+.14)*.57];
      const r: ModelVector=[Math.cos(a+.32)*.79,-.12,Math.sin(a+.32)*.79];
      addSteppedBeam(out,p,q,.10,[.59,.24,.36],.12);
      addSteppedBeam(out,q,r,.065,[.70,.33,.41],.1);
      addBox(out,[q[0],q[1]-.055,q[2]],[.05,.025,.05],[.89,.61,.55]);
    }
    for(const side of [-1,1]) {
      addBox(out,[side*.24,.09,-.23],[.09,.09,.055],ivory);
      addBox(out,[side*.25,.09,-.266],[.04,.06,.015],[.075,.085,.10]);
    }
  }
  return out;
}

export function buildHarborWorker() {
  const out: number[] = [];
  for(const side of [-1,1]) {
    addBox(out,[side*.085,.15,0],[.115,.29,.14],[.14,.26,.30]);
    addBox(out,[side*.085,.035,-.05],[.13,.09,.22],darkWood);
    addBox(out,[side*.19,.51,0],[.11,.32,.14],[.77,.65,.45]);
    addBox(out,[side*.2,.35,-.02],[.1,.1,.11],[.75,.54,.36]);
  }
  addBox(out,[0,.52,0],[.30,.33,.23],[.65,.21,.115]);
  addBox(out,[0,.59,-.125],[.07,.24,.035],ivory);
  addBox(out,[0,.79,0],[.21,.23,.20],[.77,.58,.4]);
  addBox(out,[0,.925,0],[.34,.055,.31],lightWood);
  addBox(out,[0,.985,0],[.22,.075,.21],ivory);
  addBox(out,[0,.78,-.12],[.045,.05,.05],[.79,.59,.39]);
  for(const side of [-1,1]) addBox(out,[side*.055,.825,-.105],[.025,.025,.018],[.10,.14,.15]);
  return out;
}

export function buildHarborCat() {
  const out: number[]=[];
  addVoxelSolid(out,[-.25,.08,-.13],[.28,.34,.13],.055,[[.76,.43,.20],[.92,.69,.38]],(x,y,z)=>
    ((x-.02)/.26)**2+((y-.20)/.14)**2+(z/.13)**2<1?(y>.23?0:1):-1);
  addBox(out,[-.29,.31,0],[.19,.20,.19],[.88,.59,.30]);
  for(const side of [-1,1]) {
    addBox(out,[-.30,.44,side*.055],[.09,.1,.055],[.64,.33,.17]);
    addBox(out,[-.39,.33,side*.05],[.018,.035,.028],[.13,.26,.16]);
    for(const x of [-.15,.19]) addBox(out,[x,.065,side*.085],[.06,.13,.06],[.81,.54,.28]);
  }
  addSteppedBeam(out,[.24,.26,0],[.46,.44,0],.055,[.71,.36,.16],.065);
  addBox(out,[-.4,.275,0],[.04,.035,.045],[.55,.27,.22]);
  return out;
}

export function buildCraneHook() {
  const out: number[]=[];
  addBox(out,[0,-.23,0],[.032,.54,.032],darkWood);
  addBox(out,[0,-.52,0],[.15,.16,.10],brass);
  addBox(out,[.04,-.665,0],[.05,.16,.045],iron);
  addBox(out,[-.015,-.74,0],[.15,.045,.055],iron);
  addBox(out,[-.08,-.70,0],[.04,.09,.05],iron);
  return out;
}

export function buildCargo() {
  const out: number[]=[];
  addBox(out,[0,0,0],[.57,.57,.57],wood);
  for(let i=0;i<5;i++) {
    const x=(i-2)*.116;
    addBox(out,[x,.292,0],[.108,.025,.57],i%2?lightWood:wood);
    for(const side of [-1,1]) addBox(out,[x,0,side*.289],[.105,.55,.02],i%2?wood:lightWood);
  }
  for(const side of [-1,1]) {
    addBox(out,[side*.25,0,0],[.08,.63,.63],darkWood);
    addBox(out,[0,side*.25,0],[.64,.07,.63],lightWood);
  }
  addSteppedBeam(out,[-.23,-.21,.31],[.23,.21,.31],.045,darkWood,.09);
  return out;
}

export function buildBeacon() {
  const out: number[]=[];
  addVoxelSolid(out,[-.30,0,-.30],[.30,.54,.30],.065,[[.78,.23,.095],ivory,iron],(x,y,z)=>{
    const r=.29-y*.22;
    return Math.hypot(x,z)<r?(y<.1?2:y>.35?1:0):-1;
  });
  addBox(out,[0,.81,0],[.055,.59,.055],iron);
  addBox(out,[0,.68,0],[.31,.055,.31],brass);
  addBox(out,[0,.89,0],[.18,.28,.18],[.94,.72,.31]);
  for(const x of [-.115,.115])for(const z of [-.115,.115])addBox(out,[x,.89,z],[.025,.32,.025],iron);
  addBox(out,[0,1.07,0],[.31,.05,.31],iron);
  addBox(out,[0,1.13,0],[.17,.065,.17],brass);
  return out;
}

export function buildWreck() {
  const out: number[]=[];
  addVoxelSolid(out,[-.92,-.31,-1.62],[.92,.33,1.62],.12,[wood,darkWood,lightWood],(x,y,z)=>{
    const width=.86*Math.sqrt(Math.max(0,1-(z/1.65)**2));
    if(Math.abs(x)>width||Math.abs(x)<width-.15&&y>-.18)return -1;
    if(z>.95+x*.4 || z<-.85&&x>.15 || Math.sin(z*6+x*4)>.75&&y>.02)return -1;
    return y>.13?2:Math.floor((y+.31)/.12)%2;
  });
  for(let z=-1.2;z<=1.2;z+=.4)for(const sign of [-1,1])addSteppedBeam(out,[0,-.19,z],[sign*.72,.29,z],.075,darkWood,.13);
  for(let x=-.5;x<=.5;x+=.2)addBox(out,[x,-.08,-.45],[.15,.07,1.35+(x+.5)*.35],lightWood);
  addSteppedBeam(out,[.13,-.04,-.3],[.57,2.07,-.16],.1,darkWood,.18);
  addBox(out,[.55,1.65,-.15],[1.19,.07,.07],wood);
  for(let i=0;i<6;i++)addBox(out,[.31+i*.105,1.49-i*.05,-.17],[.1,.35+(i%3)*.1,.035],[.50,.37,.23]);
  addSteppedBeam(out,[-.7,.16,.5],[.48,1.9,-.16],.023,darkWood,.2);
  return out;
}

export function buildCloud() {
  const out: number[]=[];
  addVoxelSolid(out,[-1.72,-.22,-.62],[1.72,.72,.62],.18,[[.77,.86,.82],[.90,.92,.83],[.97,.94,.80]],(x,y,z)=>{
    const occupied = (x/1.65)**2+((y-.03)/.35)**2+(z/.58)**2<1
      || ((x+.65)/.66)**2+((y-.27)/.44)**2+(z/.48)**2<1
      || ((x-.61)/.83)**2+((y-.3)/.4)**2+((z+.09)/.49)**2<1;
    return occupied?y>.4?2:y<.05?0:1:-1;
  });
  return out;
}
