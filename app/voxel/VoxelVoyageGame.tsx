"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sitePath } from "../site-path";
import {
  VoxelVoyageEngine,
  type VoxelControl,
  type VoxelSnapshot,
} from "./voxel-engine";
import {
  EQUIPMENT_CATALOG,
  getEquipment,
  SHIP_HULLS,
} from "./voxel-loadout";
import { WORLD_SEED, WORLD_SIZE } from "./voxel-world";

const INITIAL_SNAPSHOT: VoxelSnapshot = {
  phase: "intro",
  fps: 60,
  renderScale: 100,
  speed: 0,
  heading: 0,
  sail: 62,
  hull: 100,
  depth: 17,
  volcanoPhase: "Magma pressure rising",
  lavaHeat: 42,
  lavaCoverage: 0,
  eruptionActive: false,
  triangles: 0,
  chunks: 0,
  residentTriangles: 0,
  residentChunks: 0,
  worldSize: WORLD_SIZE,
  worldSeed: WORLD_SEED,
  worldReady: false,
  positionX: 0, positionZ: 18,
  regionName: "Tidehaven Isles", difficulty: 1, visitedRegions: 1,
  harborName: "Tidehaven", harborBearing: 40,
  streamingPending: 169, streamedChunks: 0, evictedChunks: 0, streamCpuMs: 0,
  activeLife: 0, weather: "Gentle swell", chart: [],
  graphicsBackend: "WebGL 2",
  terrainFormat: "8-byte faces / GPU expansion",
  terrainBatches: 1,
  terrainDrawCalls: 0,
  terrainBufferBytes: 0,
  terrainResidencyLimit: 169,
  renderCpuMs: 0,
  gpuDrawMs: null,
  terrainBuildCount: 0,
  terrainUploadCount: 0,
  terrainSkippedCount: 0,
  shipHull: "windcutter",
  shipHullName: "Windcutter",
  weaponSlots: 2,
  loadout: ["swivel_8"],
  readyWeapons: 1,
  weaponCooldown: 0,
  targetsRemaining: 3,
  cargo: 0,
  fish: 0,
  coins: 4,
  windHeading: 52,
  windStrength: 3.9,
  harborDistance: 26,
  netProgress: 0,
  actionLabel: "Observe",
  actionAvailable: false,
  objective: "Salvage crates from the wreck or lower sails near fish to cast a net.",
  docking: false,
  notice: "The sea awaits your first voyage.",
};

const KEY_CONTROLS: Record<string, VoxelControl> = {
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
  w: "sail",
  arrowup: "sail",
  s: "reef",
  arrowdown: "reef",
};

function formatHeading(heading: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(heading / 45) % directions.length] + " · " + String(heading).padStart(3, "0") + "°";
}

function formatTriangles(value: number) {
  if (value < 1000) return String(value);
  return (value / 1000).toFixed(1) + "K";
}

function formatBytes(value: number) {
  if (value < 1024) return value + " B";
  return (value / (1024 * 1024)).toFixed(2) + " MiB";
}

export function VoxelVoyageGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VoxelVoyageEngine | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [error, setError] = useState<string | null>(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [chartVisible, setChartVisible] = useState(false);
  const [worldSeed, setWorldSeed] = useState(WORLD_SEED);
  const [seedDraft, setSeedDraft] = useState(String(WORLD_SEED));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(null);
    try {
      const engine = new VoxelVoyageEngine(canvas, {
        seed: worldSeed,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        onSnapshot: setSnapshot,
        onError: setError,
      });
      engineRef.current = engine;
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start the 3D scene");
    }
  }, [worldSeed]);

  const setControl = useCallback((control: VoxelControl, pressed: boolean) => {
    engineRef.current?.setControl(control, pressed);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat && (event.key === "Enter" || event.key.toLowerCase() === "p")) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT") return;
      const key = event.key.toLowerCase();
      if (key === "+" || key === "=" || key === "-" || key === "_") {
        event.preventDefault();
        engineRef.current?.zoomView(key === "+" || key === "=");
        return;
      }
      const control = KEY_CONTROLS[key];
      if (control) {
        event.preventDefault();
        setControl(control, true);
        return;
      }
      if (key === "f" || key === "e") {
        event.preventDefault();
        engineRef.current?.interact();
        return;
      }
      if (key === "h") {
        event.preventDefault();
        setHudVisible((visible) => !visible);
        return;
      }
      if (key === "m") {
        event.preventDefault();
        setChartVisible((visible) => !visible);
        return;
      }
      if (key === "v") {
        event.preventDefault();
        engineRef.current?.triggerEruption();
        return;
      }
      if (key === "q") {
        event.preventDefault();
        engineRef.current?.fireWeapons();
        return;
      }
      if (event.key === "Enter" && snapshot.phase === "intro") {
        event.preventDefault();
        engineRef.current?.begin();
      } else if (key === "p" || event.key === "Escape") {
        event.preventDefault();
        if (snapshot.phase === "paused") engineRef.current?.resume();
        else if (snapshot.phase === "sailing") engineRef.current?.pause();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const control = KEY_CONTROLS[event.key.toLowerCase()];
      if (control) setControl(control, false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setControl, snapshot.phase]);

  const stopSteering = useCallback(() => {
    dragStartRef.current = null;
    setControl("left", false);
    setControl("right", false);
  }, [setControl]);

  const mountedWeapons = snapshot.loadout.filter((id) => getEquipment(id).category === "weapon");
  const currentHullIndex = SHIP_HULLS.findIndex((hull) => hull.id === snapshot.shipHull);

  return (
    <main className="voxel-shell">
      <canvas
        ref={canvasRef}
        className="voxel-canvas"
        aria-label="Voxel archipelago: sail, equip your ship, and explore the sea, volcanoes, and harbors"
        tabIndex={0}
        onPointerDown={(event) => {
          dragStartRef.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStartRef.current === null) return;
          const delta = event.clientX - dragStartRef.current;
          setControl("left", delta < -14);
          setControl("right", delta > 14);
        }}
        onPointerUp={stopSteering}
        onPointerCancel={stopSteering}
      />

      <div className="voxel-sky-glow" aria-hidden="true" />
      <div className="voxel-scanlines" aria-hidden="true" />

      <header className="voxel-topbar">
        <a className="voxel-brand" href={sitePath("/v5")} aria-label="Endless Wake V5 home">
          <span className="voxel-brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>
            <strong>Endless Wake</strong>
            <small>LIVING TIDES · VOXEL</small>
          </span>
        </a>
        <nav className="voxel-top-actions" aria-label="Version navigation">
          <span className="voxel-build-tag"><i />V5 · Archipelago</span>
          <button type="button" className="voxel-chart-toggle" onClick={() => setChartVisible((visible) => !visible)} aria-pressed={chartVisible}>Chart · M</button>
          <button type="button" onClick={() => setHudVisible((visible) => !visible)} aria-pressed={!hudVisible}>
            {hudVisible ? "Hide HUD · H" : "Show HUD · H"}
          </button>
          <a href={sitePath("/v4")}>Play V4</a>
        </nav>
      </header>

      <div className="voxel-view-controls" role="group" aria-label="Camera zoom">
        <button type="button" aria-label="Zoom in, keyboard plus" title="Zoom in · +" onClick={() => engineRef.current?.zoomView(true)}>＋</button>
        <button type="button" aria-label="Zoom out, keyboard minus" title="Zoom out · −" onClick={() => engineRef.current?.zoomView(false)}>−</button>
      </div>

      {hudVisible && <section className="voxel-flight-hud" aria-label="Sailing instruments">
        <div className="voxel-heading-readout">
          <span>Heading</span>
          <strong>{formatHeading(snapshot.heading)}</strong>
        </div>
        <div className="voxel-dial-row">
          <article>
            <span>Speed</span>
            <strong>{snapshot.speed.toFixed(1)}</strong>
            <small>kn</small>
          </article>
          <article>
            <span>Sail</span>
            <strong>{snapshot.sail}</strong>
            <small>%</small>
          </article>
          <article className={snapshot.hull < 45 ? "is-warning" : ""}>
            <span>Hull</span>
            <strong>{snapshot.hull}</strong>
            <small>%</small>
          </article>
        </div>
        <div className="voxel-depth-bar">
          <span>Depth below keel</span>
          <b>{snapshot.depth.toFixed(1)} m</b>
          <i style={{ width: Math.min(100, snapshot.depth * 4) + "%" }} />
        </div>
        <div className="voxel-voyage-resources" aria-label="Supplies">
          <span><small>Cargo</small><b>{snapshot.cargo}</b></span>
          <span><small>Fish</small><b>{snapshot.fish}</b></span>
          <span><small>Coins</small><b>{snapshot.coins}</b></span>
        </div>
        <div className="voxel-wind-readout">
          <span>Wind {formatHeading(snapshot.windHeading)}</span>
          <b>{snapshot.windStrength.toFixed(1)}</b>
        </div>
      </section>}

      {hudVisible && <aside className="voxel-lab-panel" aria-label="Voyage and ship status">
        <div className="voxel-panel-heading">
          <span>Voyage log</span>
          <b>{snapshot.harborDistance.toFixed(1)} nm</b>
        </div>
        <h2>{snapshot.docking ? `${snapshot.harborName} docking` : snapshot.regionName}</h2>
        <p className="voxel-objective">{snapshot.objective}</p>
        <div className="voxel-waypoint">
          <span><i />{formatHeading(snapshot.harborBearing)}</span>
          <b>{snapshot.harborName} · Supplies / shipyard</b>
        </div>
        <p className="voxel-region-status">Sea state {snapshot.difficulty} / 5 · {snapshot.weather} · Visited {snapshot.visitedRegions} regions</p>

        <section className="voxel-armament-readout" aria-label="Hull and deck equipment">
          <div><span>Current hull</span><b>{snapshot.shipHullName}</b></div>
          <div><span>Deck slots</span><b>{snapshot.loadout.length} / {snapshot.weaponSlots}</b></div>
          <p>{snapshot.loadout.map((id) => getEquipment(id).shortName).join(" · ") || "No equipment installed"}</p>
          <small>Red-sail targets: {snapshot.targetsRemaining} · {snapshot.readyWeapons} weapons ready</small>
        </section>

        <div className={`voxel-volcano-heading ${snapshot.eruptionActive ? "is-erupting" : ""}`}>
          <span>Volcano watch · {snapshot.volcanoPhase}</span>
          <b>{snapshot.lavaHeat}% heat</b>
        </div>
        <div className="voxel-volcano-meter" aria-label={`Lava heat: ${snapshot.lavaHeat}%`}>
          <i style={{ width: snapshot.lavaHeat + "%" }} />
          <span>Cooled rock coverage {snapshot.lavaCoverage}%</span>
        </div>
        <p className="voxel-volcano-copy">Lava raises the eruption channels and cools from orange to black basalt.</p>
        <div className="voxel-volcano-actions">
          <button
            type="button"
            disabled={snapshot.eruptionActive || snapshot.volcanoPhase === "No active volcano nearby"}
            onClick={() => engineRef.current?.triggerEruption()}
          >
            {snapshot.eruptionActive ? "Eruption in progress" : "Trigger eruption · V"}
          </button>
        </div>
        <details className="voxel-telemetry-details">
          <summary>Rendering and physics</summary>
          <dl className="voxel-telemetry">
            <div><dt>Visible chunks</dt><dd>{snapshot.chunks} / {snapshot.residentChunks}</dd></div>
            <div><dt>Resident chunks</dt><dd>{snapshot.residentChunks} / limit {snapshot.terrainResidencyLimit}</dd></div>
            <div><dt>Visible triangles</dt><dd>{formatTriangles(snapshot.triangles)}</dd></div>
            <div><dt>Resident triangles</dt><dd>{formatTriangles(snapshot.residentTriangles)}</dd></div>
            <div><dt>Terrain batches</dt><dd>{snapshot.terrainBatches} batches / {snapshot.terrainDrawCalls} draws</dd></div>
            <div><dt>Terrain format</dt><dd>{snapshot.terrainFormat}</dd></div>
            <div><dt>Terrain data</dt><dd>{formatBytes(snapshot.terrainBufferBytes)}</dd></div>
            <div><dt>Build / upload / skip</dt><dd>{snapshot.terrainBuildCount} / {snapshot.terrainUploadCount} / {snapshot.terrainSkippedCount}</dd></div>
            <div><dt>World size</dt><dd>{snapshot.worldSize} units</dd></div>
            <div><dt>Load / evict / pending</dt><dd>{snapshot.streamedChunks} / {snapshot.evictedChunks} / {snapshot.streamingPending}</dd></div>
            <div><dt>CPU streaming</dt><dd>{snapshot.streamCpuMs.toFixed(2)} ms</dd></div>
            <div><dt>Nearby wildlife</dt><dd>{snapshot.activeLife} groups</dd></div>
            <div><dt>Buoyancy samples</dt><dd>6 points</dd></div>
            <div><dt>Graphics backend</dt><dd>{snapshot.graphicsBackend}</dd></div>
            <div><dt>Frame rate</dt><dd>{snapshot.fps} FPS</dd></div>
            <div><dt>CPU rendering</dt><dd>{snapshot.renderCpuMs.toFixed(2)} ms</dd></div>
            <div><dt>GPU rendering</dt><dd>{snapshot.gpuDrawMs === null ? "Sampling" : snapshot.gpuDrawMs.toFixed(2) + " ms"}</dd></div>
            <div><dt>Render scale</dt><dd>{snapshot.renderScale}%</dd></div>
          </dl>
        </details>
        <button className="voxel-reset-button" type="button" onClick={() => engineRef.current?.resetWorld()}>
          Restart voyage
        </button>
      </aside>}

      {chartVisible && <section className="voxel-chart" aria-label="Archipelago chart">
        <header><div><b>Archipelago chart</b><span>{snapshot.regionName} · Sea state {snapshot.difficulty}</span></div><button type="button" onClick={() => setChartVisible(false)} aria-label="Close chart">×</button></header>
        <svg viewBox="-170 -170 340 340" role="img" aria-label="Nearby islands, supply harbors, and wrecks centered on the ship">
          <defs><pattern id="voxel-chart-grid" width="39" height="39" patternUnits="userSpaceOnUse"><path d="M 39 0 L 0 0 0 39" fill="none" stroke="currentColor" strokeWidth="0.5" /></pattern></defs>
          <rect x="-170" y="-170" width="340" height="340" fill="url(#voxel-chart-grid)" opacity="0.22" />
          <circle r="66" fill="none" stroke="currentColor" strokeDasharray="3 5" opacity="0.3" />
          {snapshot.chart.map((point, index) => {
            const x = point.x - snapshot.positionX, z = point.z - snapshot.positionZ;
            if (Math.abs(x) > 163 || Math.abs(z) > 163) return null;
            return <g key={index} transform={`translate(${x} ${z})`} className={`chart-${point.kind}`}>
              <title>{point.label}</title>
              {point.kind === "harbor" ? <><rect x="-3" y="-3" width="6" height="6" /><text x="6" y="3">{point.label}</text></>
                : point.kind === "wreck" ? <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  : <circle r={point.kind === "volcano" ? 12 : point.kind === "port" ? 6 : 10} />}
            </g>;
          })}
          <path d="M 0 -6 L 4 5 L 0 3 L -4 5 Z" fill="#fff2cf" stroke="#092c3d" strokeWidth="1" transform={`rotate(${snapshot.heading})`} />
          <text x="0" y="-153" textAnchor="middle" fill="#fff2cf">N</text>
        </svg>
        <p><span>● Islands</span><span>■ Harbor</span><span>× Wreck</span><span className="chart-volcano">● Volcano</span></p>
        <footer>Position {snapshot.positionX}, {snapshot.positionZ} · World seed {snapshot.worldSeed}<small>Changes last for this page session; revisiting an area does not reset cargo or combat.</small></footer>
      </section>}

      {hudVisible && <div className="voxel-notice" role="status" aria-live="polite">
        <i aria-hidden="true" />
        <span>{snapshot.notice}</span>
      </div>}

      {hudVisible && snapshot.phase === "sailing" && (
        <button
          className="voxel-fire-control"
          type="button"
          disabled={mountedWeapons.length === 0 || snapshot.readyWeapons === 0}
          onClick={() => engineRef.current?.fireWeapons()}
          aria-label="Fire deck weapons, keyboard Q"
        >
          <span>{snapshot.readyWeapons > 0 ? `Fire ×${snapshot.readyWeapons}` : "Reloading"}</span>
          <small>{snapshot.readyWeapons > 0 ? "Q" : `${snapshot.weaponCooldown.toFixed(1)}s`}</small>
        </button>
      )}

      {hudVisible && snapshot.phase !== "docked" && <section className="voxel-controls" aria-label="Sailing controls">
        <button
          type="button"
          aria-label="Steer left, A or left arrow"
          onPointerDown={() => setControl("left", true)}
          onPointerUp={() => setControl("left", false)}
          onPointerCancel={() => setControl("left", false)}
          onPointerLeave={() => setControl("left", false)}
        >
          <span>↙</span><small>A</small>
        </button>
        <button
          type="button"
          aria-label="Lower sails, S or down arrow"
          onPointerDown={() => setControl("reef", true)}
          onPointerUp={() => setControl("reef", false)}
          onPointerCancel={() => setControl("reef", false)}
          onPointerLeave={() => setControl("reef", false)}
        >
          <span>Lower</span><small>S</small>
        </button>
        <button
          className="voxel-sail-control"
          type="button"
          aria-label="Raise sails, W or up arrow"
          onPointerDown={() => setControl("sail", true)}
          onPointerUp={() => setControl("sail", false)}
          onPointerCancel={() => setControl("sail", false)}
          onPointerLeave={() => setControl("sail", false)}
        >
          <span>Raise</span><small>W</small>
        </button>
        <button
          type="button"
          aria-label="Steer right, D or right arrow"
          onPointerDown={() => setControl("right", true)}
          onPointerUp={() => setControl("right", false)}
          onPointerCancel={() => setControl("right", false)}
          onPointerLeave={() => setControl("right", false)}
        >
          <span>↘</span><small>D</small>
        </button>
        <button
          className="voxel-action-control"
          type="button"
          disabled={!snapshot.actionAvailable}
          aria-label={`${snapshot.actionLabel}, keyboard F or E`}
          onClick={() => engineRef.current?.interact()}
        >
          <span>{snapshot.actionLabel}</span><small>F / E</small>
        </button>
      </section>}

      {snapshot.phase === "intro" && (
        <section className="voxel-intro" aria-labelledby="voxel-intro-title">
          <div className="voxel-intro-card">
            <span className="voxel-eyebrow">V5 · ENDLESS WAKE: LIVING TIDES</span>
            <h1 id="voxel-intro-title">Living Tides</h1>
            <p className="voxel-intro-lead">Set sail from Tidehaven through atolls, rainforests, and volcanic islands. Upgrade your ship, follow the fish, and explore new archipelagos.</p>
            <div className="voxel-principles">
              <article><b>Archipelago chart</b><span>Press M to find harbors, islands, and wrecks</span></article>
              <article><b>Open-water sailing</b><span>Wind, currents, drift, inertia, and buoyancy shape the voyage</span></article>
              <article><b>Shipyard</b><span>Upgrade your hull and equip deck slots</span></article>
              <article><b>Volcanic activity</b><span>Lava reshapes channels and cools into dark rock</span></article>
            </div>
            <div className="voxel-seed-control">
              <label htmlFor="voxel-world-seed">World seed</label>
              <input id="voxel-world-seed" inputMode="numeric" value={seedDraft} maxLength={10} onChange={(event) => setSeedDraft(event.target.value.replace(/\D/g, ""))} />
              <button type="button" disabled={!seedDraft || Number(seedDraft) > 0xffffffff || Number(seedDraft) === worldSeed} onClick={() => setWorldSeed(Number(seedDraft))}>Generate world</button>
            </div>
            <button type="button" onClick={() => engineRef.current?.begin()} disabled={Boolean(error) || !snapshot.worldReady}>
              {error ? "3D scene unavailable" : snapshot.worldReady ? "Set sail" : "Preparing the sea…"}
            </button>
            <small>W/S sails · A/D steer · Q fire · F/E interact · M chart · V eruption · H HUD · P/Esc pause. The voyage lasts for this page session.</small>
            <a href={sitePath("/v4")}>Play V4</a>
          </div>
        </section>
      )}

      {snapshot.phase === "paused" && (
        <section className="voxel-pause" aria-label="Voyage paused">
          <div>
            <span>Voyage paused</span>
            <h2>The sea awaits</h2>
            <button type="button" onClick={() => engineRef.current?.resume()}>Resume voyage</button>
          </div>
        </section>
      )}

      {snapshot.phase === "docked" && (
        <section className="voxel-dock" aria-labelledby="voxel-dock-title">
          <div className="voxel-dock-card">
            <span>{snapshot.harborName} · East berth</span>
            <h2 id="voxel-dock-title">Harbor and shipyard</h2>
            <p>Larger hulls have more deck slots. Each weapon or fishing device occupies a slot and appears on deck.</p>
            <dl>
              <div><dt>Cargo</dt><dd>{snapshot.cargo} × 6</dd></div>
              <div><dt>Fish</dt><dd>{snapshot.fish} × 4</dd></div>
              <div><dt>Coins</dt><dd>{snapshot.coins}</dd></div>
              <div><dt>Hull</dt><dd>{snapshot.hull}%</dd></div>
              <div><dt>Hull</dt><dd>{snapshot.shipHullName}</dd></div>
              <div><dt>slots</dt><dd>{snapshot.loadout.length} / {snapshot.weaponSlots}</dd></div>
            </dl>
            <div className="voxel-dock-actions voxel-dock-ledger-actions">
              <button
                type="button"
                disabled={snapshot.cargo + snapshot.fish === 0}
                onClick={() => engineRef.current?.sellCargo()}
              >
                Sell all cargo
              </button>
              <button
                type="button"
                disabled={snapshot.hull >= 100 || snapshot.coins < 8}
                onClick={() => engineRef.current?.repairHull()}
              >
                Repair hull · 8 coins
              </button>
            </div>

            <section className="voxel-shipyard" aria-labelledby="voxel-hulls-title">
              <div className="voxel-shipyard-heading">
                <h3 id="voxel-hulls-title">Hulls</h3>
                <span>Larger hulls have more slots and different handling</span>
              </div>
              <div className="voxel-shipyard-grid voxel-hull-grid">
                {SHIP_HULLS.map((hull, index) => {
                  const current = hull.id === snapshot.shipHull;
                  const unavailable = index < currentHullIndex || snapshot.coins < hull.price;
                  return <article key={hull.id} className={current ? "is-equipped" : ""}>
                    <header><b>{hull.name}</b><span>{hull.slots} slots</span></header>
                    <p>{hull.description}</p>
                    <small>Sail power {Math.round(hull.sailPower * 100)} · Steering {Math.round(hull.turning * 100)}</small>
                    <button
                      type="button"
                      disabled={current || unavailable}
                      onClick={() => engineRef.current?.buyShipHull(hull.id)}
                    >
                      {current ? "Current hull" : index < currentHullIndex ? "Already surpassed" : `${hull.price} coins to upgrade`}
                    </button>
                  </article>;
                })}
              </div>
            </section>

            <section className="voxel-shipyard" aria-labelledby="voxel-equipment-title">
              <div className="voxel-shipyard-heading">
                <h3 id="voxel-equipment-title">Deck equipment</h3>
                <span>Buy multiple items to fill your deck slots</span>
              </div>
              <div className="voxel-shipyard-grid voxel-equipment-grid">
                {EQUIPMENT_CATALOG.map((equipment) => <article key={equipment.id}>
                  <header><b>{equipment.name}</b><span>{equipment.category === "weapon" ? `${equipment.range} range` : "Fishing upgrade"}</span></header>
                  <p>{equipment.description}</p>
                  <button
                    type="button"
                    disabled={snapshot.loadout.length >= snapshot.weaponSlots || snapshot.coins < equipment.price}
                    onClick={() => engineRef.current?.buyEquipment(equipment.id)}
                  >
                    {equipment.price} coins to install
                  </button>
                </article>)}
              </div>
            </section>

            <section className="voxel-mounted-list" aria-label="Installed deck equipment">
              <h3>Equipped slots</h3>
              <div>
                {snapshot.loadout.map((id, slot) => {
                  const equipment = getEquipment(id);
                  return <button type="button" key={`${id}-${slot}`} onClick={() => engineRef.current?.sellEquipment(slot)}>
                    <span>{slot + 1}. {equipment.shortName}</span>
                    <small>Sell +{Math.floor(equipment.price / 2)}</small>
                  </button>;
                })}
                {Array.from({ length: snapshot.weaponSlots - snapshot.loadout.length }, (_, index) => (
                  <span className="is-empty" key={`empty-${index}`}>Empty slot</span>
                ))}
              </div>
            </section>

            <button className="voxel-depart-button voxel-dock-depart" type="button" onClick={() => engineRef.current?.departHarbor()}>
              Keep equipment and depart
            </button>
          </div>
        </section>
      )}

      {error && snapshot.phase !== "intro" && (
        <div className="voxel-error" role="alert">{error}</div>
      )}
    </main>
  );
}
