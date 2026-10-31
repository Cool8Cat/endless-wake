export const TERRAIN_FLOOR = -8;
export const TERRAIN_HEIGHT_UNIT = 0.25;
export const TERRAIN_CELL_SIZE = 0.5;
export const MAX_RESIDENT_TERRAIN_CHUNKS = 169;

export type PackedTerrainQuad = {
  x: number;
  y: number;
  z: number;
  face: number;
  material: number;
  width: number;
  height: number;
};

export type TerrainChunkField = {
  heights: Int16Array;
  materials: Uint8Array;
  quads: Uint32Array;
};

export type PackedChunkPart = {
  quads: Uint32Array;
  offsetX: number;
  offsetZ: number;
};

export function selectResidentChunkIndices(
  chunksPerSide: number,
  centerChunkX: number,
  centerChunkZ: number,
  limit = MAX_RESIDENT_TERRAIN_CHUNKS,
) {
  if (!Number.isInteger(chunksPerSide) || chunksPerSide < 1
    || !Number.isInteger(limit) || limit < 1) throw new RangeError("Invalid terrain residency bounds");
  if (chunksPerSide * chunksPerSide <= limit) {
    return Array.from({ length: chunksPerSide * chunksPerSide }, (_, index) => index);
  }
  let side = Math.min(chunksPerSide, Math.floor(Math.sqrt(limit)));
  if (side % 2 === 0) side -= 1;
  side = Math.max(1, side);
  const half = Math.floor(side / 2);
  const clampedCenterX = Math.max(0, Math.min(chunksPerSide - 1, Math.floor(centerChunkX)));
  const clampedCenterZ = Math.max(0, Math.min(chunksPerSide - 1, Math.floor(centerChunkZ)));
  const startX = Math.max(0, Math.min(chunksPerSide - side, clampedCenterX - half));
  const startZ = Math.max(0, Math.min(chunksPerSide - side, clampedCenterZ - half));
  const indices: number[] = [];
  for (let z = startZ; z < startZ + side; z += 1) {
    for (let x = startX; x < startX + side; x += 1) indices.push(z * chunksPerSide + x);
  }
  return indices;
}

const HORIZONTAL_MASK = 0x7f;
const HEIGHT_MASK = 0x7f;
const FACE_MASK = 0x7;
const MATERIAL_MASK = 0x1f;

// Two words describe one visible rectangle: x7/y7/z7/face3/material5 in word 0,
// width7/height7 in word 1. The vertex shader expands the six triangle vertices,
// so the CPU and GPU upload eight bytes instead of 216.
export function packTerrainQuad(
  x: number,
  y: number,
  z: number,
  face: number,
  material: number,
  width: number,
  height: number,
) {
  if (!Number.isInteger(x) || x < 0 || x > HORIZONTAL_MASK
    || !Number.isInteger(y) || y < 0 || y > HEIGHT_MASK
    || !Number.isInteger(z) || z < 0 || z > HORIZONTAL_MASK
    || !Number.isInteger(face) || face < 0 || face > 5
    || !Number.isInteger(material) || material < 0 || material > MATERIAL_MASK
    || !Number.isInteger(width) || width < 1 || width > HEIGHT_MASK
    || !Number.isInteger(height) || height < 1 || height > HEIGHT_MASK) {
    throw new RangeError("Terrain rectangle exceeds the compact format");
  }
  return [
    (x | (y << 7) | (z << 14) | (face << 21) | (material << 24)) >>> 0,
    (width | (height << 7)) >>> 0,
  ] as const;
}

export function unpackTerrainQuad(word0: number, word1: number): PackedTerrainQuad {
  return {
    x: word0 & HORIZONTAL_MASK,
    y: (word0 >>> 7) & HEIGHT_MASK,
    z: (word0 >>> 14) & HORIZONTAL_MASK,
    face: (word0 >>> 21) & FACE_MASK,
    material: (word0 >>> 24) & MATERIAL_MASK,
    width: word1 & HEIGHT_MASK,
    height: (word1 >>> 7) & HEIGHT_MASK,
  };
}

function appendQuad(output: number[], quad: readonly [number, number]) {
  output.push(quad[0], quad[1]);
}

export function buildTerrainHeightfield(
  size: number,
  sample: (localX: number, localZ: number) => { heightUnits: number; material: number },
  neighborHeightUnits: (localX: number, localZ: number) => number,
): TerrainChunkField {
  if (!Number.isInteger(size) || size < 1 || size > 31) throw new RangeError("Invalid terrain chunk size");
  const heights = new Int16Array(size * size);
  const materials = new Uint8Array(size * size);
  const floorUnits = Math.round(TERRAIN_FLOOR / TERRAIN_HEIGHT_UNIT);
  const output: number[] = [];

  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = sample(x, z);
      if (!Number.isInteger(cell.heightUnits) || cell.heightUnits < floorUnits || cell.heightUnits - floorUnits > HEIGHT_MASK) {
        throw new RangeError("Terrain height exceeds the compact format");
      }
      if (!Number.isInteger(cell.material) || cell.material < 0 || cell.material > MATERIAL_MASK) {
        throw new RangeError("Terrain material exceeds the compact format");
      }
      const index = z * size + x;
      heights[index] = cell.heightUnits;
      materials[index] = cell.material;
    }
  }

  const used = new Uint8Array(size * size);
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const start = z * size + x;
      if (used[start]) continue;
      let width = 1;
      while (x + width < size) {
        const candidate = start + width;
        if (used[candidate] || heights[candidate] !== heights[start] || materials[candidate] !== materials[start]) break;
        width += 1;
      }
      let depth = 1;
      depthLoop: while (z + depth < size) {
        for (let offset = 0; offset < width; offset += 1) {
          const candidate = (z + depth) * size + x + offset;
          if (used[candidate] || heights[candidate] !== heights[start] || materials[candidate] !== materials[start]) break depthLoop;
        }
        depth += 1;
      }
      for (let dz = 0; dz < depth; dz += 1) {
        used.fill(1, (z + dz) * size + x, (z + dz) * size + x + width);
      }
      appendQuad(output, packTerrainQuad(
        x,
        heights[start] - floorUnits,
        z,
        2,
        materials[start],
        width,
        depth,
      ));
    }
  }

  const heightAt = (x: number, z: number) => {
    if (x >= 0 && z >= 0 && x < size && z < size) return heights[z * size + x];
    return neighborHeightUnits(x, z);
  };
  const emitSideRuns = (direction: "north" | "south" | "west" | "east", fixed: number) => {
    let runStart = 0;
    let runHigh = 0;
    let runLow = 0;
    let runMaterial = -1;
    const flush = (runEnd: number) => {
      if (runMaterial < 0) return;
      const length = runEnd - runStart;
      const y = runLow - floorUnits;
      const vertical = runHigh - runLow;
      if (direction === "north") {
        appendQuad(output, packTerrainQuad(runStart, y, fixed, 5, runMaterial, length, vertical));
      } else if (direction === "south") {
        appendQuad(output, packTerrainQuad(runStart, y, fixed + 1, 4, runMaterial, length, vertical));
      } else if (direction === "west") {
        appendQuad(output, packTerrainQuad(fixed, y, runStart, 1, runMaterial, length, vertical));
      } else {
        appendQuad(output, packTerrainQuad(fixed + 1, y, runStart, 0, runMaterial, length, vertical));
      }
    };

    for (let variable = 0; variable <= size; variable += 1) {
      let high = 0;
      let low = 0;
      let material = -1;
      if (variable < size) {
        const x = direction === "north" || direction === "south" ? variable : fixed;
        const z = direction === "north" || direction === "south" ? fixed : variable;
        const index = z * size + x;
        high = heights[index];
        low = direction === "north" ? heightAt(x, z - 1)
          : direction === "south" ? heightAt(x, z + 1)
            : direction === "west" ? heightAt(x - 1, z)
              : heightAt(x + 1, z);
        if (low < high) material = materials[index];
      }
      if (material === runMaterial && high === runHigh && low === runLow) continue;
      flush(variable);
      runStart = variable;
      runHigh = high;
      runLow = low;
      runMaterial = material;
    }
  };

  for (let fixed = 0; fixed < size; fixed += 1) {
    emitSideRuns("north", fixed);
    emitSideRuns("south", fixed);
    emitSideRuns("west", fixed);
    emitSideRuns("east", fixed);
  }

  return { heights, materials, quads: new Uint32Array(output) };
}

export function combinePackedTerrain(parts: readonly PackedChunkPart[]) {
  const wordCount = parts.reduce((total, part) => total + part.quads.length, 0);
  const combined = new Uint32Array(wordCount);
  let cursor = 0;
  for (const part of parts) {
    for (let index = 0; index < part.quads.length; index += 2) {
      const quad = unpackTerrainQuad(part.quads[index], part.quads[index + 1]);
      const relocated = packTerrainQuad(
        quad.x + part.offsetX,
        quad.y,
        quad.z + part.offsetZ,
        quad.face,
        quad.material,
        quad.width,
        quad.height,
      );
      combined[cursor] = relocated[0];
      combined[cursor + 1] = relocated[1];
      cursor += 2;
    }
  }
  return combined;
}

const CORNERS = [
  [0, 0], [1, 0], [1, 1],
  [0, 0], [1, 1], [0, 1],
] as const;

const NORMALS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0],
  [0, -1, 0], [0, 0, 1], [0, 0, -1],
] as const;

export function expandPackedTerrain(
  quads: Uint32Array,
  originX: number,
  originZ: number,
  palette: readonly (readonly [number, number, number])[],
) {
  const output = new Float32Array((quads.length / 2) * 6 * 9);
  let cursor = 0;
  for (let index = 0; index < quads.length; index += 2) {
    const quad = unpackTerrainQuad(quads[index], quads[index + 1]);
    const normal = NORMALS[quad.face];
    const baseColor = palette[quad.material];
    if (!normal || !baseColor) throw new RangeError("Invalid compact terrain data");
    const sideShade = quad.face === 2 ? 1 : 0.72;
    for (const corner of CORNERS) {
      let u = corner[0];
      const v = corner[1];
      if (quad.face === 0 || quad.face === 2 || quad.face === 5) u = 1 - u;
      let x = quad.x;
      let y = quad.y;
      let z = quad.z;
      if (quad.face < 2) {
        z += u * quad.width;
        y += v * quad.height;
      } else if (quad.face < 4) {
        x += u * quad.width;
        z += v * quad.height;
      } else {
        x += u * quad.width;
        y += v * quad.height;
      }
      output[cursor] = originX + x * TERRAIN_CELL_SIZE;
      output[cursor + 1] = TERRAIN_FLOOR + y * TERRAIN_HEIGHT_UNIT;
      output[cursor + 2] = originZ + z * TERRAIN_CELL_SIZE;
      output[cursor + 3] = normal[0];
      output[cursor + 4] = normal[1];
      output[cursor + 5] = normal[2];
      output[cursor + 6] = baseColor[0] * sideShade;
      output[cursor + 7] = baseColor[1] * sideShade;
      output[cursor + 8] = baseColor[2] * sideShade;
      cursor += 9;
    }
  }
  return output;
}

export function concatenateFloat32(parts: readonly Float32Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const combined = new Float32Array(length);
  let cursor = 0;
  for (const part of parts) {
    combined.set(part, cursor);
    cursor += part.length;
  }
  return combined;
}
