import { addBox, addVoxelSolid, addSteppedBeam, type ModelVector } from "./voxel-model-kit";
export type PlantKind = "palm" | "mangrove" | "coral" | "kelp";

function plant(kind: PlantKind, variation: number) {
  const out: number[] = [], wood: ModelVector = [.43,.28,.14];
  if(kind==="palm") {
    const lean = variation?.22:-.13;
    for(let i=0;i<9;i++)addBox(out,[lean*(i/9)**2,.10+i*.19,0],[.14-i*.004,.19,.14-i*.004],i%3?[.48,.33,.17]:[.33,.21,.115]);
    for(let ray=0;ray<7;ray++) {
      const a=ray*Math.PI*2/7+variation*.45;
      for(let segment=0;segment<4;segment++) {
        const r=.13+segment*.22;
        addBox(out,[lean+Math.cos(a)*r,1.93-Math.pow(segment/3,2)*.31,Math.sin(a)*r],
          [Math.abs(Math.cos(a))*.27+.10,.065,Math.abs(Math.sin(a))*.27+.10],segment<2?[.19,.49,.26]:[.31,.56,.26]);
      }
    }
    for(const sign of [-1,1]) addBox(out,[lean+sign*.09,1.66,.055],[.13,.16,.13],wood);
  } else if(kind==="mangrove") {
    addSteppedBeam(out,[0,.1,0],[.07,1.3,.03],.14,wood,.22);
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5+.3;
      const x=Math.cos(a)*.42,z=Math.sin(a)*.42;
      addSteppedBeam(out,[0,.66,0],[x,.16,z],.065,wood,.17);
      addSteppedBeam(out,[x,.16,z],[x*1.15,-.08,z*1.15],.04,wood,.17);
      addSteppedBeam(out,[0,.84,0],[x,1.30,z],.075,wood,.18);
    }
    addVoxelSolid(out,[-.89,1.11,-.82],[.89,2.03,.82],.145,
      [[.10,.34,.22],[.18,.47,.26],[.29,.54,.27]],(x,y,z)=>{
        const inside=[[-.42,1.44,.15],[.35,1.53,-.18],[.02,1.73,.14]].some(([cx,cy,cz])=>((x-cx)/.52)**2+((y-cy)/.31)**2+((z-cz)/.53)**2<1);
        return inside?y>1.7?2:y<1.4?0:1:-1;
      });
  } else if(kind==="coral") {
    const coral: ModelVector = variation?[.63,.39,.66]:[.78,.32,.26];
    addBox(out,[0,.06,0],[.31,.12,.26],[.53,.41,.30]);
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5+.4, x=Math.cos(a)*.22,z=Math.sin(a)*.22;
      addSteppedBeam(out,[0,.12,0],[x,.26,z],.07,coral,.13);
      addSteppedBeam(out,[x,.26,z],[x*1.12,.43+(i%2)*.12,z*1.12],.055,coral,.13);
      addBox(out,[x*1.12,.46+(i%2)*.12,z*1.12],[.07,.05,.07],variation?[.84,.58,.73]:[.97,.58,.39]);
    }
  } else {
    for(let stem=0;stem<3;stem++) {
      const x=(stem-1)*.13, height=.82+stem*.13;
      addSteppedBeam(out,[x,0,0],[x+.11,height,.08],.04,[.16,.36,.24],.14);
      for(let leaf=1;leaf<5;leaf++) {
        const sign=leaf%2?1:-1;
        addSteppedBeam(out,[x+.06,height*leaf/5,.04],[x+sign*(.16+stem*.035),height*leaf/5+.14,.11],.065,[.30,.52,.29],.09);
      }
    }
  }
  return new Float32Array(out);
}

// Plant meshes are created once, then rotated and scaled for each habitat.
export const PLANT_MODELS: Record<PlantKind, readonly Float32Array[]> = {
  palm:[plant("palm",0),plant("palm",1)], mangrove:[plant("mangrove",0)],
  coral:[plant("coral",0),plant("coral",1)], kelp:[plant("kelp",0)],
};
