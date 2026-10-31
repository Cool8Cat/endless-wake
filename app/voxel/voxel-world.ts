import { HARBOR_VARIANTS } from "./voxel-architecture";
import { TERRAIN_CELL_SIZE, TERRAIN_HEIGHT_UNIT } from "./voxel-terrain-mesh";
// Layout contains asset references and habitat rules; model geometry lives in the renderer.
export const WORLD_SEED = 73129;
export const REGION_SIZE = 156;
export const REGION_RADIUS = 32;
export const REGIONS_PER_SIDE = REGION_RADIUS * 2 + 1;
export const WORLD_SIZE = REGIONS_PER_SIDE * REGION_SIZE;
export const WORLD_HALF = WORLD_SIZE / 2;
export const WORLD_REGION_COUNT = REGIONS_PER_SIDE ** 2;
export type Biome = "home" | "lagoon" | "mangrove" | "basalt" | "reef";
export type HabitatKind = "fish" | "turtle" | "ray" | "octopus";
export type IslandKind = "port" | "green" | "atoll" | "spire" | "volcano";
export type Point = { x: number; z: number };
export type LandformModule = { kind: "ridge" | "peak" | "shelf" | "cove"; x: number; z: number; width: number; depth: number; rise: number };
export type Island = Point & { kind: IslandKind; radius: number; height: number; stretch: number; phase: number; modules?: LandformModule[] };
export type Harbor = Point & { id: number; name: string; dockX: number; dockZ: number; architecture: number };
export type WorldSpawn = Point & { id: number; slot: number; phase: number; radius: number };
export type Habitat = WorldSpawn & { kind: HabitatKind; depth: number; speed: number };
export type Region = {
  id: number; rx: number; rz: number; name: string; biome: Biome; difficulty: number;
  islands: Island[]; harbor: Harbor; volcano: Point | null;
  salvage: WorldSpawn[]; life: Habitat[]; patrols: WorldSpawn[]; wreck: Point;
  weatherPhase: number;
};

const TAU = Math.PI * 2;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
export function worldHash(seed: number, x: number, z: number, channel = 0) {
  let value = Math.imul(x, 0x45d9f3b) ^ Math.imul(z, 0x119de1f3) ^ Math.imul(channel, 0x27d4eb2d) ^ seed;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export function regionCoordinate(position: number) {
  return Math.floor((position + REGION_SIZE / 2) / REGION_SIZE);
}

function regionId(rx: number, rz: number) {
  return (rz + REGION_RADIUS) * REGIONS_PER_SIDE + rx + REGION_RADIUS;
}

function seaFloor(seed: number, x: number, z: number) {
  const ix = Math.floor(x / 7), iz = Math.floor(z / 7);
  let fx = x / 7 - ix, fz = z / 7 - iz;
  fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = worldHash(seed, ix, iz), b = worldHash(seed, ix + 1, iz);
  const c = worldHash(seed, ix, iz + 1), d = worldHash(seed, ix + 1, iz + 1);
  return -5.9 + ((a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz) * 0.7;
}

function islandHeight(island: Island, x: number, z: number) {
  const dx = x - island.x, dz = (z - island.z) / island.stretch;
  const radius = Math.hypot(dx, dz);
  if (radius >= island.radius) return 0;
  const angle = Math.atan2(dz, dx);
  const shape = island.kind === "port" ? 1 : 1 + Math.sin(angle * 3 + island.phase) * 0.08;
  const t = radius / (island.radius * shape);
  const edge = clamp((1 - t) * 4, 0, 1);
  if (island.kind === "atoll") return Math.exp(-((t - 0.51) ** 2) / 0.038) * island.height * edge
    * (1 - Math.exp(-((Math.atan2(Math.sin(angle-island.phase),Math.cos(angle-island.phase))) ** 2)/.032)*.72);
  let height = (1 - clamp(t, 0, 1)) ** (island.kind === "spire" ? 1.55 : 1.05) * island.height;
  for (const part of island.modules || []) {
    const px=(dx-part.x)/part.width,pz=(dz-part.z)/part.depth;
    const distance=px*px+pz*pz;
    const envelope=part.kind==="shelf"?Math.max(0,1-distance)**.35:Math.exp(-distance*2.2);
    height += envelope*part.rise*(part.kind==="cove"?-1:1);
  }
  if (island.kind === "volcano") height -= Math.max(0, 1 - radius / 2.45) * 2.85;
  return Math.max(0, height * edge);
}

function goldenHeight(x: number, z: number) {
  const noise = (seaFloor(73129,x*2,z*2)+5.55)*.7
    + (seaFloor(73129,x*.75+11,z*.75-7)+5.55)*.6;
  const primaryDistance = (x + 3.5) ** 2 + (z + 5) ** 2;
  const mound = (cx: number, cz: number, height: number, spread: number) => height * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / spread);
  return -5.55 + noise + 1.35 * Math.exp(-primaryDistance / 290)
    + 0.72 * (15.8 * Math.exp(-primaryDistance / 82) + mound(2.1, -2.2, 6.8, 34)
      + 3.4 * Math.exp(-((x + z * 0.32 + 1.8) ** 2) / 1.8 - ((z + 3.4) ** 2) / 18))
    - Math.max(0, 1 - Math.sqrt(primaryDistance) / 2.45) * 2.85
    + mound(13, -7, 5.8, 24) + mound(13, -7, 0.65, 92)
    + mound(-15, 2, 7, 23) - mound(-13.8, 1.7, 4, 9)
    + mound(7, 13, 7.1, 15) + mound(-12, -15, 6.7, 20)
    + mound(-36, 25, 7.4, 31) - mound(-35.2, 24.6, 4.2, 10)
    + mound(34, -31, 7.5, 34) + mound(32, 27, 6.1, 29);
}

export function lavaChannel(x: number, z: number, center: Point, front: number) {
  if (front <= 0) return 0;
  const dx = x - center.x, dz = z - center.z;
  const radius = Math.hypot(dx, dz);
  if (radius < 1.15 || radius > 12.5) return 0;
  const angle = Math.atan2(dz, dx);
  const delta = (target: number) => Math.atan2(Math.sin(angle - target), Math.cos(angle - target));
  const mask = Math.max(Math.exp(-(delta(2.36) ** 2) / 0.042), Math.exp(-(delta(0.42) ** 2) / 0.032) * 0.74);
  return mask * clamp((radius - 1.15) / 1.2, 0, 1) * clamp((2.6 + front * 10.8 - radius) / 1.8, 0, 1);
}

export function volcanoState(elapsed: number, phase: number, triggeredAt = -1, extraDeposits = 0) {
  const clock = triggeredAt >= 0 && elapsed - triggeredAt < 35
    ? 25 + elapsed - triggeredAt : (elapsed + phase) % 60;
  const index = clock < 12 ? 0 : clock < 25 ? 1 : clock < 35 ? 2 : clock < 47 ? 3 : 4;
  const heat = index === 0 ? 0.16 - clock / 12 * 0.1
    : index === 1 ? 0.12 + (clock - 12) / 13 * 0.5
      : index === 2 ? 0.82 + Math.sin((clock - 25) / 10 * Math.PI) * 0.18
        : index === 3 ? 1 - (clock - 35) / 12 * 0.28 : 0.72 - (clock - 47) / 13 * 0.62;
  const flow = index < 2 ? 0 : index === 2 ? 0.05 + (clock - 25) / 10 * 0.29
    : index === 3 ? 0.34 + (clock - 35) / 12 * 0.66 : 1;
  // An analytic integral keeps cooling history identical whether the region is resident or not.
  const integral = (t: number) => Math.floor(t / 60) * 35 + clamp(t % 60 - 25, 0, 35);
  const deposits = Math.max(0, integral(elapsed + phase) - integral(phase)) + extraDeposits
    + (triggeredAt >= 0 ? clamp(elapsed - triggeredAt, 0, 35) : 0);
  return { clock, index, heat, flow, deposit: 1 - Math.exp(-deposits * 0.016) };
}

export class VoxelWorld {
  readonly seed: number;
  private readonly regions = new Map<number, Region>();
  // Finite chart bounds make progress memory fixed, including return trips after eviction.
  readonly collected = new Uint8Array(WORLD_REGION_COUNT);
  readonly fishReadyAt = new Float64Array(WORLD_REGION_COUNT * 8);
  readonly patrolDamage = new Uint8Array(WORLD_REGION_COUNT * 4);
  readonly visited = new Uint8Array(WORLD_REGION_COUNT);
  private readonly volcanoTriggers = new Float64Array(WORLD_REGION_COUNT).fill(-1);
  private readonly volcanoDeposits = new Float64Array(WORLD_REGION_COUNT);
  visitedCount = 0;
  constructor(seed = WORLD_SEED) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("Invalid world seed");
    this.seed = seed;
  }

  get cachedRegionCount() { return this.regions.size; }
  regionAt(x: number, z: number) { return this.region(regionCoordinate(x), regionCoordinate(z)); }
  region(rx: number, rz: number): Region {
    rx = clamp(rx, -REGION_RADIUS, REGION_RADIUS); rz = clamp(rz, -REGION_RADIUS, REGION_RADIUS);
    const id = regionId(rx, rz);
    const cached = this.regions.get(id);
    if (cached) return cached;
    const region = this.generateRegion(rx, rz, id);
    if (this.regions.size >= 32) this.regions.delete(this.regions.keys().next().value!);
    this.regions.set(id, region);
    return region;
  }

  private generateRegion(rx: number, rz: number, id: number): Region {
    const home = rx === 0 && rz === 0;
    const random = (channel: number) => worldHash(this.seed, rx, rz, channel);
    const distance = Math.hypot(rx, rz);
    const biome: Biome = home ? "home" : (["lagoon", "mangrove", "basalt", "reef"] as const)[Math.floor(random(1) * 4)];
    const difficulty = home ? 1 : Math.min(5, 1 + Math.floor(distance / 3) + (biome === "basalt" || biome === "reef" ? 1 : 0));
    const cx = rx * REGION_SIZE, cz = rz * REGION_SIZE;
    const harborX = home ? 13 : cx + 30 + (random(2) - 0.5) * 10;
    const harborZ = home ? -7 : cz - 27 + (random(3) - 0.5) * 10;
    const prefix = ["Jade", "Silversand", "Redcape", "Blue Sail", "Moon Bay", "Longwind", "Gullsong", "Coral"][Math.floor(random(4) * 8)];
    const names: Record<Biome, string> = { home: "Tidehaven Isles", lagoon: "Azure Atoll", mangrove: "Rainforest Isles", basalt: "Blackrock Volcanoes", reef: "Windswept Reefs" };
    const harbor = { id, x: harborX, z: harborZ, dockX: harborX + 5.4, dockZ: harborZ - 0.7,
      architecture: home ? 0 : Math.floor(random(5)*HARBOR_VARIANTS), name: home ? "Tidehaven" : `${prefix} Harbor ${rx + 33}·${rz + 33}` };
    const islands: Island[] = [{ x: harborX, z: harborZ, radius: 13, height: 7.2, kind: "port", stretch: 1, phase: 0 }];
    const centers = [[-29, -29], [-30, 30], [31, 31]];
    for (let slot = 0; slot < centers.length; slot += 1) {
      const kind: IslandKind = biome === "basalt" && slot === 0 ? "volcano"
        : biome === "lagoon" ? "atoll" : biome === "reef" ? "spire" : "green";
      const radius = kind === "volcano" ? 23 : 17 + random(30 + slot) * 7;
      const modules: LandformModule[] = kind === "volcano" || kind === "atoll" ? [] : [
        {kind:"ridge",x:-radius*.20,z:radius*(random(80+slot)-.5)*.4,width:radius*.48,depth:radius*.15,rise:2+random(90+slot)*3},
        {kind:biome==="reef"?"peak":"shelf",x:radius*.27,z:radius*.15,width:radius*.20,depth:radius*.23,rise:1.6+random(95+slot)*2},
        {kind:"cove",x:radius*(random(98+slot)-.5)*.6,z:-radius*.4,width:radius*.17,depth:radius*.28,rise:1.9},
      ];
      islands.push({
        x: cx + centers[slot][0] + (random(10 + slot) - 0.5) * 12,
        z: cz + centers[slot][1] + (random(20 + slot) - 0.5) * 12,
        radius, modules,
        height: kind === "volcano" ? 19 : kind === "atoll" ? 7.4 : 8 + random(40 + slot) * (difficulty + 2),
        kind, stretch: 0.8 + random(50 + slot) * 0.24, phase: random(60 + slot) * TAU,
      });
    }
    if (home) islands.splice(1, islands.length - 1,
      ...[[-3.5, -5, 13, "volcano"], [-15, 2, 5, "atoll"], [7, 13, 4, "green"], [-12, -15, 5, "spire"],
        [-36, 25, 7, "atoll"], [34, -31, 6, "spire"], [32, 27, 6, "atoll"]].map(([x,z,radius,kind]) =>
        ({ x: Number(x), z: Number(z), radius: Number(radius), kind: kind as IslandKind, height: 10, stretch: 1, phase: 0 })));
    const volcano = home ? { x: -3.5, z: -5 } : biome === "basalt" ? { x: islands[1].x, z: islands[1].z } : null;
    const region: Region = { id, rx, rz, biome, name: names[biome], difficulty, islands, harbor, volcano,
      salvage: [], life: [], patrols: [], wreck: { x: cx, z: cz + 8 }, weatherPhase: random(70) * TAU };
    const safePoint = (slot: number, preferredX?: number, preferredZ?: number): WorldSpawn => {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const x = attempt === 0 && preferredX !== undefined ? preferredX : cx + (random(100 + slot * 83 + attempt) - 0.5) * 114;
        const z = attempt === 0 && preferredZ !== undefined ? preferredZ : cz + (random(10100 + slot * 83 + attempt) - 0.5) * 114;
        if (this.clearWaterInRegion(region, x, z, 4)) return { id, slot, x, z, radius: 1.5 + random(30100 + slot) * 0.9, phase: random(30200 + slot) * TAU };
      }
      // The central lane is reserved and never receives islands.
      return { id, slot, x: cx, z: cz + 52 - slot * 7, radius: 1.5, phase: random(30300 + slot) * TAU };
    };
    const wreck = safePoint(0, home ? -4.65 : cx + 2, home ? 10.45 : cz + 8);
    region.wreck = { x: wreck.x, z: wreck.z };
    for (let slot = 0; slot < 4; slot += 1) {
      region.salvage.push(safePoint(slot + 1, wreck.x + (slot % 2 ? 1.7 : -1.7), wreck.z + (slot < 2 ? 1.6 : -1.6)));
      region.salvage[slot].slot = slot;
    }
    for (let slot = 0; slot < 8; slot += 1) {
      const kind: HabitatKind = slot % 2 === 0 ? "fish" : biome === "reef" ? "octopus" : biome === "lagoon" ? "ray" : "turtle";
      let spawn = safePoint(10 + slot, home && slot === 0 ? 2.4 : undefined, home && slot === 0 ? 13.2 : undefined);
      // Favor safe shallow margins for wildlife without allowing their full orbit onto land.
      if (!home) for (let attempt = 0; attempt < 12; attempt += 1) {
        const island = islands[1 + slot % 3];
        const angle = random(31000 + slot * 17 + attempt) * TAU;
        const radius = island.radius * (0.68 + attempt * 0.028);
        const x = island.x + Math.cos(angle) * radius, z = island.z + Math.sin(angle) * radius;
        const height = this.baseHeightInRegion(region, x, z);
        if (height > -5 && this.clearWaterInRegion(region, x, z, 4)) { spawn = { ...spawn, x, z }; break; }
      }
      region.life.push({ ...spawn, slot, kind, speed: (slot % 3 ? 1 : -1) * (kind === "fish" ? 0.3 : 0.13), depth: kind === "fish" ? 0.82 : 1.35 });
    }
    for (let slot = 0; slot < Math.min(4, difficulty); slot += 1) {
      let spawn = safePoint(21 + slot, home ? 7.5 : cx - 12, home ? 8.5 : cz + 9 + slot * 12);
      if (Math.hypot(spawn.x - harborX, spawn.z - harborZ) < 22) spawn = safePoint(31 + slot, cx - 7, cz + 15 + slot * 9);
      region.patrols.push({ ...spawn, slot });
    }
    return region;
  }

  private clearWaterInRegion(region: Region, x: number, z: number, radius: number) {
    for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      if (this.baseHeightInRegion(region, x + dx, z + dz) > -2.3) return false;
    }
    return true;
  }

  baseHeightInRegion(region: Region, x: number, z: number) {
    let height = seaFloor(this.seed, x, z);
    if (region.biome === "home") {
      const weight = clamp((68 - Math.max(Math.abs(x), Math.abs(z))) / 16, 0, 1);
      height = goldenHeight(x, z) * weight + height * (1 - weight);
    } else for (const island of region.islands) height += islandHeight(island, x, z);
    const port = region.harbor;
    const dx = x - port.x, dz = z - port.z;
    // Solid workshop pad plus a deep east-facing pier approach, wide enough for the largest hull.
    if (dx >= -4 && dx < 1.8 && Math.abs(dz) < 3.4) height = 0.5;
    if (dx >= 2 && dx < 20 && Math.abs(dz + 0.7) < 5.2) height = Math.min(height, -2.5);
    return height;
  }

  height(x: number, z: number, elapsed = 0) {
    if (Math.abs(x) >= WORLD_HALF || Math.abs(z) >= WORLD_HALF) return -6;
    // Mesh, collision, depth and placement all read the same quantized voxel column.
    x = (Math.floor(x/TERRAIN_CELL_SIZE)+.5)*TERRAIN_CELL_SIZE;
    z = (Math.floor(z/TERRAIN_CELL_SIZE)+.5)*TERRAIN_CELL_SIZE;
    const region = this.regionAt(x, z);
    let height = this.baseHeightInRegion(region, x, z);
    if (region.volcano) {
      const state = this.volcano(region, elapsed);
      height += lavaChannel(x, z, region.volcano, state.deposit) * state.deposit * 0.95;
    }
    return clamp(Math.round(height/TERRAIN_HEIGHT_UNIT)*TERRAIN_HEIGHT_UNIT,-8,23);
  }

  material(x: number, z: number, height: number, elapsed: number, activeHeat: boolean) {
    const region = this.regionAt(x, z);
    if (region.volcano && Math.hypot(x - region.volcano.x, z - region.volcano.z) < 14) {
      const state = this.volcano(region, elapsed);
      const molten = activeHeat ? lavaChannel(x, z, region.volcano, state.flow) * state.heat : 0;
      if (molten > 0.08) return 16 + clamp(Math.round(molten * 6), 0, 6);
      if (Math.hypot(x - region.volcano.x, z - region.volcano.z) < 2.2 && height > 3.5) return 7;
      if (lavaChannel(x, z, region.volcano, state.deposit) * state.deposit > 0.06) return 8;
    }
    if (height < -3.5) return 0;
    if (height < -1.15) return 1;
    if (height < 0.35) return 2;
    if (region.biome === "basalt" && height > 1.5) return 6;
    return height < 2.4 ? 3 : height < 5.6 ? 4 : height < 8.5 ? 5 : 6;
  }

  nearbyRegions(x: number, z: number, radius = 1) {
    const rx = regionCoordinate(x), rz = regionCoordinate(z);
    const regions: Region[] = [];
    for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      if (Math.abs(rx + dx) <= REGION_RADIUS && Math.abs(rz + dz) <= REGION_RADIUS) regions.push(this.region(rx + dx, rz + dz));
    }
    return regions;
  }

  visit(region: Region) {
    if (!this.visited[region.id]) { this.visited[region.id] = 1; this.visitedCount += 1; }
  }
  volcano(region: Region, elapsed: number) {
    return volcanoState(elapsed, region.biome === "home" ? 22 : region.weatherPhase * 9, this.volcanoTriggers[region.id], this.volcanoDeposits[region.id]);
  }
  triggerVolcano(region: Region, elapsed: number) {
    if (!region.volcano) return;
    const previous = this.volcanoTriggers[region.id];
    if (previous >= 0) this.volcanoDeposits[region.id] += clamp(elapsed - previous, 0, 35);
    this.volcanoTriggers[region.id] = elapsed;
  }
  catchFish(id: number, slot: number, elapsed: number) { this.fishReadyAt[id * 8 + slot] = elapsed + 180; }
  fishAvailable(id: number, slot: number, elapsed: number) { return elapsed >= this.fishReadyAt[id * 8 + slot]; }
  collect(id: number, slot: number) { this.collected[id] |= 1 << slot; }
  hasCollected(id: number, slot: number) { return (this.collected[id] & (1 << slot)) !== 0; }
  reset() {
    this.collected.fill(0); this.fishReadyAt.fill(0); this.patrolDamage.fill(0);
    this.volcanoTriggers.fill(-1); this.volcanoDeposits.fill(0); this.visited.fill(0); this.visitedCount = 0;
  }
}
