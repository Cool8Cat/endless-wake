import assert from 'node:assert/strict';
import test from 'node:test';
import { loadVoxelModule } from './voxel-test-modules.mjs';

const kit = await loadVoxelModule('voxel-model-kit');
const ships = await loadVoxelModule('voxel-ship-models');
const life = await loadVoxelModule('voxel-life-models');
const { PLANT_MODELS } = await loadVoxelModule('voxel-plants');
const { buildHarbor } = await loadVoxelModule('voxel-harbor-models');
const { harborPlan, HARBOR_VARIANTS } = await loadVoxelModule('voxel-architecture');
const { SHIP_HULLS, EQUIPMENT_CATALOG, hardpointsForHull } = await loadVoxelModule('voxel-loadout');

function checkMesh(mesh, name) {
  assert.ok(mesh.length > 0 && mesh.length % 27 === 0, name);
  for (const value of mesh) assert.ok(Number.isFinite(value), name);
  for (let i = 0; i < mesh.length; i += 27) {
    const ab = [0,1,2].map(a => mesh[i+9+a]-mesh[i+a]);
    const ac = [0,1,2].map(a => mesh[i+18+a]-mesh[i+a]);
    const cross = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    assert.ok(cross.reduce((sum,v,a) => sum+v*mesh[i+3+a],0) > 0, `${name}: outward nondegenerate triangle ${i/27}`);
    for (let v = 0; v < 3; v++) for (let channel = 6; channel < 9; channel++) assert.ok(mesh[i+v*9+channel] >= 0 && mesh[i+v*9+channel] <= 1, `${name}: color range`);
  }
}

test('fine solid meshing removes internal faces and merges exact coplanar surfaces', () => {
  const cube = [];
  kit.addVoxelSolid(cube,[0,0,0],[1,1,1],.05,[[1,.5,.2]],()=>0);
  checkMesh(cube,'20 cubed solid'); assert.equal(cube.length/27,12);
  const split = [];
  kit.addVoxelSolid(split,[0,0,0],[1,1,1],.05,[[1,0,0],[0,0,1]],x=>x<.5?0:1);
  checkMesh(split,'two materials'); assert.equal(split.length/27,20);
  // A color boundary never creates an internal wall at x=.5.
  for(let i=0;i<split.length;i+=9) if(split[i+3]!==0) assert.ok(split[i]===0||split[i]===1);
  const hollow=[];
  kit.addVoxelSolid(hollow,[0,0,0],[1,1,1],.1,[[.4,.4,.4]],(x,y,z)=>Math.min(x,y,z)>.15&&Math.max(x,y,z)<.85?-1:0);
  checkMesh(hollow,'hollow shell'); assert.equal(hollow.length/27,24);
  for(const cell of [0,-1,NaN,Infinity,.0001]) assert.throws(()=>kit.addVoxelSolid([],[0,0,0],[1,1,1],cell,[[1,1,1]],()=>0));
  assert.throws(()=>kit.addVoxelSolid([],[NaN,0,0],[1,1,1],.1,[[1,1,1]],()=>0));
  assert.throws(()=>kit.addVoxelSolid([],[0,0,0],[1,1,1],.1,[[1,1,1]],()=>2));
});

test('all detailed assets have finite outward geometry and bounded triangle counts', () => {
  const assets = {};
  for (const hull of SHIP_HULLS) {
    assets[hull.id] = ships.buildBoatHull(hull.id);
    assets[`${hull.id}-sails`] = ships.buildBoatSails(hull.id);
    for (const point of hardpointsForHull(hull.id)) assert.ok(Math.abs(point.x) < ships.hullHalfBeam(hull.id,point.z), `${hull.id}: hardpoint on deck`);
  }
  for (const equipment of EQUIPMENT_CATALOG) assets[equipment.id] = ships.buildEquipment(equipment.id);
  for (const kind of ['fish','turtle','ray','octopus']) assets[kind] = life.buildSeaLife(kind);
  for (const name of ['buildHarborWorker','buildHarborCat','buildCraneHook','buildCargo','buildBeacon','buildWreck','buildCloud']) assets[name] = life[name]();
  for (const [kind, variants] of Object.entries(PLANT_MODELS)) variants.forEach((mesh,i)=>{assets[`${kind}${i}`]=mesh;});
  assets.corsair = ships.buildCorsairTarget();
  for(const [name,mesh] of Object.entries(assets)) { checkMesh(mesh,name); assert.ok(mesh.length/27 < 12000, `${name}: shared asset budget`); }
});

test('harbor layouts maintain unobstructed paths', () => {
  const plans = Array.from({length:HARBOR_VARIANTS},(_,i)=>harborPlan(i));
  assert.equal(new Set(plans.map(plan=>JSON.stringify({...plan,variant:0}))).size,HARBOR_VARIANTS);
  assert.equal(new Set(plans.map(plan=>plan.buildings[0].roof)).size,3);
  for(const plan of plans) {
    for(const building of plan.buildings) {
      assert.ok(building.x-building.width/2-.15>=-3.5 && building.x+building.width/2+.15<=1.05,'foundation x');
      assert.ok(building.z-building.depth/2-.15>=-2 && building.z+building.depth/2+.15<=1.18,'foundation z');
      if(building.x+building.width/2>=-.9) assert.ok(building.z-building.depth/2-.15 > -1.2,'worker promenade');
    }
    const [a,b]=plan.buildings;
    assert.ok(Math.abs(a.x-b.x)>(a.width+b.width)/2+.3,'roof footprints separated');
    const mesh = buildHarbor(plan.variant);
    checkMesh(mesh,`harbor ${plan.variant}`); assert.ok(mesh.length/27<12000,'single shared port mesh budget');
  }
  assert.throws(()=>harborPlan(12)); assert.throws(()=>harborPlan(-1));
});
