export type ShipHullId = "windcutter" | "brigantine" | "grand_voyager";
export type EquipmentId = "swivel_8" | "long_18" | "wave_ballista" | "gear_net";

export type ShipHullSpec = {
  id: ShipHullId;
  name: string;
  description: string;
  price: number;
  slots: number;
  halfRows: number;
  beam: number;
  masts: number;
  sailPower: number;
  turning: number;
  draft: number;
};

export type EquipmentSpec = {
  id: EquipmentId;
  name: string;
  shortName: string;
  description: string;
  category: "weapon" | "fishing";
  price: number;
  range: number;
  damage: number;
  cooldown: number;
  projectileSpeed: number;
};

export type EquipmentHardpoint = {
  x: number;
  y: number;
  z: number;
};

export const SHIP_HULLS: readonly ShipHullSpec[] = [
  {
    id: "windcutter",
    name: "Windcutter",
    description: "Light and responsive, with two deck slots.",
    price: 0,
    slots: 2,
    halfRows: 6,
    beam: 1,
    masts: 1,
    sailPower: 1,
    turning: 1,
    draft: 1,
  },
  {
    id: "brigantine",
    name: "Armed Brig",
    description: "A two-masted hull with four slots and less agile handling.",
    price: 18,
    slots: 4,
    halfRows: 8,
    beam: 1.24,
    masts: 2,
    sailPower: 0.91,
    turning: 0.84,
    draft: 1.16,
  },
  {
    id: "grand_voyager",
    name: "Voyager",
    description: "A heavy hull with six slots, strong firepower, and slower handling.",
    price: 42,
    slots: 6,
    halfRows: 10,
    beam: 1.48,
    masts: 3,
    sailPower: 0.8,
    turning: 0.67,
    draft: 1.34,
  },
] as const;

export const EQUIPMENT_CATALOG: readonly EquipmentSpec[] = [
  {
    id: "swivel_8",
    name: "8-pound swivel gun",
    shortName: "8-lb gun",
    description: "Fast reload; deals 2 hull damage within 24 nautical miles.",
    category: "weapon",
    price: 7,
    range: 24,
    damage: 2,
    cooldown: 1.45,
    projectileSpeed: 16,
  },
  {
    id: "long_18",
    name: "18-pound long gun",
    shortName: "18-lb gun",
    description: "A heavy gun with 34 nautical miles of range, 4 damage, and a slower reload.",
    category: "weapon",
    price: 11,
    range: 34,
    damage: 4,
    cooldown: 2.8,
    projectileSpeed: 18,
  },
  {
    id: "wave_ballista",
    name: "Wavepiercer ballista",
    shortName: "Wavepiercer",
    description: "Fires a heavy bolt for 3 damage at up to 43 nautical miles.",
    category: "weapon",
    price: 8,
    range: 43,
    damage: 3,
    cooldown: 2.05,
    projectileSpeed: 23,
  },
  {
    id: "gear_net",
    name: "Tidal net winch",
    shortName: "Net winch",
    description: "Extends fishing range, speeds up hauling, and increases the catch.",
    category: "fishing",
    price: 6,
    range: 0,
    damage: 0,
    cooldown: 0,
    projectileSpeed: 0,
  },
] as const;

const HARDPOINTS: Record<ShipHullId, readonly EquipmentHardpoint[]> = {
  windcutter: [
    { x: -0.72, y: 0.69, z: -0.72 },
    { x: 0.72, y: 0.69, z: -0.72 },
  ],
  brigantine: [
    { x: -0.95, y: 0.72, z: -1.34 },
    { x: 0.95, y: 0.72, z: -1.34 },
    { x: -0.95, y: 0.72, z: 1.02 },
    { x: 0.95, y: 0.72, z: 1.02 },
  ],
  grand_voyager: [
    { x: -1.16, y: 0.75, z: -1.86 },
    { x: 1.16, y: 0.75, z: -1.86 },
    { x: -1.16, y: 0.75, z: 0 },
    { x: 1.16, y: 0.75, z: 0 },
    { x: -1.16, y: 0.75, z: 1.75 },
    { x: 1.16, y: 0.75, z: 1.75 },
  ],
};

export function getShipHull(id: ShipHullId) {
  const hull = SHIP_HULLS.find((candidate) => candidate.id === id);
  if (!hull) throw new RangeError(`Unknown ship hull: ${id}`);
  return hull;
}

export function getEquipment(id: EquipmentId) {
  const equipment = EQUIPMENT_CATALOG.find((candidate) => candidate.id === id);
  if (!equipment) throw new RangeError(`Unknown equipment: ${id}`);
  return equipment;
}

export function hardpointsForHull(id: ShipHullId) {
  return HARDPOINTS[id];
}

export function fishingProfile(loadout: readonly EquipmentId[]) {
  const rigs = loadout.reduce((count, id) => count + (id === "gear_net" ? 1 : 0), 0);
  return {
    rigs,
    acquireDistance: 4.15 + rigs * 0.9,
    retainDistance: 4.6 + rigs * 1.05,
    maximumSail: 0.34 + rigs * 0.07,
    maximumSpeed: 1.35 + rigs * 0.22,
    progressSeconds: Math.max(0.85, 2.15 - rigs * 0.48),
    catchBonus: rigs,
  };
}

export function offensiveEquipment(loadout: readonly EquipmentId[]) {
  return loadout.filter((id) => getEquipment(id).category === "weapon");
}
