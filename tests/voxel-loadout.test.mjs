import assert from "node:assert/strict";
import test from "node:test";

import {
  EQUIPMENT_CATALOG,
  fishingProfile,
  getEquipment,
  hardpointsForHull,
  offensiveEquipment,
  SHIP_HULLS,
} from "../app/voxel/voxel-loadout.ts";

test("larger modeled hulls expose more real equipment hardpoints with handling tradeoffs", () => {
  assert.deepEqual(SHIP_HULLS.map((hull) => hull.slots), [2, 4, 6]);
  assert.deepEqual(SHIP_HULLS.map((hull) => hardpointsForHull(hull.id).length), [2, 4, 6]);
  for (let index = 1; index < SHIP_HULLS.length; index += 1) {
    assert.ok(SHIP_HULLS[index].halfRows > SHIP_HULLS[index - 1].halfRows);
    assert.ok(SHIP_HULLS[index].beam > SHIP_HULLS[index - 1].beam);
    assert.ok(SHIP_HULLS[index].price > SHIP_HULLS[index - 1].price);
    assert.ok(SHIP_HULLS[index].turning < SHIP_HULLS[index - 1].turning);
  }
});

test("weapon catalog has genuinely different range, damage, reload, and projectile profiles", () => {
  const weapons = EQUIPMENT_CATALOG.filter((equipment) => equipment.category === "weapon");
  assert.equal(weapons.length, 3);
  assert.equal(new Set(weapons.map((weapon) => weapon.range)).size, weapons.length);
  assert.equal(new Set(weapons.map((weapon) => weapon.damage)).size, weapons.length);
  assert.equal(new Set(weapons.map((weapon) => weapon.cooldown)).size, weapons.length);
  assert.ok(weapons.every((weapon) => weapon.projectileSpeed > 0));
  assert.deepEqual(offensiveEquipment(["gear_net", "long_18", "gear_net", "wave_ballista"]), ["long_18", "wave_ballista"]);
});

test("each installed net machine materially improves the fishing profile", () => {
  const baseline = fishingProfile(["swivel_8"]);
  const oneRig = fishingProfile(["swivel_8", "gear_net"]);
  const twoRigs = fishingProfile(["gear_net", "gear_net"]);
  assert.ok(oneRig.acquireDistance > baseline.acquireDistance);
  assert.ok(oneRig.retainDistance > baseline.retainDistance);
  assert.ok(oneRig.progressSeconds < baseline.progressSeconds);
  assert.ok(twoRigs.progressSeconds < oneRig.progressSeconds);
  assert.ok(twoRigs.catchBonus > oneRig.catchBonus);
  assert.equal(getEquipment("gear_net").damage, 0);
});
