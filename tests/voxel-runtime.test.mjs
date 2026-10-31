import assert from "node:assert/strict";
import test from "node:test";
import { loadVoxelModule } from "./voxel-test-modules.mjs";

function graphicsHarness(webgl2) {
  let bound = null, serial = 0;
  const buffers = new Map(), textures = new Set();
  const gl = new Proxy({
    createBuffer: () => { const id = ++serial; buffers.set(id, 0); return id; },
    bindBuffer: (_target, buffer) => { bound = buffer; },
    bufferData: (_target, data) => { assert.ok(buffers.has(bound)); buffers.set(bound, data.byteLength); },
    deleteBuffer: (buffer) => { assert.ok(buffers.has(buffer), "delete only owned live buffers"); buffers.delete(buffer); },
    createTexture: () => { const id = ++serial; textures.add(id); return id; },
    deleteTexture: (id) => { assert.ok(textures.has(id)); textures.delete(id); },
    createShader: () => ++serial, createProgram: () => ++serial,
    getShaderParameter: () => true, getProgramParameter: () => true,
    getUniformLocation: () => ++serial, getAttribLocation: () => 0,
    getExtension: () => null, getParameter: () => false,
  }, { get: (target, key) => key in target ? target[key] : /^[A-Z0-9_]+$/.test(key) ? 1 : () => {} });
  const canvas = { width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    getContext: (name) => name === "webgl2" && !webgl2 ? null : gl,
    addEventListener() {}, removeEventListener() {} };
  return { canvas, buffers, textures };
}

test("real engine streams, revisits, batches, collides and releases all GPU resources on both backends", async () => {
  const { VoxelVoyageEngine } = await loadVoxelModule("voxel-engine");
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = { requestAnimationFrame: () => 1, cancelAnimationFrame() {}, devicePixelRatio: 1 };
  globalThis.document = { hidden: false };
  try {
    for (const webgl2 of [true, false]) {
      const harness = graphicsHarness(webgl2);
      const engine = new VoxelVoyageEngine(harness.canvas, { reducedMotion: false, onSnapshot() {}, onError: assert.fail });
      const settle = () => {
        for (let i = 0; i < 300 && (i === 0 || engine.stream.pending || engine.dirtyBatches.size || engine.dirtyChunks.size); i += 1) engine.serviceTerrain();
        assert.equal(engine.stream.pending, 0); assert.equal(engine.dirtyBatches.size, 0);
        assert.equal(engine.terrainChunks.size, 169);
        assert.ok(engine.terrainMeshes.size <= 25);
        assert.ok(engine.shoreFoamByChunk.size <= 169);
        assert.equal([...engine.terrainMeshes.values()].reduce((sum, group) => sum + group.chunkIndices.length, 0), 169);
        assert.equal([...engine.terrainMeshes.values()].reduce((sum, group) => sum + group.bufferBytes, 0), engine.terrainBufferBytes);
      };
      settle(); engine.begin(); assert.equal(engine.phase, "sailing");
      const boatPosition = [engine.boatX, engine.boatZ];
      for (let i = 0; i < 30; i++) engine.zoomView(true);
      assert.equal(engine.viewScale, .52);
      for (let i = 0; i < 30; i++) engine.zoomView(false);
      assert.equal(engine.viewScale, 1.22);
      assert.deepEqual([engine.boatX, engine.boatZ], boatPosition);
      const item = engine.salvage[0];
      engine.boatX = item.x; engine.boatZ = item.z; engine.interact();
      assert.equal(engine.cargo, 1);
      const originalPoint = { x: item.x, z: item.z, id: item.id, slot: item.slot };
      for (const point of [[-780, 500], [-780, 350], [4600, -4500], [-4990, 4900], [0, 18]]) {
        engine.boatX = point[0]; engine.boatZ = point[1]; engine.syncWorldEntities(); settle();
        engine.render(engine.worldTime);
        assert.ok(engine.harborMeshes.size <= 12);
        assert.ok(harness.buffers.size <= 89);
        assert.ok(engine.nearby.length <= 9 && engine.seaLife.length <= 72 && engine.corsairs.length <= 36);
      }
      assert.equal(engine.cargo, 1);
      assert.ok(engine.world.hasCollected(originalPoint.id, originalPoint.slot));
      assert.equal(engine.salvage.find((entry) => entry.id === originalPoint.id && entry.slot === originalPoint.slot).collected, true);
      const region = engine.world.region(4, -3);
      engine.boatX = region.harbor.dockX; engine.boatZ = region.harbor.dockZ;
      engine.syncWorldEntities(); settle(); engine.sail = 0; engine.boatSpeed = 0;
      engine.interact(); assert.equal(engine.dockingActive, true);
      engine.update(1 / 60, 0); assert.equal(engine.phase, "docked");
      engine.coins = 100; engine.buyShipHull("grand_voyager"); engine.buyEquipment("gear_net");
      assert.equal(engine.shipHull, "grand_voyager"); assert.ok(engine.loadout.includes("gear_net"));
      engine.departHarbor(); assert.equal(engine.phase, "sailing");
      engine.resetWorld(); settle(); assert.equal(engine.world.hasCollected(originalPoint.id, originalPoint.slot), false);
      engine.phase = "docked"; engine.worldTime = 40;
      engine.updateVolcano(0);
      assert.ok(engine.dirtyChunks.size > 0, "cooling remains active while docked");
      settle();
      engine.destroy(); assert.equal(harness.buffers.size, 0); assert.equal(harness.textures.size, 0);
    }
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument; }
});
