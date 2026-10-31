export type V4Phase = "intro" | "playing" | "paused" | "docked" | "gameover";
export type V4VoyageEvent = "none" | "treasure" | "rival" | "maelstrom" | "leviathan" | "beacons" | "relics" | "flotilla" | "volcano";
export type V4HarborService = "none" | "trade" | "shipyard" | "arsenal" | "academy";
export type V4Notice = "none" | "rescue" | "shield" | "treasure" | "escape" | "weathered" | "deepEscape" | "beaconClear" | "relicClear" | "flotillaClear" | "volcanoClear" | "eventPassed" | "cargoSold" | "hullRepaired" | "ammoBought" | "gunsUpgraded" | "enemySunk" | "rivalClear" | "leviathanClear" | "fishCaught" | "netMissed";
export type V4Sound = "collect" | "boost" | "rescue" | "warning" | "hit" | "cannon" | "splash" | "coin" | "repair" | "gameover";

export const V4_TRADE_PRICES = { cargo: 6, valuables: 14, fish: 4 } as const;
export const V4_REWARD_RULES = {
  rescue: { coins: 3, escortSeconds: 24 },
  treasure: { completionValuables: 1 },
  rival: { sinkCoins: 5, escapeCoins: 3, escapeFairWindSeconds: 12 },
  maelstrom: { completionValuables: 1, fairWindSeconds: 35 },
  leviathan: { sinkCoins: 7, sinkValuables: 1, escapeValuables: 1, escapeGunFocusSeconds: 20 },
  beacons: { targetCount: 5, coinPerBeacon: 1, completionCargo: 1, fairWindSeconds: 45 },
  relics: { targetCount: 4, coinPerRelic: 1, completionValuables: 2, gunFocusSeconds: 40 },
  flotilla: { targetCount: 3, coinPerSkiff: 2, escortPerSkiffSeconds: 10, escortMaxSeconds: 32, completionCargo: 1 },
  volcano: { completionValuables: 1, ammo: 4 },
} as const;

export type V4Snapshot = {
  phase: V4Phase;
  distance: number;
  score: number;
  lives: number;
  boost: number;
  speed: number;
  cargo: number;
  valuables: number;
  fishCargo: number;
  coins: number;
  ammo: number;
  ammoCapacity: number;
  gunLevel: number;
  repairCost: number;
  ammoPackCost: number;
  gunUpgradeCost: number;
  sunkEnemies: number;
  sailsRaised: boolean;
  sailPercent: number;
  windHeading: number;
  windStrength: number;
  drift: number;
  autoDocking: boolean;
  nearbyFish: boolean;
  canFish: boolean;
  netCooldown: number;
  fishingProgress: number;
  escort: number;
  fairWind: number;
  gunFocus: number;
  heading: number;
  worldX: number;
  worldY: number;
  activeEvent: V4VoyageEvent;
  eventProgress: number;
  eventFound: number;
  eventTarget: number;
  notice: V4Notice;
  nearbyHarbor: V4HarborService;
  dockedHarbor: V4HarborService;
  harborDistance: number;
  canDock: boolean;
  renderScale: number;
};

export type V4EngineOptions = {
  reducedSpeed: boolean;
  highVisibility: boolean;
  reducedMotion: boolean;
};

type AtlasKind = "island" | "lighthouse" | "palm" | "reef" | "wreck" | "rescue" | "crate";
type HarborKind = "harborTrade" | "harborShipyard" | "harborArsenal" | "harborAcademy";
type EventAtlasKind = "maelstromLarge" | "maelstromSmall" | "currentRift" | "salvageBeacon" | "cargoRaft" | "stormWreckage" | "windRelic" | "rescueFlare" | "seaCreature";
type ExpandedEventKind = "signalBuoy" | "tideRelic" | "rescueSkiff" | "volcanicBomb";
type ObjectKind = AtlasKind | HarborKind | "rival" | "wind" | "whirlpool" | "currentRift" | "salvageBeacon" | "cargoRaft" | "stormWreckage" | "seaCreature" | ExpandedEventKind;
type AnimatedEventKind = "whirlpool" | "currentRift" | "stormWreckage" | "seaCreature";
type AmbientLifeKind = "gulls" | "fish" | "crabs" | "pennant";
type HarborLifeKind = "worker" | "cat" | "crane" | "palm";
type MarineLifeKind = "fishSchool" | "turtle" | "manta" | "octopus";

type SeaObject = {
  id: string;
  kind: ObjectKind;
  x: number;
  y: number;
  radius: number;
  scale: number;
  rotation: number;
  seed: number;
  active: boolean;
  eventObject: boolean;
  velocityX?: number;
  velocityY?: number;
  age?: number;
  health?: number;
  maxHealth?: number;
};

type MarineLife = {
  id: string;
  kind: MarineLifeKind;
  x: number;
  y: number;
  scale: number;
  seed: number;
};

export const V4_RUN_SAVE_VERSION = 1 as const;

type V4SavedPhase = Extract<V4Phase, "playing" | "paused" | "docked">;

type V4SavedSeaObject = {
  id: string;
  kind: ObjectKind;
  x: number;
  y: number;
  radius: number;
  scale: number;
  rotation: number;
  seed: number;
  active: boolean;
  eventObject: boolean;
  velocityX?: number;
  velocityY?: number;
  age?: number;
  health?: number;
  maxHealth?: number;
};

export type V4RunSave = {
  version: typeof V4_RUN_SAVE_VERSION;
  savedAt: number;
  phase: V4SavedPhase;
  playerX: number;
  playerY: number;
  heading: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  speed: number;
  sailBlend: number;
  targetSail: number;
  distance: number;
  bonusScore: number;
  lives: number;
  boostEnergy: number;
  cargo: number;
  valuables: number;
  fishCargo: number;
  coins: number;
  ammo: number;
  gunLevel: number;
  sunkEnemies: number;
  escortTime: number;
  fairWindTime: number;
  gunFocusTime: number;
  netCooldown: number;
  dockedHarbor: V4HarborService;
  cannonCooldown: number;
  cannonSerial: number;
  activeEvent: V4VoyageEvent;
  eventIndex: number;
  eventTimer: number;
  eventDuration: number;
  eventFound: number;
  eventTarget: number;
  eventVariant: number;
  eventWave: number;
  eventSpawnSerial: number;
  eventAnchorX: number;
  eventAnchorY: number;
  nextEventDistance: number;
  collectedIds: string[];
  salvageDrops: V4SavedSeaObject[];
  eventObjects: V4SavedSeaObject[];
};

type CannonShot = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetId: string;
  age: number;
  duration: number;
  seed: number;
};

type CombatEffectKind = "muzzle" | "water" | "hit" | "sink";

type CombatEffect = {
  kind: CombatEffectKind;
  x: number;
  y: number;
  age: number;
  duration: number;
  seed: number;
};

type WakePoint = {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  centerX: number;
  centerY: number;
  age: number;
};

const ATLAS_CELLS: Record<AtlasKind, readonly [number, number]> = {
  island: [1, 0],
  lighthouse: [2, 0],
  palm: [0, 1],
  reef: [1, 1],
  wreck: [2, 1],
  rescue: [0, 2],
  crate: [1, 2],
};

const HARBOR_ATLAS_CELLS: Record<HarborKind, readonly [number, number]> = {
  harborTrade: [0, 0],
  harborShipyard: [1, 0],
  harborArsenal: [0, 1],
  harborAcademy: [1, 1],
};

const HARBOR_SERVICE_BY_KIND: Record<HarborKind, Exclude<V4HarborService, "none">> = {
  harborTrade: "trade",
  harborShipyard: "shipyard",
  harborArsenal: "arsenal",
  harborAcademy: "academy",
};

const HARBOR_KIND_BY_SERVICE: Record<Exclude<V4HarborService, "none">, HarborKind> = {
  trade: "harborTrade",
  shipyard: "harborShipyard",
  arsenal: "harborArsenal",
  academy: "harborAcademy",
};

const CHARTED_HARBORS: Record<string, {
  service: Exclude<V4HarborService, "none">;
  offsetX: number;
  offsetY: number;
}> = {
  "0:-1": { service: "trade", offsetX: 22, offsetY: 10 },
  "1:-3": { service: "arsenal", offsetX: 10, offsetY: 14 },
  "0:-4": { service: "shipyard", offsetX: 18, offsetY: 16 },
  "2:-5": { service: "academy", offsetX: 8, offsetY: 16 },
};

const EVENT_ATLAS_CELLS: Record<EventAtlasKind, readonly [number, number]> = {
  maelstromLarge: [0, 0],
  maelstromSmall: [1, 0],
  currentRift: [2, 0],
  salvageBeacon: [0, 1],
  cargoRaft: [1, 1],
  stormWreckage: [2, 1],
  windRelic: [0, 2],
  rescueFlare: [1, 2],
  seaCreature: [2, 2],
};

const EVENT_OBJECT_ART: Partial<Record<ObjectKind, EventAtlasKind>> = {
  salvageBeacon: "salvageBeacon",
  cargoRaft: "cargoRaft",
};

const ANIMATED_EVENT_ROWS: Record<AnimatedEventKind, number> = {
  whirlpool: 0,
  currentRift: 1,
  stormWreckage: 2,
  seaCreature: 3,
};

const EXPANDED_EVENT_ROWS: Record<ExpandedEventKind, number> = {
  signalBuoy: 0,
  tideRelic: 1,
  rescueSkiff: 2,
  volcanicBomb: 3,
};

const EVENT_SEQUENCE = ["treasure", "rival", "maelstrom", "leviathan", "beacons", "relics", "flotilla", "volcano"] as const;

const AMBIENT_LIFE_ROWS: Record<AmbientLifeKind, number> = {
  gulls: 0,
  fish: 1,
  crabs: 2,
  pennant: 3,
};

const HARBOR_LIFE_ROWS: Record<HarborLifeKind, number> = {
  worker: 0,
  cat: 1,
  crane: 2,
  palm: 3,
};

const MARINE_LIFE_ROWS: Record<MarineLifeKind, number> = {
  fishSchool: 0,
  turtle: 1,
  manta: 2,
  octopus: 3,
};

const CHUNK_SIZE = 32;
const CHUNK_RADIUS = 3;
const COLLISION_SCAN_RADIUS = 8;
const MAX_COLLECTED_RECORDS = 4096;
const MAX_WAKE_POINTS = 104;
const MAX_EVENT_OBJECTS = 40;
const MAX_SALVAGE_DROPS = 24;
const MAX_CANNON_SHOTS = 32;
const MAX_COMBAT_EFFECTS = 48;
const MAX_MARINE_LIFE = 150;
const ANIMATION_FRAME_COUNT = 4;
const DIRECTIONAL_SHIP_GRID = 4;
const DIRECTIONAL_SHIP_VIEWS = [
  { frame: 0, sourceHeading: Math.PI },
  { frame: 9, sourceHeading: Math.PI / 4 },
  { frame: 9, sourceHeading: Math.PI / 4 },
  { frame: 9, sourceHeading: Math.PI / 4 },
  { frame: 5, sourceHeading: Math.PI * 0.625 },
  { frame: 5, sourceHeading: Math.PI * 0.625 },
  { frame: 4, sourceHeading: Math.PI * 0.75 },
  { frame: 4, sourceHeading: Math.PI * 0.75 },
  { frame: 0, sourceHeading: Math.PI },
  { frame: 0, sourceHeading: Math.PI },
  { frame: 2, sourceHeading: Math.PI * 1.25 },
  { frame: 2, sourceHeading: Math.PI * 1.25 },
  { frame: 6, sourceHeading: Math.PI * 1.5 },
  { frame: 13, sourceHeading: Math.PI * 1.75 },
  { frame: 13, sourceHeading: Math.PI * 1.75 },
  { frame: 13, sourceHeading: Math.PI * 1.75 },
] as const;
const HARBOR_CHANCE = 0.032;
const HARBOR_DOCK_MARGIN = 3.1;
const DOCKING_SPEED = 1.35;
const AUTO_DOCK_APPROACH_MARGIN = 5.4;
const NET_CAST_RANGE = 5.6;
const NET_ACQUISITION_GRACE = 0.85;
const NET_CAST_SECONDS = 2.15;
const NET_RECOVERY_SECONDS = 4.2;
const BROADSIDE_HALF_ANGLE = 0.82;
const MIN_RENDER_SCALE = 0.7;
const PERFORMANCE_SAMPLE_SECONDS = 2;
const IDLE_FRAME_INTERVAL_MS = 1000 / 30;
const SEABED_TILE_SIZE = 1024;
const CAUSTICS_TILE_SIZE = 512;
const SURFACE_TILE_SIZE = 384;
const TWO_PI = Math.PI * 2;
const Y_PERSPECTIVE = 0.84;

type SurfaceMotionProfile = Readonly<{
  frequency: number;
  bobFactor: number;
  maxBob: number;
  scaleAmplitude: number;
  swayAmplitude: number;
  spinSpeed: number;
  waterline: boolean;
}>;

const SURFACE_MOTION_PROFILES: Partial<Record<ObjectKind, SurfaceMotionProfile>> = {
  rescue: { frequency: 1.82, bobFactor: 0.02, maxBob: 2.6, scaleAmplitude: 0.026, swayAmplitude: 0.045, spinSpeed: 0, waterline: true },
  crate: { frequency: 2.08, bobFactor: 0.024, maxBob: 2.8, scaleAmplitude: 0.04, swayAmplitude: 0.065, spinSpeed: 0, waterline: true },
  rival: { frequency: 2, bobFactor: 0.009, maxBob: 1.35, scaleAmplitude: 0.01, swayAmplitude: 0, spinSpeed: 0, waterline: false },
  wind: { frequency: 2.7, bobFactor: 0.018, maxBob: 2.2, scaleAmplitude: 0.034, swayAmplitude: 0.018, spinSpeed: 0.24, waterline: false },
  whirlpool: { frequency: 1.9, bobFactor: 0, maxBob: 0, scaleAmplitude: 0.022, swayAmplitude: 0.012, spinSpeed: 0.18, waterline: false },
  currentRift: { frequency: 1.7, bobFactor: 0, maxBob: 0, scaleAmplitude: 0.016, swayAmplitude: 0.024, spinSpeed: 0, waterline: false },
  salvageBeacon: { frequency: 2.36, bobFactor: 0.026, maxBob: 3, scaleAmplitude: 0.04, swayAmplitude: 0.052, spinSpeed: 0, waterline: true },
  cargoRaft: { frequency: 1.34, bobFactor: 0.018, maxBob: 2.4, scaleAmplitude: 0.026, swayAmplitude: 0.046, spinSpeed: 0, waterline: true },
  stormWreckage: { frequency: 1.16, bobFactor: 0.014, maxBob: 2.3, scaleAmplitude: 0.024, swayAmplitude: 0.05, spinSpeed: 0, waterline: true },
  seaCreature: { frequency: 1.78, bobFactor: 0.013, maxBob: 2, scaleAmplitude: 0.03, swayAmplitude: 0.032, spinSpeed: 0, waterline: true },
  signalBuoy: { frequency: 2.28, bobFactor: 0.027, maxBob: 3.1, scaleAmplitude: 0.042, swayAmplitude: 0.052, spinSpeed: 0, waterline: true },
  tideRelic: { frequency: 1.66, bobFactor: 0.022, maxBob: 2.7, scaleAmplitude: 0.05, swayAmplitude: 0.034, spinSpeed: 0.26, waterline: true },
  rescueSkiff: { frequency: 1.52, bobFactor: 0.018, maxBob: 2.4, scaleAmplitude: 0.028, swayAmplitude: 0.044, spinSpeed: 0, waterline: true },
};

const SAVE_PHASES = new Set<V4SavedPhase>(["playing", "paused", "docked"]);
const SAVE_EVENTS = new Set<V4VoyageEvent>(["none", ...EVENT_SEQUENCE]);
const SAVE_HARBORS = new Set<V4HarborService>(["none", "trade", "shipyard", "arsenal", "academy"]);
const SAVE_OBJECT_KINDS = new Set<ObjectKind>([
  "island", "lighthouse", "palm", "reef", "wreck", "rescue", "crate",
  "harborTrade", "harborShipyard", "harborArsenal", "harborAcademy",
  "rival", "wind", "whirlpool", "currentRift", "salvageBeacon", "cargoRaft",
  "stormWreckage", "seaCreature", "signalBuoy", "tideRelic", "rescueSkiff", "volcanicBomb",
]);
const SAVE_EVENT_OBJECT_KINDS = new Set<ObjectKind>([
  "island", "reef", "crate", "rival", "whirlpool", "currentRift", "salvageBeacon", "cargoRaft",
  "stormWreckage", "seaCreature", "signalBuoy", "tideRelic", "rescueSkiff", "volcanicBomb",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteInRange(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isOptionalFiniteInRange(value: unknown, minimum: number, maximum: number) {
  return value === undefined || isFiniteInRange(value, minimum, maximum);
}

function isSavedSeaObject(value: unknown): value is V4SavedSeaObject {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && value.id.length > 0
    && value.id.length <= 160
    && typeof value.kind === "string"
    && SAVE_OBJECT_KINDS.has(value.kind as ObjectKind)
    && isFiniteInRange(value.x, -10_000_000, 10_000_000)
    && isFiniteInRange(value.y, -10_000_000, 10_000_000)
    && isFiniteInRange(value.radius, 0.05, 100)
    && isFiniteInRange(value.scale, 0.05, 100)
    && isFiniteInRange(value.rotation, -TWO_PI * 4, TWO_PI * 4)
    && Number.isInteger(value.seed)
    && isFiniteInRange(value.seed, 0, 0xffff_ffff)
    && typeof value.active === "boolean"
    && typeof value.eventObject === "boolean"
    && isOptionalFiniteInRange(value.velocityX, -100, 100)
    && isOptionalFiniteInRange(value.velocityY, -100, 100)
    && isOptionalFiniteInRange(value.age, 0, 1_000)
    && isOptionalFiniteInRange(value.health, 0, 1_000)
    && isOptionalFiniteInRange(value.maxHealth, 0, 1_000);
}

export function parseV4RunSave(value: unknown): V4RunSave | null {
  if (!isRecord(value)
    || value.version !== V4_RUN_SAVE_VERSION
    || !isFiniteInRange(value.savedAt, 1, Number.MAX_SAFE_INTEGER)
    || !Number.isInteger(value.savedAt)
    || typeof value.phase !== "string"
    || !SAVE_PHASES.has(value.phase as V4SavedPhase)
    || typeof value.activeEvent !== "string"
    || !SAVE_EVENTS.has(value.activeEvent as V4VoyageEvent)
    || typeof value.dockedHarbor !== "string"
    || !SAVE_HARBORS.has(value.dockedHarbor as V4HarborService)) return null;

  const numericRanges: Record<string, readonly [number, number]> = {
    playerX: [-10_000_000, 10_000_000],
    playerY: [-10_000_000, 10_000_000],
    heading: [0, TWO_PI],
    velocityX: [-100, 100],
    velocityY: [-100, 100],
    angularVelocity: [-10, 10],
    speed: [0, 100],
    sailBlend: [0, 1],
    targetSail: [0, 1],
    distance: [0, 1_000_000_000],
    bonusScore: [0, 1_000_000_000_000],
    lives: [1, 3],
    boostEnergy: [0, 100],
    cargo: [0, 1_000_000],
    valuables: [0, 1_000_000],
    fishCargo: [0, 1_000_000],
    coins: [0, 1_000_000_000],
    ammo: [0, 1_000],
    gunLevel: [1, 3],
    sunkEnemies: [0, 1_000_000],
    escortTime: [0, 3_600],
    fairWindTime: [0, 3_600],
    gunFocusTime: [0, 3_600],
    netCooldown: [0, 60],
    cannonCooldown: [0, 60],
    cannonSerial: [0, 1_000_000_000],
    eventIndex: [0, 10_000_000],
    eventTimer: [0, 300],
    eventDuration: [0.01, 300],
    eventFound: [0, 100],
    eventTarget: [0, 100],
    eventVariant: [0, 2],
    eventWave: [0, 1_000],
    eventSpawnSerial: [0, 1_000_000_000],
    eventAnchorX: [-10_000_000, 10_000_000],
    eventAnchorY: [-10_000_000, 10_000_000],
    nextEventDistance: [0, 1_000_000_000],
  };
  for (const [key, [minimum, maximum]] of Object.entries(numericRanges)) {
    if (!isFiniteInRange(value[key], minimum, maximum)) return null;
  }

  const integerFields = [
    "lives", "cargo", "valuables", "fishCargo", "coins", "ammo", "gunLevel", "sunkEnemies", "cannonSerial",
    "eventIndex", "eventFound", "eventTarget", "eventVariant", "eventWave", "eventSpawnSerial",
  ];
  if (integerFields.some((key) => !Number.isInteger(value[key]))) return null;
  if ((value.phase === "docked") !== (value.dockedHarbor !== "none")) return null;
  if ((value.ammo as number) > 24 + (value.gunLevel as number) * 6) return null;
  if ((value.eventFound as number) > (value.eventTarget as number)) return null;
  if ((value.eventTimer as number) > (value.eventDuration as number) + 0.1) return null;
  if (!Array.isArray(value.collectedIds)
    || value.collectedIds.length > MAX_COLLECTED_RECORDS
    || value.collectedIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > 160)) return null;
  if (!Array.isArray(value.salvageDrops)
    || value.salvageDrops.length > MAX_SALVAGE_DROPS
    || !value.salvageDrops.every((object) => isSavedSeaObject(object) && object.kind === "crate")) return null;
  if (!Array.isArray(value.eventObjects)
    || value.eventObjects.length > MAX_EVENT_OBJECTS
    || !value.eventObjects.every((object) => isSavedSeaObject(object) && SAVE_EVENT_OBJECT_KINDS.has(object.kind))) return null;
  if (value.activeEvent === "none"
    && (value.eventObjects.length > 0 || value.eventFound !== 0 || value.eventTarget !== 0)) return null;

  return value as V4RunSave;
}

function copySavedSeaObject(object: SeaObject): V4SavedSeaObject {
  return {
    id: object.id,
    kind: object.kind,
    x: object.x,
    y: object.y,
    radius: object.radius,
    scale: object.scale,
    rotation: object.rotation,
    seed: object.seed,
    active: object.active,
    eventObject: object.eventObject,
    ...(object.velocityX === undefined ? {} : { velocityX: object.velocityX }),
    ...(object.velocityY === undefined ? {} : { velocityY: object.velocityY }),
    ...(object.age === undefined ? {} : { age: object.age }),
    ...(object.health === undefined ? {} : { health: object.health }),
    ...(object.maxHealth === undefined ? {} : { maxHealth: object.maxHealth }),
  };
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const chunkKey = (x: number, y: number) => `${x}:${y}`;

function angleDelta(from: number, to: number) {
  let value = (to - from) % TWO_PI;
  if (value > Math.PI) value -= TWO_PI;
  if (value < -Math.PI) value += TWO_PI;
  return value;
}

function projectHeadingToScreen(heading: number) {
  const forwardX = Math.sin(heading);
  const forwardY = -Math.cos(heading) * Y_PERSPECTIVE;
  return Math.atan2(forwardX, -forwardY);
}

function isHarborKind(kind: ObjectKind): kind is HarborKind {
  return kind === "harborTrade" || kind === "harborShipyard" || kind === "harborArsenal" || kind === "harborAcademy";
}

function isHostileKind(kind: ObjectKind) {
  return kind === "rival" || kind === "seaCreature";
}

function hashCoordinates(x: number, y: number, salt = 0) {
  let hash = Math.imul(x, 374_761_393) ^ Math.imul(y, 668_265_263) ^ Math.imul(salt + 1, 1_274_126_177);
  hash = Math.imul(hash ^ (hash >>> 13), 1_274_126_177);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function objectSize(kind: ObjectKind, radius: number) {
  switch (kind) {
    case "island": return radius * 3.2;
    case "lighthouse": return radius * 3.15;
    case "palm": return radius * 3.05;
    case "reef": return radius * 2.85;
    case "wreck": return radius * 2.9;
    case "rescue": return radius * 3.15;
    case "crate": return radius * 3.5;
    case "rival": return radius * 3.15;
    case "wind": return radius * 4.35;
    case "whirlpool": return radius * 3.9;
    case "currentRift": return radius * 4.8;
    case "salvageBeacon": return radius * 4.15;
    case "cargoRaft": return radius * 3.8;
    case "stormWreckage": return radius * 3.55;
    case "seaCreature": return radius * 3.8;
    case "signalBuoy": return radius * 3.2;
    case "tideRelic": return radius * 3.3;
    case "rescueSkiff": return radius * 3.25;
    case "volcanicBomb": return radius * 3.15;
    case "harborTrade": return radius * 3.22;
    case "harborShipyard": return radius * 3.28;
    case "harborArsenal": return radius * 3.16;
    case "harborAcademy": return radius * 3.2;
    default: return radius * 2;
  }
}

async function loadImageAsset(source: string, failureMessage: string) {
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(failureMessage));
    const base = (globalThis as typeof globalThis & { __ENDLESS_WAKE_BASE_PATH__?: string }).__ENDLESS_WAKE_BASE_PATH__ ?? "";
    image.src = `${base}${source}`;
    if (image.complete && image.naturalWidth > 0) resolve();
  });
  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // A completed onload is sufficient on browsers that reject a second decode.
    }
  }
  return image;
}

export class VoyageV4Engine {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly onSnapshot: (snapshot: V4Snapshot) => void;
  private readonly onSound: (sound: V4Sound) => void;
  private options: V4EngineOptions;
  private atlas: HTMLImageElement | null = null;
  private playerShipImage: HTMLImageElement | null = null;
  private playerShipFurledImage: HTMLImageElement | null = null;
  private rivalShipImage: HTMLImageElement | null = null;
  private playerShipNorthImage: HTMLImageElement | null = null;
  private playerShipNorthFurledImage: HTMLImageElement | null = null;
  private rivalShipNorthImage: HTMLImageElement | null = null;
  private eventAtlas: HTMLImageElement | null = null;
  private islandVariantAtlas: HTMLImageElement | null = null;
  private eventFrameAtlas: HTMLImageElement | null = null;
  private eventExpansionAtlas: HTMLImageElement | null = null;
  private ambientLifeAtlas: HTMLImageElement | null = null;
  private harborAtlas: HTMLImageElement | null = null;
  private harborLifeAtlas: HTMLImageElement | null = null;
  private underwaterLifeAtlas: HTMLImageElement | null = null;
  private seabedPattern: CanvasPattern | null = null;
  private causticsPattern: CanvasPattern | null = null;
  private surfacePattern: CanvasPattern | null = null;
  private assetReady = false;
  private destroyed = false;
  private animationFrame = 0;
  private phase: V4Phase = "intro";

  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private renderScale = 1;
  private baseWorldScale = 18;
  private worldScale = 18;
  private cameraZoom = 1.16;
  private elapsed = 0;
  private lastFrame = 0;
  private lastIdleFrame = 0;
  private performanceElapsed = 0;
  private smoothedFrameMs = 16.7;
  private lastSnapshotTime = 0;

  private playerX = 0;
  private playerY = 0;
  private cameraX = 0;
  private cameraY = 3.6;
  private heading = 0;
  private velocityX = 0;
  private velocityY = 0;
  private angularVelocity = 0;
  private lateralDrift = 0;
  private windHeading = 0.72;
  private windStrength = 1;
  private targetHeading: number | null = null;
  private steer = 0;
  private boosting = false;
  private speed = 0;
  private sailBlend = 1;
  private targetSail = 1;
  private distance = 0;
  private bonusScore = 0;
  private lives = 3;
  private boostEnergy = 76;
  private cargo = 0;
  private valuables = 0;
  private fishCargo = 0;
  private coins = 0;
  private ammo = 18;
  private gunLevel = 1;
  private sunkEnemies = 0;
  private escortTime = 0;
  private fairWindTime = 0;
  private gunFocusTime = 0;
  private collisionCooldown = 0;
  private lastCollisionId = "";
  private lastCollisionGrace = 0;

  private chunks = new Map<string, SeaObject[]>();
  private chunkX = Number.NaN;
  private chunkY = Number.NaN;
  private objectCache: SeaObject[] = [];
  private visibleObjects: SeaObject[] = [];
  private marineLife: MarineLife[] = [];
  private collected = new Set<string>();
  private collectedOrder: string[] = [];
  private wakes: WakePoint[] = [];
  private wakeTimer = 0;
  private salvageDrops: SeaObject[] = [];
  private nearbyHarborObject: SeaObject | null = null;
  private framingHarborObject: SeaObject | null = null;
  private dockedHarbor: V4HarborService = "none";
  private autoDocking = false;
  private dockingHarborId = "";
  private dockBerthX = 0;
  private dockBerthY = 0;

  private fishingTargetId: string | null = null;
  private fishingProgress = 0;
  private netCooldown = 0;

  private cannonShots: CannonShot[] = [];
  private combatEffects: CombatEffect[] = [];
  private cannonCooldown = 0;
  private cannonSerial = 0;
  private broadsideTargetSide = 0;

  private activeEvent: V4VoyageEvent = "none";
  private eventIndex = 0;
  private eventTimer = 0;
  private eventDuration = 1;
  private eventFound = 0;
  private eventTarget = 0;
  private eventVariant = 0;
  private eventWave = 0;
  private eventSpawnSerial = 100;
  private eventAnchorX = 0;
  private eventAnchorY = 0;
  private nextEventDistance = 72;
  private eventObjects: SeaObject[] = [];
  private notice: V4Notice = "none";
  private noticeTimer = 0;

  private readonly resizeHandler = () => this.resize();

  constructor(
    canvas: HTMLCanvasElement,
    options: V4EngineOptions,
    onSnapshot: (snapshot: V4Snapshot) => void,
    onSound: (sound: V4Sound) => void,
  ) {
    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) throw new Error("This browser does not support Canvas 2D");
    this.canvas = canvas;
    this.context = context;
    this.options = options;
    this.onSnapshot = onSnapshot;
    this.onSound = onSound;
    this.createCausticsPattern();
    this.createSurfacePattern();
    this.resize();
    this.updateChunks(true);
    window.addEventListener("resize", this.resizeHandler, { passive: true });
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  async loadAssets() {
    if (this.assetReady) return;
    const [image, playerShipImage, playerShipFurledImage, rivalShipImage, playerShipNorthImage, playerShipNorthFurledImage, rivalShipNorthImage, eventAtlas, seabedImage, islandVariantAtlas, eventFrameAtlas, eventExpansionAtlas, ambientLifeAtlas, harborAtlas, harborLifeAtlas, underwaterLifeAtlas] = await Promise.all([
      loadImageAsset("/v4-world-atlas-v1.png", "Failed to load the V4 world atlas"),
      loadImageAsset("/v4-player-ship-directional-full-v1.png", "Failed to load the V4 player ship atlas"),
      loadImageAsset("/v4-player-ship-directional-furled-v1.png", "Failed to load the V4 furled-sail atlas"),
      loadImageAsset("/v4-rival-ship-directional-v1.png", "Failed to load the V4 rival ship atlas"),
      loadImageAsset("/v4-player-ship-north-full-v1.png", "Failed to load the V4 north-facing player ship"),
      loadImageAsset("/v4-player-ship-north-furled-v1.png", "Failed to load the V4 north-facing furled sail"),
      loadImageAsset("/v4-rival-ship-north-v1.png", "Failed to load the V4 north-facing rival ship"),
      loadImageAsset("/v4-events-v1.png", "Failed to load the V4 event atlas"),
      loadImageAsset("/v4-seabed.jpg", "Failed to load the V4 seabed"),
      loadImageAsset("/v4-island-variants-v1.png", "Failed to load the V4 island atlas"),
      loadImageAsset("/v4-event-frames-v1.png", "Failed to load the V4 event animation atlas"),
      loadImageAsset("/v4-event-expansion-v1.png", "Failed to load the V4 extended event atlas"),
      loadImageAsset("/v4-ambient-life-v1.png", "Failed to load the V4 wildlife atlas"),
      loadImageAsset("/v4-harbors-v1.png", "Failed to load the V4 harbor atlas"),
      loadImageAsset("/v4-harbor-life-v1.png", "Failed to load the V4 harbor life atlas"),
      loadImageAsset("/v4-underwater-life-v1.png", "Failed to load the V4 underwater life atlas"),
    ]);
    if (this.destroyed) return;
    this.atlas = image;
    this.playerShipImage = playerShipImage;
    this.playerShipFurledImage = playerShipFurledImage;
    this.rivalShipImage = rivalShipImage;
    this.playerShipNorthImage = playerShipNorthImage;
    this.playerShipNorthFurledImage = playerShipNorthFurledImage;
    this.rivalShipNorthImage = rivalShipNorthImage;
    this.eventAtlas = eventAtlas;
    this.islandVariantAtlas = islandVariantAtlas;
    this.eventFrameAtlas = eventFrameAtlas;
    this.eventExpansionAtlas = eventExpansionAtlas;
    this.ambientLifeAtlas = ambientLifeAtlas;
    this.harborAtlas = harborAtlas;
    this.harborLifeAtlas = harborLifeAtlas;
    this.underwaterLifeAtlas = underwaterLifeAtlas;
    this.createSeabedPattern(seabedImage);
    this.assetReady = true;
  }

  setOptions(options: V4EngineOptions) {
    const densityChanged = options.reducedSpeed !== this.options.reducedSpeed;
    this.options = options;
    if (densityChanged) this.resize();
  }

  startRun() {
    if (!this.assetReady) return;
    this.phase = "playing";
    this.playerX = 0;
    this.playerY = 0;
    this.cameraZoom = 1.16;
    this.worldScale = this.baseWorldScale * this.cameraZoom;
    this.cameraX = 0;
    this.cameraY = 4.2;
    this.heading = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angularVelocity = 0;
    this.lateralDrift = 0;
    this.windHeading = 0.72;
    this.windStrength = 1;
    this.targetHeading = null;
    this.steer = 0;
    this.boosting = false;
    this.speed = 0;
    this.sailBlend = 1;
    this.targetSail = 1;
    this.distance = 0;
    this.bonusScore = 0;
    this.lives = 3;
    this.boostEnergy = 76;
    this.cargo = 0;
    this.valuables = 0;
    this.fishCargo = 0;
    this.coins = 0;
    this.ammo = 18;
    this.gunLevel = 1;
    this.sunkEnemies = 0;
    this.escortTime = 0;
    this.fairWindTime = 0;
    this.gunFocusTime = 0;
    this.collisionCooldown = 0;
    this.lastCollisionId = "";
    this.lastCollisionGrace = 0;
    this.activeEvent = "none";
    this.eventIndex = 0;
    this.eventTimer = 0;
    this.eventFound = 0;
    this.eventTarget = 0;
    this.eventVariant = 0;
    this.eventWave = 0;
    this.eventSpawnSerial = 100;
    this.eventAnchorX = 0;
    this.eventAnchorY = 0;
    this.nextEventDistance = 72;
    this.eventObjects.length = 0;
    this.notice = "none";
    this.noticeTimer = 0;
    this.collected.clear();
    this.collectedOrder.length = 0;
    this.wakes.length = 0;
    this.wakeTimer = 0;
    this.salvageDrops.length = 0;
    this.nearbyHarborObject = null;
    this.framingHarborObject = null;
    this.dockedHarbor = "none";
    this.autoDocking = false;
    this.dockingHarborId = "";
    this.dockBerthX = 0;
    this.dockBerthY = 0;
    this.fishingTargetId = null;
    this.fishingProgress = 0;
    this.netCooldown = 0;
    this.cannonShots.length = 0;
    this.combatEffects.length = 0;
    this.cannonCooldown = 0;
    this.cannonSerial = 0;
    this.broadsideTargetSide = 0;
    this.chunks.clear();
    this.chunkX = Number.NaN;
    this.chunkY = Number.NaN;
    this.updateChunks(true);
    this.updateNearbyHarbor();
    this.lastFrame = performance.now();
    this.emitSnapshot(true);
  }

  createRunSave(): V4RunSave | null {
    const phase = this.phase;
    if (phase !== "playing" && phase !== "paused" && phase !== "docked") return null;
    return {
      version: V4_RUN_SAVE_VERSION,
      savedAt: Date.now(),
      phase,
      playerX: this.playerX,
      playerY: this.playerY,
      heading: this.heading,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      angularVelocity: this.angularVelocity,
      speed: this.speed,
      sailBlend: this.sailBlend,
      targetSail: this.targetSail,
      distance: this.distance,
      bonusScore: this.bonusScore,
      lives: this.lives,
      boostEnergy: this.boostEnergy,
      cargo: this.cargo,
      valuables: this.valuables,
      fishCargo: this.fishCargo,
      coins: this.coins,
      ammo: this.ammo,
      gunLevel: this.gunLevel,
      sunkEnemies: this.sunkEnemies,
      escortTime: this.escortTime,
      fairWindTime: this.fairWindTime,
      gunFocusTime: this.gunFocusTime,
      netCooldown: this.netCooldown,
      dockedHarbor: this.dockedHarbor,
      cannonCooldown: this.cannonCooldown,
      cannonSerial: this.cannonSerial,
      activeEvent: this.activeEvent,
      eventIndex: this.eventIndex,
      eventTimer: this.eventTimer,
      eventDuration: this.eventDuration,
      eventFound: this.eventFound,
      eventTarget: this.eventTarget,
      eventVariant: this.eventVariant,
      eventWave: this.eventWave,
      eventSpawnSerial: this.eventSpawnSerial,
      eventAnchorX: this.eventAnchorX,
      eventAnchorY: this.eventAnchorY,
      nextEventDistance: this.nextEventDistance,
      collectedIds: this.collectedOrder.slice(-MAX_COLLECTED_RECORDS),
      salvageDrops: this.salvageDrops.slice(0, MAX_SALVAGE_DROPS).map(copySavedSeaObject),
      eventObjects: this.eventObjects.slice(0, MAX_EVENT_OBJECTS).map(copySavedSeaObject),
    };
  }

  restoreRun(value: unknown) {
    const save = parseV4RunSave(value);
    if (!this.assetReady || !save) return false;

    this.phase = save.phase === "docked" ? "docked" : "playing";
    this.playerX = save.playerX;
    this.playerY = save.playerY;
    this.cameraZoom = save.phase === "docked" ? 1.62 : 1.16;
    this.worldScale = this.baseWorldScale * this.cameraZoom;
    this.cameraX = save.playerX;
    this.cameraY = save.playerY + 3.6;
    this.heading = save.heading;
    this.velocityX = save.phase === "docked" ? 0 : save.velocityX;
    this.velocityY = save.phase === "docked" ? 0 : save.velocityY;
    this.angularVelocity = save.phase === "docked" ? 0 : save.angularVelocity;
    this.lateralDrift = 0;
    this.targetHeading = null;
    this.steer = 0;
    this.boosting = false;
    this.speed = save.phase === "docked" ? 0 : save.speed;
    this.sailBlend = save.phase === "docked" ? 0 : save.sailBlend;
    this.targetSail = save.phase === "docked" ? 0 : save.targetSail;
    this.distance = save.distance;
    this.bonusScore = save.bonusScore;
    this.lives = save.lives;
    this.boostEnergy = save.boostEnergy;
    this.cargo = save.cargo;
    this.valuables = save.valuables;
    this.fishCargo = save.fishCargo;
    this.coins = save.coins;
    this.ammo = save.ammo;
    this.gunLevel = save.gunLevel;
    this.sunkEnemies = save.sunkEnemies;
    this.escortTime = save.escortTime;
    this.fairWindTime = save.fairWindTime;
    this.gunFocusTime = save.gunFocusTime;
    this.netCooldown = save.netCooldown;
    this.collisionCooldown = 0.65;
    this.lastCollisionId = "";
    this.lastCollisionGrace = 0;
    this.activeEvent = save.activeEvent;
    this.eventIndex = save.eventIndex;
    this.eventTimer = save.eventTimer;
    this.eventDuration = save.eventDuration;
    this.eventFound = save.eventFound;
    this.eventTarget = save.eventTarget;
    this.eventVariant = save.eventVariant;
    this.eventWave = save.eventWave;
    this.eventSpawnSerial = save.eventSpawnSerial;
    this.eventAnchorX = save.eventAnchorX;
    this.eventAnchorY = save.eventAnchorY;
    this.nextEventDistance = save.nextEventDistance;
    this.eventObjects.length = 0;
    this.eventObjects.push(...save.eventObjects.map((object) => ({ ...object })));
    this.notice = "none";
    this.noticeTimer = 0;
    this.collected.clear();
    this.collectedOrder.length = 0;
    for (const id of save.collectedIds) {
      this.collected.add(id);
      this.collectedOrder.push(id);
    }
    this.wakes.length = 0;
    this.wakeTimer = 0;
    this.salvageDrops.length = 0;
    this.salvageDrops.push(...save.salvageDrops.map((object) => ({ ...object })));
    this.nearbyHarborObject = null;
    this.framingHarborObject = null;
    this.dockedHarbor = save.dockedHarbor;
    this.autoDocking = false;
    this.dockingHarborId = "";
    this.dockBerthX = 0;
    this.dockBerthY = 0;
    this.fishingTargetId = null;
    this.fishingProgress = 0;
    this.cannonShots.length = 0;
    this.combatEffects.length = 0;
    this.cannonCooldown = save.cannonCooldown;
    this.cannonSerial = save.cannonSerial;
    this.broadsideTargetSide = 0;
    this.chunks.clear();
    this.chunkX = Number.NaN;
    this.chunkY = Number.NaN;
    this.updateChunks(true);
    this.updateNearbyHarbor();
    this.lastFrame = performance.now();
    this.emitSnapshot(true);
    return true;
  }

  returnToIntro() {
    if (this.phase === "intro" || this.phase === "gameover") return;
    this.phase = "intro";
    this.boosting = false;
    this.steer = 0;
    this.emitSnapshot(true);
  }

  pause() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.boosting = false;
    this.emitSnapshot(true);
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.lastFrame = performance.now();
    this.emitSnapshot(true);
  }

  setSteer(value: number) {
    if (this.phase !== "playing") return;
    this.steer = clamp(value, -1, 1);
    if (this.steer !== 0) {
      this.targetHeading = null;
    }
  }

  setBoosting(value: boolean) {
    const canBoost = value && this.phase === "playing" && this.targetSail > 0.5 && this.boostEnergy > 3;
    if (canBoost && !this.boosting) this.onSound("boost");
    this.boosting = canBoost;
  }

  setPointerDirection(normalizedX: number, normalizedY: number) {
    if (this.phase !== "playing") return;
    if (Math.hypot(normalizedX, normalizedY) < 0.12) return;
    const nextHeading = Math.atan2(normalizedX, -normalizedY / Y_PERSPECTIVE);
    this.targetHeading = nextHeading;
  }

  setSailsRaised(raised: boolean) {
    if (this.phase !== "playing") return;
    this.targetSail = raised ? 1 : 0;
    if (!raised) this.boosting = false;
    if (raised && this.autoDocking) {
      this.autoDocking = false;
      this.dockingHarborId = "";
    }
    this.emitSnapshot(true);
  }

  toggleSails() {
    this.setSailsRaised(this.targetSail < 0.5);
  }

  deployNet() {
    if (this.phase !== "playing" || this.netCooldown > 0 || this.fishingTargetId) return;
    // The HUD is sampled at 10 Hz while fish keep swimming between samples.
    // Preserve the player's visible "can cast" window without making the net
    // forgiving once the boat starts moving or the sails go back up.
    const school = this.findNearestFishSchool(NET_CAST_RANGE + NET_ACQUISITION_GRACE);
    const canCast = this.targetSail === 0 && this.sailBlend <= 0.32 && this.speed <= 1.25;
    if (!school || !canCast) {
      this.netCooldown = 1.1;
      this.showNotice("netMissed");
      this.onSound("splash");
      this.emitSnapshot(true);
      return;
    }
    this.fishingTargetId = school.id;
    this.fishingProgress = 0.001;
    this.autoDocking = false;
    this.dockingHarborId = "";
    this.onSound("splash");
    this.emitSnapshot(true);
  }

  tryDock() {
    if (this.phase !== "playing" || !this.nearbyHarborObject || !this.canDockAtHarbor(this.nearbyHarborObject)) return;
    this.beginAutoDocking(this.nearbyHarborObject);
  }

  departHarbor() {
    if (this.phase !== "docked") return;
    const departureHarbor = this.nearbyHarborObject && isHarborKind(this.nearbyHarborObject.kind)
      ? this.nearbyHarborObject
      : null;
    if (departureHarbor) {
      const dx = this.playerX - departureHarbor.x;
      const dy = this.playerY - departureHarbor.y;
      const distance = Math.max(0.001, Math.hypot(dx, dy));
      const normalX = dx / distance;
      const normalY = dy / distance;
      const departureRadius = departureHarbor.radius + 3.05;
      this.playerX = departureHarbor.x + normalX * departureRadius;
      this.playerY = departureHarbor.y + normalY * departureRadius;
      this.heading = Math.atan2(normalX, -normalY);
      this.targetHeading = null;
      this.collisionCooldown = 1.2;
      this.lastCollisionId = departureHarbor.id;
      this.lastCollisionGrace = 2.8;
    }
    this.phase = "playing";
    this.dockedHarbor = "none";
    this.autoDocking = false;
    this.dockingHarborId = "";
    this.targetSail = 1;
    this.sailBlend = 0.18;
    this.speed = 0.45;
    this.velocityX = Math.sin(this.heading) * this.speed;
    this.velocityY = -Math.cos(this.heading) * this.speed;
    this.angularVelocity = 0;
    this.lastFrame = performance.now();
    this.emitSnapshot(true);
  }

  sellCargoAtHarbor() {
    if (this.phase !== "docked" || this.dockedHarbor !== "trade" || this.cargo + this.valuables + this.fishCargo <= 0) return;
    const soldCargo = this.cargo;
    const soldValuables = this.valuables;
    const soldFish = this.fishCargo;
    this.cargo = 0;
    this.valuables = 0;
    this.fishCargo = 0;
    this.coins += soldCargo * V4_TRADE_PRICES.cargo + soldValuables * V4_TRADE_PRICES.valuables + soldFish * V4_TRADE_PRICES.fish;
    this.bonusScore += soldCargo * 70 + soldValuables * 150 + soldFish * 34;
    this.showNotice("cargoSold");
    this.onSound("coin");
    this.emitSnapshot(true);
  }

  repairAtHarbor() {
    const cost = this.getRepairCost();
    if (this.phase !== "docked" || this.dockedHarbor !== "shipyard" || this.lives >= 3 || this.coins < cost) return;
    this.coins -= cost;
    this.lives += 1;
    this.showNotice("hullRepaired");
    this.onSound("repair");
    this.emitSnapshot(true);
  }

  buyAmmoAtHarbor() {
    const capacity = this.getAmmoCapacity();
    const amount = Math.min(10, capacity - this.ammo);
    const cost = this.getAmmoPackCost();
    if (this.phase !== "docked" || this.dockedHarbor !== "arsenal" || amount <= 0 || this.coins < cost) return;
    this.coins -= cost;
    this.ammo += amount;
    this.showNotice("ammoBought");
    this.onSound("coin");
    this.emitSnapshot(true);
  }

  upgradeGunsAtHarbor() {
    const cost = this.getGunUpgradeCost();
    if (this.phase !== "docked" || this.dockedHarbor !== "academy" || this.gunLevel >= 3 || this.coins < cost) return;
    this.coins -= cost;
    this.gunLevel += 1;
    this.ammo = Math.min(this.getAmmoCapacity(), this.ammo + 4);
    this.showNotice("gunsUpgraded");
    this.onSound("repair");
    this.emitSnapshot(true);
  }

  private getAmmoCapacity() {
    return 24 + this.gunLevel * 6;
  }

  private getRepairCost() {
    return 8 + Math.max(0, 3 - this.lives) * 2;
  }

  private getAmmoPackCost() {
    return 8;
  }

  private getGunUpgradeCost() {
    if (this.gunLevel >= 3) return 0;
    return this.gunLevel === 1 ? 24 : 42;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.resizeHandler);
  }

  private readonly loop = (now: number) => {
    if (this.destroyed) return;
    const rawDelta = this.lastFrame ? (now - this.lastFrame) / 1000 : 0;
    this.lastFrame = now;
    const delta = clamp(rawDelta, 0, 0.05);
    this.elapsed += delta;

    if (this.phase === "playing") {
      this.update(delta);
      this.render();
      this.updatePerformance(rawDelta);
    } else if (now - this.lastIdleFrame >= IDLE_FRAME_INTERVAL_MS) {
      this.lastIdleFrame = now;
      this.render();
    }

    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(bounds.width || window.innerWidth));
    this.height = Math.max(1, Math.round(bounds.height || window.innerHeight));
    const dprLimit = this.options.reducedSpeed ? 1.25 : 1.8;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, dprLimit);
    this.baseWorldScale = clamp(Math.min(this.width, this.height) / (this.width < 720 ? 38 : 42), 12, 23);
    this.worldScale = this.baseWorldScale * this.cameraZoom;
    this.applyCanvasResolution();
  }

  private applyCanvasResolution() {
    const scale = this.pixelRatio * this.renderScale;
    const width = Math.max(1, Math.round(this.width * scale));
    const height = Math.max(1, Math.round(this.height * scale));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }

  private updatePerformance(rawDelta: number) {
    if (!Number.isFinite(rawDelta) || rawDelta <= 0 || rawDelta > 0.25) return;
    const frameMs = rawDelta * 1000;
    this.smoothedFrameMs = lerp(this.smoothedFrameMs, frameMs, 0.08);
    this.performanceElapsed += rawDelta;
    if (this.performanceElapsed < PERFORMANCE_SAMPLE_SECONDS) return;
    this.performanceElapsed = 0;
    let nextScale = this.renderScale;
    if (this.smoothedFrameMs > 22) nextScale = Math.max(MIN_RENDER_SCALE, this.renderScale - 0.08);
    else if (this.smoothedFrameMs < 17.3) nextScale = Math.min(1, this.renderScale + 0.05);
    if (Math.abs(nextScale - this.renderScale) >= 0.01) {
      this.renderScale = nextScale;
      this.applyCanvasResolution();
    }
  }

  private update(delta: number) {
    this.updateChunks(false);
    this.updateNearbyHarbor();

    this.windHeading = (0.72 + Math.sin(this.elapsed * 0.021 + this.playerX * 0.0031) * 0.54
      + Math.sin(this.playerY * 0.0017 - this.elapsed * 0.008) * 0.18 + TWO_PI) % TWO_PI;
    this.windStrength = 0.84 + Math.sin(this.elapsed * 0.037 + this.playerY * 0.0024) * 0.13
      + Math.sin(this.elapsed * 0.011 + this.playerX * 0.0012) * 0.07;

    if (!this.autoDocking && !this.fishingTargetId && this.nearbyHarborObject && this.canDockAtHarbor(this.nearbyHarborObject)) {
      this.beginAutoDocking(this.nearbyHarborObject);
    }
    const dockingHarbor = this.autoDocking
      ? this.objectCache.find((object) => object.id === this.dockingHarborId && object.active && isHarborKind(object.kind)) ?? null
      : null;
    if (this.autoDocking && !dockingHarbor) {
      this.autoDocking = false;
      this.dockingHarborId = "";
    }

    let steeringInput = this.steer;
    if (dockingHarbor) {
      this.targetSail = 0;
      this.boosting = false;
      const dockDeltaX = this.dockBerthX - this.playerX;
      const dockDeltaY = this.dockBerthY - this.playerY;
      const dockHeading = Math.atan2(dockDeltaX, -dockDeltaY);
      steeringInput = clamp(angleDelta(this.heading, dockHeading) / 0.52, -1, 1);
      this.targetHeading = dockHeading;
    } else if (steeringInput === 0 && this.targetHeading !== null) {
      const difference = angleDelta(this.heading, this.targetHeading);
      steeringInput = clamp(difference / 0.66, -1, 1);
      if (Math.abs(difference) < 0.012 && Math.abs(this.angularVelocity) < 0.035) this.targetHeading = null;
    }

    const preTurnForwardX = Math.sin(this.heading);
    const preTurnForwardY = -Math.cos(this.heading);
    const preTurnForwardSpeed = this.velocityX * preTurnForwardX + this.velocityY * preTurnForwardY;
    const steeringAuthority = clamp(Math.abs(preTurnForwardSpeed) / 2.8, 0.1, 1);
    const rudderAcceleration = (this.options.reducedSpeed ? 2.35 : 2.75) * steeringAuthority;
    this.angularVelocity += steeringInput * rudderAcceleration * delta;
    const angularDamping = Math.exp(-delta * (steeringInput === 0 ? 3.4 : 2.25));
    this.angularVelocity *= angularDamping;
    this.angularVelocity = clamp(this.angularVelocity, -1.75, 1.75);
    this.heading = (this.heading + this.angularVelocity * delta + TWO_PI) % TWO_PI;

    const sailBlendEase = 1 - Math.exp(-delta * (this.targetSail > this.sailBlend ? 1.48 : 2.15));
    this.sailBlend = lerp(this.sailBlend, this.targetSail, sailBlendEase);
    if (this.targetSail === 0 && this.sailBlend < 0.008) this.sailBlend = 0;

    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    const rightX = Math.cos(this.heading);
    const rightY = Math.sin(this.heading);
    const windAlignment = (Math.cos(angleDelta(this.windHeading, this.heading)) + 1) * 0.5;
    const sailEfficiency = 0.37 + Math.pow(windAlignment, 0.58) * 0.63;
    const usingBoost = this.boosting && this.boostEnergy > 0.5 && this.targetSail > 0.5;
    const fairWindForce = this.fairWindTime > 0 ? 1.13 : 1;
    const difficultyForce = 1 + Math.min(0.18, this.distance / 9_000);
    const thrust = (this.options.reducedSpeed ? 3.45 : 4.25) * this.sailBlend * sailEfficiency
      * this.windStrength * fairWindForce * difficultyForce * (usingBoost ? 1.58 : 1);
    this.velocityX += forwardX * thrust * delta;
    this.velocityY += forwardY * thrust * delta;

    let forwardSpeed = this.velocityX * forwardX + this.velocityY * forwardY;
    let lateralSpeed = this.velocityX * rightX + this.velocityY * rightY;
    const furlBrake = this.targetSail === 0 ? 0.3 : 0;
    const forwardDrag = forwardSpeed * (0.12 + furlBrake) + forwardSpeed * Math.abs(forwardSpeed) * 0.067;
    const lateralDrag = lateralSpeed * 1.62 + lateralSpeed * Math.abs(lateralSpeed) * 0.16;
    this.velocityX -= (forwardX * forwardDrag + rightX * lateralDrag) * delta;
    this.velocityY -= (forwardY * forwardDrag + rightY * lateralDrag) * delta;

    const windPush = 0.055 * this.windStrength * (0.35 + this.sailBlend * 0.65);
    this.velocityX += Math.sin(this.windHeading) * windPush * delta;
    this.velocityY -= Math.cos(this.windHeading) * windPush * delta;

    if (this.activeEvent === "maelstrom") {
      const current = Math.sin(this.eventTimer * 2.4 + this.eventIndex) * 1.25;
      this.velocityX += rightX * current * delta;
      this.velocityY += rightY * current * delta;
    }

    if (dockingHarbor) {
      const dockDeltaX = this.dockBerthX - this.playerX;
      const dockDeltaY = this.dockBerthY - this.playerY;
      const dockDistance = Math.hypot(dockDeltaX, dockDeltaY);
      const desiredDockSpeed = dockDistance < 0.32 ? 0 : clamp(dockDistance * 0.52, 0.16, 0.72);
      const dockDirectionX = dockDistance > 0.001 ? dockDeltaX / dockDistance : 0;
      const dockDirectionY = dockDistance > 0.001 ? dockDeltaY / dockDistance : 0;
      const dockEase = 1 - Math.exp(-delta * 3.25);
      this.velocityX = lerp(this.velocityX, dockDirectionX * desiredDockSpeed, dockEase);
      this.velocityY = lerp(this.velocityY, dockDirectionY * desiredDockSpeed, dockEase);
    }

    const velocityMagnitude = Math.hypot(this.velocityX, this.velocityY);
    const maximumSpeed = this.options.reducedSpeed ? 7.1 : 8.6;
    if (velocityMagnitude > maximumSpeed) {
      const speedScale = maximumSpeed / velocityMagnitude;
      this.velocityX *= speedScale;
      this.velocityY *= speedScale;
    }
    if (this.targetSail === 0 && Math.hypot(this.velocityX, this.velocityY) < 0.018 && !dockingHarbor) {
      this.velocityX = 0;
      this.velocityY = 0;
    }

    const previousX = this.playerX;
    const previousY = this.playerY;
    this.playerX += this.velocityX * delta;
    this.playerY += this.velocityY * delta;
    this.speed = Math.hypot(this.velocityX, this.velocityY);
    lateralSpeed = this.velocityX * rightX + this.velocityY * rightY;
    this.lateralDrift = Math.abs(lateralSpeed);
    this.distance += Math.hypot(this.playerX - previousX, this.playerY - previousY) * 1.04;

    if (dockingHarbor
      && Math.hypot(this.playerX - this.dockBerthX, this.playerY - this.dockBerthY) < 0.3
      && this.speed < 0.34) {
      this.completeDocking(dockingHarbor);
      return;
    }

    if (usingBoost) this.boostEnergy = Math.max(0, this.boostEnergy - delta * (this.fairWindTime > 0 ? 11.7 : 18));
    else this.boostEnergy = Math.min(100, this.boostEnergy + delta * 6.3);
    this.netCooldown = Math.max(0, this.netCooldown - delta);
    this.collisionCooldown = Math.max(0, this.collisionCooldown - delta);
    this.lastCollisionGrace = Math.max(0, this.lastCollisionGrace - delta);
    if (this.lastCollisionGrace <= 0) this.lastCollisionId = "";
    this.escortTime = Math.max(0, this.escortTime - delta);
    this.fairWindTime = Math.max(0, this.fairWindTime - delta);
    this.gunFocusTime = Math.max(0, this.gunFocusTime - delta);
    if (this.noticeTimer > 0) {
      this.noticeTimer -= delta;
      if (this.noticeTimer <= 0) this.notice = "none";
    }

    this.updateEvent(delta);
    this.updateCombat(delta);
    this.updateWake(delta, forwardX, forwardY);
    this.updateSalvageDrops(delta);
    this.updateFishing(delta);
    this.updateChunks(false);
    this.updateNearbyHarbor();
    this.checkCollisions(delta);

    this.updateCameraPresentation(delta, forwardX, forwardY);
    this.emitSnapshot(false);
  }

  private updateCameraPresentation(delta: number, forwardX: number, forwardY: number) {
    let targetZoom = lerp(1.17, 1.08, clamp(this.speed / 11.5, 0, 1));
    if (this.activeEvent !== "none") targetZoom = Math.max(targetZoom, 1.27);

    const nearbyFish = this.speed < 2.2 ? this.findNearestFishSchool(NET_CAST_RANGE * 1.4) : null;
    if (nearbyFish || this.fishingTargetId) targetZoom = Math.max(targetZoom, this.fishingTargetId ? 1.58 : 1.42);

    let harborFraming = 0;
    const harbor = this.framingHarborObject;
    if (harbor) {
      const distance = Math.hypot(this.playerX - harbor.x, this.playerY - harbor.y);
      harborFraming = 1 - clamp((distance - harbor.radius - 3.5) / 18, 0, 1);
      targetZoom = Math.max(targetZoom, lerp(1.2, 1.68, harborFraming));
    }

    const zoomEase = 1 - Math.exp(-delta * 2.15);
    this.cameraZoom = lerp(this.cameraZoom, targetZoom, zoomEase);
    this.worldScale = this.baseWorldScale * this.cameraZoom;

    const lookAhead = 5.4 * clamp(this.speed / 5.8, 0, 1) / this.cameraZoom;
    let targetCameraX = this.playerX + forwardX * lookAhead;
    let targetCameraY = this.playerY + forwardY * lookAhead;

    if (harbor && harborFraming > 0) {
      const harborCenterX = lerp(this.playerX, harbor.x, 0.42);
      const harborCenterY = lerp(this.playerY, harbor.y, 0.42);
      targetCameraX = lerp(targetCameraX, harborCenterX, harborFraming);
      targetCameraY = lerp(targetCameraY, harborCenterY, harborFraming);
    } else if (this.fishingTargetId) {
      const target = this.marineLife.find((life) => life.id === this.fishingTargetId);
      if (target) {
        const pose = this.marinePose(target);
        targetCameraX = lerp(targetCameraX, pose.x, 0.34);
        targetCameraY = lerp(targetCameraY, pose.y, 0.34);
      }
    }

    const cameraEase = 1 - Math.exp(-delta * 3.4);
    this.cameraX = lerp(this.cameraX, targetCameraX, cameraEase);
    this.cameraY = lerp(this.cameraY, targetCameraY, cameraEase);
  }

  private updateWake(delta: number, forwardX: number, forwardY: number) {
    let alive = 0;
    for (let index = 0; index < this.wakes.length; index += 1) {
      const point = this.wakes[index];
      point.age += delta;
      if (point.age < 5.8) this.wakes[alive++] = point;
    }
    this.wakes.length = alive;
    this.wakeTimer -= delta;
    if (this.speed < 0.22) return;
    if (this.wakeTimer > 0) return;
    this.wakeTimer = this.options.reducedMotion ? 0.13 : 0.075;
    const sideX = -forwardY;
    const sideY = forwardX;
    const sternX = this.playerX - forwardX * 2.58;
    const sternY = this.playerY - forwardY * 2.58;
    this.wakes.push({
      leftX: sternX + sideX * 0.52,
      leftY: sternY + sideY * 0.52,
      rightX: sternX - sideX * 0.52,
      rightY: sternY - sideY * 0.52,
      centerX: sternX,
      centerY: sternY,
      age: 0,
    });
    if (this.wakes.length > MAX_WAKE_POINTS) this.wakes.splice(0, this.wakes.length - MAX_WAKE_POINTS);
  }

  private updateSalvageDrops(delta: number) {
    let active = 0;
    for (let index = 0; index < this.salvageDrops.length; index += 1) {
      const drop = this.salvageDrops[index];
      drop.age = (drop.age ?? 0) + delta;
      if (!drop.active || drop.age > 36) continue;
      this.salvageDrops[active++] = drop;
    }
    this.salvageDrops.length = active;
  }

  private rebuildMarineLife() {
    this.marineLife.length = 0;
    for (const key of this.chunks.keys()) {
      if (this.marineLife.length >= MAX_MARINE_LIFE) break;
      const [chunkX, chunkY] = key.split(":").map(Number);
      const random = seededRandom(hashCoordinates(chunkX, chunkY, 4_019));
      const originX = chunkX * CHUNK_SIZE;
      const originY = chunkY * CHUNK_SIZE;
      const count = 2 + (random() < 0.58 ? 1 : 0);
      for (let index = 0; index < count && this.marineLife.length < MAX_MARINE_LIFE; index += 1) {
        const roll = random();
        const kind: MarineLifeKind = roll < 0.54 ? "fishSchool" : roll < 0.72 ? "turtle" : roll < 0.88 ? "manta" : "octopus";
        this.marineLife.push({
          id: `marine:${chunkX}:${chunkY}:${index}`,
          kind,
          x: originX + 3.5 + random() * (CHUNK_SIZE - 7),
          y: originY + 3.5 + random() * (CHUNK_SIZE - 7),
          scale: 0.82 + random() * 0.38,
          seed: Math.floor(random() * 1_000_000),
        });
      }
      if (chunkX === 0 && chunkY === 0 && this.marineLife.length < MAX_MARINE_LIFE) {
        this.marineLife.push({ id: "marine:charted:shoal", kind: "fishSchool", x: 4.2, y: -7.6, scale: 1.04, seed: 912_731 });
      }
    }
  }

  private marinePose(life: MarineLife) {
    const phase = (life.seed % 1_009) / 1_009 * TWO_PI;
    const motionTime = this.options.reducedMotion ? 0 : this.elapsed;
    const speed = life.kind === "fishSchool" ? 0.22 : life.kind === "turtle" ? 0.09 : life.kind === "manta" ? 0.075 : 0.045;
    const radius = life.kind === "fishSchool" ? 2.9 : life.kind === "turtle" ? 2.2 : life.kind === "manta" ? 3.4 : 0.8;
    const angle = phase + motionTime * speed * (life.seed % 2 === 0 ? 1 : -1);
    const x = life.x + Math.cos(angle) * radius;
    const y = life.y + Math.sin(angle * (life.kind === "octopus" ? 0.62 : 1)) * radius * 0.54;
    const direction = life.seed % 2 === 0 ? 1 : -1;
    const velocityX = -Math.sin(angle) * radius * speed * direction;
    const velocityY = Math.cos(angle) * radius * 0.54 * speed * direction;
    return { x, y, velocityX, velocityY };
  }

  private findNearestFishSchool(range: number) {
    let nearest: MarineLife | null = null;
    let nearestDistance = range;
    for (const life of this.marineLife) {
      if (life.kind !== "fishSchool" || this.collected.has(life.id)) continue;
      const pose = this.marinePose(life);
      const distance = Math.hypot(pose.x - this.playerX, pose.y - this.playerY);
      if (distance <= nearestDistance) {
        nearest = life;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private updateFishing(delta: number) {
    if (!this.fishingTargetId) return;
    const target = this.marineLife.find((life) => life.id === this.fishingTargetId && life.kind === "fishSchool");
    const invalidCast = !target || this.targetSail > 0 || this.sailBlend > 0.46 || this.speed > 1.8;
    const pose = target ? this.marinePose(target) : null;
    if (invalidCast || !pose || Math.hypot(pose.x - this.playerX, pose.y - this.playerY) > NET_CAST_RANGE + 1.25) {
      this.fishingTargetId = null;
      this.fishingProgress = 0;
      this.netCooldown = Math.max(this.netCooldown, 1.8);
      this.showNotice("netMissed");
      return;
    }
    this.fishingProgress = clamp(this.fishingProgress + delta / NET_CAST_SECONDS, 0, 1);
    if (this.fishingProgress < 1) return;
    const catchSize = 2 + target.seed % 4;
    this.collected.add(target.id);
    this.collectedOrder.push(target.id);
    if (this.collectedOrder.length > MAX_COLLECTED_RECORDS) {
      const removed = this.collectedOrder.shift();
      if (removed) this.collected.delete(removed);
    }
    this.fishCargo += catchSize;
    this.bonusScore += catchSize * 42;
    this.fishingTargetId = null;
    this.fishingProgress = 0;
    this.netCooldown = NET_RECOVERY_SECONDS;
    this.showNotice("fishCaught");
    this.onSound("collect");
  }

  private updateNearbyHarbor() {
    let nearest: SeaObject | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const object of this.objectCache) {
      if (!object.active || !isHarborKind(object.kind)) continue;
      const distance = Math.hypot(this.playerX - object.x, this.playerY - object.y);
      if (distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    }
    this.nearbyHarborObject = nearest && nearestDistance <= nearest.radius + 8.5 ? nearest : null;
    this.framingHarborObject = nearest && nearestDistance <= nearest.radius + 25 ? nearest : null;
  }

  private canDockAtHarbor(harbor: SeaObject) {
    if (!isHarborKind(harbor.kind) || this.activeEvent !== "none" || this.fishingTargetId
      || this.targetSail > 0 || this.sailBlend > 0.32 || this.speed > DOCKING_SPEED) return false;
    return Math.hypot(this.playerX - harbor.x, this.playerY - harbor.y) <= harbor.radius + AUTO_DOCK_APPROACH_MARGIN;
  }

  private beginAutoDocking(harbor: SeaObject) {
    if (!this.canDockAtHarbor(harbor) || !isHarborKind(harbor.kind)) return;
    const dx = this.playerX - harbor.x;
    const dy = this.playerY - harbor.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const normalX = dx / distance;
    const normalY = dy / distance;
    const berthRadius = harbor.radius + 1.45;
    this.autoDocking = true;
    this.dockingHarborId = harbor.id;
    this.dockBerthX = harbor.x + normalX * berthRadius;
    this.dockBerthY = harbor.y + normalY * berthRadius;
    this.targetSail = 0;
    this.boosting = false;
  }

  private completeDocking(harbor: SeaObject) {
    if (!isHarborKind(harbor.kind)) return;
    this.playerX = this.dockBerthX;
    this.playerY = this.dockBerthY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angularVelocity = 0;
    this.speed = 0;
    this.sailBlend = 0;
    this.targetSail = 0;
    this.boosting = false;
    this.steer = 0;
    this.targetHeading = null;
    this.phase = "docked";
    this.dockedHarbor = HARBOR_SERVICE_BY_KIND[harbor.kind];
    this.autoDocking = false;
    this.dockingHarborId = "";
    this.cameraZoom = 1.68;
    this.worldScale = this.baseWorldScale * this.cameraZoom;
    this.cameraX = lerp(this.playerX, harbor.x, 0.42);
    this.cameraY = lerp(this.playerY, harbor.y, 0.42);
    this.emitSnapshot(true);
  }

  private updateCombat(delta: number) {
    this.cannonCooldown = Math.max(0, this.cannonCooldown - delta);
    let effectCount = 0;
    for (let index = 0; index < this.combatEffects.length; index += 1) {
      const effect = this.combatEffects[index];
      effect.age += delta;
      if (effect.age >= effect.duration) continue;
      this.combatEffects[effectCount++] = effect;
    }
    this.combatEffects.length = effectCount;

    let shotCount = 0;
    for (let index = 0; index < this.cannonShots.length; index += 1) {
      const shot = this.cannonShots[index];
      shot.age += delta;
      if (shot.age >= shot.duration) {
        this.resolveCannonImpact(shot);
        continue;
      }
      this.cannonShots[shotCount++] = shot;
    }
    this.cannonShots.length = shotCount;

    const target = this.findBroadsideTarget();
    this.broadsideTargetSide = target ? this.sideForTarget(target) : 0;
    if (target && this.cannonCooldown <= 0 && this.ammo > 0) this.fireBroadside(target, this.broadsideTargetSide || 1);
  }

  private findBroadsideTarget() {
    const range = 9.4 + this.gunLevel * 1.25;
    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    let nearest: SeaObject | null = null;
    let nearestScore = Number.POSITIVE_INFINITY;
    for (const object of this.eventObjects) {
      if (!object.active || !isHostileKind(object.kind) || (object.health ?? 0) <= 0) continue;
      const dx = object.x - this.playerX;
      const dy = object.y - this.playerY;
      const distance = Math.hypot(dx, dy);
      if (distance < 1.8 || distance > range) continue;
      const forwardAlignment = Math.abs((dx * forwardX + dy * forwardY) / Math.max(0.001, distance));
      if (forwardAlignment > Math.sin(BROADSIDE_HALF_ANGLE)) continue;
      const score = distance + forwardAlignment * 1.8 + (object.health ?? 1) * 0.04;
      if (score < nearestScore) {
        nearest = object;
        nearestScore = score;
      }
    }
    return nearest;
  }

  private sideForTarget(target: SeaObject) {
    const rightX = Math.cos(this.heading);
    const rightY = Math.sin(this.heading);
    return (target.x - this.playerX) * rightX + (target.y - this.playerY) * rightY >= 0 ? 1 : -1;
  }

  private fireBroadside(target: SeaObject, side: number) {
    const volleySize = Math.min(this.ammo, 2 + this.gunLevel, MAX_CANNON_SHOTS - this.cannonShots.length);
    if (volleySize <= 0) return;
    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    const rightX = Math.cos(this.heading);
    const rightY = Math.sin(this.heading);
    const distance = Math.hypot(target.x - this.playerX, target.y - this.playerY);
    for (let index = 0; index < volleySize; index += 1) {
      const seed = hashCoordinates(this.cannonSerial, index, target.seed + 1_107);
      const random = seededRandom(seed);
      const spreadAngle = random() * TWO_PI;
      const focusSpread = this.gunFocusTime > 0 ? 0.62 : 1;
      const spreadRadius = Math.sqrt(random()) * (1.72 - this.gunLevel * 0.18) * focusSpread;
      const muzzleOffset = (index - (volleySize - 1) * 0.5) * 0.28;
      const startX = this.playerX + rightX * side * 0.78 + forwardX * muzzleOffset;
      const startY = this.playerY + rightY * side * 0.78 + forwardY * muzzleOffset;
      const duration = 0.43 + distance * 0.038 + index * 0.018;
      this.cannonShots.push({
        startX,
        startY,
        endX: target.x + (target.velocityX ?? 0) * duration * 0.9 + Math.cos(spreadAngle) * spreadRadius,
        endY: target.y + (target.velocityY ?? 0) * duration * 0.9 + Math.sin(spreadAngle) * spreadRadius,
        targetId: target.id,
        age: 0,
        duration,
        seed,
      });
      this.spawnCombatEffect("muzzle", startX, startY, seed, 0.34);
    }
    this.ammo -= volleySize;
    this.cannonSerial += 1;
    this.cannonCooldown = (1.58 - (this.gunLevel - 1) * 0.2) * (this.gunFocusTime > 0 ? 0.74 : 1);
    this.onSound("cannon");
  }

  private resolveCannonImpact(shot: CannonShot) {
    const target = this.eventObjects.find((object) => object.id === shot.targetId && object.active);
    const hitRadius = target ? target.radius * 0.62 + 0.3 : 0;
    const hit = Boolean(target && Math.hypot(target.x - shot.endX, target.y - shot.endY) <= hitRadius);
    if (!target || !hit) {
      this.spawnCombatEffect("water", shot.endX, shot.endY, shot.seed, 0.82);
      this.onSound("splash");
      return;
    }
    target.health = Math.max(0, (target.health ?? 1) - 1);
    this.spawnCombatEffect("hit", target.x, target.y, shot.seed, 0.62);
    this.onSound("hit");
    if (target.health <= 0) this.sinkHostile(target);
  }

  private sinkHostile(target: SeaObject) {
    if (!target.active) return;
    target.active = false;
    const creature = target.kind === "seaCreature";
    this.sunkEnemies += 1;
    this.coins += creature ? V4_REWARD_RULES.leviathan.sinkCoins : V4_REWARD_RULES.rival.sinkCoins;
    if (creature) this.valuables += V4_REWARD_RULES.leviathan.sinkValuables;
    this.bonusScore += creature ? 620 : 460;
    this.spawnCombatEffect("sink", target.x, target.y, target.seed, 1.3);
    if (this.salvageDrops.length < MAX_SALVAGE_DROPS) {
      this.salvageDrops.push({
        id: `salvage:${this.eventIndex}:${this.cannonSerial}:${this.sunkEnemies}`,
        kind: "crate",
        x: target.x,
        y: target.y,
        radius: 0.74,
        scale: 1,
        rotation: target.rotation * 0.37,
        seed: hashCoordinates(target.seed, this.sunkEnemies, 1_421),
        active: true,
        eventObject: false,
        age: 0,
      });
    }
    const remainingHostiles = this.eventObjects.some((object) => object.active && isHostileKind(object.kind));
    if (!remainingHostiles && this.activeEvent === "rival") {
      this.showNotice("rivalClear");
      this.finishEvent();
    } else if (!remainingHostiles && this.activeEvent === "leviathan") {
      this.showNotice("leviathanClear");
      this.finishEvent();
    } else {
      this.showNotice("enemySunk");
    }
  }

  private spawnCombatEffect(kind: CombatEffectKind, x: number, y: number, seed: number, duration: number) {
    if (this.combatEffects.length >= MAX_COMBAT_EFFECTS) this.combatEffects.shift();
    this.combatEffects.push({ kind, x, y, age: 0, duration, seed });
  }

  private updateChunks(force: boolean) {
    const nextX = Math.floor(this.playerX / CHUNK_SIZE);
    const nextY = Math.floor(this.playerY / CHUNK_SIZE);
    if (!force && nextX === this.chunkX && nextY === this.chunkY) return;
    this.chunkX = nextX;
    this.chunkY = nextY;
    for (let y = nextY - CHUNK_RADIUS; y <= nextY + CHUNK_RADIUS; y += 1) {
      for (let x = nextX - CHUNK_RADIUS; x <= nextX + CHUNK_RADIUS; x += 1) {
        const key = chunkKey(x, y);
        if (!this.chunks.has(key)) this.chunks.set(key, this.generateChunk(x, y));
      }
    }
    for (const key of this.chunks.keys()) {
      const [x, y] = key.split(":").map(Number);
      if (Math.abs(x - nextX) > CHUNK_RADIUS || Math.abs(y - nextY) > CHUNK_RADIUS) this.chunks.delete(key);
    }
    this.objectCache.length = 0;
    for (const objects of this.chunks.values()) this.objectCache.push(...objects);
    this.objectCache.sort((left, right) => left.y - right.y || left.x - right.x);
    this.rebuildMarineLife();
  }

  private generateChunk(chunkX: number, chunkY: number) {
    const random = seededRandom(hashCoordinates(chunkX, chunkY, 27));
    const objects: SeaObject[] = [];
    const originX = chunkX * CHUNK_SIZE;
    const originY = chunkY * CHUNK_SIZE;
    let serial = 0;
    const add = (kind: ObjectKind, x: number, y: number, radius: number, scale = 1, rotation = 0) => {
      if (Math.hypot(x, y) < (kind === "crate" || kind === "wind" || kind === "rescue" ? 7 : 14)) return;
      objects.push({
        id: `${chunkX}:${chunkY}:${serial++}`,
        kind,
        x,
        y,
        radius,
        scale,
        rotation,
        seed: Math.floor(random() * 1_000_000),
        active: true,
        eventObject: false,
      });
    };

    const chartedHarbor = CHARTED_HARBORS[chunkKey(chunkX, chunkY)];
    const harborRoll = hashCoordinates(chunkX, chunkY, 713) / 4_294_967_296;
    const hasRandomHarbor = !chartedHarbor && harborRoll < HARBOR_CHANCE && Math.hypot(chunkX, chunkY) > 2;
    const harborService = chartedHarbor?.service ?? (hasRandomHarbor
      ? (["trade", "shipyard", "arsenal", "academy"] as const)[hashCoordinates(chunkX, chunkY, 827) % 4]
      : null);
    if (harborService) {
      const harborX = originX + (chartedHarbor?.offsetX ?? 7 + random() * (CHUNK_SIZE - 14));
      const harborY = originY + (chartedHarbor?.offsetY ?? 7 + random() * (CHUNK_SIZE - 14));
      const harborKind = HARBOR_KIND_BY_SERVICE[harborService];
      const harborRadius = 4.75 + random() * 0.32;
      add(harborKind, harborX, harborY, harborRadius, 0.94 + random() * 0.08);
      const satelliteCount = 1 + Math.floor(random() * 2);
      for (let satellite = 0; satellite < satelliteCount; satellite += 1) {
        const angle = random() * TWO_PI;
        const distance = harborRadius + 5.5 + random() * 3.2;
        add("reef", harborX + Math.cos(angle) * distance, harborY + Math.sin(angle) * distance, 1.7 + random() * 0.32, 0.72 + random() * 0.2);
      }
      if (chartedHarbor?.service === "trade") {
        add("crate", harborX - 9.5, harborY + 8, 0.72, 0.94, 0.18);
        add("crate", harborX - 6.7, harborY + 5, 0.72, 1, -0.1);
        add("crate", harborX - 3.5, harborY + 8, 0.72, 0.92, 0.28);
      }
    }

    const islandCount = harborService ? 0 : random() < 0.76 ? 1 : random() < 0.54 ? 2 : 0;
    for (let index = 0; index < islandCount; index += 1) {
      const x = originX + 5 + random() * (CHUNK_SIZE - 10);
      const y = originY + 5 + random() * (CHUNK_SIZE - 10);
      const roll = random();
      const kind: ObjectKind = roll < 0.47 ? "island" : roll < 0.7 ? "lighthouse" : "palm";
      const radius = kind === "island" ? 4.35 + random() * 1.15 : kind === "lighthouse" ? 3.65 : 3.25;
      add(kind, x, y, radius, 0.9 + random() * 0.18);
      const satelliteCount = 1 + Math.floor(random() * 3);
      for (let satellite = 0; satellite < satelliteCount; satellite += 1) {
        const angle = random() * TWO_PI;
        const distance = radius + 3.4 + random() * 4.6;
        const satelliteKind: ObjectKind = random() < 0.73 ? "reef" : "wreck";
        add(satelliteKind, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, satelliteKind === "reef" ? 2.1 : 2.45, 0.72 + random() * 0.28, (random() - 0.5) * 0.2);
      }
    }

    const pickupCount = 2 + Math.floor(random() * 4);
    for (let index = 0; index < pickupCount; index += 1) {
      const x = originX + 3 + random() * (CHUNK_SIZE - 6);
      const y = originY + 3 + random() * (CHUNK_SIZE - 6);
      const kind: ObjectKind = random() < 0.58 ? "crate" : "wind";
      add(kind, x, y, kind === "crate" ? 0.72 : 0.68, 0.88 + random() * 0.18, random() * TWO_PI);
    }
    if (random() < 0.16) add("rescue", originX + 5 + random() * 22, originY + 5 + random() * 22, 1.05, 0.95, random() * TWO_PI);
    if (!harborService && random() < 0.25) add("whirlpool", originX + 5 + random() * 22, originY + 5 + random() * 22, 1.75 + random() * 0.5, 1, random() * TWO_PI);
    return objects;
  }

  private checkCollisions(delta: number) {
    const centerChunkX = Math.floor(this.playerX / CHUNK_SIZE);
    const centerChunkY = Math.floor(this.playerY / CHUNK_SIZE);
    for (let chunkY = centerChunkY - 1; chunkY <= centerChunkY + 1; chunkY += 1) {
      for (let chunkX = centerChunkX - 1; chunkX <= centerChunkX + 1; chunkX += 1) {
        const objects = this.chunks.get(chunkKey(chunkX, chunkY));
        if (!objects) continue;
        for (const object of objects) this.checkObjectCollision(object, delta);
      }
    }
    for (const object of this.eventObjects) this.checkObjectCollision(object, delta);
    for (const object of this.salvageDrops) this.checkObjectCollision(object, delta);
  }

  private checkObjectCollision(object: SeaObject, delta: number) {
    if (!object.active || this.collected.has(object.id)) return;
    const dx = this.playerX - object.x;
    const dy = this.playerY - object.y;
    const distanceSquared = dx * dx + dy * dy;
    const scanRadius = COLLISION_SCAN_RADIUS + object.radius;
    if (distanceSquared > scanRadius * scanRadius) return;

    if (object.kind === "whirlpool") {
      const distance = Math.max(0.35, Math.sqrt(distanceSquared));
      if (distance < object.radius * 2.7) {
        const pull = (1 - distance / (object.radius * 2.7)) * delta * 2.2;
        this.playerX -= (dx / distance) * pull;
        this.playerY -= (dy / distance) * pull;
      }
    }

    if (object.kind === "crate" && distanceSquared < 1.35 * 1.35) {
      this.collectObject(object);
      this.cargo += 1;
      this.bonusScore += object.eventObject ? 190 : 160;
      this.boostEnergy = Math.min(100, this.boostEnergy + 7);
      if (object.eventObject && this.activeEvent === "treasure") this.eventFound += 1;
      this.onSound("collect");
      return;
    }
    if (object.kind === "wind" && distanceSquared < 1.28 * 1.28) {
      this.collectObject(object);
      this.boostEnergy = Math.min(100, this.boostEnergy + 34);
      this.bonusScore += 45;
      this.onSound("collect");
      return;
    }
    if (object.kind === "rescue" && distanceSquared < 1.55 * 1.55) {
      this.collectObject(object);
      this.escortTime = Math.max(this.escortTime, V4_REWARD_RULES.rescue.escortSeconds);
      this.coins += V4_REWARD_RULES.rescue.coins;
      this.bonusScore += 260;
      this.showNotice("rescue");
      this.onSound("rescue");
      return;
    }
    if (object.kind === "signalBuoy" && distanceSquared < 1.58 * 1.58) {
      this.collectObject(object);
      this.eventFound = Math.min(this.eventTarget, this.eventFound + 1);
      this.coins += V4_REWARD_RULES.beacons.coinPerBeacon;
      this.boostEnergy = Math.min(100, this.boostEnergy + 5);
      this.bonusScore += 70;
      this.onSound("collect");
      return;
    }
    if (object.kind === "tideRelic" && distanceSquared < 1.5 * 1.5) {
      this.collectObject(object);
      this.eventFound = Math.min(this.eventTarget, this.eventFound + 1);
      this.coins += V4_REWARD_RULES.relics.coinPerRelic;
      this.boostEnergy = Math.min(100, this.boostEnergy + 14);
      this.bonusScore += 90;
      this.onSound("boost");
      return;
    }
    if (object.kind === "rescueSkiff" && distanceSquared < 1.68 * 1.68) {
      this.collectObject(object);
      this.eventFound = Math.min(this.eventTarget, this.eventFound + 1);
      this.coins += V4_REWARD_RULES.flotilla.coinPerSkiff;
      this.escortTime = Math.min(
        V4_REWARD_RULES.flotilla.escortMaxSeconds,
        this.escortTime + V4_REWARD_RULES.flotilla.escortPerSkiffSeconds,
      );
      this.bonusScore += 120;
      this.onSound("rescue");
      return;
    }

    const hazard = object.kind === "island" || object.kind === "lighthouse" || object.kind === "palm" || isHarborKind(object.kind)
      || object.kind === "reef" || object.kind === "wreck" || object.kind === "whirlpool" || object.kind === "currentRift"
      || object.kind === "stormWreckage" || object.kind === "cargoRaft" || object.kind === "rival" || object.kind === "seaCreature"
      || object.kind === "volcanicBomb";
    if (!hazard) return;
    const movingHazard = object.kind === "rival" || object.kind === "seaCreature" || object.kind === "volcanicBomb";
    const safeBerthing = isHarborKind(object.kind)
      && (this.autoDocking && this.dockingHarborId === object.id || this.targetSail === 0 && this.speed <= 2.25)
      && distanceSquared > (object.radius * 0.78) ** 2
      && distanceSquared <= (object.radius + HARBOR_DOCK_MARGIN) ** 2;
    if (safeBerthing) return;

    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    const samples = movingHazard
      ? [{ offset: 1.78, radius: 0.48 }, { offset: 0, radius: 0.66 }, { offset: -1.72, radius: 0.55 }]
      : [
          { offset: 2.18, radius: 0.48 },
          { offset: 0.76, radius: 0.62 },
          { offset: -0.72, radius: 0.68 },
          { offset: -2.02, radius: 0.58 },
        ];
    let contact: { dx: number; dy: number; radius: number; offsetX: number; offsetY: number; overlap: number } | null = null;
    for (const sample of samples) {
      const offsetX = forwardX * sample.offset;
      const offsetY = forwardY * sample.offset;
      const sampleDx = this.playerX + offsetX - object.x;
      const sampleDy = this.playerY + offsetY - object.y;
      const sampleDistance = Math.hypot(sampleDx, sampleDy);
      const contactRadius = object.radius + sample.radius;
      const overlap = contactRadius - sampleDistance;
      if (overlap > 0 && (!contact || overlap > contact.overlap)) {
        contact = { dx: sampleDx, dy: sampleDy, radius: contactRadius, offsetX, offsetY, overlap };
      }
    }
    if (contact) this.hitHazard(object, contact.dx, contact.dy, contact.radius, contact.offsetX, contact.offsetY);
  }

  private collectObject(object: SeaObject) {
    object.active = false;
    if (object.eventObject) return;
    this.collected.add(object.id);
    this.collectedOrder.push(object.id);
    if (this.collectedOrder.length > MAX_COLLECTED_RECORDS) {
      const removed = this.collectedOrder.shift();
      if (removed) this.collected.delete(removed);
    }
  }

  private hitHazard(object: SeaObject, dx: number, dy: number, contactRadius: number, contactOffsetX: number, contactOffsetY: number) {
    const repeatedContact = object.id === this.lastCollisionId && this.lastCollisionGrace > 0;
    const rawDistance = Math.hypot(dx, dy);
    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    const normalX = rawDistance > 0.001 ? dx / rawDistance : -forwardX;
    const normalY = rawDistance > 0.001 ? dy / rawDistance : -forwardY;
    const overlap = Math.max(0.06, contactRadius - rawDistance + 0.06);
    const movingHazard = object.kind === "rival" || object.kind === "seaCreature" || object.kind === "volcanicBomb";
    const playerShare = movingHazard ? 0.68 : 1;

    this.playerX += normalX * overlap * playerShare;
    this.playerY += normalY * overlap * playerShare;
    if (movingHazard) {
      const objectShare = 1 - playerShare;
      object.x -= normalX * overlap * objectShare;
      object.y -= normalY * overlap * objectShare;
    }

    const objectVelocityX = object.velocityX ?? 0;
    const objectVelocityY = object.velocityY ?? 0;
    const relativeVelocityX = this.velocityX - objectVelocityX;
    const relativeVelocityY = this.velocityY - objectVelocityY;
    const normalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;
    const impactSpeed = Math.max(0, -normalVelocity) + (object.kind === "volcanicBomb" ? 1.1 : 0);
    const damagingContact = !repeatedContact && this.collisionCooldown <= 0
      && impactSpeed >= (movingHazard ? 0.72 : 0.95);
    if (damagingContact) {
      this.collisionCooldown = 1.75;
      this.lastCollisionId = object.id;
      this.lastCollisionGrace = 3.2;
    }
    if (normalVelocity < 0) {
      const restitution = movingHazard ? 0.44 : 0.28;
      const impulse = -(1 + restitution) * normalVelocity;
      this.velocityX += normalX * impulse;
      this.velocityY += normalY * impulse;
      const tangentX = -normalY;
      const tangentY = normalX;
      const tangentVelocity = this.velocityX * tangentX + this.velocityY * tangentY;
      this.velocityX -= tangentX * tangentVelocity * 0.34;
      this.velocityY -= tangentY * tangentVelocity * 0.34;
      if (movingHazard) {
        object.velocityX = objectVelocityX - normalX * impulse * 0.36;
        object.velocityY = objectVelocityY - normalY * impulse * 0.36;
      }
      const rotationalLever = contactOffsetX * normalY - contactOffsetY * normalX;
      this.angularVelocity += clamp(rotationalLever * impulse * 0.52, -0.92, 0.92);
      this.targetHeading = null;
    }
    this.speed = Math.hypot(this.velocityX, this.velocityY);
    if (object.kind === "volcanicBomb") object.active = false;
    if (!damagingContact) return;
    this.boostEnergy = Math.max(0, this.boostEnergy - 18);
    if (this.escortTime > 0) {
      this.escortTime = 0;
      this.bonusScore += 120;
      this.showNotice("shield");
      this.onSound("rescue");
      return;
    }
    this.lives -= 1;
    this.onSound("hit");
    if (this.lives <= 0) {
      this.phase = "gameover";
      this.boosting = false;
      this.activeEvent = "none";
      this.eventObjects.length = 0;
      this.onSound("gameover");
      this.emitSnapshot(true);
    }
  }

  private startEvent() {
    const locationX = Math.floor(this.playerX);
    const locationY = Math.floor(this.playerY);
    const roll = hashCoordinates(locationX, locationY, this.eventIndex) / 4_294_967_296;
    this.activeEvent = this.eventIndex === 0 ? "rival" : EVENT_SEQUENCE[Math.floor(roll * EVENT_SEQUENCE.length)];
    this.eventVariant = hashCoordinates(locationY, locationX, this.eventIndex + 73) % 3;
    this.eventTimer = 0;
    this.eventFound = 0;
    this.eventTarget = 0;
    this.eventWave = 0;
    this.eventSpawnSerial = 100;
    this.eventObjects.length = 0;
    const forwardX = Math.sin(this.heading);
    const forwardY = -Math.cos(this.heading);
    const sideX = -forwardY;
    const sideY = forwardX;

    if (this.activeEvent === "treasure") {
      this.eventDuration = 23 + this.eventVariant;
      this.eventTarget = this.eventVariant === 1 ? 6 : 5;
      const centerX = this.playerX + forwardX * (10 + this.eventVariant);
      const centerY = this.playerY + forwardY * (10 + this.eventVariant);
      this.eventObjects.push(this.makeEventObject("stormWreckage", centerX, centerY, 2.25, 10));
      const beaconSide = this.eventVariant === 2 ? -3.6 : 3.6;
      this.eventObjects.push(this.makeEventObject("salvageBeacon", centerX + sideX * beaconSide, centerY + sideY * beaconSide, 1.05, 11));
      for (let index = 0; index < this.eventTarget; index += 1) {
        let crateX: number;
        let crateY: number;
        if (this.eventVariant === 0) {
          const angle = (index / this.eventTarget) * TWO_PI + 0.35;
          crateX = centerX + Math.cos(angle) * 6.2;
          crateY = centerY + Math.sin(angle) * 6.2;
        } else if (this.eventVariant === 1) {
          const offset = index - (this.eventTarget - 1) * 0.5;
          crateX = centerX + forwardX * (Math.abs(offset) * 1.15 - 2.2) + sideX * offset * 2.25;
          crateY = centerY + forwardY * (Math.abs(offset) * 1.15 - 2.2) + sideY * offset * 2.25;
        } else {
          const forwardDistance = -4 + Math.floor(index / 2) * 4.1;
          const sideDistance = (index % 2 === 0 ? -1 : 1) * 4.8;
          crateX = centerX + forwardX * forwardDistance + sideX * sideDistance;
          crateY = centerY + forwardY * forwardDistance + sideY * sideDistance;
        }
        this.eventObjects.push(this.makeEventObject("crate", crateX, crateY, 0.74, index));
      }
      if (this.eventVariant === 2) {
        this.eventObjects.push(this.makeEventObject("cargoRaft", centerX + forwardX * 4.8, centerY + forwardY * 4.8, 1.45, 12));
      }
    } else if (this.activeEvent === "rival") {
      this.eventDuration = 18 + this.eventVariant;
      const openingBroadside = this.eventIndex === 0;
      const rivalCount = openingBroadside ? 1 : this.eventVariant === 1 ? 2 : 1;
      for (let index = 0; index < rivalCount; index += 1) {
        const sideDistance = rivalCount === 1 ? 0 : (index === 0 ? -3.8 : 3.8);
        const rival = this.makeEventObject(
          "rival",
          openingBroadside ? this.playerX + forwardX * 0.8 + sideX * 8.8 : this.playerX - forwardX * (14 + index * 2) + sideX * sideDistance,
          openingBroadside ? this.playerY + forwardY * 0.8 + sideY * 8.8 : this.playerY - forwardY * (14 + index * 2) + sideY * sideDistance,
          1.55,
          index,
        );
        rival.rotation = this.heading;
        rival.velocityX = forwardX * this.speed;
        rival.velocityY = forwardY * this.speed;
        this.eventObjects.push(rival);
      }
      if (this.eventVariant === 2) {
        for (let index = 0; index < 2; index += 1) {
          const sideDistance = index === 0 ? -4.6 : 4.6;
          this.eventObjects.push(this.makeEventObject(
            "cargoRaft",
            this.playerX + forwardX * (10 + index * 4) + sideX * sideDistance,
            this.playerY + forwardY * (10 + index * 4) + sideY * sideDistance,
            1.4,
            20 + index,
          ));
        }
      }
    } else if (this.activeEvent === "maelstrom") {
      this.eventDuration = 16 + this.eventVariant;
      const whirlpoolCount = 2 + this.eventVariant;
      for (let index = 0; index < whirlpoolCount; index += 1) {
        const forwardDistance = 7 + index * 5.8;
        const sideDistance = (index % 2 === 0 ? -1 : 1) * (5.2 + (index % 3) * 0.8);
        this.eventObjects.push(this.makeEventObject(
          "whirlpool",
          this.playerX + forwardX * forwardDistance + sideX * sideDistance,
          this.playerY + forwardY * forwardDistance + sideY * sideDistance,
          2.05,
          index,
        ));
      }
      const riftCount = this.eventVariant === 1 ? 2 : 1;
      for (let index = 0; index < riftCount; index += 1) {
        const sideDistance = riftCount === 1 ? 0 : (index === 0 ? -5 : 5);
        const rift = this.makeEventObject(
          "currentRift",
          this.playerX + forwardX * (18 + index * 5) + sideX * sideDistance,
          this.playerY + forwardY * (18 + index * 5) + sideY * sideDistance,
          1.85,
          10 + index,
        );
        rift.rotation = this.heading;
        this.eventObjects.push(rift);
      }
    } else if (this.activeEvent === "leviathan") {
      this.eventDuration = 17 + this.eventVariant;
      const creatureCount = this.eventVariant === 2 ? 2 : 1;
      for (let index = 0; index < creatureCount; index += 1) {
        const sideDistance = creatureCount === 1 ? 0 : (index === 0 ? -4.4 : 4.4);
        const creature = this.makeEventObject(
          "seaCreature",
          this.playerX - forwardX * (13 + index * 2.5) + sideX * sideDistance,
          this.playerY - forwardY * (13 + index * 2.5) + sideY * sideDistance,
          1.75,
          index,
        );
        creature.rotation = this.heading;
        this.eventObjects.push(creature);
      }
      if (this.eventVariant === 1) {
        const rift = this.makeEventObject("currentRift", this.playerX + forwardX * 13 + sideX * 4.5, this.playerY + forwardY * 13 + sideY * 4.5, 1.7, 10);
        rift.rotation = this.heading;
        this.eventObjects.push(rift);
      }
    } else if (this.activeEvent === "beacons") {
      this.eventDuration = 24;
      this.eventTarget = V4_REWARD_RULES.beacons.targetCount;
      for (let index = 0; index < this.eventTarget; index += 1) {
        const forwardDistance = 6.5 + index * 4.25;
        const sideDistance = this.eventVariant === 0
          ? Math.sin(index * 1.25) * 4.2
          : this.eventVariant === 1
            ? (index % 2 === 0 ? -4.4 : 4.4)
            : (index - 2) * 2.15;
        this.eventObjects.push(this.makeEventObject(
          "signalBuoy",
          this.playerX + forwardX * forwardDistance + sideX * sideDistance,
          this.playerY + forwardY * forwardDistance + sideY * sideDistance,
          0.92,
          index,
        ));
      }
      for (let index = 0; index < 2; index += 1) {
        const sideDistance = index === 0 ? 6.3 : -6.3;
        this.eventObjects.push(this.makeEventObject(
          "cargoRaft",
          this.playerX + forwardX * (12 + index * 7) + sideX * sideDistance,
          this.playerY + forwardY * (12 + index * 7) + sideY * sideDistance,
          1.32,
          10 + index,
        ));
      }
    } else if (this.activeEvent === "relics") {
      this.eventDuration = 25;
      this.eventTarget = V4_REWARD_RULES.relics.targetCount;
      const centerX = this.playerX + forwardX * 13;
      const centerY = this.playerY + forwardY * 13;
      for (let index = 0; index < this.eventTarget; index += 1) {
        const angle = index * (TWO_PI / this.eventTarget) + this.eventVariant * 0.42;
        const radius = this.eventVariant === 1 ? 6.2 : 5.1;
        const forwardOffset = this.eventVariant === 2 ? (index - 1.5) * 3.2 : Math.cos(angle) * radius;
        const sideOffset = this.eventVariant === 2 ? (index % 2 === 0 ? -4.1 : 4.1) : Math.sin(angle) * radius;
        this.eventObjects.push(this.makeEventObject(
          "tideRelic",
          centerX + forwardX * forwardOffset + sideX * sideOffset,
          centerY + forwardY * forwardOffset + sideY * sideOffset,
          0.9,
          index,
        ));
      }
      const whirlpool = this.makeEventObject("whirlpool", centerX, centerY, 1.85, 10);
      this.eventObjects.push(whirlpool);
      if (this.eventVariant > 0) {
        const rift = this.makeEventObject("currentRift", centerX + forwardX * 6 - sideX * 5, centerY + forwardY * 6 - sideY * 5, 1.65, 11);
        rift.rotation = this.heading;
        this.eventObjects.push(rift);
      }
    } else if (this.activeEvent === "flotilla") {
      this.eventDuration = 26;
      this.eventTarget = V4_REWARD_RULES.flotilla.targetCount;
      for (let index = 0; index < this.eventTarget; index += 1) {
        const forwardDistance = 7 + index * 6.2;
        const sideDistance = this.eventVariant === 0
          ? (index - 1) * 4.3
          : this.eventVariant === 1
            ? Math.sin(index * 1.7) * 2.4
            : (index % 2 === 0 ? -5 : 5);
        this.eventObjects.push(this.makeEventObject(
          "rescueSkiff",
          this.playerX + forwardX * forwardDistance + sideX * sideDistance,
          this.playerY + forwardY * forwardDistance + sideY * sideDistance,
          1.08,
          index,
        ));
      }
      this.eventObjects.push(this.makeEventObject("salvageBeacon", this.playerX + forwardX * 5 - sideX * 5.5, this.playerY + forwardY * 5 - sideY * 5.5, 0.92, 10));
      this.eventObjects.push(this.makeEventObject("salvageBeacon", this.playerX + forwardX * 21 + sideX * 5.5, this.playerY + forwardY * 21 + sideY * 5.5, 0.92, 11));
      for (let index = 0; index < 2; index += 1) {
        const sideDistance = index === 0 ? 4.8 : -4.8;
        this.eventObjects.push(this.makeEventObject("cargoRaft", this.playerX + forwardX * (11 + index * 7) + sideX * sideDistance, this.playerY + forwardY * (11 + index * 7) + sideY * sideDistance, 1.32, 20 + index));
      }
    } else {
      this.eventDuration = 19;
      this.eventAnchorX = this.playerX + forwardX * 14;
      this.eventAnchorY = this.playerY + forwardY * 14;
      const volcano = this.makeEventObject("island", this.eventAnchorX, this.eventAnchorY, 4.7, 0);
      volcano.seed += (1 - volcano.seed % 5 + 5) % 5;
      this.eventObjects.push(volcano);
      for (let index = 0; index < 2; index += 1) {
        const sideDistance = index === 0 ? -7.2 : 7.2;
        this.eventObjects.push(this.makeEventObject("reef", this.eventAnchorX + forwardX * 2.5 + sideX * sideDistance, this.eventAnchorY + forwardY * 2.5 + sideY * sideDistance, 1.75, 10 + index));
      }
      this.spawnVolcanoWave(0);
      this.eventWave = 1;
    }
    this.onSound("warning");
  }

  private makeEventObject(kind: ObjectKind, x: number, y: number, radius: number, index: number): SeaObject {
    const health = kind === "rival" ? 4 : kind === "seaCreature" ? 5 : undefined;
    return {
      id: `event:${this.eventIndex}:${index}`,
      kind,
      x,
      y,
      radius,
      scale: 1,
      rotation: 0,
      seed: hashCoordinates(this.eventIndex, index, 91),
      active: true,
      eventObject: true,
      health,
      maxHealth: health,
    };
  }

  private spawnVolcanoWave(wave: number) {
    const count = 2 + wave % 2;
    const baseAngle = Math.atan2(this.playerY - this.eventAnchorY, this.playerX - this.eventAnchorX);
    for (let index = 0; index < count && this.eventObjects.length < MAX_EVENT_OBJECTS; index += 1) {
      const seed = hashCoordinates(this.eventIndex, wave, index + 303);
      const jitter = ((seed % 1_001) / 1_000 - 0.5) * 0.18;
      const spread = (index - (count - 1) * 0.5) * (0.34 + wave % 3 * 0.025);
      const angle = baseAngle + spread + jitter;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      const speed = 2.65 + (seed % 11) * 0.075;
      const bomb = this.makeEventObject(
        "volcanicBomb",
        this.eventAnchorX + directionX * 4.25,
        this.eventAnchorY + directionY * 4.25,
        0.76,
        this.eventSpawnSerial++,
      );
      bomb.scale = 0.84 + (seed % 5) * 0.055;
      bomb.rotation = angle;
      bomb.velocityX = directionX * speed;
      bomb.velocityY = directionY * speed;
      bomb.age = 0;
      this.eventObjects.push(bomb);
    }
  }

  private updateEvent(delta: number) {
    if (this.activeEvent === "none") {
      if (this.distance >= this.nextEventDistance) this.startEvent();
      return;
    }
    this.eventTimer += delta;
    if (this.activeEvent === "rival" || this.activeEvent === "leviathan") {
      const pursuerKind: ObjectKind = this.activeEvent === "rival" ? "rival" : "seaCreature";
      const pursuerCount = this.eventObjects.reduce((count, object) => count + (object.kind === pursuerKind && object.active ? 1 : 0), 0);
      for (const pursuer of this.eventObjects) {
        if (pursuer.kind !== pursuerKind || !pursuer.active) continue;
        const dx = this.playerX - pursuer.x;
        const dy = this.playerY - pursuer.y;
        const distance = Math.max(0.01, Math.hypot(dx, dy));
        const chaseSpeed = (this.options.reducedSpeed ? 4.85 : this.activeEvent === "rival" ? 5.95 : 5.72)
          + Math.min(0.8, this.distance / 1_700) - Math.max(0, pursuerCount - 1) * 0.48;
        let velocityX: number;
        let velocityY: number;
        if (pursuer.kind === "rival" && distance < 10) {
          const toPlayerX = dx / distance;
          const toPlayerY = dy / distance;
          const orbitDirection = pursuer.seed % 2 === 0 ? 1 : -1;
          const radialSpeed = clamp((distance - 6.5) * 1.08, -2.1, 2.8);
          // Rival captains try to hold a parallel broadside instead of circling
          // through the bow. The slower relative drift gives the player a
          // readable firing window while still requiring an occasional turn.
          const orbitSpeed = 0.72 + (pursuer.seed % 5) * 0.05;
          velocityX = Math.sin(this.heading) * this.speed + toPlayerX * radialSpeed - toPlayerY * orbitDirection * orbitSpeed;
          velocityY = -Math.cos(this.heading) * this.speed + toPlayerY * radialSpeed + toPlayerX * orbitDirection * orbitSpeed;
        } else {
          const approachScale = clamp((distance - 3.4) / 4.8, 0.22, 1);
          velocityX = (dx / distance) * chaseSpeed * approachScale;
          velocityY = (dy / distance) * chaseSpeed * approachScale;
        }
        pursuer.x += velocityX * delta;
        pursuer.y += velocityY * delta;
        pursuer.velocityX = velocityX;
        pursuer.velocityY = velocityY;
        pursuer.rotation = Math.atan2(velocityX, -velocityY);
      }
    }

    if (this.activeEvent === "volcano") {
      let active = 0;
      for (let index = 0; index < this.eventObjects.length; index += 1) {
        const object = this.eventObjects[index];
        if (!object.active) continue;
        if (object.kind === "volcanicBomb") {
          object.age = (object.age ?? 0) + delta;
          object.x += (object.velocityX ?? 0) * delta;
          object.y += (object.velocityY ?? 0) * delta;
          object.rotation += delta * 1.7;
          if (object.age > 7.2) continue;
        }
        this.eventObjects[active++] = object;
      }
      this.eventObjects.length = active;
      const desiredWaves = 1 + Math.floor(this.eventTimer / 1.65);
      while (this.eventWave < desiredWaves && this.eventObjects.length < MAX_EVENT_OBJECTS) {
        this.spawnVolcanoWave(this.eventWave++);
      }
    }

    if (this.eventTarget > 0 && this.eventFound >= this.eventTarget) {
      if (this.activeEvent === "treasure") {
        this.valuables += V4_REWARD_RULES.treasure.completionValuables;
        this.bonusScore += 720;
        this.boostEnergy = Math.min(100, this.boostEnergy + 28);
        this.showNotice("treasure");
      } else if (this.activeEvent === "beacons") {
        this.cargo += V4_REWARD_RULES.beacons.completionCargo;
        this.fairWindTime = Math.max(this.fairWindTime, V4_REWARD_RULES.beacons.fairWindSeconds);
        this.bonusScore += 620;
        this.boostEnergy = Math.min(100, this.boostEnergy + 25);
        this.showNotice("beaconClear");
      } else if (this.activeEvent === "relics") {
        this.valuables += V4_REWARD_RULES.relics.completionValuables;
        this.gunFocusTime = Math.max(this.gunFocusTime, V4_REWARD_RULES.relics.gunFocusSeconds);
        this.bonusScore += 760;
        this.boostEnergy = Math.min(100, this.boostEnergy + 32);
        this.showNotice("relicClear");
      } else if (this.activeEvent === "flotilla") {
        this.cargo += V4_REWARD_RULES.flotilla.completionCargo;
        this.bonusScore += 680;
        this.escortTime = Math.max(this.escortTime, V4_REWARD_RULES.flotilla.escortMaxSeconds);
        this.showNotice("flotillaClear");
      }
      this.finishEvent();
      return;
    }

    if (this.eventTimer >= this.eventDuration) {
      if (this.eventTarget > 0) {
        this.showNotice("eventPassed");
      } else if (this.activeEvent === "rival") {
        this.coins += V4_REWARD_RULES.rival.escapeCoins;
        this.fairWindTime = Math.max(this.fairWindTime, V4_REWARD_RULES.rival.escapeFairWindSeconds);
        this.bonusScore += 520;
        this.showNotice("escape");
      } else if (this.activeEvent === "maelstrom") {
        this.valuables += V4_REWARD_RULES.maelstrom.completionValuables;
        this.fairWindTime = Math.max(this.fairWindTime, V4_REWARD_RULES.maelstrom.fairWindSeconds);
        this.bonusScore += 380;
        this.boostEnergy = Math.min(100, this.boostEnergy + 24);
        this.showNotice("weathered");
      } else if (this.activeEvent === "leviathan") {
        this.valuables += V4_REWARD_RULES.leviathan.escapeValuables;
        this.gunFocusTime = Math.max(this.gunFocusTime, V4_REWARD_RULES.leviathan.escapeGunFocusSeconds);
        this.bonusScore += 600;
        this.boostEnergy = Math.min(100, this.boostEnergy + 18);
        this.showNotice("deepEscape");
      } else if (this.activeEvent === "volcano") {
        this.valuables += V4_REWARD_RULES.volcano.completionValuables;
        this.ammo = Math.min(this.getAmmoCapacity(), this.ammo + V4_REWARD_RULES.volcano.ammo);
        this.bonusScore += 700;
        this.boostEnergy = Math.min(100, this.boostEnergy + 20);
        this.showNotice("volcanoClear");
      }
      this.finishEvent();
    }
  }

  private finishEvent() {
    this.activeEvent = "none";
    this.eventObjects.length = 0;
    this.eventTimer = 0;
    this.eventIndex += 1;
    this.nextEventDistance = this.distance + 108 + (this.eventIndex % 4) * 14;
  }

  private showNotice(notice: Exclude<V4Notice, "none">) {
    this.notice = notice;
    this.noticeTimer = 3.2;
  }

  private createSeabedPattern(image: HTMLImageElement) {
    const tile = document.createElement("canvas");
    tile.width = SEABED_TILE_SIZE;
    tile.height = SEABED_TILE_SIZE;
    const context = tile.getContext("2d");
    if (!context) return;
    const half = SEABED_TILE_SIZE / 2;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const drawQuarter = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      context.save();
      context.translate(x + (flipX ? half : 0), y + (flipY ? half : 0));
      context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      context.drawImage(image, 0, 0, half, half);
      context.restore();
    };
    drawQuarter(0, 0, false, false);
    drawQuarter(half, 0, true, false);
    drawQuarter(0, half, false, true);
    drawQuarter(half, half, true, true);
    this.seabedPattern = this.context.createPattern(tile, "repeat");
  }

  private createSurfacePattern() {
    const tile = document.createElement("canvas");
    tile.width = SURFACE_TILE_SIZE;
    tile.height = SURFACE_TILE_SIZE;
    const context = tile.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, tile.width, tile.height);
    context.lineCap = "round";
    const random = seededRandom(82_491);
    for (let index = 0; index < 72; index += 1) {
      const x = random() * tile.width;
      const y = random() * tile.height;
      const length = 18 + random() * 48;
      const bend = (random() - 0.5) * 8;
      context.beginPath();
      context.moveTo(x, y + 1.6);
      context.bezierCurveTo(x + length * 0.28, y - 2 + bend, x + length * 0.72, y + 3 - bend, x + length, y + 1.6);
      context.strokeStyle = "rgba(0,38,59,.16)";
      context.lineWidth = 1.8 + random() * 1.4;
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x + length * 0.28, y - 3 + bend, x + length * 0.72, y + 2 - bend, x + length, y);
      context.strokeStyle = index % 4 === 0 ? "rgba(226,255,247,.29)" : "rgba(153,241,229,.18)";
      context.lineWidth = 0.55 + random() * 0.85;
      context.stroke();
    }

    for (let index = 0; index < 36; index += 1) {
      const x = random() * tile.width;
      const y = random() * tile.height;
      const length = 2 + random() * 7;
      context.strokeStyle = index % 3 === 0 ? "rgba(240,255,250,.38)" : "rgba(163,244,232,.22)";
      context.lineWidth = 0.6 + random() * 0.7;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + length, y + (random() - 0.5) * 1.8);
      context.stroke();
    }
    this.surfacePattern = this.context.createPattern(tile, "repeat");
  }

  private createCausticsPattern() {
    const tile = document.createElement("canvas");
    tile.width = CAUSTICS_TILE_SIZE;
    tile.height = CAUSTICS_TILE_SIZE;
    const context = tile.getContext("2d");
    if (!context) return;

    const highlight = document.createElement("canvas");
    const shadow = document.createElement("canvas");
    highlight.width = CAUSTICS_TILE_SIZE;
    highlight.height = CAUSTICS_TILE_SIZE;
    shadow.width = CAUSTICS_TILE_SIZE;
    shadow.height = CAUSTICS_TILE_SIZE;
    const highlightContext = highlight.getContext("2d");
    const shadowContext = shadow.getContext("2d");
    if (!highlightContext || !shadowContext) return;

    const random = seededRandom(317_741);
    const seeds: Array<readonly [number, number]> = [];
    for (let index = 0; index < 72; index += 1) {
      seeds.push([random() * CAUSTICS_TILE_SIZE, random() * CAUSTICS_TILE_SIZE]);
    }

    const highlightPixels = highlightContext.createImageData(CAUSTICS_TILE_SIZE, CAUSTICS_TILE_SIZE);
    const shadowPixels = shadowContext.createImageData(CAUSTICS_TILE_SIZE, CAUSTICS_TILE_SIZE);
    for (let y = 0; y < CAUSTICS_TILE_SIZE; y += 1) {
      for (let x = 0; x < CAUSTICS_TILE_SIZE; x += 1) {
        const warpedX = x
          + Math.sin(y / CAUSTICS_TILE_SIZE * TWO_PI * 3) * 4.8
          + Math.sin((x + y) / CAUSTICS_TILE_SIZE * TWO_PI * 2) * 2.4;
        const warpedY = y
          + Math.cos(x / CAUSTICS_TILE_SIZE * TWO_PI * 3) * 3.8
          + Math.sin((x - y) / CAUSTICS_TILE_SIZE * TWO_PI * 2) * 2.1;
        let nearest = Number.POSITIVE_INFINITY;
        let second = Number.POSITIVE_INFINITY;
        for (const seed of seeds) {
          let dx = Math.abs(warpedX - seed[0]);
          let dy = Math.abs(warpedY - seed[1]);
          dx = Math.min(dx, CAUSTICS_TILE_SIZE - dx);
          dy = Math.min(dy, CAUSTICS_TILE_SIZE - dy);
          const distance = dx * dx + dy * dy;
          if (distance < nearest) {
            second = nearest;
            nearest = distance;
          } else if (distance < second) {
            second = distance;
          }
        }
        const distanceGap = Math.sqrt(second) - Math.sqrt(nearest);
        const edge = Math.pow(clamp(1 - distanceGap / 4.2, 0, 1), 2.35);
        const lightVariation = 0.76 + Math.sin((warpedX * 0.064 + warpedY * 0.041)) * 0.16;
        const pixel = (y * CAUSTICS_TILE_SIZE + x) * 4;
        highlightPixels.data[pixel] = 198;
        highlightPixels.data[pixel + 1] = 255;
        highlightPixels.data[pixel + 2] = 232;
        highlightPixels.data[pixel + 3] = Math.round(edge * lightVariation * 122);
        shadowPixels.data[pixel] = 0;
        shadowPixels.data[pixel + 1] = 48;
        shadowPixels.data[pixel + 2] = 66;
        shadowPixels.data[pixel + 3] = Math.round(edge * 72);
      }
    }
    highlightContext.putImageData(highlightPixels, 0, 0);
    shadowContext.putImageData(shadowPixels, 0, 0);

    context.clearRect(0, 0, tile.width, tile.height);
    for (const offsetX of [-CAUSTICS_TILE_SIZE, 0, CAUSTICS_TILE_SIZE]) {
      for (const offsetY of [-CAUSTICS_TILE_SIZE, 0, CAUSTICS_TILE_SIZE]) {
        context.drawImage(shadow, offsetX + 2, offsetY + 1);
        context.drawImage(highlight, offsetX, offsetY);
      }
    }
    this.causticsPattern = this.context.createPattern(tile, "repeat");
  }

  private render() {
    const context = this.context;
    const drawScale = this.pixelRatio * this.renderScale;
    context.setTransform(drawScale, 0, 0, drawScale, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    this.prepareVisibleObjects();
    this.drawOcean();
    for (const object of this.visibleObjects) {
      if (object.active && !this.collected.has(object.id) && this.isLandmark(object.kind)) this.drawShallows(object);
    }
    this.drawWake();
    this.drawFishingNet();
    this.drawDockingAssist();
    this.drawBroadsideRange();
    this.drawCombatEffects("under");

    let playerDrawn = false;
    for (const object of this.visibleObjects) {
      if (!object.active || this.collected.has(object.id)) continue;
      if (!playerDrawn && object.y > this.playerY) {
        this.drawPlayer();
        playerDrawn = true;
      }
      this.drawObject(object);
    }
    if (!playerDrawn) this.drawPlayer();
    this.drawCannonShots();
    this.drawCombatEffects("over");
    if (this.activeEvent === "maelstrom") this.drawStormVeil();
    if (this.activeEvent === "volcano") this.drawVolcanicVeil();
    this.drawAtmosphere();
  }

  private prepareVisibleObjects() {
    const margin = 190;
    this.visibleObjects.length = 0;
    for (const object of this.objectCache) {
      if (!object.active || this.collected.has(object.id)) continue;
      const x = this.toScreenX(object.x);
      const y = this.toScreenY(object.y);
      if (x < -margin || x > this.width + margin || y < -margin || y > this.height + margin) continue;
      this.visibleObjects.push(object);
    }
    if (this.eventObjects.length > 0) {
      for (const object of this.eventObjects) {
        if (object.active) this.visibleObjects.push(object);
      }
    }
    if (this.salvageDrops.length > 0) {
      for (const object of this.salvageDrops) {
        if (object.active && !this.collected.has(object.id)) this.visibleObjects.push(object);
      }
    }
    if (this.eventObjects.length > 0 || this.salvageDrops.length > 0) {
      this.visibleObjects.sort((left, right) => left.y - right.y || left.x - right.x);
    }
  }

  private toScreenX(worldX: number) {
    return this.width * 0.5 + (worldX - this.cameraX) * this.worldScale;
  }

  private toScreenY(worldY: number) {
    return this.height * 0.5 + (worldY - this.cameraY) * this.worldScale * Y_PERSPECTIVE;
  }

  private drawOcean() {
    this.drawSeabedLayer();
    this.drawWorldDepthFields();
    this.drawMarineLife();
    this.drawWaterSurfaceLayer();
  }

  private drawWorldDepthFields() {
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "screen";
    for (const object of this.visibleObjects) {
      if (!object.active || !this.isLandmark(object.kind)) continue;
      const x = this.toScreenX(object.x);
      const y = this.toScreenY(object.y) + object.radius * this.worldScale * 0.1;
      const harborBoost = isHarborKind(object.kind) ? 1.42 : 1;
      const radius = object.radius * this.worldScale * 2.2 * harborBoost;
      const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius);
      gradient.addColorStop(0, "rgba(112,244,213,.3)");
      gradient.addColorStop(0.38, "rgba(44,210,196,.23)");
      gradient.addColorStop(0.72, "rgba(16,153,174,.11)");
      gradient.addColorStop(1, "rgba(2,73,113,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(x, y, radius, radius * 0.56, (object.seed % 9 - 4) * 0.018, 0, TWO_PI);
      context.fill();

      if (isHarborKind(object.kind)) {
        const secondaryX = x + ((object.seed % 5) - 2) * radius * 0.08;
        const secondaryY = y + radius * 0.12;
        const secondary = context.createRadialGradient(secondaryX, secondaryY, 1, secondaryX, secondaryY, radius * 0.72);
        secondary.addColorStop(0, "rgba(185,255,223,.2)");
        secondary.addColorStop(1, "rgba(31,178,177,0)");
        context.fillStyle = secondary;
        context.beginPath();
        context.ellipse(secondaryX, secondaryY, radius * 0.76, radius * 0.34, -0.08, 0, TWO_PI);
        context.fill();
      }
    }
    context.restore();
  }

  private drawMarineLife() {
    if (!this.underwaterLifeAtlas) return;
    const sourceSize = this.underwaterLifeAtlas.naturalWidth / ANIMATION_FRAME_COUNT;
    const context = this.context;
    const sizeByKind: Record<MarineLifeKind, number> = {
      fishSchool: 3.35,
      turtle: 3.1,
      manta: 3.85,
      octopus: 2.5,
    };
    for (const life of this.marineLife) {
      if (this.collected.has(life.id)) continue;
      const pose = this.marinePose(life);
      const x = this.toScreenX(pose.x);
      const y = this.toScreenY(pose.y);
      const size = sizeByKind[life.kind] * this.worldScale * life.scale;
      if (x < -size || x > this.width + size || y < -size || y > this.height + size) continue;
      const frame = this.frameFor(life.seed, life.kind === "fishSchool" ? 5.8 : life.kind === "octopus" ? 3.6 : 4.3);
      const direction = Math.atan2(pose.velocityY * Y_PERSPECTIVE, pose.velocityX);
      const pulse = this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 1.7 + life.seed) * size * 0.014;
      context.save();
      context.globalAlpha = life.kind === "fishSchool" ? 0.74 : 0.61;
      context.translate(x, y + pulse);
      if (life.kind === "fishSchool" || life.kind === "manta") context.rotate(direction);
      else if (pose.velocityX > 0) context.scale(-1, 1);
      context.drawImage(
        this.underwaterLifeAtlas,
        frame * sourceSize,
        MARINE_LIFE_ROWS[life.kind] * sourceSize,
        sourceSize,
        sourceSize,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      context.restore();

      if (life.kind === "fishSchool") {
        context.save();
        context.globalCompositeOperation = "screen";
        context.strokeStyle = "rgba(150,247,225,.18)";
        context.lineWidth = 0.8;
        context.beginPath();
        context.ellipse(x, y, size * 0.42, size * 0.18, direction * 0.35, 0, TWO_PI);
        context.stroke();
        context.restore();
      }
    }
  }

  private drawSeabedLayer() {
    const context = this.context;
    const base = context.createLinearGradient(0, 0, this.width, this.height);
    base.addColorStop(0, "#0a4b68");
    base.addColorStop(0.46, "#348f91");
    base.addColorStop(1, "#9ac7a5");
    context.fillStyle = base;
    context.fillRect(0, 0, this.width, this.height);

    if (this.seabedPattern) {
      const offsetX = ((-this.cameraX * this.worldScale * 0.54) % SEABED_TILE_SIZE + SEABED_TILE_SIZE) % SEABED_TILE_SIZE;
      const offsetY = ((-this.cameraY * this.worldScale * Y_PERSPECTIVE * 0.54) % SEABED_TILE_SIZE + SEABED_TILE_SIZE) % SEABED_TILE_SIZE;
      context.save();
      context.translate(offsetX - SEABED_TILE_SIZE, offsetY - SEABED_TILE_SIZE);
      context.globalAlpha = this.options.highVisibility ? 0.94 : 0.82;
      context.fillStyle = this.seabedPattern;
      context.fillRect(0, 0, this.width + SEABED_TILE_SIZE * 2, this.height + SEABED_TILE_SIZE * 2);
      context.restore();
    }

    const worldDepthPhase = Math.sin(this.cameraX * 0.018 + this.cameraY * 0.013) * 0.12;
    const transition = this.width * (0.48 + worldDepthPhase);
    const depthShade = context.createLinearGradient(
      transition - this.width * 0.72,
      -this.height * 0.08,
      transition + this.width * 0.62,
      this.height * 1.02,
    );
    depthShade.addColorStop(0, this.options.highVisibility ? "rgba(0,21,52,.58)" : "rgba(0,16,48,.72)");
    depthShade.addColorStop(0.32, "rgba(0,43,72,.42)");
    depthShade.addColorStop(0.64, "rgba(0,83,96,.12)");
    depthShade.addColorStop(1, "rgba(201,228,162,.04)");
    context.fillStyle = depthShade;
    context.fillRect(0, 0, this.width, this.height);
  }

  private drawWaterSurfaceLayer() {
    const context = this.context;
    this.drawUnderwaterCaustics();

    const water = context.createLinearGradient(-this.width * 0.08, 0, this.width * 1.05, this.height);
    water.addColorStop(0, this.options.highVisibility ? "rgba(0,45,82,.56)" : "rgba(0,24,67,.65)");
    water.addColorStop(0.34, this.options.highVisibility ? "rgba(0,99,132,.42)" : "rgba(0,76,116,.49)");
    water.addColorStop(0.7, this.options.highVisibility ? "rgba(0,168,174,.3)" : "rgba(0,137,160,.36)");
    water.addColorStop(1, this.options.highVisibility ? "rgba(41,207,183,.2)" : "rgba(11,183,177,.27)");
    context.fillStyle = water;
    context.fillRect(0, 0, this.width, this.height);

    const depth = context.createRadialGradient(this.width * 0.1, this.height * 0.04, 1, this.width * 0.1, this.height * 0.04, Math.max(this.width, this.height) * 0.92);
    depth.addColorStop(0, "rgba(0,15,47,.42)");
    depth.addColorStop(0.48, "rgba(0,42,72,.14)");
    depth.addColorStop(0.76, "rgba(23,169,158,0)");
    depth.addColorStop(1, "rgba(102,238,204,.10)");
    context.fillStyle = depth;
    context.fillRect(0, 0, this.width, this.height);

    const surfacePattern = this.surfacePattern;
    if (surfacePattern) {
      this.drawWaterPatternPass(surfacePattern, SURFACE_TILE_SIZE, 0.82, 2.4, 1.02, this.options.reducedMotion ? 0.42 : 0.58, "source-over");
      this.drawWaterPatternPass(surfacePattern, SURFACE_TILE_SIZE, 0.9, -0.78, 1.34, this.options.reducedMotion ? 0.07 : 0.16, "screen");
    }

    this.drawSurfaceWavelets();
    this.drawShallowReflections();
  }

  private drawShallowReflections() {
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    for (const object of this.visibleObjects) {
      if (!object.active || !this.isLandmark(object.kind)) continue;
      const x = this.toScreenX(object.x);
      const y = this.toScreenY(object.y);
      const radius = object.radius * this.worldScale * (isHarborKind(object.kind) ? 1.72 : 1.38);
      const count = isHarborKind(object.kind) ? 18 : 8;
      for (let index = 0; index < count; index += 1) {
        const seed = hashCoordinates(object.seed + index * 17, index + 1, 431);
        const angle = (seed % 4096) / 4096 * TWO_PI;
        const distance = radius * (0.46 + ((seed >>> 12) & 1023) / 1023 * 0.54);
        const glintX = x + Math.cos(angle) * distance;
        const glintY = y + Math.sin(angle) * distance * 0.5;
        const shimmer = this.options.reducedMotion ? 0.62 : 0.5 + Math.sin(this.elapsed * 2.2 + seed * 0.00017) * 0.5;
        const length = 4 + ((seed >>> 22) & 15) * 0.55;
        context.strokeStyle = `rgba(231,255,247,${0.055 + shimmer * 0.17})`;
        context.lineWidth = 0.7 + shimmer * 0.85;
        context.beginPath();
        context.moveTo(glintX - length * 0.5, glintY);
        context.quadraticCurveTo(glintX, glintY - 1.7, glintX + length * 0.5, glintY + 0.4);
        context.stroke();
      }
    }
    context.restore();
  }

  private drawUnderwaterCaustics() {
    const causticsPattern = this.causticsPattern;
    if (!causticsPattern) return;
    this.drawWaterPatternPass(causticsPattern, CAUSTICS_TILE_SIZE, 0.61, 1.18, 0.54, this.options.highVisibility ? 0.32 : 0.26, "source-over");
    this.drawWaterPatternPass(causticsPattern, CAUSTICS_TILE_SIZE, 0.69, -0.42, 0.76, this.options.reducedMotion ? 0.07 : 0.09, "source-over");
  }

  private drawWaterPatternPass(
    pattern: CanvasPattern,
    tileSize: number,
    parallax: number,
    driftX: number,
    driftY: number,
    alpha: number,
    composite: GlobalCompositeOperation,
  ) {
    const context = this.context;
    const time = this.options.reducedMotion ? 0 : this.elapsed;
    const offsetX = ((-this.cameraX * this.worldScale * parallax + time * driftX) % tileSize + tileSize) % tileSize;
    const offsetY = ((-this.cameraY * this.worldScale * Y_PERSPECTIVE * parallax + time * driftY) % tileSize + tileSize) % tileSize;
    context.save();
    context.translate(offsetX - tileSize, offsetY - tileSize);
    context.globalCompositeOperation = composite;
    context.globalAlpha = alpha;
    context.fillStyle = pattern;
    context.fillRect(0, 0, this.width + tileSize * 2, this.height + tileSize * 2);
    context.restore();
  }

  private drawSurfaceWavelets() {
    const context = this.context;
    const spacing = 7.4;
    const halfWorldWidth = this.width / (this.worldScale * 2) + spacing;
    const halfWorldHeight = this.height / (this.worldScale * Y_PERSPECTIVE * 2) + spacing;
    const minX = Math.floor((this.cameraX - halfWorldWidth) / spacing);
    const maxX = Math.ceil((this.cameraX + halfWorldWidth) / spacing);
    const minY = Math.floor((this.cameraY - halfWorldHeight) / spacing);
    const maxY = Math.ceil((this.cameraY + halfWorldHeight) / spacing);
    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    for (let gridY = minY; gridY <= maxY; gridY += 1) {
      for (let gridX = minX; gridX <= maxX; gridX += 1) {
        const seed = hashCoordinates(gridX, gridY, 971);
        if (seed % 5 > 1) continue;
        const jitterX = ((seed & 1023) / 1023 - 0.5) * spacing * 0.74;
        const jitterY = (((seed >>> 10) & 1023) / 1023 - 0.5) * spacing * 0.66;
        const x = this.toScreenX(gridX * spacing + jitterX);
        const y = this.toScreenY(gridY * spacing + jitterY);
        const length = 15 + ((seed >>> 20) & 31) * 0.72;
        const tilt = (((seed >>> 25) & 15) / 15 - 0.5) * 0.3;
        const dx = Math.cos(tilt) * length * 0.5;
        const dy = Math.sin(tilt) * length * 0.5;
        const shimmer = this.options.reducedMotion ? 0.54 : 0.5 + Math.sin(this.elapsed * 1.45 + seed * 0.0001) * 0.32;
        context.strokeStyle = `rgba(218,255,247,${0.095 + shimmer * 0.14})`;
        context.lineWidth = 0.65 + ((seed >>> 18) & 3) * 0.18;
        context.beginPath();
        context.moveTo(x - dx, y - dy);
        context.quadraticCurveTo(x, y - 2.4 - ((seed >>> 16) & 3), x + dx, y + dy);
        context.stroke();
      }
    }
    context.restore();
  }

  private isLandmark(kind: ObjectKind) {
    return kind === "island" || kind === "lighthouse" || kind === "palm" || kind === "reef" || kind === "wreck" || isHarborKind(kind);
  }

  private drawShallows(object: SeaObject) {
    const context = this.context;
    const x = this.toScreenX(object.x);
    const y = this.toScreenY(object.y) + object.radius * this.worldScale * 0.14;
    const radiusScale = object.kind === "reef" ? 1.48 : isHarborKind(object.kind) ? 1.94 : 1.68;
    const radius = object.radius * this.worldScale * radiusScale;
    const gradient = context.createRadialGradient(x, y, radius * 0.16, x, y, radius);
    gradient.addColorStop(0, "rgba(134,244,218,.48)");
    gradient.addColorStop(0.48, "rgba(67,221,203,.30)");
    gradient.addColorStop(0.78, "rgba(212,255,224,.15)");
    gradient.addColorStop(1, "rgba(21,142,151,0)");
    context.save();
    context.scale(1, Y_PERSPECTIVE);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y / Y_PERSPECTIVE, radius, radius * 0.78, 0, 0, TWO_PI);
    context.fill();
    context.restore();

    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    context.shadowColor = "rgba(224,255,241,.32)";
    context.shadowBlur = this.options.reducedMotion ? 0 : 4;
    for (let ring = 0; ring < 3; ring += 1) {
      const ringScale = 0.67 + ring * 0.095;
      const phase = (object.seed % 11) * 0.031 + ring * 0.09;
      context.strokeStyle = `rgba(239,255,242,${0.48 - ring * 0.105})`;
      context.lineWidth = 1.7 - ring * 0.28;
      context.setLineDash([5 + ring * 3, 8 + (object.seed % 5) + ring * 2]);
      context.lineDashOffset = this.options.reducedMotion ? 0 : -this.elapsed * (5.5 - ring) - (object.seed % 17);
      context.beginPath();
      context.ellipse(x, y + ring * 1.5, radius * ringScale, radius * (0.4 + ring * 0.045), phase, 0.08 + ring * 0.17, Math.PI * (1.82 + ring * 0.035));
      context.stroke();
    }
    context.restore();
  }

  private drawWake() {
    if (this.wakes.length < 2) return;
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(184,255,247,.34)";
    context.shadowBlur = this.options.reducedMotion ? 0 : 5;
    for (let index = 1; index < this.wakes.length; index += 1) {
      const previous = this.wakes[index - 1];
      const current = this.wakes[index];
      const life = clamp(1 - current.age / 5.8, 0, 1);
      if (life <= 0) continue;
      const alpha = life * (0.32 + clamp(this.speed / 18, 0, 0.34));
      const leftStartX = this.toScreenX(previous.leftX);
      const leftStartY = this.toScreenY(previous.leftY);
      const leftEndX = this.toScreenX(current.leftX);
      const leftEndY = this.toScreenY(current.leftY);
      const rightStartX = this.toScreenX(previous.rightX);
      const rightStartY = this.toScreenY(previous.rightY);
      const rightEndX = this.toScreenX(current.rightX);
      const rightEndY = this.toScreenY(current.rightY);

      context.strokeStyle = `rgba(117,232,224,${alpha * 0.34})`;
      context.lineWidth = 3.4 + life * 7.2;
      context.beginPath();
      context.moveTo(leftStartX, leftStartY);
      context.lineTo(leftEndX, leftEndY);
      context.moveTo(rightStartX, rightStartY);
      context.lineTo(rightEndX, rightEndY);
      context.stroke();

      context.strokeStyle = `rgba(242,255,248,${alpha})`;
      context.lineWidth = 1.2 + life * 3.4;
      context.beginPath();
      context.moveTo(leftStartX, leftStartY);
      context.lineTo(leftEndX, leftEndY);
      context.moveTo(rightStartX, rightStartY);
      context.lineTo(rightEndX, rightEndY);
      context.stroke();
      if (index % 2 === 0) {
        context.strokeStyle = `rgba(139,239,226,${alpha * 0.42})`;
        context.lineWidth = 1 + life * 1.6;
        context.beginPath();
        context.moveTo(this.toScreenX(previous.centerX), this.toScreenY(previous.centerY));
        context.lineTo(this.toScreenX(current.centerX), this.toScreenY(current.centerY));
        context.stroke();
      }
      if (index % 4 === 0) {
        context.fillStyle = `rgba(248,255,246,${alpha * 0.72})`;
        const foamRadius = 0.8 + life * 2.2;
        context.beginPath();
        context.moveTo(leftEndX + foamRadius, leftEndY);
        context.arc(leftEndX, leftEndY, foamRadius, 0, TWO_PI);
        context.moveTo(rightEndX + foamRadius * 0.86, rightEndY);
        context.arc(rightEndX, rightEndY, foamRadius * 0.86, 0, TWO_PI);
        context.fill();
      }
    }
    context.restore();
  }

  private drawFishingNet() {
    if (!this.fishingTargetId) return;
    const target = this.marineLife.find((life) => life.id === this.fishingTargetId);
    if (!target) return;
    const pose = this.marinePose(target);
    const progress = clamp(this.fishingProgress, 0, 1);
    const eased = 1 - (1 - progress) ** 3;
    const originX = this.toScreenX(this.playerX - Math.sin(this.heading) * 0.78);
    const originY = this.toScreenY(this.playerY + Math.cos(this.heading) * 0.78);
    const targetX = this.toScreenX(pose.x);
    const targetY = this.toScreenY(pose.y);
    const netX = lerp(originX, targetX, eased);
    const netY = lerp(originY, targetY, eased);
    const radiusX = this.worldScale * (0.82 + eased * 3.18);
    const radiusY = radiusX * 0.44;
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "screen";
    const waterGlow = context.createRadialGradient(netX, netY, radiusX * 0.08, netX, netY, radiusX * 1.18);
    waterGlow.addColorStop(0, `rgba(89,220,205,${0.04 + eased * 0.08})`);
    waterGlow.addColorStop(0.72, `rgba(62,197,194,${0.09 + eased * 0.11})`);
    waterGlow.addColorStop(1, "rgba(19,119,146,0)");
    context.fillStyle = waterGlow;
    context.beginPath();
    context.ellipse(netX, netY, radiusX * 1.18, radiusY * 1.3, 0, 0, TWO_PI);
    context.fill();

    context.strokeStyle = `rgba(238,221,168,${0.42 + eased * 0.46})`;
    context.lineWidth = 1.2 + eased * 0.85;
    context.shadowColor = "rgba(255,237,183,.32)";
    context.shadowBlur = this.options.reducedMotion ? 0 : 4;
    context.beginPath();
    context.moveTo(originX, originY);
    context.lineTo(netX - radiusX * 0.92, netY);
    context.moveTo(originX, originY);
    context.lineTo(netX + radiusX * 0.92, netY);
    context.stroke();
    context.shadowBlur = 0;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.ellipse(netX, netY, radiusX, radiusY, 0, 0, TWO_PI);
    for (let band = -4; band <= 4; band += 1) {
      const normalized = band / 5;
      const bandX = netX + normalized * radiusX;
      const extent = radiusY * Math.sqrt(Math.max(0, 1 - normalized ** 2));
      context.moveTo(bandX, netY - extent);
      context.lineTo(bandX, netY + extent);
    }
    for (let band = -2; band <= 2; band += 1) {
      const normalized = band / 3;
      const bandY = netY + normalized * radiusY;
      const extent = radiusX * Math.sqrt(Math.max(0, 1 - normalized ** 2));
      context.moveTo(netX - extent, bandY);
      context.lineTo(netX + extent, bandY);
    }
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "rgba(255,188,76,.96)";
    for (let floatIndex = 0; floatIndex < 12; floatIndex += 1) {
      const angle = floatIndex / 12 * TWO_PI;
      const floatX = netX + Math.cos(angle) * radiusX;
      const floatY = netY + Math.sin(angle) * radiusY;
      context.beginPath();
      context.arc(floatX, floatY, 2.1 + eased * 1.15, 0, TWO_PI);
      context.fill();
    }

    context.strokeStyle = `rgba(244,255,246,${0.18 + eased * 0.34})`;
    context.lineWidth = 1.3;
    context.setLineDash([7, 10]);
    context.lineDashOffset = this.options.reducedMotion ? 0 : -this.elapsed * 8;
    context.beginPath();
    context.ellipse(netX, netY, radiusX * 1.12, radiusY * 1.22, 0, 0, TWO_PI);
    context.stroke();
    context.restore();
  }

  private drawDockingAssist() {
    if (!this.autoDocking) return;
    const context = this.context;
    const startX = this.toScreenX(this.playerX);
    const startY = this.toScreenY(this.playerY);
    const endX = this.toScreenX(this.dockBerthX);
    const endY = this.toScreenY(this.dockBerthY);
    const pulse = this.options.reducedMotion ? 0.7 : 0.62 + Math.sin(this.elapsed * 4.2) * 0.16;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = `rgba(255,222,145,${pulse})`;
    context.lineWidth = 1.4;
    context.setLineDash([7, 6]);
    context.lineDashOffset = this.options.reducedMotion ? 0 : -this.elapsed * 11;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo((startX + endX) * 0.5, Math.min(startY, endY) - 9, endX, endY);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.ellipse(endX, endY, this.worldScale * 0.7, this.worldScale * 0.28, 0, 0, TWO_PI);
    context.stroke();
    context.restore();
  }

  private drawBroadsideRange() {
    if (this.phase !== "playing" || this.ammo <= 0) return;
    const context = this.context;
    const range = 9.4 + this.gunLevel * 1.25;
    const originX = this.toScreenX(this.playerX);
    const originY = this.toScreenY(this.playerY);
    context.save();
    for (const side of [-1, 1]) {
      const center = this.heading + side * Math.PI * 0.5;
      const active = this.broadsideTargetSide === side;
      const start = center - BROADSIDE_HALF_ANGLE;
      const end = center + BROADSIDE_HALF_ANGLE;
      context.beginPath();
      context.moveTo(originX, originY);
      for (let step = 0; step <= 14; step += 1) {
        const angle = lerp(start, end, step / 14);
        context.lineTo(
          this.toScreenX(this.playerX + Math.sin(angle) * range),
          this.toScreenY(this.playerY - Math.cos(angle) * range),
        );
      }
      context.closePath();
      context.fillStyle = active
        ? "rgba(255,190,91,.14)"
        : this.options.highVisibility ? "rgba(136,238,230,.085)" : "rgba(136,238,230,.045)";
      context.fill();
      context.strokeStyle = active ? "rgba(255,218,137,.7)" : "rgba(153,239,230,.24)";
      context.lineWidth = active ? 1.35 : 0.8;
      context.setLineDash(active ? [7, 5] : [4, 8]);
      context.lineDashOffset = this.options.reducedMotion ? 0 : -this.elapsed * (active ? 15 : 5);
      context.stroke();
    }
    context.restore();
  }

  private drawCannonShots() {
    if (this.cannonShots.length === 0) return;
    const context = this.context;
    context.save();
    context.lineCap = "round";
    for (const shot of this.cannonShots) {
      const progress = clamp(shot.age / shot.duration, 0, 1);
      const previous = clamp(progress - 0.1, 0, 1);
      const arcHeight = Math.sin(progress * Math.PI) * (14 + (shot.seed % 7));
      const previousArc = Math.sin(previous * Math.PI) * (14 + (shot.seed % 7));
      const worldX = lerp(shot.startX, shot.endX, progress);
      const worldY = lerp(shot.startY, shot.endY, progress);
      const previousX = lerp(shot.startX, shot.endX, previous);
      const previousY = lerp(shot.startY, shot.endY, previous);
      const x = this.toScreenX(worldX);
      const y = this.toScreenY(worldY) - arcHeight;
      const tailX = this.toScreenX(previousX);
      const tailY = this.toScreenY(previousY) - previousArc;
      const trail = context.createLinearGradient(tailX, tailY, x, y);
      trail.addColorStop(0, "rgba(255,138,52,0)");
      trail.addColorStop(1, "rgba(255,225,150,.72)");
      context.strokeStyle = trail;
      context.lineWidth = 2.2;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(x, y);
      context.stroke();
      context.fillStyle = "rgba(12,16,18,.94)";
      context.shadowColor = "rgba(255,157,58,.7)";
      context.shadowBlur = 6;
      context.beginPath();
      context.arc(x, y, 2.25, 0, TWO_PI);
      context.fill();
      context.shadowBlur = 0;
    }
    context.restore();
  }

  private drawCombatEffects(layer: "under" | "over") {
    if (this.combatEffects.length === 0) return;
    const context = this.context;
    context.save();
    for (const effect of this.combatEffects) {
      const progress = clamp(effect.age / effect.duration, 0, 1);
      const fade = 1 - progress;
      const x = this.toScreenX(effect.x);
      const y = this.toScreenY(effect.y);
      if (effect.kind === "water") {
        if (layer === "under") {
          context.strokeStyle = `rgba(220,255,248,${fade * 0.8})`;
          context.lineWidth = 1.2 + fade * 1.8;
          context.beginPath();
          context.ellipse(x, y, 5 + progress * 22, 2.4 + progress * 9, 0, 0, TWO_PI);
          context.stroke();
          context.strokeStyle = `rgba(71,201,213,${fade * 0.48})`;
          context.beginPath();
          context.ellipse(x, y, 2 + progress * 13, 1 + progress * 5.4, 0, 0, TWO_PI);
          context.stroke();
        } else {
          context.fillStyle = `rgba(235,255,250,${fade * 0.82})`;
          for (let index = 0; index < 5; index += 1) {
            const angle = ((effect.seed >>> (index * 3)) & 31) / 31 * TWO_PI;
            const distance = (5 + index * 2.2) * Math.sin(progress * Math.PI);
            const dropY = y - Math.sin(progress * Math.PI) * (12 + index * 2.5) + progress * progress * 8;
            context.beginPath();
            context.arc(x + Math.cos(angle) * distance, dropY + Math.sin(angle) * distance * 0.22, Math.max(0.7, fade * 1.75), 0, TWO_PI);
            context.fill();
          }
        }
        continue;
      }
      if (effect.kind === "sink") {
        if (layer === "under") {
          const radius = this.worldScale * (0.7 + progress * 2.8);
          context.fillStyle = `rgba(3,30,42,${fade * 0.32})`;
          context.beginPath();
          context.ellipse(x, y + 4, radius, radius * 0.38, effect.seed % 7 * 0.08, 0, TWO_PI);
          context.fill();
          context.strokeStyle = `rgba(224,255,245,${fade * 0.72})`;
          context.lineWidth = 1.2 + fade * 2.3;
          context.beginPath();
          context.ellipse(x, y, radius * 0.86, radius * 0.34, 0, 0, TWO_PI);
          context.stroke();
        } else {
          context.fillStyle = `rgba(255,219,149,${fade * 0.7})`;
          for (let index = 0; index < 6; index += 1) {
            const angle = index / 6 * TWO_PI + effect.seed * 0.001;
            const distance = progress * this.worldScale * 1.9;
            context.fillRect(x + Math.cos(angle) * distance - 1.5, y + Math.sin(angle) * distance * 0.45 - progress * 15, 3, 3);
          }
        }
        continue;
      }
      if (layer !== "over") continue;
      if (effect.kind === "muzzle") {
        const radius = 4 + Math.sin(progress * Math.PI) * 16;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(255,255,222,${fade})`);
        glow.addColorStop(0.25, `rgba(255,188,69,${fade * 0.9})`);
        glow.addColorStop(1, "rgba(255,100,35,0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "hit") {
        const radius = 5 + progress * 18;
        context.strokeStyle = `rgba(255,223,154,${fade * 0.9})`;
        context.lineWidth = 2.2;
        for (let index = 0; index < 7; index += 1) {
          const angle = index / 7 * TWO_PI + effect.seed * 0.0007;
          context.beginPath();
          context.moveTo(x + Math.cos(angle) * 3, y + Math.sin(angle) * 2);
          context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.7);
          context.stroke();
        }
        context.fillStyle = `rgba(18,24,25,${fade * 0.34})`;
        context.beginPath();
        context.arc(x + progress * 4, y - progress * 13, 4 + progress * 7, 0, TWO_PI);
        context.fill();
      }
    }
    context.restore();
  }

  private drawHarbor(object: SeaObject, x: number, y: number, size: number) {
    if (!this.harborAtlas || !isHarborKind(object.kind)) return;
    const context = this.context;
    const [column, row] = HARBOR_ATLAS_CELLS[object.kind];
    const sourceWidth = this.harborAtlas.naturalWidth / 2;
    const sourceHeight = this.harborAtlas.naturalHeight / 2;
    const drawWidth = size * 1.34;
    const service = HARBOR_SERVICE_BY_KIND[object.kind];
    const colors: Record<Exclude<V4HarborService, "none">, string> = {
      trade: "255,206,103",
      shipyard: "113,225,236",
      arsenal: "255,127,72",
      academy: "145,180,255",
    };
    const phase = (object.seed % 997) / 997 * TWO_PI;
    const pulse = this.options.reducedMotion ? 0.78 : 0.68 + Math.sin(this.elapsed * 2.2 + phase) * 0.12;
    context.save();
    context.fillStyle = "rgba(1,21,31,.28)";
    context.beginPath();
    context.ellipse(x + size * 0.035, y + size * 0.18, drawWidth * 0.31, size * 0.115, 0.08, 0, TWO_PI);
    context.fill();
    context.drawImage(
      this.harborAtlas,
      column * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      x - drawWidth / 2,
      y - size / 2,
      drawWidth,
      size,
    );
    context.strokeStyle = `rgba(${colors[service]},${pulse})`;
    context.lineWidth = 1.35;
    context.setLineDash([5, 7]);
    context.lineDashOffset = this.options.reducedMotion ? 0 : -this.elapsed * 8;
    context.beginPath();
    context.ellipse(x, y + size * 0.15, drawWidth * 0.34, size * 0.145, 0, 0, TWO_PI);
    context.stroke();
    context.restore();

    this.drawHarborLife(object, x, y, size, service);
    const orbit = this.options.reducedMotion ? phase : phase + this.elapsed * 0.31;
    this.drawAmbientSprite(
      "gulls",
      this.frameFor(object.seed + 17, 6.2),
      x + Math.cos(orbit) * size * 0.28,
      y - size * 0.24 + Math.sin(orbit) * size * 0.065,
      size * 0.14,
      -orbit * 0.1,
    );
    this.drawAmbientSprite("pennant", this.frameFor(object.seed + 71, 5.8), x + size * 0.05, y - size * 0.27, size * 0.13);
  }

  private drawHarborLifeSprite(kind: HarborLifeKind, frame: number, x: number, y: number, size: number, flip = false) {
    if (!this.harborLifeAtlas) return;
    const sourceSize = this.harborLifeAtlas.naturalWidth / ANIMATION_FRAME_COUNT;
    const context = this.context;
    context.save();
    context.translate(x, y);
    if (flip) context.scale(-1, 1);
    context.drawImage(
      this.harborLifeAtlas,
      frame * sourceSize,
      HARBOR_LIFE_ROWS[kind] * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawHarborLife(object: SeaObject, x: number, y: number, size: number, service: Exclude<V4HarborService, "none">) {
    const phase = (object.seed % 997) / 997 * TWO_PI;
    const activity = this.options.reducedMotion ? phase : phase + this.elapsed * (service === "trade" ? 0.72 : 0.54);
    const workerPath = Math.sin(activity);
    const catPath = Math.sin(activity * 0.67 + 1.9);
    const serviceIndex = service === "trade" ? 0 : service === "shipyard" ? 1 : service === "arsenal" ? 2 : 3;
    const workerY = y + size * (0.045 + serviceIndex * 0.006);
    this.drawHarborLifeSprite(
      "worker",
      this.frameFor(object.seed + 103, service === "trade" ? 6.4 : 5.2),
      x + size * (-0.2 + workerPath * 0.13),
      workerY,
      size * 0.13,
      Math.cos(activity) < 0,
    );
    if (service === "trade" || service === "shipyard" || service === "academy") {
      this.drawHarborLifeSprite(
        "cat",
        this.frameFor(object.seed + 211, 5.8),
        x + size * (0.12 + catPath * 0.16),
        y + size * 0.105,
        size * 0.092,
        Math.cos(activity * 0.67 + 1.9) < 0,
      );
    }
    this.drawHarborLifeSprite(
      "crane",
      this.frameFor(object.seed + 317, service === "shipyard" ? 3.8 : 2.7),
      x + size * (service === "arsenal" ? -0.25 : 0.27),
      y - size * 0.02,
      size * (service === "shipyard" ? 0.28 : 0.23),
      service === "arsenal",
    );
    this.drawHarborLifeSprite(
      "palm",
      this.frameFor(object.seed + 419, 4.6),
      x + size * (serviceIndex % 2 === 0 ? 0.24 : -0.25),
      y - size * 0.17,
      size * 0.19,
      serviceIndex % 2 === 1,
    );
  }

  private drawHostileHealth(object: SeaObject, x: number, y: number, width: number) {
    if (!object.maxHealth || object.health === undefined || object.health >= object.maxHealth) return;
    const context = this.context;
    const progress = clamp(object.health / object.maxHealth, 0, 1);
    context.save();
    context.fillStyle = "rgba(4,18,25,.72)";
    context.fillRect(x - width / 2 - 2, y - 2, width + 4, 7);
    context.fillStyle = progress > 0.45 ? "rgba(255,187,91,.94)" : "rgba(255,101,79,.95)";
    context.fillRect(x - width / 2, y, width * progress, 3);
    context.restore();
  }

  private drawObject(object: SeaObject) {
    const x = this.toScreenX(object.x);
    const y = this.toScreenY(object.y);
    const size = objectSize(object.kind, object.radius) * this.worldScale * object.scale;
    const phase = (object.seed % 997) / 997 * TWO_PI;
    const motion = SURFACE_MOTION_PROFILES[object.kind];
    let liftWave = 0;
    let visualY = y;
    let visualSize = size;
    let rotationOffset = 0;
    // Surface motion is draw-only; world coordinates and collision geometry stay fixed.
    if (motion && !this.options.reducedMotion) {
      liftWave = Math.sin(this.elapsed * motion.frequency + phase);
      const rollWave = Math.sin(this.elapsed * motion.frequency * 0.57 + phase * 1.73);
      const spinDirection = object.seed % 2 === 0 ? 1 : -1;
      visualY -= liftWave * Math.min(motion.maxBob, size * motion.bobFactor);
      visualSize = size * (1 + liftWave * motion.scaleAmplitude);
      rotationOffset = rollWave * motion.swayAmplitude
        + (this.elapsed * motion.spinSpeed * spinDirection) % TWO_PI;
    }
    if (isHarborKind(object.kind)) {
      this.drawHarbor(object, x, y, size);
      return;
    }
    if (object.kind === "rival") {
      this.drawPursuerWake(x, y, size, object.rotation, object.seed);
      this.drawShip("rival", object.rotation, x, visualY, visualSize);
      this.drawHostileHealth(object, x, visualY - visualSize * 0.43, visualSize * 0.44);
      return;
    }
    if (object.kind === "wind") {
      this.drawPickupHalo(x, y, size * 0.34, "88,255,235");
      this.drawEventSprite("windRelic", x, visualY, visualSize, phase * 0.12 + rotationOffset);
      return;
    }
    if (object.kind === "whirlpool") {
      this.drawWhirlpool(object, x, y, visualSize, rotationOffset);
      return;
    }
    if (object.kind === "currentRift" || object.kind === "stormWreckage" || object.kind === "seaCreature") {
      const rotation = (object.kind === "currentRift" ? object.rotation - Math.PI * 0.25 : 0) + rotationOffset;
      const fps = object.kind === "seaCreature" ? 4.2 : object.kind === "currentRift" ? 5.4 : 3.7;
      this.drawAnimatedEventSprite(object.kind, x, visualY, visualSize, rotation, object.seed, fps);
      if (motion?.waterline) this.drawSurfaceWaterline(x, y, size, liftWave);
      if (object.kind === "seaCreature") this.drawHostileHealth(object, x, visualY - visualSize * 0.38, visualSize * 0.4);
      return;
    }
    if (object.kind === "signalBuoy" || object.kind === "tideRelic" || object.kind === "rescueSkiff" || object.kind === "volcanicBomb") {
      if (object.kind === "signalBuoy") {
        this.drawPickupHalo(x, y, size * 0.42, "94,255,236");
        this.drawBeaconPulse(x, visualY, visualSize, object.seed);
      } else if (object.kind === "tideRelic") {
        this.drawPickupHalo(x, y, size * 0.48, "105,244,255");
      } else if (object.kind === "rescueSkiff") {
        this.drawPickupHalo(x, y, size * 0.4, "255,218,132");
      } else {
        this.drawVolcanicTrail(object, x, y, size);
      }
      const fps = object.kind === "volcanicBomb" ? 6.1 : object.kind === "rescueSkiff" ? 5.2 : object.kind === "signalBuoy" ? 4.6 : 4.1;
      const rotation = (object.kind === "volcanicBomb" ? object.rotation : 0) + rotationOffset;
      this.drawExpandedEventSprite(object.kind, x, visualY, visualSize, rotation, object.seed, fps);
      if (motion?.waterline) this.drawSurfaceWaterline(x, y, size, liftWave);
      return;
    }
    const eventKind = EVENT_OBJECT_ART[object.kind];
    if (eventKind) {
      if (object.kind === "salvageBeacon") this.drawBeaconPulse(x, visualY, visualSize, object.seed);
      this.drawEventSprite(eventKind, x, visualY, visualSize, rotationOffset);
      if (motion?.waterline) this.drawSurfaceWaterline(x, y, size, liftWave);
      return;
    }
    if (!this.atlas || !(object.kind in ATLAS_CELLS)) return;
    const atlasKind = object.kind as AtlasKind;
    if (this.isLandmark(object.kind)) this.drawLandmarkLife(object, x, y, size, "under");
    if (object.kind === "lighthouse") this.drawLighthouseBeam(x, y, size, object.seed);
    if (object.kind === "crate" || object.kind === "rescue") this.drawPickupHalo(x, y, size * 0.34, object.kind === "rescue" ? "88,255,210" : "255,215,105");
    if (object.kind === "island") this.drawIslandVariant(object, x, y, size);
    else this.drawAtlasSprite(
      atlasKind,
      x,
      visualY,
      visualSize,
      object.rotation + rotationOffset,
      object.kind === "lighthouse" || object.kind === "palm",
      !motion?.waterline,
    );
    if (motion?.waterline) this.drawSurfaceWaterline(x, y, size, liftWave);
    if (this.isLandmark(object.kind)) this.drawLandmarkLife(object, x, y, size, "over");
  }

  private frameFor(seed: number, fps: number) {
    if (this.options.reducedMotion) return seed % ANIMATION_FRAME_COUNT;
    const phase = (seed % 1_009) / 1_009 * ANIMATION_FRAME_COUNT;
    return Math.floor(this.elapsed * fps + phase) % ANIMATION_FRAME_COUNT;
  }

  private drawIslandVariant(object: SeaObject, x: number, y: number, size: number) {
    const variant = object.seed % 5;
    if (variant === 4 || !this.islandVariantAtlas) {
      this.drawAtlasSprite("island", x, y, size, object.rotation, true);
      return;
    }
    const context = this.context;
    const sourceSize = this.islandVariantAtlas.naturalWidth / 2;
    const scale = variant === 1 ? 1.07 : variant === 2 ? 0.98 : 1;
    const drawSize = size * scale;
    context.save();
    context.translate(x, y);
    context.rotate(object.rotation);
    context.fillStyle = "rgba(1,24,34,.25)";
    context.beginPath();
    context.ellipse(drawSize * 0.04, drawSize * 0.18, drawSize * 0.29, drawSize * 0.11, 0.12, 0, TWO_PI);
    context.fill();
    context.drawImage(
      this.islandVariantAtlas,
      (variant % 2) * sourceSize,
      Math.floor(variant / 2) * sourceSize,
      sourceSize,
      sourceSize,
      -drawSize / 2,
      -drawSize / 2,
      drawSize,
      drawSize,
    );
    context.restore();
  }

  private drawAnimatedEventSprite(kind: AnimatedEventKind, x: number, y: number, size: number, rotation: number, seed: number, fps: number) {
    if (!this.eventFrameAtlas) return;
    const frame = this.frameFor(seed, fps);
    const sourceSize = this.eventFrameAtlas.naturalWidth / ANIMATION_FRAME_COUNT;
    const row = ANIMATED_EVENT_ROWS[kind];
    const context = this.context;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.drawImage(
      this.eventFrameAtlas,
      frame * sourceSize,
      row * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawExpandedEventSprite(kind: ExpandedEventKind, x: number, y: number, size: number, rotation: number, seed: number, fps: number) {
    if (!this.eventExpansionAtlas) return;
    const frame = this.frameFor(seed, fps);
    const sourceSize = this.eventExpansionAtlas.naturalWidth / ANIMATION_FRAME_COUNT;
    const row = EXPANDED_EVENT_ROWS[kind];
    const context = this.context;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.drawImage(
      this.eventExpansionAtlas,
      frame * sourceSize,
      row * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawAmbientSprite(kind: AmbientLifeKind, frame: number, x: number, y: number, size: number, rotation = 0, alpha = 1) {
    if (!this.ambientLifeAtlas) return;
    const sourceSize = this.ambientLifeAtlas.naturalWidth / ANIMATION_FRAME_COUNT;
    const context = this.context;
    context.save();
    context.globalAlpha = alpha;
    context.translate(x, y);
    context.rotate(rotation);
    context.drawImage(
      this.ambientLifeAtlas,
      frame * sourceSize,
      AMBIENT_LIFE_ROWS[kind] * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawLandmarkLife(object: SeaObject, x: number, y: number, size: number, layer: "under" | "over") {
    const phase = (object.seed % 997) / 997 * TWO_PI;
    const orbit = this.options.reducedMotion ? phase : phase + this.elapsed * 0.34;
    const islandLife = object.seed % 3;
    if (layer === "under") {
      if (object.kind === "reef" || object.kind === "wreck" || (object.kind === "island" && islandLife === 1)) {
        const fishFrame = this.frameFor(object.seed + 31, 4.8);
        this.drawAmbientSprite(
          "fish",
          fishFrame,
          x + Math.cos(orbit * 0.72) * size * 0.26,
          y + Math.sin(orbit * 0.72) * size * 0.13,
          size * (object.kind === "reef" ? 0.22 : 0.17),
          orbit * 0.18,
          0.5,
        );
      }
      return;
    }

    if (object.kind === "island" && islandLife !== 1 || object.kind === "lighthouse") {
      const gullFrame = this.frameFor(object.seed + 17, 6.4);
      this.drawAmbientSprite(
        "gulls",
        gullFrame,
        x + Math.cos(orbit) * size * 0.24,
        y - size * 0.22 + Math.sin(orbit) * size * 0.075,
        size * 0.17,
        -orbit * 0.12,
      );
    }
    if (object.kind === "palm" || object.kind === "island" && islandLife === 2) {
      const crabFrame = this.frameFor(object.seed + 53, 4.1);
      this.drawAmbientSprite("crabs", crabFrame, x + Math.cos(phase) * size * 0.24, y + size * 0.27, size * 0.12, phase * 0.16);
    }
    if (object.kind === "lighthouse" || object.kind === "wreck") {
      const pennantFrame = this.frameFor(object.seed + 79, 5.8);
      this.drawAmbientSprite("pennant", pennantFrame, x + size * 0.02, y - size * (object.kind === "lighthouse" ? 0.29 : 0.2), size * 0.15);
      if (object.kind === "wreck") this.drawWreckLantern(x, y, size, object.seed);
    }
  }

  private drawLighthouseBeam(x: number, y: number, size: number, seed: number) {
    const context = this.context;
    const phase = (seed % 997) / 997 * TWO_PI;
    const rotation = this.options.reducedMotion ? phase : phase + this.elapsed * 0.42;
    const originY = y - size * 0.16;
    context.save();
    context.translate(x, originY);
    context.rotate(rotation);
    context.globalCompositeOperation = "screen";
    const beam = context.createLinearGradient(0, 0, size * 0.84, 0);
    beam.addColorStop(0, "rgba(255,237,164,.27)");
    beam.addColorStop(0.68, "rgba(255,244,189,.11)");
    beam.addColorStop(1, "rgba(255,250,218,0)");
    context.fillStyle = beam;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(size * 0.84, -size * 0.17);
    context.lineTo(size * 0.84, size * 0.17);
    context.closePath();
    context.fill();
    context.restore();
  }

  private drawWreckLantern(x: number, y: number, size: number, seed: number) {
    const context = this.context;
    const pulse = this.options.reducedMotion ? 0.72 : 0.58 + Math.sin(this.elapsed * 4.2 + seed) * 0.18;
    const lightX = x + size * 0.04;
    const lightY = y - size * 0.08;
    const glow = context.createRadialGradient(lightX, lightY, 1, lightX, lightY, size * 0.09);
    glow.addColorStop(0, `rgba(255,221,127,${pulse})`);
    glow.addColorStop(1, "rgba(255,179,67,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(lightX, lightY, size * 0.09, 0, TWO_PI);
    context.fill();
  }

  private drawBeaconPulse(x: number, y: number, size: number, seed: number) {
    const context = this.context;
    const phase = this.options.reducedMotion ? 0.62 : 0.48 + Math.sin(this.elapsed * 3.8 + seed) * 0.28;
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = `rgba(255,226,142,${phase})`;
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(x, y - size * 0.09, size * (0.18 + phase * 0.05), 0, TWO_PI);
    context.stroke();
    context.restore();
  }

  private drawVolcanicTrail(object: SeaObject, x: number, y: number, size: number) {
    const velocityX = object.velocityX ?? 0;
    const velocityY = (object.velocityY ?? 0) * Y_PERSPECTIVE;
    const length = Math.max(0.001, Math.hypot(velocityX, velocityY));
    const trailX = velocityX / length;
    const trailY = velocityY / length;
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "screen";
    const glow = context.createLinearGradient(x, y, x - trailX * size * 0.62, y - trailY * size * 0.62);
    glow.addColorStop(0, "rgba(255,226,122,.72)");
    glow.addColorStop(0.42, "rgba(255,111,43,.35)");
    glow.addColorStop(1, "rgba(255,77,28,0)");
    context.strokeStyle = glow;
    context.lineWidth = Math.max(1.4, size * 0.08);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - trailX * size * 0.62, y - trailY * size * 0.62);
    context.stroke();
    context.restore();
  }

  private drawPursuerWake(x: number, y: number, size: number, heading: number, seed: number) {
    const context = this.context;
    const forwardX = Math.sin(heading);
    const forwardY = -Math.cos(heading) * Y_PERSPECTIVE;
    const length = Math.max(0.001, Math.hypot(forwardX, forwardY));
    const fx = forwardX / length;
    const fy = forwardY / length;
    const sx = -fy;
    const sy = fx;
    const sternX = x - fx * size * 0.27;
    const sternY = y - fy * size * 0.27;
    const flutter = this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 4.6 + seed) * size * 0.018;
    context.save();
    context.strokeStyle = "rgba(231,255,248,.43)";
    context.lineWidth = Math.max(1, size * 0.018);
    context.lineCap = "round";
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(sternX + sx * side * size * 0.09, sternY + sy * side * size * 0.09);
      context.quadraticCurveTo(
        sternX - fx * size * 0.2 + sx * side * flutter,
        sternY - fy * size * 0.2 + sy * side * flutter,
        sternX - fx * size * 0.44 + sx * side * size * 0.15,
        sternY - fy * size * 0.44 + sy * side * size * 0.15,
      );
      context.stroke();
    }
    context.restore();
  }

  private drawHullDisplacement(x: number, y: number, size: number, heading: number) {
    const context = this.context;
    const projectedHeading = projectHeadingToScreen(heading);
    const forwardX = Math.sin(projectedHeading);
    const forwardY = -Math.cos(projectedHeading);
    const sideX = -forwardY;
    const sideY = forwardX;
    const strength = clamp(this.speed / 7, 0.24, 1);
    const bowX = x + forwardX * size * 0.31;
    const bowY = y + forwardY * size * 0.31;

    context.save();
    context.translate(x, y);
    context.rotate(projectedHeading);
    context.fillStyle = `rgba(0,36,57,${0.07 + strength * 0.07})`;
    context.beginPath();
    context.ellipse(0, size * 0.04, size * 0.3, size * 0.105, 0, 0, TWO_PI);
    context.fill();
    context.restore();

    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    for (const side of [-1, 1]) {
      const startX = bowX + sideX * side * size * 0.025;
      const startY = bowY + sideY * side * size * 0.025;
      context.strokeStyle = `rgba(235,255,248,${0.18 + strength * 0.26})`;
      context.lineWidth = 0.9 + strength * 1.15;
      context.beginPath();
      context.moveTo(startX, startY);
      context.bezierCurveTo(
        x + forwardX * size * 0.19 + sideX * side * size * 0.15,
        y + forwardY * size * 0.19 + sideY * side * size * 0.15,
        x - forwardX * size * 0.04 + sideX * side * size * 0.28,
        y - forwardY * size * 0.04 + sideY * side * size * 0.28,
        x - forwardX * size * 0.16 + sideX * side * size * 0.31,
        y - forwardY * size * 0.16 + sideY * side * size * 0.31,
      );
      context.stroke();
    }
    context.strokeStyle = `rgba(135,238,225,${0.1 + strength * 0.12})`;
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(bowX - sideX * size * 0.09, bowY - sideY * size * 0.09);
    context.quadraticCurveTo(
      bowX + forwardX * size * (0.07 + strength * 0.025),
      bowY + forwardY * size * (0.07 + strength * 0.025),
      bowX + sideX * size * 0.09,
      bowY + sideY * size * 0.09,
    );
    context.stroke();
    context.restore();
  }

  private drawPickupHalo(x: number, y: number, radius: number, color: string) {
    const context = this.context;
    const pulse = this.options.reducedMotion ? 1 : 0.88 + Math.sin(this.elapsed * 3.3 + x * 0.01) * 0.12;
    const gradient = context.createRadialGradient(x, y, 1, x, y, radius * pulse);
    gradient.addColorStop(0, `rgba(${color},.24)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius * pulse, 0, TWO_PI);
    context.fill();
  }

  private drawSurfaceWaterline(x: number, y: number, size: number, liftWave: number) {
    const context = this.context;
    const submersion = (1 - liftWave) * 0.5;
    const waterlineY = y + size * (0.115 + submersion * 0.018);
    const waterlineWidth = size * (0.225 - submersion * 0.008);
    context.save();
    context.fillStyle = `rgba(26,143,157,${0.08 + submersion * 0.055})`;
    context.beginPath();
    context.ellipse(x, waterlineY, waterlineWidth, size * 0.064, 0.04, 0, Math.PI);
    context.closePath();
    context.fill();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = `rgba(218,255,246,${0.16 + submersion * 0.14})`;
    context.lineWidth = Math.max(0.8, size * 0.012);
    context.beginPath();
    context.ellipse(x, waterlineY, waterlineWidth, size * 0.064, 0.04, 0.08 * Math.PI, 0.92 * Math.PI);
    context.stroke();
    context.restore();
  }

  private drawAtlasSprite(kind: AtlasKind, x: number, y: number, size: number, rotation: number, heavyShadow = false, shadow = true) {
    if (!this.atlas) return;
    const context = this.context;
    const [column, row] = ATLAS_CELLS[kind];
    const sourceSize = this.atlas.naturalWidth / 3;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    if (shadow) {
      context.fillStyle = heavyShadow ? "rgba(1,24,34,.25)" : "rgba(1,24,34,.18)";
      context.beginPath();
      context.ellipse(size * 0.04, size * 0.18, size * 0.27, size * 0.11, 0.12, 0, TWO_PI);
      context.fill();
    }
    context.drawImage(
      this.atlas,
      column * sourceSize,
      row * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawShip(kind: "player" | "rival", heading: number, x: number, y: number, size: number) {
    const image = kind === "player" ? this.playerShipImage : this.rivalShipImage;
    const northImage = kind === "player" ? this.playerShipNorthImage : this.rivalShipNorthImage;
    if (!image) return;
    const context = this.context;
    const projectedHeading = projectHeadingToScreen(heading);
    context.save();
    context.translate(x, y);
    context.fillStyle = kind === "player" ? "rgba(1,24,34,.2)" : "rgba(1,14,24,.26)";
    context.save();
    context.rotate(projectedHeading);
    context.beginPath();
    context.ellipse(0, size * 0.13, size * 0.29, size * 0.105, 0, 0, TWO_PI);
    context.fill();
    context.restore();
    if (kind === "player" && this.playerShipFurledImage) {
      const sail = clamp(this.sailBlend, 0, 1);
      if (sail < 0.995) {
        context.globalAlpha = 1 - sail;
        this.drawDirectionalShipFrame(this.playerShipFurledImage, this.playerShipNorthFurledImage, projectedHeading, size);
      }
      if (sail > 0.005) {
        context.globalAlpha = sail;
        this.drawDirectionalShipFrame(image, northImage, projectedHeading, size);
      }
      context.globalAlpha = 1;
    } else {
      this.drawDirectionalShipFrame(image, northImage, projectedHeading, size);
    }
    context.restore();
  }

  private drawDirectionalShipFrame(image: HTMLImageElement, northImage: HTMLImageElement | null, projectedHeading: number, size: number) {
    const normalized = (projectedHeading % TWO_PI + TWO_PI) % TWO_PI;
    const slot = Math.round(normalized / TWO_PI * DIRECTIONAL_SHIP_VIEWS.length) % DIRECTIONAL_SHIP_VIEWS.length;
    if (slot === 0 && northImage) {
      this.context.drawImage(northImage, -size / 2, -size / 2, size, size);
      return;
    }
    const view = DIRECTIONAL_SHIP_VIEWS[slot];
    const frame = view.frame;
    const column = frame % DIRECTIONAL_SHIP_GRID;
    const row = Math.floor(frame / DIRECTIONAL_SHIP_GRID);
    const sourceWidth = image.naturalWidth / DIRECTIONAL_SHIP_GRID;
    const sourceHeight = image.naturalHeight / DIRECTIONAL_SHIP_GRID;
    this.context.save();
    this.context.rotate(angleDelta(view.sourceHeading, normalized));
    this.context.drawImage(
      image,
      column * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    this.context.restore();
  }

  private drawEventSprite(kind: EventAtlasKind, x: number, y: number, size: number, rotation: number) {
    if (!this.eventAtlas) return;
    const context = this.context;
    const [column, row] = EVENT_ATLAS_CELLS[kind];
    const sourceSize = this.eventAtlas.naturalWidth / 3;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.drawImage(
      this.eventAtlas,
      column * sourceSize,
      row * sourceSize,
      sourceSize,
      sourceSize,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawWhirlpool(object: SeaObject, x: number, y: number, size: number, rotation: number) {
    this.drawAnimatedEventSprite("whirlpool", x, y, size, rotation, object.seed, 6.2);
    if (this.options.highVisibility) {
      this.context.save();
      this.context.strokeStyle = "rgba(255,219,134,.82)";
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.ellipse(x, y, size * 0.34, size * 0.2, 0, 0, TWO_PI);
      this.context.stroke();
      this.context.restore();
    }
  }

  private drawPlayer() {
    if (!this.playerShipImage) return;
    const x = this.toScreenX(this.playerX);
    const y = this.toScreenY(this.playerY);
    const bob = this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 3.1) * 1.3;
    const size = this.worldScale * 7.8;
    this.drawHullDisplacement(x, y + bob, size, this.heading);
    this.drawShip("player", this.heading, x, y + bob, size);
    if (this.escortTime > 0) {
      const orbit = this.options.reducedMotion ? 1.1 : this.elapsed * 0.7;
      const escortX = x + Math.cos(orbit) * size * 0.58;
      const escortY = y + Math.sin(orbit) * size * 0.31 + size * 0.28;
      this.drawAtlasSprite("rescue", escortX, escortY, size * 0.38, 0);
    }
  }

  private drawStormVeil() {
    const context = this.context;
    context.save();
    context.fillStyle = "rgba(4,38,61,.13)";
    context.fillRect(0, 0, this.width, this.height);
    context.strokeStyle = "rgba(190,239,245,.17)";
    context.lineWidth = 1;
    const drift = this.options.reducedMotion ? 0 : (this.elapsed * 180) % 90;
    for (let x = -this.height; x < this.width + this.height; x += 48) {
      context.beginPath();
      context.moveTo(x + drift, -20);
      context.lineTo(x - 120 + drift, this.height + 20);
      context.stroke();
    }
    context.restore();
  }

  private drawVolcanicVeil() {
    const context = this.context;
    context.save();
    context.fillStyle = "rgba(54,24,18,.055)";
    context.fillRect(0, 0, this.width, this.height);
    for (let index = 0; index < 16; index += 1) {
      const seed = hashCoordinates(index, this.eventIndex, 811);
      const drift = this.options.reducedMotion ? 0 : this.elapsed * (9 + seed % 7);
      const x = (seed % Math.max(1, Math.floor(this.width + 80))) - 40;
      const y = ((seed >>> 10) % Math.max(1, Math.floor(this.height + 80)) + drift) % (this.height + 80) - 40;
      context.fillStyle = index % 4 === 0 ? "rgba(255,145,76,.28)" : "rgba(44,34,31,.18)";
      context.beginPath();
      context.arc(x, y, index % 4 === 0 ? 1.4 : 1.05, 0, TWO_PI);
      context.fill();
    }
    context.restore();
  }

  private drawAtmosphere() {
    const context = this.context;
    const vignette = context.createRadialGradient(this.width * 0.52, this.height * 0.47, Math.min(this.width, this.height) * 0.25, this.width * 0.52, this.height * 0.47, Math.max(this.width, this.height) * 0.72);
    vignette.addColorStop(0, "rgba(0,18,31,0)");
    vignette.addColorStop(0.72, "rgba(0,18,31,.05)");
    vignette.addColorStop(1, "rgba(0,13,25,.32)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, this.width, this.height);
  }

  private emitSnapshot(force: boolean) {
    const now = performance.now();
    if (!force && now - this.lastSnapshotTime < 100) return;
    this.lastSnapshotTime = now;
    const score = Math.floor(this.distance * 2.35) + this.cargo * 160 + this.valuables * 360 + this.fishCargo * 52
      + this.coins * 15 + this.sunkEnemies * 80 + this.bonusScore;
    const harborDistance = this.nearbyHarborObject
      ? Math.hypot(this.playerX - this.nearbyHarborObject.x, this.playerY - this.nearbyHarborObject.y)
      : -1;
    const nearbyHarbor = this.nearbyHarborObject && isHarborKind(this.nearbyHarborObject.kind)
      ? HARBOR_SERVICE_BY_KIND[this.nearbyHarborObject.kind]
      : "none";
    const eventProgress = this.eventTarget > 0
      ? (this.eventTarget ? this.eventFound / this.eventTarget : 0)
      : this.activeEvent === "none" ? 0 : this.eventTimer / this.eventDuration;
    const nearbyFish = this.findNearestFishSchool(NET_CAST_RANGE);
    const canFish = Boolean(nearbyFish && !this.fishingTargetId && this.netCooldown <= 0
      && this.targetSail === 0 && this.sailBlend <= 0.32 && this.speed <= 1.25);
    this.onSnapshot({
      phase: this.phase,
      distance: Math.floor(this.distance),
      score,
      lives: this.lives,
      boost: Math.round(this.boostEnergy),
      speed: this.speed,
      cargo: this.cargo,
      valuables: this.valuables,
      fishCargo: this.fishCargo,
      coins: this.coins,
      ammo: this.ammo,
      ammoCapacity: this.getAmmoCapacity(),
      gunLevel: this.gunLevel,
      repairCost: this.getRepairCost(),
      ammoPackCost: this.getAmmoPackCost(),
      gunUpgradeCost: this.getGunUpgradeCost(),
      sunkEnemies: this.sunkEnemies,
      sailsRaised: this.targetSail > 0.5,
      sailPercent: Math.round(this.sailBlend * 100),
      windHeading: ((this.windHeading * 180) / Math.PI + 360) % 360,
      windStrength: Math.round(this.windStrength * 100),
      drift: Math.round(this.lateralDrift * 19) / 10,
      autoDocking: this.autoDocking,
      nearbyFish: Boolean(nearbyFish),
      canFish,
      netCooldown: Math.ceil(this.netCooldown),
      fishingProgress: Math.round(this.fishingProgress * 100),
      escort: Math.ceil(this.escortTime),
      fairWind: Math.ceil(this.fairWindTime),
      gunFocus: Math.ceil(this.gunFocusTime),
      heading: ((this.heading * 180) / Math.PI + 360) % 360,
      worldX: Math.round(this.playerX),
      worldY: Math.round(this.playerY),
      activeEvent: this.activeEvent,
      eventProgress: clamp(eventProgress * 100, 0, 100),
      eventFound: this.eventFound,
      eventTarget: this.eventTarget,
      notice: this.notice,
      nearbyHarbor,
      dockedHarbor: this.dockedHarbor,
      harborDistance: harborDistance < 0 ? -1 : Math.round(harborDistance * 10) / 10,
      canDock: Boolean(this.nearbyHarborObject && this.canDockAtHarbor(this.nearbyHarborObject)),
      renderScale: Math.round(this.renderScale * 100),
    });
  }
}
