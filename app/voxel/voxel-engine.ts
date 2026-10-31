import {
  buildTerrainHeightfield,
  combinePackedTerrain,
  concatenateFloat32,
  expandPackedTerrain,
  TERRAIN_FLOOR,
  TERRAIN_HEIGHT_UNIT,
  TERRAIN_CELL_SIZE,
} from "./voxel-terrain-mesh";
import {
  fishingProfile,
  getEquipment,
  getShipHull,
  hardpointsForHull,
  SHIP_HULLS,
  type EquipmentId,
  type ShipHullId,
} from "./voxel-loadout";
import { VoxelWorld, WORLD_SEED, WORLD_SIZE, WORLD_HALF, REGION_SIZE, lavaChannel, type Region, type Harbor } from "./voxel-world";
import { VoxelStream, STREAM_CHUNK_SIZE, STREAM_BATCH_CHUNKS, STREAM_LIMIT, chunkKey, batchKey } from "./voxel-stream";
import { PLANT_MODELS, type PlantKind } from "./voxel-plants";
import { buildBoatHull, buildBoatSails, buildEquipment, buildWeaponProjectile, buildCorsairTarget } from "./voxel-ship-models";
import { buildHarborWorker, buildHarborCat, buildCraneHook, buildWreck, buildCargo, buildBeacon, buildSeaLife, buildCloud } from "./voxel-life-models";
import { appendModel } from "./voxel-model-kit";
import { buildHarbor } from "./voxel-harbor-models";

export type VoxelPhase = "intro" | "sailing" | "paused" | "docked";

export type VoxelControl = "left" | "right" | "sail" | "reef";

export type VoxelSnapshot = {
  phase: VoxelPhase;
  fps: number;
  renderScale: number;
  speed: number;
  heading: number;
  sail: number;
  hull: number;
  depth: number;
  volcanoPhase: string;
  lavaHeat: number;
  lavaCoverage: number;
  eruptionActive: boolean;
  triangles: number;
  chunks: number;
  residentTriangles: number;
  residentChunks: number;
  worldSize: number;
  worldSeed: number;
  worldReady: boolean;
  positionX: number;
  positionZ: number;
  regionName: string;
  difficulty: number;
  visitedRegions: number;
  harborName: string;
  harborBearing: number;
  streamingPending: number;
  streamedChunks: number;
  evictedChunks: number;
  streamCpuMs: number;
  activeLife: number;
  weather: string;
  chart: Array<{ x: number; z: number; kind: string; label: string }>;
  graphicsBackend: string;
  terrainFormat: string;
  terrainBatches: number;
  terrainDrawCalls: number;
  terrainBufferBytes: number;
  terrainResidencyLimit: number;
  renderCpuMs: number;
  gpuDrawMs: number | null;
  terrainBuildCount: number;
  terrainUploadCount: number;
  terrainSkippedCount: number;
  shipHull: ShipHullId;
  shipHullName: string;
  weaponSlots: number;
  loadout: EquipmentId[];
  readyWeapons: number;
  weaponCooldown: number;
  targetsRemaining: number;
  cargo: number;
  fish: number;
  coins: number;
  windHeading: number;
  windStrength: number;
  harborDistance: number;
  netProgress: number;
  actionLabel: string;
  actionAvailable: boolean;
  objective: string;
  docking: boolean;
  notice: string;
};

type VoxelEngineOptions = {
  seed?: number;
  reducedMotion: boolean;
  onSnapshot: (snapshot: VoxelSnapshot) => void;
  onError: (message: string) => void;
};

type GpuMesh = {
  buffer: WebGLBuffer;
  vertexCount: number;
};

type TerrainChunkGeometry = {
  quads: Uint32Array;
  details: Float32Array;
  depths: Uint8Array;
};

type TerrainBatchMesh = {
  buffer: WebGLBuffer;
  detailBuffer: WebGLBuffer | null;
  packed: boolean;
  quadCount: number;
  vertexCount: number;
  detailVertexCount: number;
  triangleCount: number;
  bufferBytes: number;
  chunkIndices: string[];
  groupX: number;
  groupZ: number;
  centerX: number;
  centerZ: number;
  radius: number;
};

type LitProgram = {
  program: WebGLProgram;
  position: number;
  normal: number;
  color: number;
  viewProjection: WebGLUniformLocation;
  model: WebGLUniformLocation;
  camera: WebGLUniformLocation;
  focus: WebGLUniformLocation;
  lightDirection: WebGLUniformLocation;
  fogColor: WebGLUniformLocation;
  alpha: WebGLUniformLocation;
  terrainVariation: WebGLUniformLocation;
};

type PackedTerrainProgram = {
  program: WebGLProgram;
  quad: number;
  viewProjection: WebGLUniformLocation;
  groupOrigin: WebGLUniformLocation;
  palette: WebGLUniformLocation;
  camera: WebGLUniformLocation;
  focus: WebGLUniformLocation;
  lightDirection: WebGLUniformLocation;
  fogColor: WebGLUniformLocation;
  terrainVariation: WebGLUniformLocation;
  lavaMaterials: WebGLUniformLocation;
  lavaOrigin: WebGLUniformLocation;
};

type WaterProgram = {
  program: WebGLProgram;
  position: number;
  viewProjection: WebGLUniformLocation;
  camera: WebGLUniformLocation;
  focus: WebGLUniformLocation;
  origin: WebGLUniformLocation;
  time: WebGLUniformLocation;
  volcanoHeat: WebGLUniformLocation;
  depthField: WebGLUniformLocation;
  depthOrigin: WebGLUniformLocation;
  volcanoOrigin: WebGLUniformLocation;
  fogColor: WebGLUniformLocation;
};

type ParticleProgram = {
  program: WebGLProgram;
  position: number;
  alpha: number;
  viewProjection: WebGLUniformLocation;
  color: WebGLUniformLocation;
  size: WebGLUniformLocation;
};

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
};

type WakeParticle = {
  x: number;
  y: number;
  z: number;
  age: number;
  life: number;
};

type SeaLifeKind = "fish" | "turtle" | "ray" | "octopus";

type SeaLife = {
  id: number;
  slot: number;
  kind: SeaLifeKind;
  originX: number;
  originZ: number;
  radius: number;
  speed: number;
  phase: number;
  depth: number;
  caught: boolean;
};

type Salvage = {
  id: number;
  slot: number;
  x: number;
  z: number;
  phase: number;
  collected: boolean;
};

type FoamPoint = {
  x: number;
  z: number;
  phase: number;
};

type WeaponProjectile = {
  equipment: EquipmentId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  age: number;
  life: number;
};

type CorsairTarget = {
  id: number;
  slot: number;
  originX: number;
  originZ: number;
  radius: number;
  speed: number;
  phase: number;
  hull: number;
  maxHull: number;
  reward: number;
  sunk: boolean;
};

type Vec3 = readonly [number, number, number];

const CHUNK_SIZE = STREAM_CHUNK_SIZE;
const CHUNK_CELLS = CHUNK_SIZE / TERRAIN_CELL_SIZE;
const BATCH_CHUNKS = STREAM_BATCH_CHUNKS;
const BATCH_SIZE = CHUNK_SIZE * BATCH_CHUNKS;
const WATER_SIZE = 164;
const WATER_SEGMENTS = 48;
const BUOYANCY_SAMPLES = 6;
const DEG = 180 / Math.PI;
const MAX_SHORE_FOAM = 576;
const MAX_SHORE_FOAM_PER_CHUNK = 3;
const DEPTH_FIELD_SIZE = 384;
const DEPTH_FIELD_WORLD_SIZE = DEPTH_FIELD_SIZE * TERRAIN_CELL_SIZE;
const LAVA_MATERIAL_SIZE = 64;
const VOLCANO_DIRTY_RADIUS = 14.5;
const TERRAIN_PALETTE: readonly Vec3[] = [
  [0.055, 0.16, 0.25],
  [0.25, 0.38, 0.32],
  [0.72, 0.63, 0.39],
  [0.20, 0.39, 0.18],
  [0.18, 0.31, 0.16],
  [0.34, 0.31, 0.25],
  [0.17, 0.15, 0.14],
  [0.105, 0.095, 0.085],
  [0.075, 0.085, 0.08],
  ...Array.from({ length: 7 }, (_, level) => {
    const heat = level / 6;
    return [0.72 + heat * 0.26, 0.08 + heat * 0.16, 0.018] as Vec3;
  }),
  ...Array.from({ length: 7 }, (_, level) => {
    const heat = level / 6;
    return [0.52 + heat * 0.46, 0.07 + heat * 0.18, 0.015] as Vec3;
  }),
];
const TERRAIN_PALETTE_DATA = new Float32Array(TERRAIN_PALETTE.flat());


const IDENTITY = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

const LIT_VERTEX_SHADER = [
  "precision highp float;",
  "attribute vec3 aPosition;",
  "attribute vec3 aNormal;",
  "attribute vec3 aColor;",
  "uniform mat4 uViewProjection;",
  "uniform mat4 uModel;",
  "varying vec3 vWorldPosition;",
  "varying vec3 vNormal;",
  "varying vec3 vColor;",
  "void main() {",
  "  vec4 world = uModel * vec4(aPosition, 1.0);",
  "  vWorldPosition = world.xyz;",
  "  vNormal = normalize(mat3(uModel) * aNormal);",
  "  vColor = aColor;",
  "  gl_Position = uViewProjection * world;",
  "}",
].join("\n");

const LIT_FRAGMENT_SHADER = [
  "precision highp float;",
  "uniform vec3 uCamera;",
  "uniform vec2 uFocus;",
  "uniform vec3 uLightDirection;",
  "uniform vec3 uFogColor;",
  "uniform float uAlpha;",
  "uniform float uTerrainVariation;",
  "varying vec3 vWorldPosition;",
  "varying vec3 vNormal;",
  "varying vec3 vColor;",
  "void main() {",
  "  float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);",
  "  float sideShade = 0.82 + 0.18 * max(vNormal.y, 0.0);",
  "  float light = (0.38 + diffuse * 0.78) * sideShade;",
  "  vec3 viewDirection = normalize(uCamera - vWorldPosition);",
  "  float rim = pow(1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0), 3.0);",
  "  float sunRim = pow(max(dot(viewDirection, normalize(vec3(0.44, 0.72, 0.25))), 0.0), 10.0);",
  "  float terrainNoise = fract(sin(dot(floor(vWorldPosition.xz * 2.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;",
  "  vec3 baseColor = max(vColor + vec3(terrainNoise * uTerrainVariation), vec3(0.0));",
  "  vec3 color = baseColor * light + vec3(0.08, 0.18, 0.17) * rim + vec3(0.24, 0.17, 0.07) * sunRim;",
  "  float fog = smoothstep(44.0, 66.0, distance(uFocus, vWorldPosition.xz));",
  "  gl_FragColor = vec4(mix(color, uFogColor, fog), uAlpha);",
  "}",
].join("\n");

const PACKED_TERRAIN_VERTEX_SHADER = "#version 300 es\n" + [
  "precision highp float;",
  "precision highp int;",
  "layout(location=0) in uvec2 aQuad;",
  "uniform mat4 uViewProjection;",
  "uniform vec2 uGroupOrigin;",
  "uniform vec3 uPalette[23];",
  "out vec3 vWorldPosition;",
  "out vec3 vNormal;",
  "out vec3 vColor;",
  "flat out int vMaterial;",
  "const vec2 corners[6] = vec2[6](vec2(0.0,0.0),vec2(1.0,0.0),vec2(1.0,1.0),vec2(0.0,0.0),vec2(1.0,1.0),vec2(0.0,1.0));",
  "void main() {",
  "  uint word0 = aQuad.x;",
  "  uint word1 = aQuad.y;",
  "  int face = int((word0 >> 21u) & 7u);",
  "  int material = int((word0 >> 24u) & 31u);",
  "  vec3 point = vec3(float(word0 & 127u), float((word0 >> 7u) & 127u), float((word0 >> 14u) & 127u));",
  "  vec2 uv = corners[gl_VertexID];",
  "  if (face == 0 || face == 2 || face == 5) uv.x = 1.0 - uv.x;",
  "  uv *= vec2(float(word1 & 127u), float((word1 >> 7u) & 127u));",
  "  if (face < 2) {",
  "    point.zy += uv;",
  "    vNormal = vec3(face == 0 ? 1.0 : -1.0, 0.0, 0.0);",
  "  } else if (face < 4) {",
  "    point.xz += uv;",
  "    vNormal = vec3(0.0, face == 2 ? 1.0 : -1.0, 0.0);",
  "  } else {",
  "    point.xy += uv;",
  "    vNormal = vec3(0.0, 0.0, face == 4 ? 1.0 : -1.0);",
  "  }",
  `  vWorldPosition = vec3(uGroupOrigin.x + point.x * ${TERRAIN_CELL_SIZE.toFixed(2)}, ${TERRAIN_FLOOR.toFixed(1)} + point.y * ${TERRAIN_HEIGHT_UNIT.toFixed(2)}, uGroupOrigin.y + point.z * ${TERRAIN_CELL_SIZE.toFixed(2)});`,
  "  vColor = uPalette[material] * (face == 2 ? 1.0 : 0.72);",
  "  vMaterial = material;",
  "  gl_Position = uViewProjection * vec4(vWorldPosition, 1.0);",
  "}",
].join("\n");

const PACKED_TERRAIN_FRAGMENT_SHADER = "#version 300 es\n" + [
  "precision highp float;",
  "uniform vec3 uCamera;",
  "uniform vec2 uFocus;",
  "uniform vec3 uLightDirection;",
  "uniform vec3 uFogColor;",
  "uniform float uTerrainVariation;",
  "uniform highp usampler2D uLavaMaterials;",
  "uniform vec2 uLavaOrigin;",
  "in vec3 vWorldPosition;",
  "in vec3 vNormal;",
  "in vec3 vColor;",
  "flat in int vMaterial;",
  "out vec4 fragColor;",
  "void main() {",
  "  float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);",
  "  float sideShade = 0.82 + 0.18 * max(vNormal.y, 0.0);",
  "  float light = (0.38 + diffuse * 0.78) * sideShade;",
  "  vec3 viewDirection = normalize(uCamera - vWorldPosition);",
  "  float rim = pow(1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0), 3.0);",
  "  float sunRim = pow(max(dot(viewDirection, normalize(vec3(0.44, 0.72, 0.25))), 0.0), 10.0);",
  "  float terrainNoise = fract(sin(dot(floor(vWorldPosition.xz * 2.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;",
  "  vec3 materialColor = vColor;",
  `  vec2 cell = (floor((vWorldPosition.xz - vNormal.xz * 0.001) / ${TERRAIN_CELL_SIZE.toFixed(2)}) + 0.5) * ${TERRAIN_CELL_SIZE.toFixed(2)};`,
  `  ivec2 maskCell = ivec2(floor((cell - uLavaOrigin) / ${TERRAIN_CELL_SIZE.toFixed(2)}));`,
  "  uint heatCode = 0u;",
  `  if (all(greaterThanEqual(maskCell, ivec2(0))) && all(lessThan(maskCell, ivec2(${LAVA_MATERIAL_SIZE})))) {`,
  "    uint packedHeat = texelFetch(uLavaMaterials, maskCell, 0).r;",
  "    heatCode = vMaterial == 7 ? (packedHeat >> 4u) & 15u : packedHeat & 15u;",
  "  }",
  "  if (heatCode > 0u) {",
  "    float heat = float(heatCode - 1u) / 6.0;",
  "    materialColor = (vMaterial == 7",
  "      ? vec3(0.72 + heat * 0.26, 0.08 + heat * 0.16, 0.018)",
  "      : vec3(0.52 + heat * 0.46, 0.07 + heat * 0.18, 0.015)) * (vNormal.y > 0.5 ? 1.0 : 0.72);",
  "  }",
  "  vec3 baseColor = max(materialColor + vec3(terrainNoise * uTerrainVariation), vec3(0.0));",
  "  vec3 color = baseColor * light + vec3(0.08, 0.18, 0.17) * rim + vec3(0.24, 0.17, 0.07) * sunRim;",
  "  float fog = smoothstep(44.0, 66.0, distance(uFocus, vWorldPosition.xz));",
  "  fragColor = vec4(mix(color, uFogColor, fog), 1.0);",
  "}",
].join("\n");

const WATER_VERTEX_SHADER = [
  "precision highp float;",
  "attribute vec3 aPosition;",
  "uniform mat4 uViewProjection;",
  "uniform vec2 uOrigin;",
  "uniform float uTime;",
  "varying vec3 vWorldPosition;",
  "varying vec3 vWaveNormal;",
  "varying float vShimmer;",
  "void main() {",
  "  vec2 horizontal = aPosition.xz + uOrigin;",
  "  float waveA = sin(horizontal.x * 0.16 + uTime * 0.90) * 0.11;",
  "  float waveB = sin(horizontal.y * 0.21 - uTime * 0.70) * 0.08;",
  "  float waveC = sin((horizontal.x + horizontal.y) * 0.09 + uTime * 0.45) * 0.07;",
  "  float dx = cos(horizontal.x * 0.16 + uTime * 0.90) * 0.0176 + cos((horizontal.x + horizontal.y) * 0.09 + uTime * 0.45) * 0.0063;",
  "  float dz = cos(horizontal.y * 0.21 - uTime * 0.70) * 0.0168 + cos((horizontal.x + horizontal.y) * 0.09 + uTime * 0.45) * 0.0063;",
  "  vec3 world = vec3(horizontal.x, waveA + waveB + waveC, horizontal.y);",
  "  vWorldPosition = world;",
  "  vWaveNormal = normalize(vec3(-dx, 1.0, -dz));",
  "  vShimmer = waveA + waveB + waveC;",
  "  gl_Position = uViewProjection * vec4(world, 1.0);",
  "}",
].join("\n");

const WATER_FRAGMENT_SHADER = [
  "precision highp float;",
  "uniform vec3 uCamera;",
  "uniform vec2 uFocus;",
  "uniform vec3 uFogColor;",
  "uniform float uTime;",
  "uniform float uVolcanoHeat;",
  "uniform sampler2D uDepthField;",
  "uniform vec2 uDepthOrigin;",
  "uniform vec2 uVolcanoOrigin;",
  "varying vec3 vWorldPosition;",
  "varying vec3 vWaveNormal;",
  "varying float vShimmer;",
  "float shelf(vec2 point, vec2 center, float spread) {",
  "  vec2 delta = point - center;",
  "  return exp(-dot(delta, delta) / spread);",
  "}",
  "void main() {",
  "  vec3 viewDirection = normalize(uCamera - vWorldPosition);",
  "  float fresnel = pow(1.0 - max(dot(viewDirection, vWaveNormal), 0.0), 2.2);",
  "  vec2 point = vWorldPosition.xz;",
  `  vec2 depthUV = (point - uDepthOrigin) / ${DEPTH_FIELD_WORLD_SIZE.toFixed(1)};`,
  `  float depth = 8.0 - texture2D(uDepthField, depthUV).r * ${(255*TERRAIN_HEIGHT_UNIT).toFixed(2)};`,
  "  float shallows = 1.0 - smoothstep(0.2, 5.4, depth);",
  "  float causticA = sin(point.x * 0.58 - point.y * 0.41 + uTime * 1.05);",
  "  float causticB = sin(point.x * 0.37 + point.y * 0.63 - uTime * 0.72);",
  "  float caustic = pow(max(0.0, causticA * causticB), 2.0) * shallows;",
  "  vec3 abyss = vec3(0.012, 0.075, 0.16);",
  "  vec3 deep = vec3(0.018, 0.19, 0.31);",
  "  vec3 jade = vec3(0.055, 0.54, 0.51);",
  "  vec3 color = mix(mix(abyss, deep, 0.62 + vShimmer * 1.1), jade, shallows * 0.9);",
  "  float sunGlint = pow(max(dot(reflect(normalize(vec3(-0.44, -0.86, -0.25)), vWaveNormal), viewDirection), 0.0), 58.0);",
  "  float coastFoam = (1.0 - smoothstep(0.25, 0.95, abs(depth))) * step(-0.1, depth);",
  "  coastFoam *= 0.55 + 0.45 * sin(point.x * 2.4 + point.y * 2.1 + uTime * 2.2);",
  "  float volcanicGlow = shelf(point, uVolcanoOrigin, 52.0) * uVolcanoHeat;",
  "  color += vec3(0.18, 0.34, 0.27) * caustic + vec3(1.0, 0.84, 0.55) * sunGlint * 0.72;",
  "  color += vec3(0.22, 0.045, 0.008) * volcanicGlow * (0.3 + caustic);",
  "  color = mix(color, vec3(0.72, 0.95, 0.82), max(coastFoam, 0.0) * 0.42);",
  "  float fog = smoothstep(44.0, 66.0, distance(uFocus, vWorldPosition.xz));",
  "  float alpha = mix(0.34, 0.74, fresnel) - shallows * 0.08;",
  "  gl_FragColor = vec4(mix(color, uFogColor, fog), mix(alpha, 1.0, fog));",
  "}",
].join("\n");

const PARTICLE_VERTEX_SHADER = [
  "precision highp float;",
  "attribute vec3 aPosition;",
  "attribute float aAlpha;",
  "uniform mat4 uViewProjection;",
  "uniform float uSize;",
  "varying float vAlpha;",
  "void main() {",
  "  vec4 clip = uViewProjection * vec4(aPosition, 1.0);",
  "  gl_Position = clip;",
  "  gl_PointSize = clamp(uSize / max(clip.w * 0.075, 0.65), 2.0, uSize);",
  "  vAlpha = aAlpha;",
  "}",
].join("\n");

const PARTICLE_FRAGMENT_SHADER = [
  "precision highp float;",
  "uniform vec3 uColor;",
  "varying float vAlpha;",
  "void main() {",
  "  vec2 point = gl_PointCoord * 2.0 - 1.0;",
  "  vec2 voxelPoint = floor((point + 1.0) * 3.0) / 3.0 - 1.0;",
  "  float radius = dot(voxelPoint, voxelPoint);",
  "  if (radius > 1.25) discard;",
  "  float softEdge = 1.0 - smoothstep(0.5, 1.25, radius);",
  "  gl_FragColor = vec4(uColor, vAlpha * (0.42 + softEdge * 0.58));",
  "}",
].join("\n");

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function hash2(x: number, z: number) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function multiplyMatrix(a: Float32Array, b: Float32Array) {
  const output = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let value = 0;
      for (let index = 0; index < 4; index += 1) {
        value += a[index * 4 + row] * b[column * 4 + index];
      }
      output[column * 4 + row] = value;
    }
  }
  return output;
}

function translationMatrix(x: number, y: number, z: number) {
  const output = new Float32Array(IDENTITY);
  output[12] = x;
  output[13] = y;
  output[14] = z;
  return output;
}

function scaleMatrix(x: number, y: number, z: number) {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ]);
}

function rotationXMatrix(angle: number) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, cosine, sine, 0,
    0, -sine, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function rotationYMatrix(angle: number) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Float32Array([
    cosine, 0, -sine, 0,
    0, 1, 0, 0,
    sine, 0, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function rotationZMatrix(angle: number) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Float32Array([
    cosine, sine, 0, 0,
    -sine, cosine, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function perspectiveMatrix(fieldOfView: number, aspect: number, near: number, far: number) {
  const scale = 1 / Math.tan(fieldOfView / 2);
  const range = 1 / (near - far);
  return new Float32Array([
    scale / aspect, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, (far + near) * range, -1,
    0, 0, 2 * far * near * range, 0,
  ]);
}

function lookAtMatrix(eye: Vec3, center: Vec3, up: Vec3) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  const zLength = Math.hypot(zx, zy, zz) || 1;
  zx /= zLength;
  zy /= zLength;
  zz /= zLength;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xLength = Math.hypot(xx, xy, xz) || 1;
  xx /= xLength;
  xy /= xLength;
  xz /= xLength;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

type FrustumPlane = readonly [number, number, number, number];

function normalizePlane(a: number, b: number, c: number, d: number): FrustumPlane {
  const length = Math.hypot(a, b, c) || 1;
  return [a / length, b / length, c / length, d / length];
}

function extractFrustumPlanes(matrix: Float32Array) {
  return [
    normalizePlane(matrix[3] + matrix[0], matrix[7] + matrix[4], matrix[11] + matrix[8], matrix[15] + matrix[12]),
    normalizePlane(matrix[3] - matrix[0], matrix[7] - matrix[4], matrix[11] - matrix[8], matrix[15] - matrix[12]),
    normalizePlane(matrix[3] + matrix[1], matrix[7] + matrix[5], matrix[11] + matrix[9], matrix[15] + matrix[13]),
    normalizePlane(matrix[3] - matrix[1], matrix[7] - matrix[5], matrix[11] - matrix[9], matrix[15] - matrix[13]),
    normalizePlane(matrix[3] + matrix[2], matrix[7] + matrix[6], matrix[11] + matrix[10], matrix[15] + matrix[14]),
    normalizePlane(matrix[3] - matrix[2], matrix[7] - matrix[6], matrix[11] - matrix[10], matrix[15] - matrix[14]),
  ] as const;
}

function sphereInsideFrustum(planes: readonly FrustumPlane[], x: number, y: number, z: number, radius: number) {
  for (const plane of planes) {
    if (plane[0] * x + plane[1] * y + plane[2] * z + plane[3] < -radius) return false;
  }
  return true;
}



function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create a WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create a WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || "Unknown program link error";
    gl.deleteProgram(program);
    throw new Error(error);
  }
  return program;
}

function getUniform(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error("Missing shader parameter: " + name);
  return location;
}

function createLitProgram(gl: WebGLRenderingContext): LitProgram {
  const program = createProgram(gl, LIT_VERTEX_SHADER, LIT_FRAGMENT_SHADER);
  return {
    program,
    position: gl.getAttribLocation(program, "aPosition"),
    normal: gl.getAttribLocation(program, "aNormal"),
    color: gl.getAttribLocation(program, "aColor"),
    viewProjection: getUniform(gl, program, "uViewProjection"),
    model: getUniform(gl, program, "uModel"),
    camera: getUniform(gl, program, "uCamera"),
    focus: getUniform(gl, program, "uFocus"),
    lightDirection: getUniform(gl, program, "uLightDirection"),
    fogColor: getUniform(gl, program, "uFogColor"),
    alpha: getUniform(gl, program, "uAlpha"),
    terrainVariation: getUniform(gl, program, "uTerrainVariation"),
  };
}

function createPackedTerrainProgram(gl: WebGL2RenderingContext): PackedTerrainProgram {
  const program = createProgram(gl, PACKED_TERRAIN_VERTEX_SHADER, PACKED_TERRAIN_FRAGMENT_SHADER);
  return {
    program,
    quad: gl.getAttribLocation(program, "aQuad"),
    viewProjection: getUniform(gl, program, "uViewProjection"),
    groupOrigin: getUniform(gl, program, "uGroupOrigin"),
    palette: getUniform(gl, program, "uPalette[0]"),
    camera: getUniform(gl, program, "uCamera"),
    focus: getUniform(gl, program, "uFocus"),
    lightDirection: getUniform(gl, program, "uLightDirection"),
    fogColor: getUniform(gl, program, "uFogColor"),
    terrainVariation: getUniform(gl, program, "uTerrainVariation"),
    lavaMaterials: getUniform(gl, program, "uLavaMaterials"),
    lavaOrigin: getUniform(gl, program, "uLavaOrigin"),
  };
}

function createWaterProgram(gl: WebGLRenderingContext): WaterProgram {
  const program = createProgram(gl, WATER_VERTEX_SHADER, WATER_FRAGMENT_SHADER);
  return {
    program,
    position: gl.getAttribLocation(program, "aPosition"),
    viewProjection: getUniform(gl, program, "uViewProjection"),
    camera: getUniform(gl, program, "uCamera"),
    focus: getUniform(gl, program, "uFocus"),
    origin: getUniform(gl, program, "uOrigin"),
    time: getUniform(gl, program, "uTime"),
    volcanoHeat: getUniform(gl, program, "uVolcanoHeat"),
    depthField: getUniform(gl, program, "uDepthField"),
    depthOrigin: getUniform(gl, program, "uDepthOrigin"),
    volcanoOrigin: getUniform(gl, program, "uVolcanoOrigin"),
    fogColor: getUniform(gl, program, "uFogColor"),
  };
}

function createParticleProgram(gl: WebGLRenderingContext): ParticleProgram {
  const program = createProgram(gl, PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER);
  return {
    program,
    position: gl.getAttribLocation(program, "aPosition"),
    alpha: gl.getAttribLocation(program, "aAlpha"),
    viewProjection: getUniform(gl, program, "uViewProjection"),
    color: getUniform(gl, program, "uColor"),
    size: getUniform(gl, program, "uSize"),
  };
}




function buildWaterMesh() {
  const step = WATER_SIZE / WATER_SEGMENTS;
  const vertices: number[] = [];
  for (let z = 0; z < WATER_SEGMENTS; z += 1) {
    for (let x = 0; x < WATER_SEGMENTS; x += 1) {
      const x0 = -WATER_SIZE / 2 + x * step;
      const x1 = x0 + step;
      const z0 = -WATER_SIZE / 2 + z * step;
      const z1 = z0 + step;
      vertices.push(
        x0, 0, z0, x0, 0, z1, x1, 0, z1,
        x0, 0, z0, x1, 0, z1, x1, 0, z0,
      );
    }
  }
  return new Float32Array(vertices);
}

export class VoxelVoyageEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly gl2: WebGL2RenderingContext | null;
  private readonly graphicsBackend: string;
  private readonly options: VoxelEngineOptions;
  private readonly litProgram: LitProgram;
  private readonly packedTerrainProgram: PackedTerrainProgram | null;
  private readonly waterProgram: WaterProgram;
  private readonly particleProgram: ParticleProgram;
  private readonly world: VoxelWorld;
  private readonly stream = new VoxelStream();
  private readonly terrainChunks = new Map<string, TerrainChunkGeometry>();
  private readonly terrainMeshes = new Map<string, TerrainBatchMesh>();
  private readonly dirtyBatches = new Set<string>();
  private readonly dirtyChunks = new Set<string>();
  private worldTime = 0;
  private nearby: Region[] = [];
  private localRegion!: Region;
  private activeHarbor!: Harbor;
  private activeVolcano: Region | null = null;
  private regionSyncClock = 0;
  private streamCpuMs = 0;
  private depthOriginX = Number.NaN;
  private depthOriginZ = Number.NaN;
  private readonly depthData = new Uint8Array(DEPTH_FIELD_SIZE * DEPTH_FIELD_SIZE * 4);
  private readonly depthTexture: WebGLTexture;
  private depthDirty = true;
  private readonly waterMesh: GpuMesh;
  private readonly boatHullMeshes: Record<ShipHullId, GpuMesh>;
  private readonly boatSailMeshes: Record<ShipHullId, GpuMesh>;
  private readonly equipmentMeshes: Record<EquipmentId, GpuMesh>;
  private readonly projectileMeshes: Record<EquipmentId, GpuMesh>;
  private readonly corsairMesh: GpuMesh;
  private readonly harborMeshes = new Map<number,GpuMesh>();
  private readonly harborWorkerMesh: GpuMesh;
  private readonly harborCatMesh: GpuMesh;
  private readonly craneHookMesh: GpuMesh;
  private readonly wreckMesh: GpuMesh;
  private readonly cargoMesh: GpuMesh;
  private readonly beaconMesh: GpuMesh;
  private readonly cloudMesh: GpuMesh;
  private readonly seaLifeMeshes: Record<SeaLifeKind, GpuMesh>;
  private readonly particleBuffer: WebGLBuffer;
  private readonly lavaMaterialTexture: WebGLTexture | null;
  private readonly lavaMaterialData = new Uint8Array(LAVA_MATERIAL_SIZE * LAVA_MATERIAL_SIZE);
  private readonly lavaMaterialScratch = new Uint8Array(LAVA_MATERIAL_SIZE * LAVA_MATERIAL_SIZE);
  private readonly visibleTerrainChunks = new Set<string>();
  private readonly controls: Record<VoxelControl, boolean> = {
    left: false,
    right: false,
    sail: false,
    reef: false,
  };
  private phase: VoxelPhase = "intro";
  private frameRequest = 0;
  private lastFrameTime = 0;
  private snapshotClock = 0;
  private fpsClock = 0;
  private fpsFrames = 0;
  private fps = 60;
  private qualityScale = 1;
  private volcanoClock = 22;
  private lavaHeat = 0.42;
  private lavaFlow = 0;
  private lavaDeposit = 0;
  private renderedLavaDeposit = -1;
  private renderedLavaHeat = -1;
  private previousVolcanoPhase = 1;
  private boatX = 0;
  private boatY = 0.38;
  private boatZ = 18;
  private boatVerticalVelocity = 0;
  private boatHeading = 0;
  private boatAngularVelocity = 0;
  private boatVelocityX = 0;
  private boatVelocityZ = 0;
  private boatSpeed = 0;
  private sail = 0.62;
  private roll = 0;
  private pitch = 0;
  private hull = 100;
  private shipHull: ShipHullId = "windcutter";
  private readonly loadout: EquipmentId[] = ["swivel_8"];
  private readonly equipmentCooldowns: number[] = [0];
  private collisionCooldown = 0;
  private wakeClock = 0;
  private notice = "The seabed is stable.";
  private noticeTimer = 0;
  private triangleCount = 0;
  private visibleTriangleCount = 0;
  private visibleChunkCount = 0;
  private terrainDrawCalls = 0;
  private terrainBufferBytes = 0;
  private renderCpuMs = 0;
  private gpuDrawMs: number | null = null;
  private terrainBuildCount = 0;
  private terrainUploadCount = 0;
  private terrainSkippedCount = 0;
  private frameNumber = 0;
  private readonly gpuTimer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private readonly pendingGpuQueries: WebGLQuery[] = [];
  private cameraX = 0;
  private cameraY = 17.6;
  private cameraZ = 37.4;
  private viewScale = 1;
  private randomState = 0x1a2b3c4d;
  private cargo = 0;
  private fish = 0;
  private coins = 4;
  private netProgress = 0;
  private netTarget = -1;
  private netCooldown = 0;
  private dockingActive = false;
  private readonly wakes: WakeParticle[] = [];
  private readonly eruption: Particle[] = [];
  private readonly weaponProjectiles: WeaponProjectile[] = [];
  private readonly corsairs: CorsairTarget[] = [];
  private readonly shoreFoamByChunk = new Map<string, FoamPoint[]>();
  private readonly salvage: Salvage[] = [];
  private readonly seaLife: SeaLife[] = [];
  private readonly contextLost: (event: Event) => void;

  constructor(canvas: HTMLCanvasElement, options: VoxelEngineOptions) {
    this.canvas = canvas;
    this.options = options;
    this.world = new VoxelWorld(options.seed ?? WORLD_SEED);
    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: true,
      depth: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    };
    const webgl2 = canvas.getContext("webgl2", contextAttributes);
    const gl = (webgl2 || canvas.getContext("webgl", contextAttributes)) as WebGLRenderingContext | null;
    if (!gl) throw new Error("This browser or device does not support WebGL.");
    this.gl = gl;
    this.gl2 = webgl2;
    const depthTexture = gl.createTexture();
    if (!depthTexture) throw new Error("Unable to create the seabed depth texture");
    this.depthTexture = depthTexture;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DEPTH_FIELD_SIZE, DEPTH_FIELD_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.depthData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.graphicsBackend = webgl2 ? "WebGL 2" : "WebGL 1";
    this.litProgram = createLitProgram(gl);
    this.packedTerrainProgram = webgl2 ? createPackedTerrainProgram(webgl2) : null;
    this.waterProgram = createWaterProgram(gl);
    this.particleProgram = createParticleProgram(gl);
    this.gpuTimer = webgl2
      ? webgl2.getExtension("EXT_disjoint_timer_query_webgl2") as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null
      : null;
    if (webgl2) {
      const texture = webgl2.createTexture();
      if (!texture) throw new Error("Unable to create the lava heat texture");
      webgl2.bindTexture(webgl2.TEXTURE_2D, texture);
      webgl2.pixelStorei(webgl2.UNPACK_ALIGNMENT, 1);
      webgl2.texImage2D(webgl2.TEXTURE_2D, 0, webgl2.R8UI, LAVA_MATERIAL_SIZE, LAVA_MATERIAL_SIZE, 0, webgl2.RED_INTEGER, webgl2.UNSIGNED_BYTE, this.lavaMaterialData);
      webgl2.texParameteri(webgl2.TEXTURE_2D, webgl2.TEXTURE_MIN_FILTER, webgl2.NEAREST);
      webgl2.texParameteri(webgl2.TEXTURE_2D, webgl2.TEXTURE_MAG_FILTER, webgl2.NEAREST);
      webgl2.texParameteri(webgl2.TEXTURE_2D, webgl2.TEXTURE_WRAP_S, webgl2.CLAMP_TO_EDGE);
      webgl2.texParameteri(webgl2.TEXTURE_2D, webgl2.TEXTURE_WRAP_T, webgl2.CLAMP_TO_EDGE);
      this.lavaMaterialTexture = texture;
    } else {
      this.lavaMaterialTexture = null;
    }
    this.waterMesh = this.uploadPositionMesh(buildWaterMesh());
    this.boatHullMeshes = {
      windcutter: this.uploadLitMesh(new Float32Array(buildBoatHull("windcutter"))),
      brigantine: this.uploadLitMesh(new Float32Array(buildBoatHull("brigantine"))),
      grand_voyager: this.uploadLitMesh(new Float32Array(buildBoatHull("grand_voyager"))),
    };
    this.boatSailMeshes = {
      windcutter: this.uploadLitMesh(new Float32Array(buildBoatSails("windcutter"))),
      brigantine: this.uploadLitMesh(new Float32Array(buildBoatSails("brigantine"))),
      grand_voyager: this.uploadLitMesh(new Float32Array(buildBoatSails("grand_voyager"))),
    };
    this.equipmentMeshes = {
      swivel_8: this.uploadLitMesh(new Float32Array(buildEquipment("swivel_8"))),
      long_18: this.uploadLitMesh(new Float32Array(buildEquipment("long_18"))),
      wave_ballista: this.uploadLitMesh(new Float32Array(buildEquipment("wave_ballista"))),
      gear_net: this.uploadLitMesh(new Float32Array(buildEquipment("gear_net"))),
    };
    this.projectileMeshes = {
      swivel_8: this.uploadLitMesh(new Float32Array(buildWeaponProjectile("swivel_8"))),
      long_18: this.uploadLitMesh(new Float32Array(buildWeaponProjectile("long_18"))),
      wave_ballista: this.uploadLitMesh(new Float32Array(buildWeaponProjectile("wave_ballista"))),
      gear_net: this.uploadLitMesh(new Float32Array(buildWeaponProjectile("gear_net"))),
    };
    this.corsairMesh = this.uploadLitMesh(new Float32Array(buildCorsairTarget()));
    this.harborMeshes.set(0, this.uploadLitMesh(new Float32Array(buildHarbor(0))));
    this.harborWorkerMesh = this.uploadLitMesh(new Float32Array(buildHarborWorker()));
    this.harborCatMesh = this.uploadLitMesh(new Float32Array(buildHarborCat()));
    this.craneHookMesh = this.uploadLitMesh(new Float32Array(buildCraneHook()));
    this.wreckMesh = this.uploadLitMesh(new Float32Array(buildWreck()));
    this.cargoMesh = this.uploadLitMesh(new Float32Array(buildCargo()));
    this.beaconMesh = this.uploadLitMesh(new Float32Array(buildBeacon()));
    this.cloudMesh = this.uploadLitMesh(new Float32Array(buildCloud()));
    this.seaLifeMeshes = {
      fish: this.uploadLitMesh(new Float32Array(buildSeaLife("fish"))),
      turtle: this.uploadLitMesh(new Float32Array(buildSeaLife("turtle"))),
      ray: this.uploadLitMesh(new Float32Array(buildSeaLife("ray"))),
      octopus: this.uploadLitMesh(new Float32Array(buildSeaLife("octopus"))),
    };
    const particleBuffer = gl.createBuffer();
    if (!particleBuffer) throw new Error("Unable to create the particle buffer");
    this.particleBuffer = particleBuffer;
    this.syncWorldEntities();
    this.rebuildTerrain(true);
    this.contextLost = (event) => {
      event.preventDefault();
      this.options.onError("The 3D graphics context was lost. Refresh the page to return to the sea.");
      this.pause();
    };
    this.canvas.addEventListener("webglcontextlost", this.contextLost);
    this.emitSnapshot();
    this.frameRequest = window.requestAnimationFrame(this.frame);
  }

  begin() {
    if (!this.stream.readyAt(this.boatX, this.boatZ, 2)) return;
    this.phase = "sailing";
    this.setNotice("Explore the islands, fish, wrecks, and beacons. The chart marks the nearest harbor.");
    this.emitSnapshot();
  }

  pause() {
    if (this.phase === "sailing") this.phase = "paused";
    this.clearControls();
    this.emitSnapshot();
  }

  resume() {
    if (this.phase === "paused") this.phase = "sailing";
    this.emitSnapshot();
  }

  setControl(control: VoxelControl, pressed: boolean) {
    this.controls[control] = pressed;
  }

  zoomView(inward: boolean) {
    this.viewScale = clamp(this.viewScale * (inward ? 0.82 : 1 / 0.82), 0.52, 1.22);
  }

  fireWeapons() {
    if (this.phase !== "sailing" || this.dockingActive) return;
    const hardpoints = hardpointsForHull(this.shipHull);
    const forwardX = Math.sin(this.boatHeading);
    const forwardZ = -Math.cos(this.boatHeading);
    let fired = 0;
    for (let slot = 0; slot < this.loadout.length; slot += 1) {
      const equipment = this.loadout[slot];
      const spec = getEquipment(equipment);
      if (spec.category !== "weapon" || (this.equipmentCooldowns[slot] || 0) > 0) continue;
      const hardpoint = hardpoints[slot];
      if (!hardpoint) continue;
      const x = this.boatX + hardpoint.x * Math.cos(this.boatHeading) + hardpoint.z * Math.sin(this.boatHeading);
      const z = this.boatZ + hardpoint.x * Math.sin(this.boatHeading) - hardpoint.z * Math.cos(this.boatHeading);
      this.weaponProjectiles.push({
        equipment,
        x,
        y: this.boatY + hardpoint.y + 0.28,
        z,
        vx: this.boatVelocityX + forwardX * spec.projectileSpeed,
        vy: equipment === "wave_ballista" ? 0.04 : equipment === "long_18" ? 0.42 : 0.25,
        vz: this.boatVelocityZ + forwardZ * spec.projectileSpeed,
        damage: spec.damage,
        age: 0,
        life: spec.range / spec.projectileSpeed,
      });
      this.equipmentCooldowns[slot] = spec.cooldown;
      fired += 1;
    }
    if (this.weaponProjectiles.length > 36) this.weaponProjectiles.splice(0, this.weaponProjectiles.length - 36);
    if (fired > 0) {
      this.setNotice(`${fired} deck weapons fired.`);
    } else if (this.loadout.some((id) => getEquipment(id).category === "weapon")) {
      this.setNotice("Weapons are reloading.");
    } else {
      this.setNotice("No weapons are installed. Equip them at the Tidehaven shipyard.");
    }
    this.emitSnapshot();
  }

  buyShipHull(id: ShipHullId) {
    if (this.phase !== "docked") return;
    const currentIndex = SHIP_HULLS.findIndex((candidate) => candidate.id === this.shipHull);
    const targetIndex = SHIP_HULLS.findIndex((candidate) => candidate.id === id);
    if (targetIndex <= currentIndex) {
      this.setNotice(id === this.shipHull ? "This hull is already equipped." : "The shipyard only upgrades to larger hulls.");
    } else {
      const hull = getShipHull(id);
      if (this.coins < hull.price) {
        this.setNotice(`${hull.name} costs ${hull.price} coins`);
      } else {
        this.coins -= hull.price;
        this.shipHull = id;
        this.boatY += (hull.draft - getShipHull(SHIP_HULLS[currentIndex].id).draft) * 0.06;
        this.setNotice(`${hull.name} is ready with ${hull.slots} deck slots.`);
      }
    }
    this.emitSnapshot();
  }

  buyEquipment(id: EquipmentId) {
    if (this.phase !== "docked") return;
    const hull = getShipHull(this.shipHull);
    const equipment = getEquipment(id);
    if (this.loadout.length >= hull.slots) {
      this.setNotice(`${hull.name} has ${hull.slots} full slots. Upgrade the hull or sell equipment.`);
    } else if (this.coins < equipment.price) {
      this.setNotice(`${equipment.name} costs ${equipment.price} coins`);
    } else {
      this.coins -= equipment.price;
      this.loadout.push(id);
      this.equipmentCooldowns.push(0);
      this.setNotice(`${equipment.name} installed in slot ${this.loadout.length}.`);
    }
    this.emitSnapshot();
  }

  sellEquipment(slot: number) {
    if (this.phase !== "docked" || slot < 0 || slot >= this.loadout.length) return;
    const equipment = getEquipment(this.loadout[slot]);
    const refund = Math.floor(equipment.price / 2);
    this.loadout.splice(slot, 1);
    this.equipmentCooldowns.splice(slot, 1);
    this.coins += refund;
    this.setNotice(`${equipment.name} sold for ${refund} coins`);
    this.emitSnapshot();
  }

  triggerEruption() {
    if (this.phase !== "sailing") return;
    if (!this.activeVolcano) { this.setNotice("No active volcano is nearby. The chart marks volcanic regions."); return; }
    this.world.triggerVolcano(this.activeVolcano, this.worldTime);
    this.updateVolcano(0);
    this.setNotice("The volcano erupts; lava is flowing toward the sea.");
    this.emitSnapshot();
  }

  interact() {
    if (this.phase !== "sailing" || this.dockingActive || this.netProgress > 0) return;
    const salvageIndex = this.nearestSalvageIndex();
    if (salvageIndex >= 0) {
      this.salvage[salvageIndex].collected = true;
      this.world.collect(this.salvage[salvageIndex].id, this.salvage[salvageIndex].slot);
      this.cargo += 1;
      this.setNotice("Cargo recovered. Sell it at Tidehaven.");
      this.emitSnapshot();
      return;
    }

    const fishIndex = this.nearestFishIndex();
    if (fishIndex >= 0) {
      const profile = fishingProfile(this.loadout);
      if (this.sail > profile.maximumSail || this.boatSpeed > profile.maximumSpeed) {
        this.setNotice(`To fish, keep sails below ${Math.round(profile.maximumSail * 100)}% and speed below ${profile.maximumSpeed.toFixed(1)} kn`);
      } else if (this.netCooldown > 0) {
        this.setNotice("The net is not ready yet.");
      } else {
        this.netTarget = fishIndex;
        this.netProgress = 0.01;
        this.setNotice("The net is sinking. Stay slow and close to the fish.");
      }
      this.emitSnapshot();
      return;
    }

    if (this.harborDistance() < 6.2) {
      if (this.sail > 0.3 || this.boatSpeed > 1.45) {
        this.setNotice("Lower your sails and slow to 1.5 knots or less before docking.");
      } else {
        this.dockingActive = true;
        this.setNotice("Tidehaven pilot lights are guiding the ship to the pier.");
      }
      this.emitSnapshot();
      return;
    }

    this.setNotice("Approach cargo, fish, or Tidehaven to interact.");
    this.emitSnapshot();
  }

  sellCargo() {
    if (this.phase !== "docked" || (this.cargo === 0 && this.fish === 0)) return;
    const earned = this.cargo * 6 + this.fish * 4;
    this.coins += earned;
    this.cargo = 0;
    this.fish = 0;
    this.setNotice(`Cargo sold at Tidehaven for ${earned} coins`);
    this.emitSnapshot();
  }

  repairHull() {
    if (this.phase !== "docked" || this.hull >= 100) return;
    if (this.coins < 8) {
      this.setNotice("Hull repairs cost 8 coins.");
    } else {
      this.coins -= 8;
      this.hull = Math.min(100, this.hull + 28);
      this.setNotice("Repairs complete. Hull restored by 28%.");
    }
    this.emitSnapshot();
  }

  departHarbor() {
    if (this.phase !== "docked") return;
    this.phase = "sailing";
    this.dockingActive = false;
    this.boatHeading = Math.PI / 2;
    this.boatVelocityX = 0.62;
    this.boatVelocityZ = 0;
    this.boatAngularVelocity = 0;
    this.sail = Math.max(this.sail, 0.2);
    this.setNotice(`${this.activeHarbor.name}: departure complete. Follow the deep-water channel.`);
    this.emitSnapshot();
  }

  resetWorld() {
    if (this.phase === "docked") this.phase = "sailing";
    this.world.reset();
    this.worldTime = 0;
    this.volcanoClock = 22;
    this.lavaHeat = 0.42;
    this.lavaFlow = 0;
    this.lavaDeposit = 0;
    this.renderedLavaDeposit = -1;
    this.renderedLavaHeat = -1;
    this.previousVolcanoPhase = 1;
    this.boatX = 0;
    this.boatY = 0.38;
    this.boatZ = 18;
    this.boatVerticalVelocity = 0;
    this.boatHeading = 0;
    this.boatAngularVelocity = 0;
    this.boatVelocityX = 0;
    this.boatVelocityZ = 0;
    this.boatSpeed = 0;
    this.sail = 0.62;
    this.roll = 0;
    this.pitch = 0;
    this.hull = 100;
    this.shipHull = "windcutter";
    this.loadout.splice(0, this.loadout.length, "swivel_8");
    this.equipmentCooldowns.splice(0, this.equipmentCooldowns.length, 0);
    this.cargo = 0;
    this.fish = 0;
    this.coins = 4;
    this.netProgress = 0;
    this.netTarget = -1;
    this.netCooldown = 0;
    this.dockingActive = false;
    for (const salvage of this.salvage) salvage.collected = false;
    for (const life of this.seaLife) life.caught = false;
    this.wakes.length = 0;
    this.eruption.length = 0;
    this.weaponProjectiles.length = 0;
    for (const corsair of this.corsairs) {
      corsair.hull = corsair.maxHull;
      corsair.sunk = false;
    }
    this.syncWorldEntities();
    this.rebuildTerrain(true);
    this.setNotice("The world and voyage have been reset.");
    this.emitSnapshot();
  }

  destroy() {
    window.cancelAnimationFrame(this.frameRequest);
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    const gl = this.gl;
    for (const mesh of this.terrainMeshes.values()) {
      if (!mesh) continue;
      gl.deleteBuffer(mesh.buffer);
      if (mesh.detailBuffer) gl.deleteBuffer(mesh.detailBuffer);
    }
    gl.deleteBuffer(this.waterMesh.buffer);
    gl.deleteTexture(this.depthTexture);
    for (const mesh of Object.values(this.boatHullMeshes)) gl.deleteBuffer(mesh.buffer);
    for (const mesh of Object.values(this.boatSailMeshes)) gl.deleteBuffer(mesh.buffer);
    for (const mesh of Object.values(this.equipmentMeshes)) gl.deleteBuffer(mesh.buffer);
    for (const mesh of Object.values(this.projectileMeshes)) gl.deleteBuffer(mesh.buffer);
    gl.deleteBuffer(this.corsairMesh.buffer);
    for (const mesh of this.harborMeshes.values()) gl.deleteBuffer(mesh.buffer);
    gl.deleteBuffer(this.harborWorkerMesh.buffer);
    gl.deleteBuffer(this.harborCatMesh.buffer);
    gl.deleteBuffer(this.craneHookMesh.buffer);
    gl.deleteBuffer(this.wreckMesh.buffer);
    gl.deleteBuffer(this.cargoMesh.buffer);
    gl.deleteBuffer(this.beaconMesh.buffer);
    gl.deleteBuffer(this.cloudMesh.buffer);
    for (const mesh of Object.values(this.seaLifeMeshes)) gl.deleteBuffer(mesh.buffer);
    gl.deleteBuffer(this.particleBuffer);
    if (this.lavaMaterialTexture) gl.deleteTexture(this.lavaMaterialTexture);
    gl.deleteProgram(this.litProgram.program);
    if (this.packedTerrainProgram) gl.deleteProgram(this.packedTerrainProgram.program);
    gl.deleteProgram(this.waterProgram.program);
    gl.deleteProgram(this.particleProgram.program);
    if (this.gl2) {
      for (const query of this.pendingGpuQueries) this.gl2.deleteQuery(query);
      this.pendingGpuQueries.length = 0;
    }
  }

  private readonly frame = (time: number) => {
    const delta = this.lastFrameTime > 0 ? Math.min(0.05, (time - this.lastFrameTime) / 1000) : 1 / 60;
    this.lastFrameTime = time;
    if (document.hidden) { this.frameRequest = window.requestAnimationFrame(this.frame); return; }
    if (!document.hidden) {
      if (this.phase === "sailing" || this.phase === "docked") {
        this.worldTime += delta;
        this.regionSyncClock -= delta;
        if (this.regionSyncClock <= 0 && this.netProgress === 0) {
          this.syncWorldEntities();
          this.regionSyncClock = 1;
        }
        this.updateVolcano(delta);
        this.updateEruption(delta);
      }
      if (this.phase === "sailing") this.update(delta, this.worldTime);
      this.serviceTerrain();
    }
    const renderStartedAt = performance.now();
    this.render(this.worldTime);
    const renderElapsed = performance.now() - renderStartedAt;
    this.renderCpuMs = this.renderCpuMs === 0 ? renderElapsed : lerp(this.renderCpuMs, renderElapsed, 0.08);
    this.fpsClock += delta;
    this.fpsFrames += 1;
    this.snapshotClock += delta;
    if (this.fpsClock >= 1) {
      this.fps = Math.round(this.fpsFrames / this.fpsClock);
      this.fpsClock = 0;
      this.fpsFrames = 0;
      if (this.fps < 38) this.qualityScale = Math.max(0.7, this.qualityScale - 0.08);
      else if (this.fps > 56) this.qualityScale = Math.min(1, this.qualityScale + 0.04);
    }
    if (this.snapshotClock >= 0.18) {
      this.snapshotClock = 0;
      this.emitSnapshot();
    }
    this.frameRequest = window.requestAnimationFrame(this.frame);
  };

  private update(delta: number, time: number) {
    this.netCooldown = Math.max(0, this.netCooldown - delta);
    for (let slot = 0; slot < this.equipmentCooldowns.length; slot += 1) {
      this.equipmentCooldowns[slot] = Math.max(0, (this.equipmentCooldowns[slot] || 0) - delta);
    }
    const hullSpec = getShipHull(this.shipHull);
    if (!this.dockingActive) {
      if (this.controls.sail) this.sail = clamp(this.sail + delta * 0.42, 0, 1);
      if (this.controls.reef) this.sail = clamp(this.sail - delta * 0.72, 0, 1);
    } else {
      this.sail = lerp(this.sail, 0, 1 - Math.exp(-2.8 * delta));
    }

    let steering = Number(this.controls.right) - Number(this.controls.left);
    if (this.dockingActive) {
      const targetHeading = Math.atan2(this.activeHarbor.dockX - this.boatX, -(this.activeHarbor.dockZ - this.boatZ));
      steering = clamp(angleDelta(this.boatHeading, targetHeading) * 2.4, -1, 1);
    }
    const forwardVelocity = this.boatVelocityX * Math.sin(this.boatHeading) - this.boatVelocityZ * Math.cos(this.boatHeading);
    const steerAuthority = 0.16 + Math.min(Math.abs(forwardVelocity) / 3.6, 1) * 0.92;
    this.boatAngularVelocity += steering * steerAuthority * hullSpec.turning * delta;
    this.boatAngularVelocity *= Math.exp(-2.15 * delta);
    this.boatAngularVelocity = clamp(this.boatAngularVelocity, -0.82, 0.82);
    this.boatHeading += this.boatAngularVelocity * delta;

    const forwardX = Math.sin(this.boatHeading);
    const forwardZ = -Math.cos(this.boatHeading);
    const rightX = Math.cos(this.boatHeading);
    const rightZ = Math.sin(this.boatHeading);
    const windHeading = this.windHeadingAt(time);
    const windStrength = this.windStrengthAt(time);
    const windAngle = Math.abs(angleDelta(this.boatHeading, windHeading));
    const sailPressure = 0.18 + Math.pow(Math.sin(windAngle), 2) * 0.82;
    if (!this.dockingActive) {
      const thrust = this.sail * (0.62 + windStrength * 0.32) * sailPressure * hullSpec.sailPower;
      this.boatVelocityX += forwardX * thrust * delta;
      this.boatVelocityZ += forwardZ * thrust * delta;
    }

    let longitudinal = this.boatVelocityX * forwardX + this.boatVelocityZ * forwardZ;
    let lateral = this.boatVelocityX * rightX + this.boatVelocityZ * rightZ;
    const longitudinalDrag = (0.08 + Math.abs(longitudinal) * 0.018) * longitudinal;
    const lateralDrag = lateral * (0.76 + Math.abs(lateral) * 0.12);
    longitudinal -= longitudinalDrag * delta;
    lateral -= lateralDrag * delta;
    if (this.controls.reef) longitudinal *= Math.exp(-0.8 * delta);
    this.boatVelocityX = forwardX * longitudinal + rightX * lateral;
    this.boatVelocityZ = forwardZ * longitudinal + rightZ * lateral;

    const current = this.currentAt(this.boatX, this.boatZ, time);
    this.boatVelocityX += current[0] * delta;
    this.boatVelocityZ += current[1] * delta;

    if (this.dockingActive) {
      const distance = this.harborDistance();
      const desiredSpeed = clamp(distance * 0.28, 0.16, 0.72);
      this.boatVelocityX = lerp(this.boatVelocityX, forwardX * desiredSpeed, 1 - Math.exp(-1.8 * delta));
      this.boatVelocityZ = lerp(this.boatVelocityZ, forwardZ * desiredSpeed, 1 - Math.exp(-1.8 * delta));
      if (distance < 0.48 && Math.hypot(this.boatVelocityX, this.boatVelocityZ) < 0.62) {
        this.boatVelocityX = 0;
        this.boatVelocityZ = 0;
        this.boatSpeed = 0;
        this.sail = 0;
        this.dockingActive = false;
        this.phase = "docked";
        this.setNotice("Docking complete. The harbor is ready to handle your cargo.");
      }
    }

    this.boatSpeed = Math.hypot(this.boatVelocityX, this.boatVelocityZ);
    const previousX = this.boatX;
    const previousZ = this.boatZ;
    const nextX = this.boatX + this.boatVelocityX * delta;
    const nextZ = this.boatZ + this.boatVelocityZ * delta;
    if (this.stream.readyAt(nextX, nextZ, 2)) {
      this.boatX = nextX;
      this.boatZ = nextZ;
    }
    this.resolveTerrainCollision(previousX, previousZ, forwardX, forwardZ);

    const lengthScale = hullSpec.halfRows / 6;
    const waveSamples = [
      [0, -1.9 * lengthScale], [-0.78 * hullSpec.beam, -0.65 * lengthScale], [0.78 * hullSpec.beam, -0.65 * lengthScale],
      [-0.72 * hullSpec.beam, 1.18 * lengthScale], [0.72 * hullSpec.beam, 1.18 * lengthScale], [0, 1.82 * lengthScale],
    ] as const;
    let totalWater = 0;
    let frontWater = 0;
    let backWater = 0;
    let leftWater = 0;
    let rightWater = 0;
    for (const [localX, localZ] of waveSamples) {
      const worldX = this.boatX + localX * Math.cos(this.boatHeading) + localZ * Math.sin(this.boatHeading);
      const worldZ = this.boatZ + localX * Math.sin(this.boatHeading) - localZ * Math.cos(this.boatHeading);
      const height = this.waveHeight(worldX, worldZ, time);
      totalWater += height;
      if (localZ < 0) frontWater += height / 3;
      else backWater += height / 3;
      if (localX < 0) leftWater += height / 2;
      else if (localX > 0) rightWater += height / 2;
    }
    const targetY = totalWater / BUOYANCY_SAMPLES + 0.36 - (hullSpec.draft - 1) * 0.12;
    const verticalForce = (targetY - this.boatY) * 15 - this.boatVerticalVelocity * 5.4;
    this.boatVerticalVelocity += verticalForce * delta;
    this.boatY += this.boatVerticalVelocity * delta;
    const targetPitch = clamp((backWater - frontWater) * 0.65, -0.14, 0.14);
    const targetRoll = clamp((rightWater - leftWater) * 0.8 - this.boatAngularVelocity * 0.24, -0.18, 0.18);
    this.pitch = lerp(this.pitch, targetPitch, 1 - Math.exp(-3.2 * delta));
    this.roll = lerp(this.roll, targetRoll, 1 - Math.exp(-4 * delta));

    this.collisionCooldown = Math.max(0, this.collisionCooldown - delta);
    this.noticeTimer = Math.max(0, this.noticeTimer - delta);
    if (this.noticeTimer === 0) this.notice = this.contextNotice();

    this.updateWake(delta, time, forwardX, forwardZ);
    this.updateWeaponProjectiles(delta, time);
    this.updateFishing(delta, time);
    const navigationLimit = WORLD_HALF - 20;
    if (Math.abs(this.boatX) > navigationLimit || Math.abs(this.boatZ) > navigationLimit) {
      this.boatX = lerp(this.boatX, clamp(this.boatX, -navigationLimit, navigationLimit), delta * 2);
      this.boatZ = lerp(this.boatZ, clamp(this.boatZ, -navigationLimit, navigationLimit), delta * 2);
      this.boatVelocityX *= Math.pow(0.5, delta);
      this.boatVelocityZ *= Math.pow(0.5, delta);
      this.setNotice("You have reached the edge of the chart. The current is guiding you back.");
    }
  }

  private resolveTerrainCollision(previousX: number, previousZ: number, forwardX: number, forwardZ: number) {
    const rightX = Math.cos(this.boatHeading);
    const rightZ = Math.sin(this.boatHeading);
    const hull = getShipHull(this.shipHull);
    const lengthScale = hull.halfRows / 6;
    const samples = [
      [forwardX * 2.15 * lengthScale, forwardZ * 2.15 * lengthScale],
      [forwardX * 0.65 * lengthScale + rightX * 0.82 * hull.beam, forwardZ * 0.65 * lengthScale + rightZ * 0.82 * hull.beam],
      [forwardX * 0.65 * lengthScale - rightX * 0.82 * hull.beam, forwardZ * 0.65 * lengthScale - rightZ * 0.82 * hull.beam],
      [-forwardX * 1.25 * lengthScale + rightX * 0.72 * hull.beam, -forwardZ * 1.25 * lengthScale + rightZ * 0.72 * hull.beam],
      [-forwardX * 1.25 * lengthScale - rightX * 0.72 * hull.beam, -forwardZ * 1.25 * lengthScale - rightZ * 0.72 * hull.beam],
    ] as const;
    let collisionSample = -1;
    for (let index = 0; index < samples.length; index += 1) {
      const [offsetX, offsetZ] = samples[index];
      if (this.terrainHeight(this.boatX + offsetX, this.boatZ + offsetZ) > -0.34) {
        collisionSample = index;
        break;
      }
    }
    if (collisionSample < 0) return;
    this.boatX = previousX;
    this.boatZ = previousZ;
    const gradientX = this.terrainHeight(previousX + 0.7, previousZ) - this.terrainHeight(previousX - 0.7, previousZ);
    const gradientZ = this.terrainHeight(previousX, previousZ + 0.7) - this.terrainHeight(previousX, previousZ - 0.7);
    const length = Math.hypot(gradientX, gradientZ) || 1;
    const normalX = -gradientX / length;
    const normalZ = -gradientZ / length;
    this.boatX += normalX * 0.14;
    this.boatZ += normalZ * 0.14;
    const impactSpeed = Math.max(0, -(this.boatVelocityX * normalX + this.boatVelocityZ * normalZ));
    if (impactSpeed > 0) {
      this.boatVelocityX += normalX * impactSpeed * 1.22;
      this.boatVelocityZ += normalZ * impactSpeed * 1.22;
      const tangentX = -normalZ;
      const tangentZ = normalX;
      const tangentSpeed = this.boatVelocityX * tangentX + this.boatVelocityZ * tangentZ;
      this.boatVelocityX -= tangentX * tangentSpeed * 0.18;
      this.boatVelocityZ -= tangentZ * tangentSpeed * 0.18;
    }
    const lever = collisionSample === 0 ? 0 : collisionSample % 2 === 1 ? 1 : -1;
    this.boatAngularVelocity += lever * clamp(impactSpeed * 0.14, 0.05, 0.34);
    this.boatSpeed = Math.hypot(this.boatVelocityX, this.boatVelocityZ);
    if (this.collisionCooldown <= 0) {
      this.hull = Math.max(0, this.hull - Math.max(3, Math.round(impactSpeed * 2.6)));
      this.collisionCooldown = 1.2;
      this.setNotice("The hull has struck the shore.");
    }
  }

  private updateWake(delta: number, time: number, forwardX: number, forwardZ: number) {
    for (const wake of this.wakes) wake.age += delta;
    while (this.wakes.length > 0 && this.wakes[0].age >= this.wakes[0].life) this.wakes.shift();
    this.wakeClock -= delta;
    if (this.boatSpeed > 0.45 && this.wakeClock <= 0) {
      const rightX = Math.cos(this.boatHeading);
      const rightZ = Math.sin(this.boatHeading);
      const hull = getShipHull(this.shipHull);
      const tailX = this.boatX - forwardX * 1.92 * hull.halfRows / 6;
      const tailZ = this.boatZ - forwardZ * 1.92 * hull.halfRows / 6;
      for (const side of [-1, 1]) {
        const x = tailX + rightX * side * 0.58 * hull.beam;
        const z = tailZ + rightZ * side * 0.58 * hull.beam;
        this.wakes.push({ x, y: this.waveHeight(x, z, time) + 0.06, z, age: 0, life: 3.1 });
      }
      this.wakeClock = clamp(0.16 - this.boatSpeed * 0.012, 0.07, 0.15);
      if (this.wakes.length > 96) this.wakes.splice(0, this.wakes.length - 96);
    }
  }

  private updateVolcano(_delta: number) {
    const region = this.activeVolcano;
    if (!region) { this.lavaHeat = 0; this.lavaFlow = 0; this.lavaDeposit = 0; return; }
    const state = this.world.volcano(region, this.worldTime);
    this.volcanoClock = state.clock;
    this.lavaHeat = state.heat;
    this.lavaFlow = state.flow;
    this.lavaDeposit = state.deposit;
    const heatRequiresRebuild = !this.packedTerrainProgram
      && Math.abs(this.lavaHeat - this.renderedLavaHeat) >= (this.options.reducedMotion ? 0.14 : 0.075);
    if (Math.abs(this.lavaDeposit - this.renderedLavaDeposit) >= (this.options.reducedMotion ? 0.04 : 0.018)
      || heatRequiresRebuild) this.rebuildTerrain(false);
    if (state.index !== this.previousVolcanoPhase) {
      this.previousVolcanoPhase = state.index;
      if (region.volcano && Math.hypot(region.volcano.x - this.boatX, region.volcano.z - this.boatZ) < 55) {
        this.setNotice(["The eruption has paused; basalt remains on the slope.", "Magma pressure is rising; fish are moving away from shore.",
          "The volcano is erupting. Avoid the crater and lava.", "Lava flows through the channels, changing the shoreline.", "Lava cools into rock as the sea returns over the shallows."][state.index]);
      }
    }
  }

  private syncWorldEntities() {
    const previousRegion = this.localRegion?.id;
    this.localRegion = this.world.regionAt(this.boatX, this.boatZ);
    this.world.visit(this.localRegion);
    this.nearby = this.world.nearbyRegions(this.boatX, this.boatZ);
    if (!this.dockingActive && this.phase !== "docked") {
      this.activeHarbor = this.nearby.reduce((best, region) =>
        Math.hypot(region.harbor.dockX - this.boatX, region.harbor.dockZ - this.boatZ)
          < Math.hypot(best.dockX - this.boatX, best.dockZ - this.boatZ) ? region.harbor : best, this.localRegion.harbor);
    }
    const previousVolcano = this.activeVolcano?.id;
    this.activeVolcano = this.nearby.filter((region) => region.volcano
      && Math.hypot(region.volcano.x - this.boatX, region.volcano.z - this.boatZ) < 100)
      .sort((a, b) => Math.hypot(a.volcano!.x - this.boatX, a.volcano!.z - this.boatZ)
        - Math.hypot(b.volcano!.x - this.boatX, b.volcano!.z - this.boatZ))[0] || null;
    if (previousVolcano !== this.activeVolcano?.id) {
      this.renderedLavaDeposit = -1; this.renderedLavaHeat = -1;
    }
    this.salvage.length = 0; this.seaLife.length = 0; this.corsairs.length = 0;
    const close = (x: number, z: number) => Math.hypot(x - this.boatX, z - this.boatZ) < 95;
    for (const region of this.nearby) {
      for (const item of region.salvage) if (close(item.x, item.z)) {
        this.salvage.push({ ...item, collected: this.world.hasCollected(item.id, item.slot) });
      }
      for (const life of region.life) if (close(life.x, life.z)) {
        this.seaLife.push({ ...life, originX: life.x, originZ: life.z, caught: !this.world.fishAvailable(life.id, life.slot, this.worldTime) });
      }
      for (const patrol of region.patrols) if (close(patrol.x, patrol.z)) {
        const maxHull = 4 + region.difficulty * 3;
        const hull = Math.max(0, maxHull - this.world.patrolDamage[patrol.id * 4 + patrol.slot]);
        this.corsairs.push({ ...patrol, originX: patrol.x, originZ: patrol.z, speed: 0.14,
          hull, maxHull, reward: 3 + region.difficulty * 3, sunk: hull === 0 });
      }
    }
    if (previousRegion !== undefined && previousRegion !== this.localRegion.id) {
      this.setNotice(`Entered ${this.localRegion.name} · Sea state ${this.localRegion.difficulty} · Nearest harbor: ${this.activeHarbor.name}`);
    }
  }

  private updateEruption(delta: number) {
    for (const particle of this.eruption) {
      particle.age += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.z += particle.vz * delta;
      particle.vy -= 4.6 * delta;
    }
    for (let index = this.eruption.length - 1; index >= 0; index -= 1) {
      if (this.eruption[index].age >= this.eruption[index].life) this.eruption.splice(index, 1);
    }
    const phase = this.volcanoPhaseIndex();
    if (phase !== 2 && phase !== 3) return;
    const motionFactor = this.options.reducedMotion ? 0.28 : 1;
    const spawnChance = (phase === 2 ? 21 : 3.5) * motionFactor * delta;
    let count = Math.floor(spawnChance);
    if (this.random() < spawnChance - count) count += 1;
    for (let index = 0; index < count && this.eruption.length < 64; index += 1) {
      const angle = this.random() * Math.PI * 2;
      const radius = this.random() * 1.5;
      const center = this.activeVolcano?.volcano;
      if (!center || Math.hypot(center.x - this.boatX, center.z - this.boatZ) > 75) break;
      const x = Math.cos(angle) * radius + center.x;
      const z = Math.sin(angle) * radius + center.z;
      const peak = this.terrainHeight(x, z);
      const force = 1.6 + this.random() * 2.2;
      this.eruption.push({
        x,
        y: peak + 0.35,
        z,
        vx: Math.cos(angle) * force,
        vy: 2.8 + this.random() * 3.6,
        vz: Math.sin(angle) * force,
        age: 0,
        life: 0.9 + this.random() * 1.1,
      });
    }
  }

  private corsairPosition(corsair: CorsairTarget, time: number): Vec3 {
    const motion = corsair.phase + time * corsair.speed;
    const x = corsair.originX + Math.cos(motion) * corsair.radius;
    const z = corsair.originZ + Math.sin(motion) * corsair.radius * 0.68;
    return [x, this.waveHeight(x, z, time) + 0.24, z];
  }

  private updateWeaponProjectiles(delta: number, time: number) {
    for (const projectile of this.weaponProjectiles) {
      projectile.age += delta;
      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.z += projectile.vz * delta;
      projectile.vy -= (projectile.equipment === "wave_ballista" ? 0.16 : 1.35) * delta;
      if (projectile.age >= projectile.life) continue;
      if (this.terrainHeight(projectile.x, projectile.z) > projectile.y - 0.08) {
        projectile.age = projectile.life;
        continue;
      }
      for (const corsair of this.corsairs) {
        if (corsair.sunk) continue;
        const position = this.corsairPosition(corsair, time);
        if (Math.hypot(position[0] - projectile.x, position[2] - projectile.z) > 1.25
          || Math.abs(position[1] + 0.38 - projectile.y) > 1.25) continue;
        projectile.age = projectile.life;
        corsair.hull = Math.max(0, corsair.hull - projectile.damage);
        this.world.patrolDamage[corsair.id * 4 + corsair.slot] = corsair.maxHull - corsair.hull;
        if (corsair.hull === 0) {
          corsair.sunk = true;
          this.coins += corsair.reward;
          this.setNotice(`Pirate target sunk; recovered ${corsair.reward} coins.`);
        } else {
          this.setNotice(`Pirate target hit: ${projectile.damage} damage; target hull ${corsair.hull}/${corsair.maxHull}`);
        }
        break;
      }
    }
    for (let index = this.weaponProjectiles.length - 1; index >= 0; index -= 1) {
      if (this.weaponProjectiles[index].age >= this.weaponProjectiles[index].life) this.weaponProjectiles.splice(index, 1);
    }
  }

  private updateFishing(delta: number, time: number) {
    if (this.netProgress <= 0 || this.netTarget < 0) return;
    const life = this.seaLife[this.netTarget];
    if (!life || life.caught || life.kind !== "fish") {
      this.netProgress = 0;
      this.netTarget = -1;
      return;
    }
    const profile = fishingProfile(this.loadout);
    const position = this.seaLifePosition(life, time);
    if (this.sail > profile.maximumSail + 0.08 || this.boatSpeed > profile.maximumSpeed + 0.3
      || Math.hypot(position[0] - this.boatX, position[2] - this.boatZ) > profile.retainDistance) {
      this.netProgress = 0;
      this.netTarget = -1;
      this.netCooldown = 1.4;
      this.setNotice("The fish escaped. Lower sails, slow down, and stay close to the school.");
      return;
    }
    this.netProgress += delta;
    if (this.netProgress < profile.progressSeconds) return;
    const catchSize = 2 + profile.catchBonus + Math.floor(hash2(Math.floor(life.originX * 7), Math.floor(life.originZ * 7)) * 4);
    life.caught = true;
    this.world.catchFish(life.id, life.slot, this.worldTime);
    this.fish += catchSize;
    this.netProgress = 0;
    this.netTarget = -1;
    this.netCooldown = 2.2;
    this.setNotice(`Net hauled in; added ${catchSize} fish to the hold.`);
  }

  private windHeadingAt(time: number) {
    return (52 + Math.sin(time * 0.035) * 14 + Math.sin(time * 0.011) * 8) / DEG;
  }

  private windStrengthAt(time: number) {
    return 3.9 + Math.sin(time * 0.19) * 0.55 + Math.sin(time * 0.047) * 0.35 + this.gustStrength(time) * 2.4;
  }

  private gustStrength(time: number) {
    const region = this.localRegion;
    if (!region || region.biome === "home") return 0;
    const interior = clamp(1 - Math.max(Math.abs(this.boatX - region.rx * REGION_SIZE), Math.abs(this.boatZ - region.rz * REGION_SIZE)) / 78, 0, 1);
    return clamp((Math.sin(time * 0.035 + region.weatherPhase) - 0.35) / 0.65, 0, 1) * region.difficulty / 5 * interior;
  }

  private currentAt(x: number, z: number, time: number): readonly [number, number] {
    const gust = 1 + this.gustStrength(time) * 1.7;
    const currentX = Math.sin(z * 0.075 + time * 0.08) * 0.085 * gust;
    const currentZ = Math.cos(x * 0.068 - time * 0.065) * 0.07 * gust;
    return [currentX, currentZ];
  }

  private seaLifePosition(life: SeaLife, time: number): Vec3 {
    const motion = this.options.reducedMotion ? life.phase : life.phase + time * life.speed;
    let x = life.originX + Math.cos(motion) * life.radius;
    let z = life.originZ + Math.sin(motion) * life.radius * 0.72;
    const region = this.world.regionAt(x, z);
    if (region.volcano) {
      const distance = Math.hypot(x - region.volcano.x, z - region.volcano.z);
      if (distance < 14 && distance > 0.01) {
        const avoidance = (1 - distance / 14) * this.world.volcano(region, time).heat * 1.1;
        x += (x - region.volcano.x) / distance * avoidance;
        z += (z - region.volcano.z) / distance * avoidance;
      }
    }
    if (this.terrainHeight(x, z) > -1.8) { x = life.originX; z = life.originZ; }
    const y = Math.min(-0.4, Math.max(this.terrainHeight(x, z) + 0.5, -life.depth + Math.sin(motion * 1.7) * 0.12));
    return [x, y, z];
  }

  private nearestSalvageIndex() {
    let nearest = -1;
    let distance = 2.45;
    for (let index = 0; index < this.salvage.length; index += 1) {
      const item = this.salvage[index];
      if (item.collected) continue;
      const nextDistance = Math.hypot(item.x - this.boatX, item.z - this.boatZ);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    }
    return nearest;
  }

  private nearestFishIndex(time = this.worldTime) {
    let nearest = -1;
    let distance = fishingProfile(this.loadout).acquireDistance;
    for (let index = 0; index < this.seaLife.length; index += 1) {
      const life = this.seaLife[index];
      if (life.kind !== "fish" || life.caught) continue;
      const position = this.seaLifePosition(life, time);
      const nextDistance = Math.hypot(position[0] - this.boatX, position[2] - this.boatZ);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    }
    return nearest;
  }

  private harborDistance() {
    return Math.hypot(this.activeHarbor.dockX - this.boatX, this.activeHarbor.dockZ - this.boatZ);
  }

  private actionState() {
    if (this.phase === "docked") return { label: "Docked", available: false };
    if (this.dockingActive) return { label: "Docking", available: false };
    if (this.netProgress > 0) return { label: `Hauling net ${Math.min(99, Math.round(this.netProgress / fishingProfile(this.loadout).progressSeconds * 100))}%`, available: false };
    if (this.nearestSalvageIndex() >= 0) return { label: "Salvage cargo", available: true };
    if (this.nearestFishIndex() >= 0) return { label: "Cast net", available: this.netCooldown <= 0 };
    if (this.harborDistance() < 6.2) return { label: "Request docking", available: true };
    return { label: "Observe", available: false };
  }

  private objectiveText() {
    if (this.phase === "docked") return "Sell your catch and upgrade your hull or deck equipment.";
    if (this.dockingActive) return "Pilot lights guide the ship to the east pier. Keep sails lowered.";
    if (this.cargo + this.fish > 0) return `Sail to ${this.activeHarbor.name} to sell your catch; lower sails and slow down near the beacon.`;
    if (this.corsairs.some((corsair) => !corsair.sunk)) return "Aim at the red-sail target and press Q to fire ready weapons.";
    if (this.salvage.some((item) => !item.collected)) return "Salvage crates from the wreck or lower sails near fish to cast a net.";
    return `Follow the deep-water channel through ${this.localRegion.name} toward the next island.`;
  }

  private contextNotice() {
    const action = this.actionState();
    if (action.available) return `${action.label} is within reach`;
    return `${this.volcanoPhaseName()}: sea conditions, wildlife, and volcanic activity continue.`;
  }

  private render(time: number) {
    this.resizeCanvas();
    const gl = this.gl;
    const gl2 = this.gl2;
    this.frameNumber += 1;
    this.pollGpuTimers();
    let gpuQuery: WebGLQuery | null = null;
    if (gl2 && this.gpuTimer && this.pendingGpuQueries.length < 4 && this.frameNumber % 12 === 0) {
      gpuQuery = gl2.createQuery();
      if (gpuQuery) gl2.beginQuery(this.gpuTimer.TIME_ELAPSED_EXT, gpuQuery);
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.045, 0.23, 0.30, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const forwardX = Math.sin(this.boatHeading);
    const forwardZ = -Math.cos(this.boatHeading);
    const desiredCameraX = this.boatX - forwardX * 19.4 * this.viewScale;
    const desiredCameraY = this.boatY + 21 * this.viewScale;
    const desiredCameraZ = this.boatZ - forwardZ * 19.4 * this.viewScale;
    this.cameraX = lerp(this.cameraX, desiredCameraX, 0.075);
    this.cameraY = lerp(this.cameraY, desiredCameraY, 0.075);
    this.cameraZ = lerp(this.cameraZ, desiredCameraZ, 0.075);
    const target: Vec3 = [this.boatX + forwardX * 6.4 * this.viewScale, this.boatY - 0.35, this.boatZ + forwardZ * 6.4 * this.viewScale];
    const camera: Vec3 = [this.cameraX, this.cameraY, this.cameraZ];
    const view = lookAtMatrix(camera, target, [0, 1, 0]);
    const projection = perspectiveMatrix(45 / DEG, this.canvas.width / Math.max(1, this.canvas.height), 0.1, 190);
    const viewProjection = multiplyMatrix(projection, view);
    const frustum = extractFrustumPlanes(viewProjection);
    this.updateLavaMaterialTexture();

    this.visibleChunkCount = 0;
    this.visibleTriangleCount = 0;
    this.terrainDrawCalls = 0;
    this.visibleTerrainChunks.clear();
    for (const mesh of this.terrainMeshes.values()) {
      if (!mesh) continue;
      if (!sphereInsideFrustum(frustum, mesh.centerX, 2.2, mesh.centerZ, mesh.radius)) continue;
      if (mesh.packed) {
        this.drawPackedTerrain(mesh, viewProjection, camera);
        this.terrainDrawCalls += 1;
        if (mesh.detailBuffer && mesh.detailVertexCount > 0) {
          this.drawLit({ buffer: mesh.detailBuffer, vertexCount: mesh.detailVertexCount }, IDENTITY, viewProjection, camera, 1, 0.02);
          this.terrainDrawCalls += 1;
        }
      } else {
        this.drawLit(mesh, IDENTITY, viewProjection, camera, 1, 0.02);
        this.terrainDrawCalls += 1;
      }
      for (const chunkIndex of mesh.chunkIndices) {
        this.visibleTerrainChunks.add(chunkIndex);
        this.visibleChunkCount += 1;
      }
      this.visibleTriangleCount += mesh.triangleCount;
    }
    this.drawSeaLife(viewProjection, camera, time, frustum);
    this.drawWorldDetails(viewProjection, camera, time, frustum);
    this.drawCorsairs(viewProjection, camera, time, frustum);
    this.drawWeaponProjectiles(viewProjection, camera);

    let boatModel = translationMatrix(this.boatX, this.boatY, this.boatZ);
    boatModel = multiplyMatrix(boatModel, rotationYMatrix(this.boatHeading));
    boatModel = multiplyMatrix(boatModel, rotationZMatrix(this.roll));
    boatModel = multiplyMatrix(boatModel, rotationXMatrix(this.pitch));
    this.drawLit(this.boatHullMeshes[this.shipHull], boatModel, viewProjection, camera, 1);
    let sailModel = multiplyMatrix(boatModel, translationMatrix(0, 1.32, 0));
    sailModel = multiplyMatrix(sailModel, scaleMatrix(1, 0.12 + this.sail * 0.88, 1));
    sailModel = multiplyMatrix(sailModel, translationMatrix(0, -1.32, 0));
    this.drawLit(this.boatSailMeshes[this.shipHull], sailModel, viewProjection, camera, 1);
    const hardpoints = hardpointsForHull(this.shipHull);
    for (let slot = 0; slot < this.loadout.length; slot += 1) {
      const hardpoint = hardpoints[slot];
      if (!hardpoint) continue;
      const equipmentModel = multiplyMatrix(boatModel, translationMatrix(hardpoint.x, hardpoint.y, hardpoint.z));
      this.drawLit(this.equipmentMeshes[this.loadout[slot]], equipmentModel, viewProjection, camera, 1);
    }

    gl.depthMask(false);
    this.drawWater(viewProjection, camera, time);
    this.drawShoreFoam(viewProjection, time);
    this.drawWake(viewProjection);
    this.drawFishingNet(viewProjection, time);
    this.drawEruption(viewProjection);
    gl.depthMask(true);
    if (gl2 && this.gpuTimer && gpuQuery) {
      gl2.endQuery(this.gpuTimer.TIME_ELAPSED_EXT);
      this.pendingGpuQueries.push(gpuQuery);
    }
  }

  private pollGpuTimers() {
    const gl = this.gl2;
    const timer = this.gpuTimer;
    if (!gl || !timer) return;
    if (gl.getParameter(timer.GPU_DISJOINT_EXT)) {
      for (const query of this.pendingGpuQueries) gl.deleteQuery(query);
      this.pendingGpuQueries.length = 0;
      return;
    }
    while (this.pendingGpuQueries.length > 0
      && gl.getQueryParameter(this.pendingGpuQueries[0], gl.QUERY_RESULT_AVAILABLE)) {
      const query = this.pendingGpuQueries.shift();
      if (!query) break;
      const elapsed = Number(gl.getQueryParameter(query, gl.QUERY_RESULT)) / 1_000_000;
      gl.deleteQuery(query);
      if (Number.isFinite(elapsed)) {
        this.gpuDrawMs = this.gpuDrawMs === null ? elapsed : lerp(this.gpuDrawMs, elapsed, 0.12);
      }
    }
  }

  private drawLit(mesh: GpuMesh, model: Float32Array, viewProjection: Float32Array, camera: Vec3, alpha: number, terrainVariation = 0) {
    const gl = this.gl;
    const program = this.litProgram;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.enableVertexAttribArray(program.position);
    gl.enableVertexAttribArray(program.normal);
    gl.enableVertexAttribArray(program.color);
    gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(program.normal, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(program.color, 3, gl.FLOAT, false, 36, 24);
    gl.uniformMatrix4fv(program.viewProjection, false, viewProjection);
    gl.uniformMatrix4fv(program.model, false, model);
    gl.uniform3f(program.camera, camera[0], camera[1], camera[2]);
    gl.uniform2f(program.focus, this.boatX, this.boatZ);
    gl.uniform3f(program.lightDirection, 0.44, 0.86, 0.25);
    gl.uniform3f(program.fogColor, 0.045, 0.23, 0.30);
    gl.uniform1f(program.alpha, alpha);
    gl.uniform1f(program.terrainVariation, terrainVariation);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }

  private updateLavaMaterialTexture() {
    const gl = this.gl2;
    if (!gl || !this.lavaMaterialTexture) return;
    const center = this.activeVolcano?.volcano;
    let changed = false;
    for (let index = 0; index < this.lavaMaterialScratch.length; index += 1) {
      const x = center ? Math.floor(center.x) - 16 + (index % LAVA_MATERIAL_SIZE + .5)*TERRAIN_CELL_SIZE : 0;
      const z = center ? Math.floor(center.z) - 16 + (Math.floor(index / LAVA_MATERIAL_SIZE)+.5)*TERRAIN_CELL_SIZE : 0;
      const molten = center ? lavaChannel(x, z, center, this.lavaFlow) * this.lavaHeat : 0;
      const level = clamp(Math.round(molten * 6), 0, 6) + 1;
      const value = (molten > 0.08 ? level : 0) | ((molten > 0.12 ? level : 0) << 4);
      this.lavaMaterialScratch[index] = value;
      if (value !== this.lavaMaterialData[index]) changed = true;
    }
    if (!changed) return;
    this.lavaMaterialData.set(this.lavaMaterialScratch);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.lavaMaterialTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LAVA_MATERIAL_SIZE, LAVA_MATERIAL_SIZE, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.lavaMaterialData);
  }

  private drawPackedTerrain(mesh: TerrainBatchMesh, viewProjection: Float32Array, camera: Vec3) {
    const gl = this.gl2;
    const program = this.packedTerrainProgram;
    if (!gl || !program || !mesh.packed) return;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.enableVertexAttribArray(program.quad);
    gl.vertexAttribIPointer(program.quad, 2, gl.UNSIGNED_INT, 8, 0);
    gl.vertexAttribDivisor(program.quad, 1);
    gl.uniformMatrix4fv(program.viewProjection, false, viewProjection);
    gl.uniform2f(program.groupOrigin, mesh.groupX * BATCH_SIZE, mesh.groupZ * BATCH_SIZE);
    const volcano = this.activeVolcano?.volcano;
    gl.uniform2f(program.lavaOrigin, volcano ? Math.floor(volcano.x) - 16 : 0, volcano ? Math.floor(volcano.z) - 16 : 0);
    gl.uniform3fv(program.palette, TERRAIN_PALETTE_DATA);
    gl.uniform3f(program.camera, camera[0], camera[1], camera[2]);
    gl.uniform2f(program.focus, this.boatX, this.boatZ);
    gl.uniform3f(program.lightDirection, 0.44, 0.86, 0.25);
    gl.uniform3f(program.fogColor, 0.045, 0.23, 0.30);
    gl.uniform1f(program.terrainVariation, 0.02);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.lavaMaterialTexture);
    gl.uniform1i(program.lavaMaterials, 0);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, mesh.quadCount);
    gl.vertexAttribDivisor(program.quad, 0);
  }

  private drawSeaLife(viewProjection: Float32Array, camera: Vec3, time: number, frustum: readonly FrustumPlane[]) {
    for (const life of this.seaLife) {
      if (life.caught) continue;
      const position = this.seaLifePosition(life, time);
      if (!sphereInsideFrustum(frustum, position[0], position[1], position[2], 2.4)) continue;
      const motion = this.options.reducedMotion ? life.phase : life.phase + time * life.speed;
      let model = translationMatrix(position[0], position[1], position[2]);
      model = multiplyMatrix(model, rotationYMatrix(-motion + (life.speed < 0 ? Math.PI : 0)));
      const pulse = this.options.reducedMotion ? 1 : 1 + Math.sin(time * 2.1 + life.phase) * 0.045;
      model = multiplyMatrix(model, scaleMatrix(pulse, pulse, pulse));
      this.drawLit(this.seaLifeMeshes[life.kind], model, viewProjection, camera, 0.92);
    }
  }

  private drawCorsairs(viewProjection: Float32Array, camera: Vec3, time: number, frustum: readonly FrustumPlane[]) {
    for (const corsair of this.corsairs) {
      if (corsair.sunk) continue;
      const position = this.corsairPosition(corsair, time);
      if (!sphereInsideFrustum(frustum, position[0], position[1], position[2], 3.5)) continue;
      const motion = corsair.phase + time * corsair.speed;
      let model = translationMatrix(position[0], position[1], position[2]);
      model = multiplyMatrix(model, rotationYMatrix(motion + (corsair.speed >= 0 ? Math.PI : 0)));
      if (!this.options.reducedMotion) model = multiplyMatrix(model, rotationZMatrix(Math.sin(time * 1.2 + corsair.phase) * 0.055));
      this.drawLit(this.corsairMesh, model, viewProjection, camera, 1);
    }
  }

  private drawWeaponProjectiles(viewProjection: Float32Array, camera: Vec3) {
    for (const projectile of this.weaponProjectiles) {
      let model = translationMatrix(projectile.x, projectile.y, projectile.z);
      if (projectile.equipment === "wave_ballista") {
        const horizontal = Math.hypot(projectile.vx, projectile.vz) || 1;
        model = multiplyMatrix(model, rotationYMatrix(Math.atan2(projectile.vx, -projectile.vz)));
        model = multiplyMatrix(model, rotationXMatrix(Math.atan2(projectile.vy, horizontal)));
      }
      this.drawLit(this.projectileMeshes[projectile.equipment], model, viewProjection, camera, 1);
    }
  }

  private drawWorldDetails(viewProjection: Float32Array, camera: Vec3, time: number, frustum: readonly FrustumPlane[]) {
    for (const region of this.nearby) {
      const harbor = region.harbor;
      if (Math.hypot(harbor.x - this.boatX, harbor.z - this.boatZ) < 90
        && sphereInsideFrustum(frustum, harbor.x, 2.2, harbor.z, 8)) {
        const harborMesh = this.harborMeshes.get(harbor.architecture);
        if (!harborMesh) continue;
        this.drawLit(harborMesh, translationMatrix(harbor.x, 0, harbor.z), viewProjection, camera, 1);
        for (let index = 0; index < 3; index += 1) {
          const travel = this.options.reducedMotion ? 0 : Math.sin(time * (0.38 + index * 0.07) + index * 2.1) * 0.72;
          const x = harbor.x - 0.8 + index * 1.25 + travel;
          const z = harbor.z - 1.38;
          const model = translationMatrix(x, x-harbor.x >= 1.8 ? .38 : .52, z);
          this.drawLit(this.harborWorkerMesh, model, viewProjection, camera, 1);
        }
        const catTravel = this.options.reducedMotion ? 0 : Math.sin(time * 0.46 + 1.8) * .8;
        this.drawLit(this.harborCatMesh, translationMatrix(harbor.x - .45 + catTravel, .52, harbor.z + 1.35), viewProjection, camera, 1);
        const hookLift = this.options.reducedMotion ? 0.4 : 0.55 + Math.sin(time * (this.phase === "docked" ? 1.1 : 0.72)) * 0.45;
        this.drawLit(this.craneHookMesh, multiplyMatrix(translationMatrix(harbor.x + 1, 1.94, harbor.z - .12), scaleMatrix(1,.65+hookLift*.55,1)), viewProjection, camera, 1);
        for (let index = 0; index < 3; index += 1) {
          const x = harbor.dockX + 3.5 + index * 4.5, z = harbor.dockZ + 2.5;
          this.drawLit(this.beaconMesh, translationMatrix(x, this.waveHeight(x, z, time) - 0.1, z), viewProjection, camera, 1);
        }
      }
      const wreck = region.wreck;
      if (Math.hypot(wreck.x - this.boatX, wreck.z - this.boatZ) < 85
        && sphereInsideFrustum(frustum, wreck.x, 0, wreck.z, 4.2)) {
        let model = translationMatrix(wreck.x, -0.38 + this.waveHeight(wreck.x, wreck.z, time) * 0.25, wreck.z);
        model = multiplyMatrix(model, rotationYMatrix(-0.62));
        model = multiplyMatrix(model, rotationZMatrix(-0.16));
        this.drawLit(this.wreckMesh, model, viewProjection, camera, 1);
      }
      // Merchant traffic follows the reserved central deep-water lane. Its phase advances offscreen.
      const phase = time * 0.028 + region.weatherPhase;
      const x = region.rx * REGION_SIZE;
      const z = region.rz * REGION_SIZE + Math.sin(phase) * 52;
      if (region.biome !== "home" && Math.hypot(x - this.boatX, z - this.boatZ) < 75
        && sphereInsideFrustum(frustum, x, 1, z, 6.7)) {
        const hullId = SHIP_HULLS[region.difficulty % SHIP_HULLS.length].id;
        const heading = Math.cos(phase) >= 0 ? Math.PI : 0;
        const model = multiplyMatrix(translationMatrix(x, this.waveHeight(x, z, time) + 0.3, z), rotationYMatrix(heading));
        this.drawLit(this.boatHullMeshes[hullId], model, viewProjection, camera, 1);
        this.drawLit(this.boatSailMeshes[hullId], model, viewProjection, camera, 1);
      }
    }
    for (const item of this.salvage) {
      if (item.collected || !sphereInsideFrustum(frustum, item.x, 0, item.z, 1.3)) continue;
      const bob = this.options.reducedMotion ? 0 : Math.sin(time * 1.4 + item.phase) * 0.08;
      const model = multiplyMatrix(translationMatrix(item.x, this.waveHeight(item.x, item.z, time) + 0.18 + bob, item.z),
        rotationYMatrix(item.phase + (this.options.reducedMotion ? 0 : time * 0.12)));
      this.drawLit(this.cargoMesh, model, viewProjection, camera, 1);
    }
    const cloudCellX = Math.floor(this.boatX / 52), cloudCellZ = Math.floor(this.boatZ / 52);
    for (let dz = -2; dz <= 2; dz += 1) for (let dx = -2; dx <= 2; dx += 1) {
      const cx = cloudCellX + dx, cz = cloudCellZ + dz;
      const phase = hash2(cx + this.world.seed, cz - 19) * Math.PI * 2;
      const drift = this.options.reducedMotion ? 0 : Math.sin(time * 0.018 + phase) * 9;
      const x = cx * 52 + 26 + Math.cos(phase) * 10 + drift, z = cz * 52 + 26 + Math.sin(phase) * 14;
      const distance = Math.hypot(x - this.boatX, z - this.boatZ);
      if (distance < 66 && sphereInsideFrustum(frustum, x, 10.8, z, 4.4)) {
        this.drawLit(this.cloudMesh, translationMatrix(x, 10.8 + phase * 0.15, z), viewProjection, camera,
          0.13 * clamp((66 - distance) / 18, 0, 1));
      }
    }
  }

  private drawWater(viewProjection: Float32Array, camera: Vec3, time: number) {
    const gl = this.gl;
    const program = this.waterProgram;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.waterMesh.buffer);
    gl.enableVertexAttribArray(program.position);
    gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 12, 0);
    gl.uniformMatrix4fv(program.viewProjection, false, viewProjection);
    gl.uniform3f(program.camera, camera[0], camera[1], camera[2]);
    gl.uniform2f(program.focus, this.boatX, this.boatZ);
    gl.uniform2f(program.origin, this.boatX, this.boatZ);
    gl.uniform1f(program.time, time);
    gl.uniform1f(program.volcanoHeat, this.lavaHeat);
    const volcano = this.activeVolcano?.volcano;
    gl.uniform2f(program.volcanoOrigin, volcano?.x ?? 0, volcano?.z ?? 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.uniform1i(program.depthField, 1);
    gl.uniform2f(program.depthOrigin, this.depthOriginX, this.depthOriginZ);
    gl.uniform3f(program.fogColor, 0.045, 0.23, 0.30);
    gl.drawArrays(gl.TRIANGLES, 0, this.waterMesh.vertexCount);
  }

  private drawShoreFoam(viewProjection: Float32Array, time: number) {
    let pointCount = 0;
    for (const chunkIndex of this.visibleTerrainChunks) pointCount += this.shoreFoamByChunk.get(chunkIndex)?.length || 0;
    pointCount = Math.min(pointCount, MAX_SHORE_FOAM);
    if (pointCount === 0) return;
    const data = new Float32Array(pointCount * 4);
    let index = 0;
    for (const chunkIndex of this.visibleTerrainChunks) {
      const points = this.shoreFoamByChunk.get(chunkIndex) || [];
      for (const point of points) {
        if (index >= pointCount) break;
        const offset = index * 4;
        data[offset] = point.x;
        data[offset + 1] = this.waveHeight(point.x, point.z, time) + 0.07;
        data[offset + 2] = point.z;
        data[offset + 3] = 0.24 + Math.max(0, Math.sin(time * 1.9 + point.phase)) * 0.44;
        index += 1;
      }
    }
    this.drawParticles(data, viewProjection, [0.77, 0.98, 0.88], 9);
  }

  private drawWake(viewProjection: Float32Array) {
    const bowCount = this.boatSpeed > 0.35 ? 10 : 0;
    if (this.wakes.length === 0 && bowCount === 0) return;
    const data = new Float32Array((this.wakes.length + bowCount) * 4);
    for (let index = 0; index < this.wakes.length; index += 1) {
      const wake = this.wakes[index];
      const offset = index * 4;
      data[offset] = wake.x;
      data[offset + 1] = wake.y;
      data[offset + 2] = wake.z;
      data[offset + 3] = Math.pow(1 - wake.age / wake.life, 1.4) * 0.72;
    }
    if (bowCount > 0) {
      const forwardX = Math.sin(this.boatHeading);
      const forwardZ = -Math.cos(this.boatHeading);
      const rightX = Math.cos(this.boatHeading);
      const rightZ = Math.sin(this.boatHeading);
      for (let index = 0; index < bowCount; index += 1) {
        const side = index < bowCount / 2 ? -1 : 1;
        const lane = index % (bowCount / 2);
        const spread = 0.22 + lane * 0.2;
        const x = this.boatX + forwardX * (2.25 - lane * 0.08) + rightX * side * spread;
        const z = this.boatZ + forwardZ * (2.25 - lane * 0.08) + rightZ * side * spread;
        const offset = (this.wakes.length + index) * 4;
        data[offset] = x;
        data[offset + 1] = this.boatY - 0.18 + lane * 0.018;
        data[offset + 2] = z;
        data[offset + 3] = clamp(this.boatSpeed / 5, 0.2, 0.78) * (1 - lane * 0.1);
      }
    }
    this.drawParticles(data, viewProjection, [0.76, 1, 0.94], 16);
  }

  private drawFishingNet(viewProjection: Float32Array, time: number) {
    if (this.netProgress <= 0) return;
    const progress = clamp(this.netProgress / 2.15, 0, 1);
    const count = 30;
    const data = new Float32Array(count * 4);
    const radius = 0.65 + progress * 2.25;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const x = this.boatX + Math.cos(angle) * radius;
      const z = this.boatZ + Math.sin(angle) * radius;
      const offset = index * 4;
      data[offset] = x;
      data[offset + 1] = this.waveHeight(x, z, time) + 0.035 - progress * 0.16;
      data[offset + 2] = z;
      data[offset + 3] = 0.74 - progress * 0.18;
    }
    this.drawParticles(data, viewProjection, [0.96, 0.78, 0.36], 7);
  }

  private drawEruption(viewProjection: Float32Array) {
    if (this.eruption.length === 0) return;
    const data = new Float32Array(this.eruption.length * 4);
    for (let index = 0; index < this.eruption.length; index += 1) {
      const particle = this.eruption[index];
      const offset = index * 4;
      data[offset] = particle.x;
      data[offset + 1] = particle.y;
      data[offset + 2] = particle.z;
      data[offset + 3] = Math.pow(1 - particle.age / particle.life, 0.7);
    }
    this.drawParticles(data, viewProjection, [1, 0.38, 0.08], 13);
  }

  private drawParticles(data: Float32Array, viewProjection: Float32Array, color: Vec3, size: number) {
    const gl = this.gl;
    const program = this.particleProgram;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(program.position);
    gl.enableVertexAttribArray(program.alpha);
    gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(program.alpha, 1, gl.FLOAT, false, 16, 12);
    gl.uniformMatrix4fv(program.viewProjection, false, viewProjection);
    gl.uniform3f(program.color, color[0], color[1], color[2]);
    gl.uniform1f(program.size, size);
    gl.drawArrays(gl.POINTS, 0, data.length / 4);
  }

  private uploadLitMesh(data: Float32Array, existing?: GpuMesh) {
    const gl = this.gl;
    const buffer = existing?.buffer || gl.createBuffer();
    if (!buffer) throw new Error("Unable to create a voxel mesh buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buffer, vertexCount: data.length / 9 };
  }

  private uploadPositionMesh(data: Float32Array) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Unable to create a water buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buffer, vertexCount: data.length / 3 };
  }

  private rebuildTerrain(force: boolean) {
    this.renderedLavaDeposit = this.lavaDeposit;
    this.renderedLavaHeat = this.lavaHeat;
    if (force) {
      for (const mesh of this.terrainMeshes.values()) {
        this.gl.deleteBuffer(mesh.buffer);
        if (mesh.detailBuffer) this.gl.deleteBuffer(mesh.detailBuffer);
      }
      this.terrainMeshes.clear(); this.terrainChunks.clear(); this.shoreFoamByChunk.clear();
      this.stream.clear(); this.dirtyChunks.clear(); this.dirtyBatches.clear();
      this.depthData.fill(0); this.depthDirty = true;
      this.depthOriginX = Number.NaN;
    } else {
      for (const address of this.stream.resident.values()) {
        if (this.chunkAffectedByVolcano(address.x, address.z)) this.dirtyChunks.add(address.key);
      }
    }
  }

  private serviceTerrain() {
    const started = performance.now();
    for (const region of this.nearby) {
      const port = region.harbor;
      if (Math.hypot(port.x-this.boatX,port.z-this.boatZ)<94 && !this.harborMeshes.has(port.architecture)) {
        this.harborMeshes.set(port.architecture,this.uploadLitMesh(new Float32Array(buildHarbor(port.architecture))));
        break;
      }
    }
    const removed = this.stream.focus(this.boatX, this.boatZ, this.boatVelocityX, this.boatVelocityZ);
    const evictedGroups = new Set<string>();
    for (const address of removed) {
      this.terrainChunks.delete(address.key); this.shoreFoamByChunk.delete(address.key);
      this.dirtyChunks.delete(address.key);
      evictedGroups.add(batchKey(address.x, address.z));
    }
    // Remove old GPU payload before adding new residency; no unbounded stale batches.
    for (const key of evictedGroups) {
      const [x, z] = key.split(",").map(Number);
      this.rebuildTerrainBatch(x, z);
      this.dirtyBatches.delete(key);
    }
    let built = 0;
    while (built < 3 && (built === 0 || performance.now() - started < 2.5)) {
      const address = this.stream.take();
      const dirtyKey = address ? undefined : this.dirtyChunks.values().next().value;
      if (!address && dirtyKey === undefined) break;
      const key = address?.key ?? dirtyKey!;
      const coords = address ? [address.x, address.z] : key.split(",").map(Number);
      const next = this.buildTerrainChunk(coords[0], coords[1]);
      this.terrainBuildCount += 1; built += 1;
      this.dirtyChunks.delete(key);
      const previous = this.terrainChunks.get(key);
      if (address) this.stream.accept(address);
      if (previous && this.sameTerrainGeometry(previous, next)) { this.terrainSkippedCount += 1; continue; }
      this.terrainChunks.set(key, next);
      this.dirtyBatches.add(batchKey(coords[0], coords[1]));
      this.rebuildShoreFoam([key]);
      this.depthDirty = true;
    }
    // Coalesce changes to a spatial group and bound the number of uploads per frame.
    let uploaded = 0;
    for (const key of this.dirtyBatches) {
      if (uploaded >= 2) break;
      const [x, z] = key.split(",").map(Number);
      this.rebuildTerrainBatch(x, z);
      this.dirtyBatches.delete(key); uploaded += 1;
    }
    this.triangleCount = 0; this.terrainBufferBytes = 0;
    for (const mesh of this.terrainMeshes.values()) {
      this.triangleCount += mesh.triangleCount; this.terrainBufferBytes += mesh.bufferBytes;
    }
    this.updateDepthField();
    this.streamCpuMs = lerp(this.streamCpuMs, performance.now() - started, 0.12);
  }

  private sameTerrainGeometry(previous: TerrainChunkGeometry, next: TerrainChunkGeometry) {
    if (previous.quads.length !== next.quads.length || previous.details.length !== next.details.length) return false;
    for (let index = 0; index < previous.quads.length; index += 1) {
      if (previous.quads[index] !== next.quads[index]) return false;
    }
    for (let index = 0; index < previous.details.length; index += 1) {
      if (previous.details[index] !== next.details[index]) return false;
    }
    return true;
  }

  private rebuildTerrainBatch(groupX: number, groupZ: number) {
    const parts: Array<{ quads: Uint32Array; offsetX: number; offsetZ: number }> = [];
    const detailParts: Float32Array[] = [];
    const chunkIndices: string[] = [];
    for (let localZ = 0; localZ < BATCH_CHUNKS; localZ += 1) {
      for (let localX = 0; localX < BATCH_CHUNKS; localX += 1) {
        const chunkX = groupX * BATCH_CHUNKS + localX;
        const chunkZ = groupZ * BATCH_CHUNKS + localZ;
        const key = chunkKey(chunkX, chunkZ);
        const chunk = this.terrainChunks.get(key);
        if (!chunk) continue;
        chunkIndices.push(key);
        parts.push({ quads: chunk.quads, offsetX: localX * CHUNK_CELLS, offsetZ: localZ * CHUNK_CELLS });
        if (chunk.details.length > 0) detailParts.push(chunk.details);
      }
    }
    const key = chunkKey(groupX, groupZ);
    const existing = this.terrainMeshes.get(key);
    if (chunkIndices.length === 0) {
      if (existing) {
        this.gl.deleteBuffer(existing.buffer);
        if (existing.detailBuffer) this.gl.deleteBuffer(existing.detailBuffer);
        this.terrainMeshes.delete(key);
      }
      return;
    }
    this.terrainUploadCount += 1;
    const packedData = combinePackedTerrain(parts);
    const details = concatenateFloat32(detailParts);
    const buffer = existing?.buffer || this.gl.createBuffer();
    if (!buffer) throw new Error("Unable to create a terrain batch buffer");
    let detailBuffer = existing?.detailBuffer || null;
    let vertexCount = packedData.length / 2 * 6;
    let bufferBytes = 0;
    const packed = Boolean(this.packedTerrainProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    if (packed) {
      this.gl.bufferData(this.gl.ARRAY_BUFFER, packedData, this.gl.STATIC_DRAW);
      bufferBytes += packedData.byteLength;
      if (details.length > 0) {
        detailBuffer ||= this.gl.createBuffer();
        if (!detailBuffer) throw new Error("Unable to create a terrain detail buffer");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, detailBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, details, this.gl.STATIC_DRAW);
        bufferBytes += details.byteLength;
      } else if (detailBuffer) { this.gl.deleteBuffer(detailBuffer); detailBuffer = null; }
    } else {
      const expanded = expandPackedTerrain(packedData, groupX * BATCH_SIZE, groupZ * BATCH_SIZE, TERRAIN_PALETTE);
      const fallback = concatenateFloat32([expanded, details]);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, fallback, this.gl.STATIC_DRAW);
      vertexCount = fallback.length / 9; bufferBytes = fallback.byteLength;
      if (detailBuffer) { this.gl.deleteBuffer(detailBuffer); detailBuffer = null; }
    }
    this.terrainMeshes.set(key, {
      buffer, detailBuffer, packed, quadCount: packedData.length / 2, vertexCount,
      detailVertexCount: details.length / 9, triangleCount: packedData.length + details.length / 27,
      bufferBytes, chunkIndices, groupX, groupZ,
      centerX: groupX * BATCH_SIZE + BATCH_SIZE / 2,
      centerZ: groupZ * BATCH_SIZE + BATCH_SIZE / 2,
      radius: Math.hypot(BATCH_SIZE / 2, BATCH_SIZE / 2, 12),
    });
  }

  private chunkAffectedByVolcano(chunkX: number, chunkZ: number) {
    const minimumX = chunkX * CHUNK_SIZE, minimumZ = chunkZ * CHUNK_SIZE;
    return this.nearby.some((region) => {
      const center = region.volcano;
      if (!center) return false;
      return Math.hypot(clamp(center.x, minimumX, minimumX + CHUNK_SIZE) - center.x,
        clamp(center.z, minimumZ, minimumZ + CHUNK_SIZE) - center.z) <= VOLCANO_DIRTY_RADIUS;
    });
  }

  private buildTerrainChunk(chunkX: number, chunkZ: number): TerrainChunkGeometry {
    const startX = chunkX * CHUNK_SIZE, startZ = chunkZ * CHUNK_SIZE;
    const field = buildTerrainHeightfield(CHUNK_CELLS, (x, z) => {
      const wx = startX + (x + .5)*TERRAIN_CELL_SIZE, wz = startZ + (z + .5)*TERRAIN_CELL_SIZE;
      const height = this.terrainHeight(wx, wz);
      return { heightUnits: Math.round(height / TERRAIN_HEIGHT_UNIT),
        material: this.world.material(wx, wz, height, this.worldTime, !this.packedTerrainProgram) };
    }, (x, z) => Math.round(this.terrainHeight(startX + (x+.5)*TERRAIN_CELL_SIZE, startZ + (z+.5)*TERRAIN_CELL_SIZE) / TERRAIN_HEIGHT_UNIT));
    const details: number[] = [];
    for (let z = 0; z < CHUNK_SIZE; z += 1) for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const wx = startX + x + 0.5, wz = startZ + z + 0.5;
      const height = this.terrainHeight(wx,wz);
      const detail = hash2((startX + x) * 7 + 19, (startZ + z) * 11 - 23);
      const region = this.world.regionAt(wx, wz);
      if (Math.hypot(wx - region.harbor.x, wz - region.harbor.z) < 6.5) continue;
      let plant: PlantKind | null = null;
      if (height > 0.35 && height < 4.2 && detail > (region.biome === "mangrove" ? 0.944 : 0.973)
        && this.world.material(wx, wz, height, this.worldTime, false) < 6) plant = region.biome === "mangrove" ? "mangrove" : "palm";
      else if (height > -3.5 && height < -0.7 && detail > 0.966) plant = region.biome === "mangrove" ? "kelp" : "coral";
      if (!plant) continue;
      const scale = 0.8 + hash2(startX + x + 41, startZ + z - 17) * 0.45;
      const variants = PLANT_MODELS[plant];
      appendModel(details, variants[Math.floor(detail * 1000) % variants.length], [wx,height,wz], scale, Math.floor(detail*40)%4);
    }
    return { quads: field.quads, details: new Float32Array(details),
      depths: Uint8Array.from(field.heights, (height) => height - TERRAIN_FLOOR / TERRAIN_HEIGHT_UNIT) };
  }

  private rebuildShoreFoam(keys: readonly string[]) {
    for (const key of keys) {
      const [chunkX, chunkZ] = key.split(",").map(Number);
      const candidates: Array<FoamPoint & { priority: number }> = [];
      for (let z = 0; z < CHUNK_SIZE; z += 1) for (let x = 0; x < CHUNK_SIZE; x += 1) {
        const wx = chunkX * CHUNK_SIZE + x + 0.5, wz = chunkZ * CHUNK_SIZE + z + 0.5;
        const height = this.terrainHeight(wx, wz);
        if (height < -0.65 || height > 0.45) continue;
        if (![this.terrainHeight(wx + 1, wz), this.terrainHeight(wx - 1, wz),
          this.terrainHeight(wx, wz + 1), this.terrainHeight(wx, wz - 1)].some((value) => value > 0)) continue;
        const jitter = hash2(Math.floor(wx * 5), Math.floor(wz * 5));
        candidates.push({ x: wx + jitter * 0.45 - 0.22, z: wz, phase: jitter * Math.PI * 2,
          priority: hash2(Math.floor(wx * 13), Math.floor(wz * 17)) });
      }
      candidates.sort((a, b) => b.priority - a.priority);
      this.shoreFoamByChunk.set(key, candidates.slice(0, MAX_SHORE_FOAM_PER_CHUNK));
    }
  }

  private updateDepthField() {
    const x = Math.floor(this.boatX / CHUNK_SIZE) * CHUNK_SIZE - DEPTH_FIELD_WORLD_SIZE / 2;
    const z = Math.floor(this.boatZ / CHUNK_SIZE) * CHUNK_SIZE - DEPTH_FIELD_WORLD_SIZE / 2;
    if (!this.depthDirty && x === this.depthOriginX && z === this.depthOriginZ) return;
    this.depthOriginX = x; this.depthOriginZ = z;
    // Fill from already sampled resident columns; no second map-generation pass.
    this.depthData.fill(0);
    for (const address of this.stream.resident.values()) {
      const chunk = this.terrainChunks.get(address.key);
      if (!chunk) continue;
      for (let localZ = 0; localZ < CHUNK_CELLS; localZ += 1) for (let localX = 0; localX < CHUNK_CELLS; localX += 1) {
        const dx = (address.x * CHUNK_SIZE - x) / TERRAIN_CELL_SIZE + localX;
        const dz = (address.z * CHUNK_SIZE - z) / TERRAIN_CELL_SIZE + localZ;
        if (dx < 0 || dz < 0 || dx >= DEPTH_FIELD_SIZE || dz >= DEPTH_FIELD_SIZE) continue;
        const offset = (dz * DEPTH_FIELD_SIZE + dx) * 4;
        this.depthData[offset] = chunk.depths[localZ * CHUNK_CELLS + localX];
        this.depthData[offset + 3] = 255;
      }
    }
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DEPTH_FIELD_SIZE, DEPTH_FIELD_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, this.depthData);
    gl.activeTexture(gl.TEXTURE0);
    this.depthDirty = false;
  }

  private terrainHeight(x: number, z: number) {
    return this.world.height(x, z, this.worldTime);
  }

  private waveHeight(x: number, z: number, time: number) {
    return Math.sin(x * 0.16 + time * 0.9) * 0.11
      + Math.sin(z * 0.21 - time * 0.7) * 0.08
      + Math.sin((x + z) * 0.09 + time * 0.45) * 0.07;
  }

  private volcanoPhaseIndex() {
    if (this.volcanoClock < 12) return 0;
    if (this.volcanoClock < 25) return 1;
    if (this.volcanoClock < 35) return 2;
    if (this.volcanoClock < 47) return 3;
    return 4;
  }

  private volcanoPhaseName() {
    if (!this.activeVolcano) return "No active volcano nearby";
    return ["Dormant", "Magma pressure rising", "Eruption", "Lava flow", "Cooling"][this.volcanoPhaseIndex()];
  }

  private setNotice(message: string) {
    this.notice = message;
    this.noticeTimer = 4.5;
  }

  private emitSnapshot() {
    const terrain = this.terrainHeight(this.boatX, this.boatZ);
    const action = this.actionState();
    const time = this.worldTime;
    const hull = getShipHull(this.shipHull);
    const offensiveSlots = this.loadout
      .map((id, slot) => ({ slot, spec: getEquipment(id) }))
      .filter(({ spec }) => spec.category === "weapon");
    const readyWeapons = offensiveSlots.reduce(
      (count, { slot }) => count + ((this.equipmentCooldowns[slot] || 0) <= 0 ? 1 : 0),
      0,
    );
    const weaponCooldown = readyWeapons > 0 || offensiveSlots.length === 0
      ? 0
      : Math.min(...offensiveSlots.map(({ slot }) => this.equipmentCooldowns[slot] || 0));
    this.options.onSnapshot({
      phase: this.phase,
      fps: this.fps,
      renderScale: Math.round(this.qualityScale * 100),
      speed: Math.max(0, this.boatSpeed * 2.35),
      heading: (Math.round(this.boatHeading * DEG) % 360 + 360) % 360,
      sail: Math.round(this.sail * 100),
      hull: Math.round(this.hull),
      depth: Math.max(0, -terrain * 3.2),
      volcanoPhase: this.volcanoPhaseName(),
      lavaHeat: Math.round(this.lavaHeat * 100),
      lavaCoverage: Math.round(this.lavaDeposit * 100),
      eruptionActive: Boolean(this.activeVolcano) && (this.volcanoPhaseIndex() === 2 || this.volcanoPhaseIndex() === 3),
      triangles: Math.round(this.visibleTriangleCount),
      chunks: this.visibleChunkCount,
      residentTriangles: Math.round(this.triangleCount),
      residentChunks: this.terrainChunks.size,
      worldSize: WORLD_SIZE,
      worldSeed: this.world.seed,
      worldReady: this.stream.readyAt(this.boatX, this.boatZ, 2),
      positionX: Math.round(this.boatX), positionZ: Math.round(this.boatZ),
      regionName: this.localRegion.name, difficulty: this.localRegion.difficulty,
      visitedRegions: this.world.visitedCount,
      harborName: this.activeHarbor.name,
      harborBearing: (Math.round(Math.atan2(this.activeHarbor.dockX - this.boatX, -(this.activeHarbor.dockZ - this.boatZ)) * DEG) + 360) % 360,
      streamingPending: this.stream.pending,
      streamedChunks: this.stream.loaded, evictedChunks: this.stream.unloaded,
      streamCpuMs: Math.round(this.streamCpuMs * 100) / 100,
      activeLife: this.seaLife.filter((life) => !life.caught).length,
      weather: this.gustStrength(time) > 0.3 ? "Gusty winds" : "Gentle swell",
      chart: this.nearby.flatMap((region) => [
        ...region.islands.map((island) => ({ x: island.x, z: island.z, kind: island.kind, label: region.name })),
        { x: region.harbor.x, z: region.harbor.z, kind: "harbor", label: region.harbor.name },
        { x: region.wreck.x, z: region.wreck.z, kind: "wreck", label: "Wreck salvage" },
      ]),
      graphicsBackend: this.graphicsBackend,
      terrainFormat: this.packedTerrainProgram ? "8-byte faces / GPU expansion" : "Floating-point fallback",
      terrainBatches: this.terrainMeshes.size,
      terrainDrawCalls: this.terrainDrawCalls,
      terrainBufferBytes: this.terrainBufferBytes,
      terrainResidencyLimit: STREAM_LIMIT,
      renderCpuMs: Math.round(this.renderCpuMs * 100) / 100,
      gpuDrawMs: this.gpuDrawMs === null ? null : Math.round(this.gpuDrawMs * 100) / 100,
      terrainBuildCount: this.terrainBuildCount,
      terrainUploadCount: this.terrainUploadCount,
      terrainSkippedCount: this.terrainSkippedCount,
      shipHull: this.shipHull,
      shipHullName: hull.name,
      weaponSlots: hull.slots,
      loadout: [...this.loadout],
      readyWeapons,
      weaponCooldown: Math.round(weaponCooldown * 10) / 10,
      targetsRemaining: this.corsairs.reduce((count, corsair) => count + (corsair.sunk ? 0 : 1), 0),
      cargo: this.cargo,
      fish: this.fish,
      coins: this.coins,
      windHeading: (Math.round(this.windHeadingAt(time) * DEG) % 360 + 360) % 360,
      windStrength: Math.round(this.windStrengthAt(time) * 10) / 10,
      harborDistance: Math.round(this.harborDistance() * 10) / 10,
      netProgress: Math.min(100, Math.round(this.netProgress / fishingProfile(this.loadout).progressSeconds * 100)),
      actionLabel: action.label,
      actionAvailable: action.available,
      objective: this.objectiveText(),
      docking: this.dockingActive,
      notice: this.notice,
    });
  }

  private resizeCanvas() {
    const deviceScale = Math.min(window.devicePixelRatio || 1, 1.65) * this.qualityScale;
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * deviceScale));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * deviceScale));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  private clearControls() {
    for (const key of Object.keys(this.controls) as VoxelControl[]) this.controls[key] = false;
  }

  private random() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
}
