import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

for (const pathname of ["/", "/v4"]) {
  test(`server-renders only V4 on ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);

    const html = await response.text();
    assert.match(html, /<title>Endless Wake V4: Living Tides<\/title>/i);
    assert.match(html, /A living sea awaits/);
    assert.match(html, /Sail and inertia/);
    assert.match(html, /Auto-docking/);
    assert.match(html, /Fishing and marine life/);
    assert.match(html, /Living harbors/);
    assert.match(html, /Ship collisions/);
    assert.match(html, /Touch controls/);
    assert.match(html, /Keyboard controls/);
    assert.match(html, /Raise \/ lower sail/);
    assert.match(html, /Play V5 Voxel/);
    assert.match(html, /href=["']\/v5["']/i);
    assert.match(html, /manifest\.webmanifest/);
    assert.match(html, /v4-social-preview\.jpg/);
    assert.doesNotMatch(html, /V3|Azure Tides|[\u3400-\u9fff]/i);
  });
}

test("server-renders the parallel voxel version on /v5", async () => {
  const response = await render("/v5");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("x-content-type-options") ?? "", /nosniff/i);

  const html = await response.text();
  assert.match(html, /<title>Endless Wake V5: Voxel Archipelago<\/title>/i);
  assert.match(html, /Preparing the sea/);
  assert.match(html, /Archipelago chart/);
  assert.match(html, /Open-water sailing/);
  assert.match(html, /Shipyard/);
  assert.match(html, /Voyage log/);
  assert.match(html, /Volcanic activity/);
  assert.match(html, /cools into dark rock/);
  assert.match(html, /World seed/);
  assert.match(html, /The voyage lasts for this page session/);
  assert.match(html, /Play V4/);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
  assert.match(html, /voxel-social-preview\.jpg/);
});

test("redirects /voxel to /v5", async () => {
  const response = await render("/voxel");
  assert.ok(response.status >= 300 && response.status < 400);
  assert.equal(new URL(response.headers.get("location") ?? "", "http://localhost").pathname, "/v5");
});

test("keeps voxel rendering and physics native, bounded, and separate from V4", async () => {
  const [engine, component, loadout, packageJsonText, socialPreview] = await Promise.all([
    readFile(new URL("app/voxel/voxel-engine.ts", root), "utf8"),
    readFile(new URL("app/voxel/VoxelVoyageGame.tsx", root), "utf8"),
    readFile(new URL("app/voxel/voxel-loadout.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("public/voxel-social-preview.jpg", root)),
  ]);
  const packageJson = JSON.parse(packageJsonText);
  assert.match(engine, /getContext\("webgl"/);
  assert.match(engine, /VoxelWorld/);
  assert.match(engine, /VoxelStream/);
  assert.match(engine, /serviceTerrain/);
  assert.match(engine, /updateDepthField/);
  assert.match(engine, /BUOYANCY_SAMPLES = 6/);
  assert.match(engine, /buildTerrainChunk/);
  assert.match(engine, /rebuildTerrain/);
  assert.match(engine, /resolveTerrainCollision/);
  assert.match(engine, /waveHeight/);
  assert.match(engine, /qualityScale/);
  assert.match(engine, /boatVelocityX/);
  assert.match(engine, /currentAt/);
  assert.match(engine, /buildHarbor/);
  assert.match(engine, /buildSeaLife/);
  assert.match(engine, /updateFishing/);
  assert.match(engine, /sellCargo/);
  assert.match(engine, /MAX_SHORE_FOAM = 576/);
  assert.match(engine, /getContext\("webgl2"/);
  assert.match(engine, /extractFrustumPlanes/);
  assert.match(engine, /sphereInsideFrustum/);
  assert.match(engine, /chunkAffectedByVolcano/);
  assert.match(engine, /shoreFoamByChunk/);
  assert.match(engine, /terrainVariation/);
  assert.match(engine, /updateVolcano/);
  assert.match(engine, /lavaChannel/);
  assert.match(engine, /this\.world\.height/);
  assert.match(engine, /volcanoPhaseIndex/);
  assert.match(engine, /buildEquipment/);
  assert.match(engine, /fireWeapons/);
  assert.match(engine, /buyShipHull/);
  assert.match(engine, /buyEquipment/);
  assert.match(engine, /updateWeaponProjectiles/);
  assert.match(loadout, /slots: 2/);
  assert.match(loadout, /slots: 4/);
  assert.match(loadout, /slots: 6/);
  assert.match(loadout, /8-pound swivel gun/);
  assert.match(loadout, /18-pound long gun/);
  assert.match(loadout, /Wavepiercer ballista/);
  assert.match(loadout, /Tidal net winch/);
  assert.match(component, /Volcano watch/);
  assert.match(component, /Trigger eruption/);
  assert.match(component, /F \/ E/);
  assert.match(component, /Tidehaven/);
  assert.match(engine, /Cast net/);
  assert.match(component, /Sell all cargo/);
  assert.match(component, /Fire deck weapons/);
  assert.match(component, /Hulls/);
  assert.match(component, /Deck equipment/);
  assert.doesNotMatch(`${engine}\n${component}`, /from ["'](?:three|babylon|playcanvas|pixi|phaser)|eval\(|innerHTML/i);
  assert.equal(packageJson.dependencies.three, undefined);
  assert.ok(socialPreview.byteLength > 40_000 && socialPreview.byteLength < 3_500_000);
});

test("keeps V4 rendering, simulation, ecology, and offline assets native and bounded", async () => {
  const assetNames = [
    "v4-world-atlas-v1.png",
    "v4-player-ship-directional-full-v1.png",
    "v4-player-ship-directional-furled-v1.png",
    "v4-rival-ship-directional-v1.png",
    "v4-player-ship-north-full-v1.png",
    "v4-player-ship-north-furled-v1.png",
    "v4-rival-ship-north-v1.png",
    "v4-events-v1.png",
    "v4-seabed.jpg",
    "v4-island-variants-v1.png",
    "v4-event-frames-v1.png",
    "v4-event-expansion-v1.png",
    "v4-ambient-life-v1.png",
    "v4-harbors-v1.png",
    "v4-harbor-life-v1.png",
    "v4-underwater-life-v1.png",
    "v4-social-preview.jpg",
  ];
  const [engine, component, serviceWorker, packageJsonText, ...assets] = await Promise.all([
    readFile(new URL("app/v4/engine-v4.ts", root), "utf8"),
    readFile(new URL("app/v4/VoyageV4Game.tsx", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
    ...assetNames.map((name) => readFile(new URL(`public/${name}`, root))),
  ]);
  const packageJson = JSON.parse(packageJsonText);

  assert.match(engine, /getContext\("2d"/);
  assert.match(engine, /CHUNK_SIZE = 32/);
  assert.match(engine, /CHUNK_RADIUS = 3/);
  assert.match(engine, /EVENT_SEQUENCE = \["treasure", "rival", "maelstrom", "leviathan", "beacons", "relics", "flotilla", "volcano"\]/);
  assert.match(engine, /drawSeabedLayer\(\);\s*this\.drawWorldDepthFields\(\);\s*this\.drawMarineLife\(\);\s*this\.drawWaterSurfaceLayer\(\)/);
  assert.match(engine, /createCausticsPattern/);
  assert.match(engine, /drawSurfaceWavelets/);
  assert.match(engine, /ANIMATION_FRAME_COUNT = 4/);
  assert.match(engine, /MAX_EVENT_OBJECTS = 40/);
  assert.match(engine, /MAX_CANNON_SHOTS = 32/);
  assert.match(engine, /MAX_COMBAT_EFFECTS = 48/);
  assert.match(engine, /MAX_SALVAGE_DROPS = 24/);
  assert.match(engine, /MAX_MARINE_LIFE = 150/);
  assert.match(engine, /MIN_RENDER_SCALE = 0\.7/);
  assert.match(engine, /PERFORMANCE_SAMPLE_SECONDS = 2/);
  assert.match(engine, /IDLE_FRAME_INTERVAL_MS = 1000 \/ 30/);

  assert.match(engine, /private velocityX = 0/);
  assert.match(engine, /private angularVelocity = 0/);
  assert.match(engine, /const sailEfficiency =/);
  assert.match(engine, /const forwardDrag =/);
  assert.match(engine, /const lateralDrag =/);
  assert.match(engine, /this\.angularVelocity \+= steeringInput/);
  assert.match(engine, /samples = movingHazard[\s\S]*offset: 2\.18[\s\S]*offset: -2\.02/);
  assert.match(engine, /const normalVelocity =/);
  assert.match(engine, /const impulse = -\(1 \+ restitution\) \* normalVelocity/);
  assert.match(engine, /const rotationalLever =/);
  assert.doesNotMatch(engine, /resolvedHeading|tangentProjection|PLAYER_COLLISION_RADIUS/);

  assert.match(engine, /playerShipFurledImage/);
  assert.match(engine, /context\.globalAlpha = 1 - sail/);
  assert.match(engine, /beginAutoDocking/);
  assert.match(engine, /completeDocking/);
  assert.match(engine, /desiredDockSpeed/);
  assert.match(engine, /drawDockingAssist/);
  assert.match(engine, /deployNet/);
  assert.match(engine, /updateFishing/);
  assert.match(engine, /NET_CAST_SECONDS = 2\.15/);
  assert.match(engine, /fishCargo \+= catchSize/);
  assert.match(engine, /V4_TRADE_PRICES = \{ cargo: 6, valuables: 14, fish: 4 \}/);
  assert.match(engine, /MARINE_LIFE_ROWS/);
  assert.match(engine, /drawMarineLife/);
  assert.match(engine, /HARBOR_LIFE_ROWS/);
  assert.match(engine, /drawHarborLife/);
  assert.match(engine, /drawHarborLifeSprite/);

  assert.match(engine, /findBroadsideTarget/);
  assert.match(engine, /fireBroadside/);
  assert.match(engine, /drawBroadsideRange/);
  assert.match(engine, /drawCannonShots/);
  assert.match(engine, /drawCombatEffects/);
  assert.match(engine, /DIRECTIONAL_SHIP_VIEWS/);
  assert.match(engine, /rotate\(angleDelta\(view\.sourceHeading, normalized\)\)/);
  assert.match(engine, /V4_RUN_SAVE_VERSION = 1/);
  assert.match(engine, /parseV4RunSave/);
  assert.match(engine, /velocityX: this\.velocityX/);
  assert.match(engine, /angularVelocity: this\.angularVelocity/);
  assert.match(engine, /fishCargo: this\.fishCargo/);

  for (const assetName of assetNames.slice(0, -1)) assert.match(`${engine}\n${component}\n${serviceWorker}`, new RegExp(assetName.replaceAll(".", "\\.")));
  assert.match(component, /VOYAGE_SAVE_KEY = "endless-wake:voyage-save:v4"/);
  assert.match(component, /AUTOSAVE_INTERVAL_MS = 10_000/);
  assert.match(component, /deployNet/);
  assert.match(component, /Pilot docking/);
  assert.match(component, /v4-helm-controls/);
  assert.match(component, /v4-action-controls/);
  assert.match(component, /Steer left, keyboard A/);
  assert.match(component, /Hold to boost, keyboard Space/);
  assert.match(component, /snapshot\.fishCargo/);
  assert.match(component, /localStorage/);
  assert.doesNotMatch(component, /document\.cookie/);
  assert.match(component, /serviceWorker/);
  assert.doesNotMatch(`${engine}\n${component}`, /from ["'](?:three|pixi|phaser)|eval\(|innerHTML/i);
  assert.equal(packageJson.dependencies.three, undefined);
  assert.equal(packageJson.dependencies.pixijs, undefined);
  assert.equal(packageJson.dependencies.phaser, undefined);

  for (const asset of assets) assert.ok(asset.byteLength > 40_000 && asset.byteLength < 3_500_000);
  assert.match(serviceWorker, /endless-wake.*v4-.*8/s);
  assert.match(serviceWorker, /v4-player-ship-directional-furled-v1\.png/);
  assert.match(serviceWorker, /v4-harbor-life-v1\.png/);
  assert.match(serviceWorker, /v4-underwater-life-v1\.png/);

});

test("checks V4 entrypoints and production configuration", async () => {
  const [rootLayout, rootPage, v4Page, worker, vite, packageJsonText, tsconfigText] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/v4/page.tsx", root), "utf8"),
    readFile(new URL("worker/index.ts", root), "utf8"),
    readFile(new URL("vite.config.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("tsconfig.json", root), "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonText);
  const tsconfig = JSON.parse(tsconfigText);
  const publicProduct = `${rootLayout}\n${rootPage}\n${v4Page}`;

  assert.match(rootPage, /VoyageV4Game/);
  assert.match(v4Page, /VoyageV4Game/);
  assert.doesNotMatch(publicProduct, /V3|v3|Azure Tides/);
  assert.doesNotMatch(worker, /handleImageOptimization|DEFAULT_DEVICE_SIZES|\bIMAGES\b/);
  assert.match(vite, /vinext\(\)/);
  assert.equal(tsconfig.compilerOptions.noUnusedLocals, true);
  assert.equal(tsconfig.compilerOptions.noUnusedParameters, true);
  assert.match(packageJson.scripts.build, /vinext build/);
  assert.match(packageJson.scripts.test, /tsc --noEmit/);
});

test("validates V4 local voyage saves before they enter the engine", async () => {
  const source = await readFile(new URL("app/v4/engine-v4.ts", root), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const engineModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  const validSave = {
    version: 1,
    savedAt: 1_700_000_000_000,
    phase: "playing",
    playerX: 12,
    playerY: -76,
    heading: 0.4,
    velocityX: 2.1,
    velocityY: -4.3,
    angularVelocity: 0.12,
    speed: 4.8,
    sailBlend: 0.82,
    targetSail: 1,
    distance: 82.5,
    bonusScore: 150,
    lives: 3,
    boostEnergy: 64,
    cargo: 2,
    valuables: 1,
    fishCargo: 4,
    coins: 9,
    ammo: 15,
    gunLevel: 1,
    sunkEnemies: 1,
    escortTime: 12,
    fairWindTime: 8,
    gunFocusTime: 6,
    netCooldown: 2.2,
    dockedHarbor: "none",
    cannonCooldown: 0.5,
    cannonSerial: 4,
    activeEvent: "rival",
    eventIndex: 1,
    eventTimer: 2,
    eventDuration: 18,
    eventFound: 0,
    eventTarget: 0,
    eventVariant: 0,
    eventWave: 0,
    eventSpawnSerial: 101,
    eventAnchorX: 0,
    eventAnchorY: 0,
    nextEventDistance: 72,
    collectedIds: ["synthetic:chunk:crate:2"],
    salvageDrops: [],
    eventObjects: [{
      id: "synthetic:event:1:0",
      kind: "rival",
      x: 14,
      y: -82,
      radius: 1.3,
      scale: 1,
      rotation: 0.2,
      seed: 42,
      active: true,
      eventObject: true,
      health: 4,
      maxHealth: 4,
    }],
  };

  assert.deepEqual(engineModule.parseV4RunSave(JSON.parse(JSON.stringify(validSave))), validSave);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, version: 2 }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, velocityX: 101 }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, angularVelocity: -11 }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, fishCargo: -1 }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, ammo: 31 }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, phase: "docked", dockedHarbor: "none" }), null);
  assert.equal(engineModule.parseV4RunSave({ ...validSave, collectedIds: Array(4_097).fill("synthetic") }), null);
  assert.equal(engineModule.parseV4RunSave({
    ...validSave,
    eventObjects: [{ ...validSave.eventObjects[0], kind: "harborTrade" }],
  }), null);
});
