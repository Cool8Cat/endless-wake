import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTerrainHeightfield,
  combinePackedTerrain,
  expandPackedTerrain,
  MAX_RESIDENT_TERRAIN_CHUNKS,
  packTerrainQuad,
  selectResidentChunkIndices,
  TERRAIN_FLOOR,
  TERRAIN_HEIGHT_UNIT,
  TERRAIN_CELL_SIZE,
  unpackTerrainQuad,
} from "../app/voxel/voxel-terrain-mesh.ts";

const PALETTE = Array.from({ length: 23 }, (_, index) => [index / 22, 0.25, 1 - index / 22]);

test("fine terrain covers full-height mountains and four-by-four spatial batches in eight bytes", () => {
  const quad = packTerrainQuad(104,124,104,2,22,23,23);
  assert.deepEqual(unpackTerrainQuad(...quad),{x:104,y:124,z:104,face:2,material:22,width:23,height:23});
  const mesh = expandPackedTerrain(new Uint32Array(quad),-52,-52,PALETTE);
  assert.equal(Math.min(...Array.from({length:6},(_,i)=>mesh[i*9])),104*TERRAIN_CELL_SIZE-52);
  assert.equal(Math.max(...Array.from({length:6},(_,i)=>mesh[i*9])),127*TERRAIN_CELL_SIZE-52);
  assert.equal(mesh[1],124*TERRAIN_HEIGHT_UNIT+TERRAIN_FLOOR);
  assert.throws(()=>packTerrainQuad(0,128,0,2,0,1,1));
  assert.throws(()=>packTerrainQuad(0,0,0,2,0,128,1));
});

function coverageFromField(size, heights, materials, outside) {
  const result = new Set();
  const at = (x, z) => x < 0 || z < 0 || x >= size || z >= size ? outside : heights[z * size + x];
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const high = at(x, z);
      const material = materials[z * size + x];
      result.add(`2:${x}:${high}:${z}:${material}`);
      for (const [face, neighbor, position] of [
        [0, at(x + 1, z), [x + 1, z]],
        [1, at(x - 1, z), [x, z]],
        [4, at(x, z + 1), [x, z + 1]],
        [5, at(x, z - 1), [x, z]],
      ]) {
        for (let y = neighbor; y < high; y += 1) result.add(`${face}:${position[0]}:${y}:${position[1]}:${material}`);
      }
    }
  }
  return result;
}

function coverageFromQuads(quads) {
  const floorUnits = Math.round(TERRAIN_FLOOR / TERRAIN_HEIGHT_UNIT);
  const result = new Set();
  for (let index = 0; index < quads.length; index += 2) {
    const quad = unpackTerrainQuad(quads[index], quads[index + 1]);
    if (quad.face === 2) {
      for (let z = quad.z; z < quad.z + quad.height; z += 1) {
        for (let x = quad.x; x < quad.x + quad.width; x += 1) {
          result.add(`2:${x}:${quad.y + floorUnits}:${z}:${quad.material}`);
        }
      }
    } else if (quad.face < 2) {
      for (let y = quad.y; y < quad.y + quad.height; y += 1) {
        for (let z = quad.z; z < quad.z + quad.width; z += 1) {
          result.add(`${quad.face}:${quad.x}:${y + floorUnits}:${z}:${quad.material}`);
        }
      }
    } else {
      for (let y = quad.y; y < quad.y + quad.height; y += 1) {
        for (let x = quad.x; x < quad.x + quad.width; x += 1) {
          result.add(`${quad.face}:${x}:${y + floorUnits}:${quad.z}:${quad.material}`);
        }
      }
    }
  }
  return result;
}

test("compact terrain preserves exact visible heightfield coverage and materials", () => {
  const size = 5;
  const heights = new Int16Array([
    -8, -8, -7, -7, -7,
    -8, -5, -5, -7, -6,
    -6, -5, -3, -3, -6,
    -6, -6, -3, -4, -4,
    -8, -6, -6, -4, -4,
  ]);
  const materials = new Uint8Array(heights.length);
  for (let index = 0; index < materials.length; index += 1) materials[index] = 1 + index % 5;
  const outside = -13;
  const field = buildTerrainHeightfield(
    size,
    (x, z) => ({ heightUnits: heights[z * size + x], material: materials[z * size + x] }),
    () => outside,
  );
  assert.deepEqual(coverageFromQuads(field.quads), coverageFromField(size, heights, materials, outside));
});

test("packed terrain expands to outward triangles with the 27x payload ratio", () => {
  const encoded = [
    ...packTerrainQuad(2, 9, 3, 0, 4, 5, 7),
    ...packTerrainQuad(2, 9, 3, 1, 4, 5, 7),
    ...packTerrainQuad(2, 9, 3, 2, 4, 5, 6),
    ...packTerrainQuad(2, 9, 3, 4, 4, 5, 7),
    ...packTerrainQuad(2, 9, 3, 5, 4, 5, 7),
  ];
  const quads = new Uint32Array(encoded);
  const expanded = expandPackedTerrain(quads, -13, 26, PALETTE);
  assert.equal(expanded.byteLength, quads.byteLength * 27);
  for (let quadIndex = 0; quadIndex < quads.length / 2; quadIndex += 1) {
    const expected = unpackTerrainQuad(quads[quadIndex * 2], quads[quadIndex * 2 + 1]);
    for (let triangle = 0; triangle < 2; triangle += 1) {
      const start = (quadIndex * 6 + triangle * 3) * 9;
      const a = expanded.subarray(start, start + 3);
      const b = expanded.subarray(start + 9, start + 12);
      const c = expanded.subarray(start + 18, start + 21);
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cross = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      const normal = expanded.subarray(start + 3, start + 6);
      assert.ok(cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2] > 0, `face ${expected.face}`);
    }
  }
});

test("spatial batches relocate chunks without changing rectangle data", () => {
  const first = new Uint32Array(packTerrainQuad(1, 4, 2, 2, 3, 4, 5));
  const second = new Uint32Array(packTerrainQuad(0, 6, 1, 5, 7, 3, 2));
  const combined = combinePackedTerrain([
    { quads: first, offsetX: 0, offsetZ: 0 },
    { quads: second, offsetX: 13, offsetZ: 13 },
  ]);
  assert.equal(combined.length, 4);
  assert.deepEqual(unpackTerrainQuad(combined[0], combined[1]), unpackTerrainQuad(first[0], first[1]));
  assert.deepEqual(unpackTerrainQuad(combined[2], combined[3]), {
    ...unpackTerrainQuad(second[0], second[1]),
    x: 13,
    z: 14,
  });
});

test("residency selection caps a large world at 169 and keeps the current 64 chunks", () => {
  const current = selectResidentChunkIndices(8, 4, 4);
  assert.equal(current.length, 64);
  assert.equal(new Set(current).size, 64);
  const large = selectResidentChunkIndices(32, 16, 16);
  assert.equal(large.length, MAX_RESIDENT_TERRAIN_CHUNKS);
  assert.equal(new Set(large).size, MAX_RESIDENT_TERRAIN_CHUNKS);
  const edge = selectResidentChunkIndices(32, 0, 31);
  assert.equal(edge.length, MAX_RESIDENT_TERRAIN_CHUNKS);
  assert.ok(edge.every((index) => index >= 0 && index < 32 * 32));
});
