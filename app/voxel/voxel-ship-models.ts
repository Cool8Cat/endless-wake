import { getShipHull, type ShipHullId, type EquipmentId } from "./voxel-loadout";
import { addBox, addVoxelSolid, addSteppedBeam, appendModel, type ModelVector } from "./voxel-model-kit";

const timber = [.29,.15,.075] as const, oak = [.53,.31,.14] as const, deck = [.76,.57,.32] as const;
const brass = [.79,.56,.22] as const, iron = [.15,.20,.20] as const, rope = [.53,.44,.28] as const;
const cream = [.95,.89,.73] as const, glass = [.19,.43,.45] as const;

function masts(id: ShipHullId) {
  return id === "windcutter" ? [.28] : id === "brigantine" ? [-1.05,1.2] : [-2.15,.05,2.05];
}

export function hullHalfBeam(id: ShipHullId, z: number) {
  const hull = getShipHull(id), length = hull.halfRows * .355 + .25;
  const t = Math.abs(z / length);
  return Math.max(.075, 1.14 * hull.beam * Math.sqrt(Math.max(0, 1 - t * t)) * (z < 0 ? 1 - t * .2 : 1));
}

export function buildBoatHull(id: ShipHullId) {
  const out: number[] = [], hull = getShipHull(id), length = hull.halfRows * .355 + .25;
  const palette = [timber,oak,deck,brass,iron,[.41,.23,.105],[.64,.41,.2],cream,glass] as const;
  const cell = .105, beam = 1.2 * hull.beam;
  addVoxelSolid(out,[-beam,-.53,-length],[beam,.73,length],cell,palette,(x,y,z) => {
    const width = hullHalfBeam(id,z);
    const bottom = -.50 + Math.pow(Math.abs(z/length),2) * .29;
    const side = width * (.67 + Math.min(1,(y-bottom)/.5)*.33);
    if (Math.abs(x) > side || y < bottom) return -1;
    const sheer = .55 + Math.pow(Math.abs(z/length),3)*.13;
    if (y > sheer) return -1;
    if (y > .40 && Math.abs(x) < width - .16) return y < .52 ? (Math.floor((x+beam)/.21)%4===0 ? 6 : 2) : -1;
    if (y > .32) return 3;
    if (y < -.19) return 0;
    return Math.floor((y+.2)/.15)%2===0 ? 1 : 5;
  });
  // Fine caprails trace the hull, while open spaces keep the purchased hardpoints legible.
  for (let z = -length+.25; z < length-.18; z += .25) for (const sign of [-1,1]) {
    const x = sign * (hullHalfBeam(id,z)-.04), y = .65 + Math.abs(z/length)**3*.1;
    addBox(out,[x,y,z],[.10,.10,.27],brass);
    if (Math.round((z+length)/.25)%3===0) addBox(out,[x,y-.13,z],[.06,.25,.07],timber);
    if (hull.masts > 1 && Math.abs(z) < length*.74 && Math.round((z+length)/.25)%4===0) {
      addBox(out,[x,.17,z],[.045,.16,.20],iron);
      addBox(out,[x+sign*.022,.31,z],[.06,.06,.24],brass);
    }
  }
  const stern = length - .45, cabinWidth = .9 * hull.beam;
  addBox(out,[0,.79,stern-.05],[cabinWidth,.45,.65],timber);
  addBox(out,[0,1.04,stern-.06],[cabinWidth+.16,.1,.82],deck);
  for (let i = -1; i <= 1; i++) {
    addBox(out,[i*cabinWidth*.25,.82,stern+.284],[cabinWidth*.18,.21,.025],glass);
    addBox(out,[i*cabinWidth*.25,.93,stern+.304],[cabinWidth*.22,.035,.045],brass);
  }
  for (let step = 0; step < 3; step++) addBox(out,[0,.58+step*.12,stern-.58+step*.09],[.34,.1,.14],deck);
  addBox(out,[0,.61,.88],[.52,.16,.48],timber);
  for (let i = -2; i <= 2; i++) addBox(out,[i*.085,.705,.88],[.045,.025,.4],deck);
  addBox(out,[0,.7,length-1.08],[.055,.32,.06],timber);
  for (let i = 0; i < 8; i++) {
    const a = i*Math.PI/4;
    addBox(out,[Math.cos(a)*.15,.92+Math.sin(a)*.15,length-1.08],[.075,.075,.055],brass);
  }
  const bowsprit: ModelVector = [0,.94,-length-1.1];
  addSteppedBeam(out,[0,.56,-length+.4],bowsprit,.075,oak,.16);
  addSteppedBeam(out,[0,-.25,-length+.1],[0,.92,-length-1.1],.025,rope,.17);
  addBox(out,[0,-.28,length+.04],[.09,.58,.32],timber);
  for (const sign of [-1,1]) {
    const x = sign * .62 * hull.beam, z = -length*.64;
    addBox(out,[x,.76,z],[.035,.38,.05],iron);
    addBox(out,[x,.59,z],[.27,.055,.07],iron);
    addBox(out,[x+sign*.12,.64,z],[.055,.14,.075],iron);
  }
  for (const [mast,mastZ] of masts(id).entries()) {
    const top = 4.48 + hull.masts*.17 - (mast===2?.34:0);
    addBox(out,[0,(top+.5)/2,mastZ],[.11,top-.5,.11],timber);
    addBox(out,[0,3.33,mastZ],[.35,.13,.33],oak);
    for (const y of [1.6,3.1,4.02]) {
      const span = (y>3.5?1.55:2.55)*Math.min(1.15,hull.beam);
      addBox(out,[0,y,mastZ],[span,.075,.075],oak);
      addBox(out,[0,y+.02,mastZ],[.16,.11,.13],brass);
    }
    for (const sign of [-1,1]) {
      addSteppedBeam(out,[sign*.96*hull.beam,.62,mastZ+.48],[0,top-.18,mastZ],.024,rope,.22);
      addSteppedBeam(out,[sign*.9*hull.beam,.62,mastZ-.42],[0,3.26,mastZ],.022,rope,.24);
    }
    if (mast===0) addSteppedBeam(out,bowsprit,[0,top-.1,mastZ],.023,rope,.22);
    addBox(out,[.24,top-.1,mastZ],[.48,.14,.045],id==="grand_voyager"?[.69,.20,.12]:[.08,.42,.42]);
    addBox(out,[.39,top-.2,mastZ],[.18,.09,.045],brass);
  }
  return out;
}

export function buildBoatSails(id: ShipHullId, red = false) {
  const out: number[] = [], hull = getShipHull(id);
  const palette = red ? [[.49,.105,.065],[.68,.18,.11],[.35,.07,.045]] as const : [cream,[.83,.75,.57],[.68,.59,.4]] as const;
  for (const [mast,z] of masts(id).entries()) {
    for (const [base,height,width] of [[1.66,1.36,2.4],[3.38,.64,1.49]]) {
      const half = width/2*Math.min(1.15,hull.beam), h = height*(mast===2?.86:1);
      addVoxelSolid(out,[-half,base,z-.42],[half,base+h,z+.02],.085,palette,(x,y,pz) => {
        const t = (y-base)/h, edge = half*(.88+.12*Math.sin(t*Math.PI));
        if (Math.abs(x)>edge || t<.055*Math.cos(x/half*Math.PI*.5)) return -1;
        const belly = -.08-.23*Math.sin(t*Math.PI)*Math.cos(x/half*Math.PI*.5);
        if (Math.abs(pz-z-belly)>.05) return -1;
        return Math.abs(x)>edge-.1 || t>.94 || t<.08 ? 1 : Math.abs(x)<.032 ? 2 : 0;
      });
    }
  }
  return out;
}

function wheel(out: number[], x: number, y: number, z: number, radius: number, alongX = true) {
  const center: ModelVector = [x,y,z];
  const ext: ModelVector = alongX ? [.065,radius,radius] : [radius,radius,.065];
  addVoxelSolid(out,center.map((p,a)=>p-ext[a]) as [number,number,number],center.map((p,a)=>p+ext[a]) as [number,number,number],.045,[iron,brass],(px,py,pz)=>{
    const r = Math.hypot(py-y,alongX?pz-z:px-x);
    return r>radius?-1:r<radius*.30?1:0;
  });
}

export function buildEquipment(id: EquipmentId) {
  const out: number[] = [];
  if (id==="swivel_8" || id==="long_18") {
    const heavy = id==="long_18", length = heavy?1.46:1.01, radius = heavy?.155:.12;
    addBox(out,[0,.07,.01],[.48,.14,.61],timber);
    for (const sign of [-1,1]) {
      addBox(out,[sign*.18,.17,.01],[.085,.22,.56],oak);
      for (const z of [-.19,.22]) wheel(out,sign*.27,.09,z,.115);
    }
    addBox(out,[0,.28,-.05],[.57,.055,.055],brass);
    addVoxelSolid(out,[-radius,.31-radius,-length+.22],[radius,.31+radius,.32],.04,[iron,brass,[.055,.075,.075]],(x,y,z)=>{
      const r = Math.hypot(x,y-.31), taper = radius*(.82+.18*(z+length)/length);
      if (r>taper) return -1;
      if (z < -length+.34 && r<radius*.54) return -1;
      return z < -length+.38 ? 2 : z < -length+.44 || Math.abs(z+.13)<.045 || z>.21 ? 1 : 0;
    });
    addBox(out,[0,.36,.40],[.10,.10,.12],brass);
    addSteppedBeam(out,[-.23,.17,.22],[-.27,.06,.47],.028,rope);
    addSteppedBeam(out,[.23,.17,.22],[.27,.06,.47],.028,rope);
  } else if (id==="wave_ballista") {
    addBox(out,[0,.07,.04],[.65,.14,.61],timber);
    addBox(out,[0,.27,-.25],[.16,.11,1.23],oak);
    for (const sign of [-1,1]) {
      addSteppedBeam(out,[0,.28,-.52],[sign*.47,.29,-.59],.08,oak);
      addSteppedBeam(out,[sign*.47,.29,-.59],[sign*.80,.31,-.39],.065,oak);
      addSteppedBeam(out,[sign*.80,.31,-.39],[0,.31,.23],.018,rope,.14);
      wheel(out,sign*.2,.26,.16,.17);
    }
    addBox(out,[0,.34,-.55],[.035,.035,1.15],brass);
    addVoxelSolid(out,[-.1,.27,-1.20],[.1,.41,-1.03],.035,[iron],(x,y,z)=>Math.abs(x)+Math.abs(y-.34)<(z+1.23)*.7?0:-1);
  } else {
    addBox(out,[0,.08,.04],[.74,.16,.65],timber);
    for (const sign of [-1,1]) {
      const x = sign*.23;
      addBox(out,[x,.25,.04],[.07,.36,.36],brass);
      for (const dx of [-.10,.10]) wheel(out,x+dx,.29,.02,.19);
      addBox(out,[x,.29,.02],[.16,.27,.27],rope);
      for (let i=0;i<5;i++) addBox(out,[x-.08+i*.04,.436,.02],[.016,.025,.20],deck);
      addBox(out,[sign*.34,.16,-.42],[.25,.12,.29],oak);
      for (let i=0;i<3;i++) addBox(out,[sign*.34+(i-1)*.065,.25,-.42],[.05,.13,.17],[.17,.64,.58]);
    }
    addSteppedBeam(out,[-.33,.4,-.04],[-.39,.55,-.48],.04,iron);
    addSteppedBeam(out,[.33,.4,-.04],[.39,.55,-.48],.04,iron);
    addBox(out,[0,.55,-.48],[.86,.04,.04],brass);
  }
  return out;
}

export function buildWeaponProjectile(id: EquipmentId) {
  const out: number[] = [];
  if(id==="wave_ballista") {
    addBox(out,[0,0,-.28],[.035,.035,.7],oak);
    addBox(out,[0,0,-.68],[.11,.07,.14],iron);
    addBox(out,[0,0,.04],[.19,.025,.13],cream);
  } else {
    const r = id==="long_18"?.12:.085;
    addVoxelSolid(out,[-r,-r,-r],[r,r,r],.04,[iron],(x,y,z)=>x*x+y*y+z*z<r*r?0:-1);
  }
  return out;
}

export function buildCorsairTarget() {
  const out: number[] = [], hull = buildBoatHull("windcutter");
  for(let i=0;i<hull.length;i+=9) { hull[i+6]*=.58; hull[i+7]*=.39; hull[i+8]*=.35; }
  appendModel(out,hull,[0,0,0],.63);
  appendModel(out,buildBoatSails("windcutter",true),[0,0,0],.63);
  return out;
}
