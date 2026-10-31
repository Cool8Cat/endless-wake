import assert from "node:assert/strict";
import test from "node:test";
import { loadVoxelModule } from "./voxel-test-modules.mjs";
const { VoxelWorld, REGION_SIZE, REGION_RADIUS, WORLD_HALF, WORLD_SIZE, WORLD_REGION_COUNT, volcanoState } = await loadVoxelModule("voxel-world");
import { VoxelStream, STREAM_LIMIT, STREAM_CHUNK_SIZE, chunkKey } from "../app/voxel/voxel-stream.ts";
import { buildTerrainHeightfield, unpackTerrainQuad, TERRAIN_CELL_SIZE, TERRAIN_HEIGHT_UNIT } from "../app/voxel/voxel-terrain-mesh.ts";

test("seeded layout survives cache eviction and generation order, including negative coordinates", () => {
  const world = new VoxelWorld(9123), other = new VoxelWorld(9123), different = new VoxelWorld(9124);
  const first = structuredClone(world.region(-6, 3));
  for (let x = -20; x <= 20; x += 1) world.region(x, -12);
  assert.ok(world.cachedRegionCount <= 32);
  assert.deepEqual(world.region(-6, 3), first);
  other.region(20, -20);
  assert.deepEqual(other.region(-6, 3), first);
  assert.notDeepEqual(different.region(-6, 3).islands, first.islands);
  assert.equal(WORLD_SIZE, 10140);
  assert.throws(() => new VoxelWorld(Number.NaN));
});

test("seeded islands compose landforms and all twelve harbor assemblies are reachable", () => {
  const world = new VoxelWorld(73129), assemblies = new Set(), modules = new Set();
  for(let x=-12;x<12;x++) for(let z=-8;z<8;z++) {
    const region=world.region(x,z); assemblies.add(region.harbor.architecture);
    for(const island of region.islands) for(const part of island.modules||[]) {
      modules.add(part.kind);
      assert.ok(Math.abs(part.x)<island.radius && Math.abs(part.z)<island.radius);
      assert.ok(part.width>0 && part.depth>0 && part.rise>0);
    }
  }
  assert.equal(assemblies.size,12);
  assert.deepEqual([...modules].sort(),['cove','peak','ridge','shelf']);
});

test("generated harbors have solid buildings, deep large-ship approaches and connected open lanes", () => {
  for (const seed of [0, 1, 73129, 4294967295]) {
    const world = new VoxelWorld(seed);
    for (let index = 0; index < 32; index += 1) {
      const rx = index - 16, rz = (index * 11 % 63) - 31;
      const region = world.region(rx, rz), harbor = region.harbor;
      assert.ok(region.difficulty >= 1 && region.difficulty <= 5);
      for (let dz = -2; dz <= 2; dz += 1) for (let dx = -3; dx <= 1; dx += 1) {
        assert.ok(world.height(harbor.x + dx, harbor.z + dz) >= 0, `harbor foundations ${seed}:${rx},${rz}`);
      }
      for (let dx = 4; dx <= 34; dx += 2) for (let dz = -2; dz <= 2; dz += 2) {
        assert.ok(world.height(harbor.x + dx, harbor.dockZ + dz) <= -2, `dock corridor ${seed}:${rx},${rz}:${dx},${dz}`);
      }
      for (let along = -78; along <= 78; along += 3) for (const offset of [-3, 0, 3]) {
        assert.ok(world.height(rx * REGION_SIZE + offset, rz * REGION_SIZE + along) <= -2, "north/south lane");
        assert.ok(world.height(rx * REGION_SIZE + along, rz * REGION_SIZE + offset) <= -2, "east/west lane");
      }
    }
  }
});

test("habitats, loot and patrol motion envelopes are navigable and ports have safe separation", () => {
  const world = new VoxelWorld(73129);
  for (let i = 0; i < 60; i += 1) {
    const region = world.region((i * 13 % 63) - 31, (i * 7 % 63) - 31);
    for (const spawn of [...region.salvage, ...region.life, ...region.patrols]) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const x = spawn.x + Math.cos(angle) * spawn.radius, z = spawn.z + Math.sin(angle) * spawn.radius;
        assert.ok(world.height(x, z, 420) <= -1.8, `safe orbit ${region.id}/${spawn.slot}`);
      }
    }
    assert.ok(region.life.filter((life) => life.kind === "fish").length >= 4);
    for (const patrol of region.patrols) assert.ok(Math.hypot(patrol.x - region.harbor.x, patrol.z - region.harbor.z) >= 20);
  }
});

test("shared world samples have no artificial cliff at chunk or region boundaries", () => {
  const world = new VoxelWorld(7);
  for (const rx of [-REGION_RADIUS, -4, 0, 4, REGION_RADIUS - 1]) {
    const x = rx * REGION_SIZE + 78;
    for (let z = -250; z < 250; z += 1) assert.ok(Math.abs(world.height(x - 0.5, z) - world.height(x + 0.5, z)) <= 0.5);
  }
  const fields = [0, 1].map((cx) => buildTerrainHeightfield(STREAM_CHUNK_SIZE/TERRAIN_CELL_SIZE,
    (x, z) => ({ heightUnits: world.height(cx * STREAM_CHUNK_SIZE + (x+.5)*TERRAIN_CELL_SIZE, (z+.5)*TERRAIN_CELL_SIZE) / TERRAIN_HEIGHT_UNIT, material: 0 }),
    (x, z) => world.height(cx * STREAM_CHUNK_SIZE + (x+.5)*TERRAIN_CELL_SIZE, (z+.5)*TERRAIN_CELL_SIZE) / TERRAIN_HEIGHT_UNIT));
  for (const field of fields) for (let i = 0; i < field.quads.length; i += 2) {
    const quad = unpackTerrainQuad(field.quads[i], field.quads[i + 1]);
    assert.ok(quad.width > 0 && quad.height > 0);
    assert.ok(quad.y >= 0 && quad.y <= 127);
  }
  assert.equal(world.height(WORLD_HALF + 1, 0), -6);
});

test("world outcomes and ecological recovery survive unloading without distant simulation loops", () => {
  const world = new VoxelWorld(1), region = world.region(3, 4);
  world.collect(region.id, 2); world.catchFish(region.id, 0, 10);
  world.patrolDamage[region.id * 4] = 7;
  world.visit(region); world.visit(region);
  for (let i = -30; i <= 30; i += 1) world.region(i, 22);
  const revisited = world.region(3, 4);
  assert.equal(world.hasCollected(revisited.id, 2), true);
  assert.equal(world.fishAvailable(revisited.id, 0, 189), false);
  assert.equal(world.fishAvailable(revisited.id, 0, 190), true);
  assert.equal(world.patrolDamage[revisited.id * 4], 7);
  assert.equal(world.visitedCount, 1);
  assert.equal(world.collected.length, WORLD_REGION_COUNT);
  assert.ok(volcanoState(3600, 22).deposit > volcanoState(60, 22).deposit);
  const before = world.height(-10, 3, 600);
  assert.equal(before, new VoxelWorld(1).height(-10, 3, 600));
  const volcano = world.region(0, 0);
  world.triggerVolcano(volcano, 20);
  const firstDeposit = world.volcano(volcano, 28).deposit;
  world.triggerVolcano(volcano, 28);
  assert.equal(world.volcano(volcano, 28).deposit, firstDeposit, "repeat eruption preserves cooled history");
  assert.ok(world.volcano(volcano, 63).deposit >= world.volcano(volcano, 62.999).deposit);
  world.reset(); assert.equal(world.hasCollected(region.id, 2), false);
});

test("streaming crosses thousands of signed chunk boundaries with fixed residency and bounded queues", () => {
  const stream = new VoxelStream();
  const settle = () => { let next; while ((next = stream.take())) assert.ok(stream.accept(next)); };
  stream.focus(0, 18); settle();
  assert.equal(stream.resident.size, STREAM_LIMIT);
  assert.equal(stream.readyAt(0, 18, 2), true);
  assert.deepEqual(stream.focus(0, 18), []);
  assert.equal(stream.pending, 0);
  const initialKeys = new Set(stream.resident.keys());
  stream.focus(13, 18, 4, 0);
  assert.equal(stream.pending, 13);
  assert.equal(stream.resident.size, 156);
  settle();
  assert.equal([...stream.resident.keys()].filter((key) => initialKeys.has(key)).length, 156);
  for (let step = 0; step < 2000; step += 1) {
    const x = (step % 750 - 375) * 13, z = (Math.floor(step / 250) - 4) * 13;
    stream.focus(x, z, 3, 0);
    assert.ok(stream.pending <= STREAM_LIMIT);
    settle();
    assert.equal(stream.resident.size, STREAM_LIMIT);
    assert.equal(stream.readyAt(x, z, 2), true);
  }
  stream.focus(-0.01, -0.01); settle();
  assert.equal(stream.resident.has(chunkKey(-1, -1)), true);
  assert.ok(stream.unloaded > 20000);
  stream.clear(); assert.equal(stream.resident.size, 0);
});

test("obsolete work is discarded on a changed course and rejected on completion", () => {
  const stream = new VoxelStream();
  stream.focus(0, 0);
  const old = stream.take();
  stream.focus(300, -300);
  assert.equal(stream.accept(old), false);
  assert.ok(stream.pending <= STREAM_LIMIT);
  const near = stream.take();
  assert.equal(near.x, Math.floor(300 / 13));
  assert.equal(near.z, Math.floor(-300 / 13));
});
