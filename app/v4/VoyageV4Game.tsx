"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sitePath } from "../site-path";
import {
  parseV4RunSave,
  V4_REWARD_RULES,
  V4_TRADE_PRICES,
  VoyageV4Engine,
  type V4EngineOptions,
  type V4HarborService,
  type V4Notice,
  type V4RunSave,
  type V4Snapshot,
  type V4Sound,
  type V4VoyageEvent,
} from "./engine-v4";

const INITIAL_SNAPSHOT: V4Snapshot = {
  phase: "intro",
  distance: 0,
  score: 0,
  lives: 3,
  boost: 76,
  speed: 0,
  cargo: 0,
  valuables: 0,
  fishCargo: 0,
  coins: 0,
  ammo: 18,
  ammoCapacity: 30,
  gunLevel: 1,
  repairCost: 8,
  ammoPackCost: 8,
  gunUpgradeCost: 24,
  sunkEnemies: 0,
  sailsRaised: true,
  sailPercent: 100,
  windHeading: 41,
  windStrength: 100,
  drift: 0,
  autoDocking: false,
  nearbyFish: false,
  canFish: false,
  netCooldown: 0,
  fishingProgress: 0,
  escort: 0,
  fairWind: 0,
  gunFocus: 0,
  heading: 0,
  worldX: 0,
  worldY: 0,
  activeEvent: "none",
  eventProgress: 0,
  eventFound: 0,
  eventTarget: 0,
  notice: "none",
  nearbyHarbor: "none",
  dockedHarbor: "none",
  harborDistance: -1,
  canDock: false,
  renderScale: 100,
};

type Preferences = V4EngineOptions & { sound: boolean };

const DEFAULT_PREFERENCES: Preferences = {
  sound: true,
  reducedSpeed: false,
  highVisibility: false,
  reducedMotion: false,
};

const BEST_SCORE_KEY = "endless-wake:best-score:v4";
const SETTINGS_KEY = "endless-wake:settings:v4";
const VOYAGE_SAVE_KEY = "endless-wake:voyage-save:v4";
const AUTOSAVE_INTERVAL_MS = 10_000;
const MAX_VOYAGE_SAVE_CHARS = 800_000;

const EVENT_COPY: Record<Exclude<V4VoyageEvent, "none">, { eyebrow: string; title: string; symbol: string; detail: string; reward: string }> = {
  treasure: { eyebrow: "Wreckage", title: "Lost cargo surfaces", symbol: "✦", detail: "Sail into the wreckage and salvage the crates before time runs out.", reward: `Collect the crates; recover them all for ${V4_REWARD_RULES.treasure.completionValuables} bonus valuables.` },
  rival: { eyebrow: "Black sails", title: "A hunter approaches", symbol: "◈", detail: "Bring the enemy alongside; your broadside fires automatically.", reward: `${V4_REWARD_RULES.rival.sinkCoins} coins and a loot crate per ship; escaping also earns a reward.` },
  maelstrom: { eyebrow: "Maelstrom", title: "Whirlpools change the currents", symbol: "◎", detail: "Watch the foam and adjust course between the whirlpools.", reward: `${V4_REWARD_RULES.maelstrom.completionValuables} valuables and ${V4_REWARD_RULES.maelstrom.fairWindSeconds}s of fair wind.` },
  leviathan: { eyebrow: "Deep water", title: "A leviathan breaks the surface", symbol: "♆", detail: "Turn broadside and use automatic cannon fire to repel the pursuing creature.", reward: "Defeat it for coins, valuables, and a loot crate; escape with a sample." },
  beacons: { eyebrow: "Beacon route", title: "Lights appear through the mist", symbol: "⌁", detail: "Reach each beacon along the winding route and avoid floating rafts.", reward: `${V4_REWARD_RULES.beacons.coinPerBeacon} coins per beacon; light them all for cargo and ${V4_REWARD_RULES.beacons.fairWindSeconds}s of fair wind.` },
  relics: { eyebrow: "Tidal astrolabe", title: "An ancient astrolabe surfaces", symbol: "✧", detail: "Collect four relics along the current without being caught by the whirlpool.", reward: `${V4_REWARD_RULES.relics.coinPerRelic} coins per relic; restore the astrolabe for ${V4_REWARD_RULES.relics.completionValuables} valuables and improved gunnery.` },
  flotilla: { eyebrow: "Lost flotilla", title: "Three skiffs await rescue", symbol: "⚑", detail: "Reach each skiff while avoiding rafts and wreckage.", reward: `${V4_REWARD_RULES.flotilla.coinPerSkiff} coins and an escort per skiff; gather all three for ${V4_REWARD_RULES.flotilla.completionCargo} cargo crates.` },
  volcano: { eyebrow: "Volcanic rain", title: "Lava falls over the sea", symbol: "◆", detail: "Keep moving around falling rocks until the eruption subsides.", reward: `${V4_REWARD_RULES.volcano.completionValuables} valuables and up to ${V4_REWARD_RULES.volcano.ammo} cannonballs.` },
};

const NOTICE_COPY: Record<Exclude<V4Notice, "none">, string> = {
  rescue: `Rescue complete · +${V4_REWARD_RULES.rescue.coins} coins and an escort`,
  shield: "Your escort blocked the hazard.",
  treasure: `Cargo recovered · All crates and ${V4_REWARD_RULES.treasure.completionValuables} valuables secured`,
  escape: `Escaped · +${V4_REWARD_RULES.rival.escapeCoins} coins and ${V4_REWARD_RULES.rival.escapeFairWindSeconds}s of fair wind`,
  weathered: `Maelstrom crossed · +${V4_REWARD_RULES.maelstrom.completionValuables} valuables and ${V4_REWARD_RULES.maelstrom.fairWindSeconds}s of fair wind`,
  deepEscape: `Deep-sea sample recovered · +${V4_REWARD_RULES.leviathan.escapeValuables} valuables and ${V4_REWARD_RULES.leviathan.escapeGunFocusSeconds}s of gunnery focus`,
  beaconClear: `All beacons lit · +${V4_REWARD_RULES.beacons.targetCount * V4_REWARD_RULES.beacons.coinPerBeacon} coins, ${V4_REWARD_RULES.beacons.completionCargo} cargo and ${V4_REWARD_RULES.beacons.fairWindSeconds}s of fair wind`,
  relicClear: `Astrolabe restored · +${V4_REWARD_RULES.relics.targetCount * V4_REWARD_RULES.relics.coinPerRelic} coins, ${V4_REWARD_RULES.relics.completionValuables} valuables and ${V4_REWARD_RULES.relics.gunFocusSeconds}s of gunnery focus`,
  flotillaClear: `Flotilla gathered · +${V4_REWARD_RULES.flotilla.targetCount * V4_REWARD_RULES.flotilla.coinPerSkiff} coins, ${V4_REWARD_RULES.flotilla.completionCargo} cargo and ${V4_REWARD_RULES.flotilla.escortMaxSeconds}s of escort`,
  volcanoClear: `Volcanic crystals secured · +${V4_REWARD_RULES.volcano.completionValuables} valuables and up to ${V4_REWARD_RULES.volcano.ammo} cannonballs`,
  eventPassed: "The event has ended · Keep your gains and sail on.",
  cargoSold: "Cargo and valuables sold · Coins added to your hold.",
  hullRepaired: "Repairs complete · Hull restored by 1 point.",
  ammoBought: "Gunpowder and cannonballs loaded.",
  gunsUpgraded: "Cannons upgraded · Range, volley size, and ammo capacity increased.",
  enemySunk: "Target sunk · Bounty awarded and a loot crate left afloat.",
  rivalClear: `Black sails cleared · +${V4_REWARD_RULES.rival.sinkCoins} coins per ship and floating loot`,
  leviathanClear: `Deep-sea threat defeated · +${V4_REWARD_RULES.leviathan.sinkCoins} coins, ${V4_REWARD_RULES.leviathan.sinkValuables} valuables, and a loot crate per creature`,
  fishCaught: "Net recovered · Fresh fish can be sold at a trading port.",
  netMissed: "No catch · Lower the sails, slow down, and approach a visible school of fish.",
};

const HARBOR_COPY: Record<Exclude<V4HarborService, "none">, {
  eyebrow: string;
  title: string;
  symbol: string;
  description: string;
  action: string;
}> = {
  trade: { eyebrow: "Harbor island · Trade", title: "Tidal Trading Port", symbol: "◇", description: `Sell all cargo for ${V4_TRADE_PRICES.cargo} coins per crate, ${V4_TRADE_PRICES.valuables} per valuable, and ${V4_TRADE_PRICES.fish} per fish.`, action: "Sell all cargo" },
  shipyard: { eyebrow: "Harbor island · Shipyard", title: "Blue Mast Shipyard", symbol: "⚒", description: "Repair one hull point. The cost rises with damage.", action: "Repair hull" },
  arsenal: { eyebrow: "Harbor island · Arsenal", title: "Red Reef Arsenal", symbol: "✹", description: "Buy up to 10 cannonballs when ammunition is low.", action: "Buy ammunition" },
  academy: { eyebrow: "Harbor island · Gunnery", title: "Astrolabe Academy", symbol: "✦", description: "Upgrade cannons to increase range, volley size, and ammunition capacity, up to level 3.", action: "Upgrade cannons" },
};

function readPreferences(): Preferences {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<Preferences>;
    return {
      sound: typeof parsed.sound === "boolean" ? parsed.sound : true,
      reducedSpeed: typeof parsed.reducedSpeed === "boolean" ? parsed.reducedSpeed : false,
      highVisibility: typeof parsed.highVisibility === "boolean" ? parsed.highVisibility : false,
      reducedMotion: typeof parsed.reducedMotion === "boolean"
        ? parsed.reducedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function readBestScore() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) || "0", 10);
    return Number.isFinite(value) && value >= 0 ? Math.min(value, 99_999_999) : 0;
  } catch {
    return 0;
  }
}

function readVoyageSave() {
  try {
    const serialized = window.localStorage.getItem(VOYAGE_SAVE_KEY);
    if (!serialized) return null;
    if (serialized.length > MAX_VOYAGE_SAVE_CHARS) {
      window.localStorage.removeItem(VOYAGE_SAVE_KEY);
      return null;
    }
    const save = parseV4RunSave(JSON.parse(serialized));
    if (!save) window.localStorage.removeItem(VOYAGE_SAVE_KEY);
    return save;
  } catch {
    return null;
  }
}

function removeVoyageSave() {
  try {
    window.localStorage.removeItem(VOYAGE_SAVE_KEY);
  } catch {
    // Storage may be unavailable; clearing it must not interrupt the game.
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatBearing(value: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const bearing = Math.round(value) % 360;
  return `${directions[Math.round(bearing / 45) % 8]} · ${String(bearing).padStart(3, "0")}°`;
}

function formatCoordinates(x: number, y: number) {
  const latitude = y <= 0 ? "N" : "S";
  const longitude = x >= 0 ? "E" : "W";
  return `${latitude}${Math.abs(y).toString().padStart(4, "0")} · ${longitude}${Math.abs(x).toString().padStart(4, "0")}`;
}

function formatSavedAt(savedAt: number) {
  return new Intl.DateTimeFormat("en", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(savedAt));
}

export function VoyageV4Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VoyageV4Engine | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const preferencesRef = useRef(DEFAULT_PREFERENCES);
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [bestScore, setBestScore] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [voyageSave, setVoyageSave] = useState<V4RunSave | null>(null);
  const [confirmNewRun, setConfirmNewRun] = useState(false);
  const [saveUnavailable, setSaveUnavailable] = useState(false);

  const persistVoyage = useCallback(() => {
    const save = engineRef.current?.createRunSave();
    if (!save) return false;
    const serialized = JSON.stringify(save);
    if (serialized.length > MAX_VOYAGE_SAVE_CHARS) {
      setSaveUnavailable(true);
      return false;
    }
    try {
      window.localStorage.setItem(VOYAGE_SAVE_KEY, serialized);
      setVoyageSave(save);
      setSaveUnavailable(false);
      return true;
    } catch {
      setSaveUnavailable(true);
      return false;
    }
  }, []);

  const playSound = useCallback((sound: V4Sound) => {
    if (!preferencesRef.current.sound) return;
    try {
      const context = audioRef.current || new AudioContext();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const tones: Record<V4Sound, [number, number, OscillatorType, number]> = {
        collect: [540, 880, "triangle", 0.2],
        boost: [270, 680, "sine", 0.22],
        rescue: [420, 1040, "triangle", 0.34],
        warning: [210, 128, "sawtooth", 0.42],
        hit: [145, 68, "sawtooth", 0.28],
        cannon: [118, 46, "square", 0.34],
        splash: [410, 94, "sine", 0.24],
        coin: [660, 1180, "triangle", 0.24],
        repair: [190, 510, "square", 0.34],
        gameover: [185, 72, "triangle", 0.62],
      };
      const [start, end, type, duration] = tones[sound];
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(end, now + duration * 0.82);
      gain.gain.setValueAtTime(sound === "hit" || sound === "cannon" ? 0.09 : 0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    } catch {
      // Browsers may block synthesized audio; gameplay never depends on it.
    }
  }, []);

  useEffect(() => {
    const stored = readPreferences();
    preferencesRef.current = stored;
    setPreferences(stored);
    setBestScore(readBestScore());
    setVoyageSave(readVoyageSave());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    try {
      const engine = new VoyageV4Engine(
        canvas,
        {
          reducedSpeed: preferencesRef.current.reducedSpeed,
          highVisibility: preferencesRef.current.highVisibility,
          reducedMotion: preferencesRef.current.reducedMotion,
        },
        setSnapshot,
        playSound,
      );
      engineRef.current = engine;
      void engine.loadAssets().then(() => {
        if (!cancelled) setAssetsReady(true);
      }).catch((error: unknown) => {
        if (!cancelled) setAssetError(error instanceof Error ? error.message : "Failed to load V4 artwork");
      });
      return () => {
        cancelled = true;
        engine.destroy();
        engineRef.current = null;
      };
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : "Unable to start V4");
    }
  }, [playSound]);

  useEffect(() => {
    preferencesRef.current = preferences;
    engineRef.current?.setOptions({
      reducedSpeed: preferences.reducedSpeed,
      highVisibility: preferences.highVisibility,
      reducedMotion: preferences.reducedMotion,
    });
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    } catch {
      // Local preferences are optional and are never transmitted.
    }
  }, [preferences]);

  useEffect(() => {
    if (snapshot.phase !== "gameover" || snapshot.score <= bestScore) return;
    setBestScore(snapshot.score);
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(snapshot.score));
    } catch {
      // A blocked localStorage API should not block the voyage.
    }
  }, [bestScore, snapshot.phase, snapshot.score]);

  useEffect(() => {
    if (snapshot.phase !== "gameover") return;
    removeVoyageSave();
    setVoyageSave(null);
    setConfirmNewRun(false);
  }, [snapshot.phase]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      engineRef.current?.pause();
      persistVoyage();
    };
    const onPageHide = () => persistVoyage();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [persistVoyage]);

  useEffect(() => {
    const timer = window.setInterval(persistVoyage, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [persistVoyage]);

  useEffect(() => {
    if (snapshot.phase === "paused" || snapshot.phase === "docked") persistVoyage();
  }, [persistVoyage, snapshot.phase]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || window.location.hostname === "localhost") return;
    let cancelled = false;
    navigator.serviceWorker.register(sitePath("/sw.js"), { scope: sitePath("/") }).then(async (registration) => {
      await navigator.serviceWorker.ready;
      if (cancelled || !registration.active) return;
      const assetPrefixes = [sitePath("/assets/"), sitePath("/_next/static/")];
      const resources = performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name, window.location.href))
        .filter((url) => url.origin === window.location.origin && !url.search && !url.hash &&
          assetPrefixes.some((prefix) => url.pathname.startsWith(prefix)) && /\.(?:m?js|css|woff2?)$/i.test(url.pathname))
        .map((url) => url.href);
      const ready = await new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
          channel.port1.close();
          resolve(false);
        }, 15_000);
        channel.port1.onmessage = (event: MessageEvent<{ ok?: boolean }>) => {
          window.clearTimeout(timeout);
          channel.port1.close();
          resolve(event.data?.ok === true);
        };
        registration.active?.postMessage({ type: "CACHE_URLS", urls: resources }, [channel.port2]);
      });
      if (!cancelled) setOfflineReady(ready && !window.location.search);
    }).catch(() => setOfflineReady(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const startNewRun = useCallback(() => {
    if (!assetsReady) return;
    removeVoyageSave();
    setVoyageSave(null);
    setConfirmNewRun(false);
    setSaveUnavailable(false);
    setSettingsOpen(false);
    if (audioRef.current?.state === "suspended") void audioRef.current.resume();
    engineRef.current?.startRun();
  }, [assetsReady]);

  const continueVoyage = useCallback(() => {
    if (!assetsReady || !voyageSave) return;
    setSettingsOpen(false);
    setConfirmNewRun(false);
    if (audioRef.current?.state === "suspended") void audioRef.current.resume();
    if (engineRef.current?.restoreRun(voyageSave)) return;
    removeVoyageSave();
    setVoyageSave(null);
    setSaveUnavailable(true);
  }, [assetsReady, voyageSave]);

  const saveAndReturn = useCallback(() => {
    if (!persistVoyage()) return;
    setSettingsOpen(false);
    engineRef.current?.returnToIntro();
  }, [persistVoyage]);

  const togglePause = useCallback(() => {
    if (snapshot.phase === "playing") engineRef.current?.pause();
    else if (snapshot.phase === "paused") engineRef.current?.resume();
  }, [snapshot.phase]);

  const openSettings = useCallback(() => {
    if (snapshot.phase === "playing") engineRef.current?.pause();
    setSettingsOpen(true);
  }, [snapshot.phase]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    if (snapshot.phase === "paused") engineRef.current?.resume();
  }, [snapshot.phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W", "s", "S", "e", "E", "r", "R", "f", "F"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") engineRef.current?.setSteer(-1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") engineRef.current?.setSteer(1);
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") engineRef.current?.setSailsRaised(true);
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") engineRef.current?.setSailsRaised(false);
      if (event.key.toLowerCase() === "r") engineRef.current?.toggleSails();
      if (event.key.toLowerCase() === "e") engineRef.current?.tryDock();
      if (event.key.toLowerCase() === "f") engineRef.current?.deployNet();
      if (event.key === " ") engineRef.current?.setBoosting(true);
      if (event.key.toLowerCase() === "p" || event.key === "Escape") togglePause();
      if (event.key === "Enter" && snapshot.phase === "intro") {
        if (voyageSave) continueVoyage();
        else startNewRun();
      }
      if (event.key === "Enter" && snapshot.phase === "gameover") startNewRun();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) engineRef.current?.setSteer(0);
      if (event.key === " ") engineRef.current?.setBoosting(false);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [continueVoyage, snapshot.phase, startNewRun, togglePause, voyageSave]);

  const onCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (snapshot.phase !== "playing") return;
    if (event.type === "pointermove" && event.buttons === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    engineRef.current?.setPointerDirection(x, y);
    if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
  };

  const steerButton = (direction: number) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      engineRef.current?.setSteer(direction);
    },
    onPointerUp: () => engineRef.current?.setSteer(0),
    onPointerCancel: () => engineRef.current?.setSteer(0),
  });

  const updatePreference = (key: keyof Preferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const activeEvent = snapshot.activeEvent === "none" ? null : EVENT_COPY[snapshot.activeEvent];
  const nearbyHarbor = snapshot.nearbyHarbor === "none" ? null : HARBOR_COPY[snapshot.nearbyHarbor];
  const dockedHarbor = snapshot.dockedHarbor === "none" ? null : HARBOR_COPY[snapshot.dockedHarbor];
  const isNewBest = snapshot.phase === "gameover" && snapshot.score >= bestScore && snapshot.score > 0;
  const tradeValue = snapshot.cargo * V4_TRADE_PRICES.cargo + snapshot.valuables * V4_TRADE_PRICES.valuables + snapshot.fishCargo * V4_TRADE_PRICES.fish;

  const harborAction = () => {
    if (snapshot.dockedHarbor === "trade") engineRef.current?.sellCargoAtHarbor();
    else if (snapshot.dockedHarbor === "shipyard") engineRef.current?.repairAtHarbor();
    else if (snapshot.dockedHarbor === "arsenal") engineRef.current?.buyAmmoAtHarbor();
    else if (snapshot.dockedHarbor === "academy") engineRef.current?.upgradeGunsAtHarbor();
  };

  const harborActionState = (() => {
    if (snapshot.dockedHarbor === "trade") return { disabled: snapshot.cargo + snapshot.valuables + snapshot.fishCargo <= 0, price: `${snapshot.cargo} crates + ${snapshot.valuables} valuables + ${snapshot.fishCargo} fish → ${tradeValue} coins`, reason: "There is no cargo to sell" };
    if (snapshot.dockedHarbor === "shipyard") return { disabled: snapshot.lives >= 3 || snapshot.coins < snapshot.repairCost, price: `${snapshot.repairCost} coins`, reason: snapshot.lives >= 3 ? "The hull is undamaged" : "Not enough coins" };
    if (snapshot.dockedHarbor === "arsenal") return { disabled: snapshot.ammo >= snapshot.ammoCapacity || snapshot.coins < snapshot.ammoPackCost, price: `${snapshot.ammoPackCost} coins`, reason: snapshot.ammo >= snapshot.ammoCapacity ? "Ammunition is full" : "Not enough coins" };
    if (snapshot.dockedHarbor === "academy") return { disabled: snapshot.gunLevel >= 3 || snapshot.coins < snapshot.gunUpgradeCost, price: snapshot.gunLevel >= 3 ? "Maximum level" : `${snapshot.gunUpgradeCost} coins`, reason: snapshot.gunLevel >= 3 ? "Cannons are fully upgraded" : "Not enough coins" };
    return { disabled: true, price: "", reason: "" };
  })();

  return (
    <main className={`v4-shell${preferences.highVisibility ? " v4-high-visibility" : ""}${preferences.reducedMotion ? " v4-reduced-motion" : ""}`}>
      <canvas
        ref={canvasRef}
        className="v4-canvas"
        aria-label="Endless Wake V4 open sea"
        onPointerDown={onCanvasPointer}
        onPointerMove={onCanvasPointer}
      >
        Your browser must support Canvas 2D to play Endless Wake V4.
      </canvas>

      <header className="v4-topbar">
        <a className="v4-brand" href={sitePath("/")} aria-label="Endless Wake V4 home">
          <span className="v4-compass" aria-hidden="true">✦</span>
          <span><strong>Endless Wake</strong><small>LIVING TIDES</small></span>
        </a>
        <nav className="v4-top-actions" aria-label="Versions and game controls">
          <span className="v4-version-link">V4</span>
          <a className="v4-version-link" href={sitePath("/v5")}>Play V5 Voxel</a>
          <span className="v4-offline"><i />{offlineReady ? "Offline ready" : "Offline unavailable"}</span>
          {(snapshot.phase === "playing" || snapshot.phase === "paused" || snapshot.phase === "docked") && (
            <span className={`v4-save-indicator${saveUnavailable ? " unavailable" : ""}`}><i />{saveUnavailable ? "Save unavailable" : "Local autosave"}</span>
          )}
          {(snapshot.phase === "playing" || snapshot.phase === "paused") && (
            <button className="v4-icon-button" type="button" onClick={togglePause} aria-label={snapshot.phase === "paused" ? "Resume game" : "Pause game"}>
              {snapshot.phase === "paused" ? "▶" : "Ⅱ"}
            </button>
          )}
          <button className="v4-icon-button" type="button" onClick={openSettings} aria-label="Sailing settings">⚙</button>
        </nav>
      </header>

      {snapshot.phase === "intro" && (
        <section className="v4-intro" aria-labelledby="v4-title">
          <h1 id="v4-title" className="v4-intro-title"><span>Endless</span><span>Wake</span><small>V4 · Living Tides</small></h1>
          <div className="v4-intro-shade" />
          <div className="v4-launch-card">
            <p className="v4-kicker"><span /> V4 · Living Tides</p>
            <h2>A living sea awaits</h2>
            <p>Sail the open sea, fish, and bring your cargo home. Approach a harbor slowly to dock with the pilot.</p>
            <div className="v4-feature-row" aria-label="Features">
              <span>Sail and inertia</span><span>Auto-docking</span><span>Fishing and marine life</span><span>Living harbors</span><span>Ship collisions</span>
            </div>
            {voyageSave && (
              <div className="v4-save-summary" aria-label="Saved voyage">
                <span><i />Voyage saved</span>
                <strong>{formatNumber(Math.floor(voyageSave.distance))} nm</strong>
                <small>{voyageSave.coins} coins · {voyageSave.cargo} crates · {voyageSave.valuables} valuables · {voyageSave.fishCargo} fish · {formatSavedAt(voyageSave.savedAt)}</small>
              </div>
            )}
            <div className="v4-launch-actions">
              <button className="v4-primary-button" type="button" onClick={voyageSave ? continueVoyage : startNewRun} disabled={!assetsReady || Boolean(assetError)}>
                <span>{assetError ? "Assets failed to load" : !assetsReady ? "Loading assets…" : voyageSave ? "Continue voyage" : "Set sail"}</span><i aria-hidden="true">→</i>
              </button>
              {voyageSave && <button className="v4-secondary-button" type="button" onClick={() => setConfirmNewRun(true)}>New voyage</button>}
              <span className="v4-best">Best score<strong>{formatNumber(bestScore)}</strong></span>
            </div>
            <div className="v4-intro-controls" aria-label="Touch and keyboard controls">
              <div className="v4-intro-control-row v4-touch-guide" aria-label="Touch controls">
                <small><i />Touch controls</small>
                <div>
                  <span className="v4-guide-steer"><b>←</b><b>→</b><em>Steer</em></span>
                  <span><b>Sail</b><em>Raise / lower</em></span>
                  <span><b>Net</b><em>Fish</em></span>
                  <span><b>Boost</b><em>Hold to boost</em></span>
                </div>
              </div>
              <div className="v4-intro-control-row v4-keyboard-guide" aria-label="Keyboard controls">
                <small><i />Keyboard controls</small>
                <div>
                  <span><kbd>A</kbd><kbd>D</kbd><em>Steer</em></span>
                  <span><kbd>W</kbd><kbd>S</kbd><em>Raise / lower sail</em></span>
                  <span><kbd>F</kbd><em>Fish</em></span>
                  <span><kbd>E</kbd><em>Dock</em></span>
                  <span><kbd>Space</kbd><em>Boost</em></span>
                </div>
              </div>
            </div>
            {confirmNewRun && voyageSave && (
              <div className="v4-save-confirm" role="alertdialog" aria-label="Replace the current save">
                <span><strong>Replace your saved voyage?</strong><small>Your current {formatNumber(Math.floor(voyageSave.distance))} nm voyage will be replaced.</small></span>
                <button type="button" onClick={startNewRun}>Start new voyage</button>
                <button type="button" onClick={() => setConfirmNewRun(false)}>Keep save</button>
              </div>
            )}
            {assetError && <p className="v4-load-error" role="alert">{assetError}. Please refresh the page and try again.</p>}
            {saveUnavailable && !assetError && <p className="v4-load-error" role="alert">The browser blocked local saves. You can keep playing on this page.</p>}
          </div>
        </section>
      )}

      {(snapshot.phase === "playing" || snapshot.phase === "paused" || snapshot.phase === "docked") && (
        <section className="v4-hud" aria-label="Voyage status">
          <div className="v4-distance"><small>Voyage</small><strong>{formatNumber(snapshot.distance)}</strong><span>nm</span></div>
          <i className="v4-hud-rule" />
          <div className="v4-stat"><small>Heading</small><strong>{formatBearing(snapshot.heading)}</strong></div>
          <div className="v4-stat v4-speed-stat"><small>Speed</small><strong>{Math.round(snapshot.speed * 1.9)} kn</strong></div>
          <div className="v4-stat v4-cargo-stat"><small>Cargo</small><strong>{snapshot.cargo} crates <span>· {snapshot.valuables} valuables · {snapshot.fishCargo} fish</span></strong></div>
          <div className="v4-stat v4-coin-stat"><small>coins</small><strong>{snapshot.coins}</strong></div>
          <div className="v4-stat v4-ammo-stat"><small>Cannons L{snapshot.gunLevel}</small><strong>{snapshot.ammo}<em> / {snapshot.ammoCapacity}</em></strong></div>
          <div className="v4-hull" aria-label={`Hull remaining: ${snapshot.lives}`}>
            <small>Hull</small><span>{[0, 1, 2].map((life) => <i className={life < snapshot.lives ? "active" : ""} key={life} />)}</span>
          </div>
        </section>
      )}

      {activeEvent && (snapshot.phase === "playing" || snapshot.phase === "paused") && (
        <section className={`v4-event v4-event-${snapshot.activeEvent}`} aria-live="polite">
          <span className="v4-event-symbol" aria-hidden="true">{activeEvent.symbol}</span>
          <span className="v4-event-copy"><small>{activeEvent.eyebrow}</small><strong>{activeEvent.title}</strong><em>{snapshot.eventTarget > 0 ? `${activeEvent.detail} · ${snapshot.eventFound}/${snapshot.eventTarget}` : activeEvent.detail}</em><b>Reward · {activeEvent.reward}</b></span>
          <i className="v4-event-meter"><b style={{ width: `${snapshot.eventProgress}%` }} /></i>
        </section>
      )}

      {snapshot.notice !== "none" && (snapshot.phase === "playing" || snapshot.phase === "docked") && (
        <div className="v4-notice" role="status"><span aria-hidden="true">✦</span>{NOTICE_COPY[snapshot.notice]}</div>
      )}

      {nearbyHarbor && snapshot.phase === "playing" && (
        <section className={`v4-harbor-prompt v4-harbor-${snapshot.nearbyHarbor}`} aria-live="polite">
          <span className="v4-harbor-symbol" aria-hidden="true">{nearbyHarbor.symbol}</span>
          <span className="v4-harbor-copy"><small>{nearbyHarbor.eyebrow}</small><strong>{nearbyHarbor.title}</strong><em>Distance {snapshot.harborDistance.toFixed(1)} nm</em></span>
          {snapshot.autoDocking ? (
            <span className="v4-auto-dock-status"><i />Pilot docking</span>
          ) : snapshot.canDock ? (
            <button type="button" onClick={() => engineRef.current?.tryDock()}><span>Request docking</span><kbd>E</kbd></button>
          ) : (
            <span className="v4-harbor-instruction">
              {snapshot.activeEvent !== "none" ? "Harbor closed until the alert ends" : snapshot.sailsRaised || snapshot.sailPercent > 32 || snapshot.speed > 1.35 ? "Lower sails and slow down to dock" : "Continue slowly along the pier"}
            </span>
          )}
        </section>
      )}

      {snapshot.phase === "playing" && (
        <section className="v4-wind-meter" aria-label={`Boost energy: ${snapshot.boost}%`}>
          <button type="button" className={snapshot.sailsRaised ? "sails-up" : "sails-down"} onClick={() => engineRef.current?.toggleSails()}>
            <small>{snapshot.sailsRaised ? "Sails raised" : "Sails lowered"} · {snapshot.sailPercent}%</small><strong>{snapshot.autoDocking ? "Auto-docking" : snapshot.sailsRaised ? "Under sail" : snapshot.speed > 0.2 ? "Slowing down" : "Stopped"}</strong>
          </button>
          <span><small>Wind {formatBearing(snapshot.windHeading).split(" · ")[0]}</small><strong>{snapshot.windStrength}%</strong></span>
          <i><b style={{ width: `${snapshot.boost}%` }} /></i>
          <span className="v4-drift-readout"><small>Drift</small><strong>{snapshot.drift.toFixed(1)} kn</strong></span>
          {(snapshot.escort > 0 || snapshot.fairWind > 0 || snapshot.gunFocus > 0) && (
            <div className="v4-buff-list" aria-label="Active bonuses">
              {snapshot.fairWind > 0 && <span>Fair wind {snapshot.fairWind}s</span>}
              {snapshot.gunFocus > 0 && <span>Gunnery focus {snapshot.gunFocus}s</span>}
              {snapshot.escort > 0 && <span>Escort {snapshot.escort}s</span>}
            </div>
          )}
        </section>
      )}

      {snapshot.phase === "playing" && (
        <section className={`v4-fishing-panel${snapshot.nearbyFish ? " has-school" : ""}${snapshot.fishingProgress > 0 ? " casting" : ""}`} aria-live="polite">
          <span aria-hidden="true">◌</span>
          <div><small>{snapshot.nearbyFish ? "Fish are within net range" : "Look for fish in the shallows"}</small><strong>{snapshot.fishingProgress > 0 ? `Hauling net ${snapshot.fishingProgress}%` : snapshot.netCooldown > 0 ? `Preparing net ${snapshot.netCooldown}s` : snapshot.canFish ? "Ready to fish" : "Lower sails and slow down to fish"}</strong></div>
          <button type="button" disabled={!snapshot.canFish && snapshot.fishingProgress === 0} onClick={() => engineRef.current?.deployNet()}><span>Cast net</span><kbd>F</kbd></button>
          {snapshot.fishingProgress > 0 && <i><b style={{ width: `${snapshot.fishingProgress}%` }} /></i>}
        </section>
      )}

      {dockedHarbor && snapshot.phase === "docked" && !settingsOpen && (
        <section className={`v4-dock-panel v4-harbor-${snapshot.dockedHarbor}`} aria-live="polite">
          <div className="v4-dock-heading">
            <span className="v4-dock-emblem" aria-hidden="true">{dockedHarbor.symbol}</span>
            <div><p className="v4-kicker"><span /> {dockedHarbor.eyebrow}</p><h2>{dockedHarbor.title}</h2></div>
          </div>
          <p>{dockedHarbor.description}</p>
          <div className="v4-dock-ledger" aria-label="Ship supplies">
            <span><small>coins</small><strong>{snapshot.coins}</strong></span>
            <span><small>Cargo</small><strong>{snapshot.cargo}</strong></span>
            <span><small>Valuables</small><strong>{snapshot.valuables}</strong></span>
            <span><small>Fish</small><strong>{snapshot.fishCargo}</strong></span>
            <span><small>Hull</small><strong>{snapshot.lives} / 3</strong></span>
            <span><small>Ammo</small><strong>{snapshot.ammo} / {snapshot.ammoCapacity}</strong></span>
          </div>
          <button className="v4-dock-action" type="button" onClick={harborAction} disabled={harborActionState.disabled}>
            <span><strong>{dockedHarbor.action}</strong><small>{harborActionState.disabled ? harborActionState.reason : harborActionState.price}</small></span><i aria-hidden="true">→</i>
          </button>
          <button className="v4-depart-button" type="button" onClick={() => engineRef.current?.departHarbor()}>Depart</button>
          <button className="v4-secondary-button v4-dock-save-button" type="button" onClick={saveAndReturn}>Save and return to menu</button>
        </section>
      )}

      {snapshot.phase === "paused" && !settingsOpen && (
        <section className="v4-center-panel" aria-live="polite">
          <p className="v4-kicker"><span /> Voyage paused</p>
          <h2>Taking a break</h2>
          <p>Your voyage, cargo, events, and bonuses can be saved in this browser.</p>
          <div className="v4-panel-actions">
            <button className="v4-primary-button compact" type="button" onClick={() => engineRef.current?.resume()}><span>Resume voyage</span><i>▶</i></button>
            <button className="v4-secondary-button" type="button" onClick={saveAndReturn}>Save and return to menu</button>
          </div>
          {voyageSave && <small className="v4-save-time">Last saved · {formatSavedAt(voyageSave.savedAt)}</small>}
          {saveUnavailable && <p className="v4-load-error" role="alert">Could not save to this browser. Your current voyage remains open.</p>}
        </section>
      )}

      {snapshot.phase === "gameover" && (
        <section className="v4-center-panel" aria-live="polite">
          <p className="v4-kicker"><span /> Voyage log</p>
          <h2>{isNewBest ? "New record" : "Voyage complete"}</h2>
          <div className="v4-result"><strong>{formatNumber(snapshot.distance)}</strong><span>nm</span></div>
          <div className="v4-result-meta"><span>Score <b>{formatNumber(snapshot.score)}</b></span><span>coins <b>{snapshot.coins}</b></span><span>Valuables <b>{snapshot.valuables}</b></span><span>Fish <b>{snapshot.fishCargo}</b></span><span>Sunk <b>{snapshot.sunkEnemies}</b></span><span>Best <b>{formatNumber(bestScore)}</b></span></div>
          <button className="v4-primary-button compact" type="button" onClick={startNewRun}><span>Sail again</span><i>↻</i></button>
        </section>
      )}

      {settingsOpen && (
        <section className="v4-settings" role="dialog" aria-modal="true" aria-labelledby="v4-settings-title">
          <div className="v4-settings-heading"><div><p className="v4-kicker"><span /> Captain's cabin</p><h2 id="v4-settings-title">Sailing settings</h2></div><button type="button" onClick={closeSettings} aria-label="Close settings">×</button></div>
          <label><span><strong>Synthesized sound</strong><small>No audio downloads or playback data sent</small></span><input type="checkbox" checked={preferences.sound} onChange={() => updatePreference("sound")} /></label>
          <label><span><strong>Relaxed speed</strong><small>Reduce speed, pixel density, and wake effects</small></span><input type="checkbox" checked={preferences.reducedSpeed} onChange={() => updatePreference("reducedSpeed")} /></label>
          <label><span><strong>High visibility</strong><small>Increase contrast for reefs, whirlpools, and controls</small></span><input type="checkbox" checked={preferences.highVisibility} onChange={() => updatePreference("highVisibility")} /></label>
          <label><span><strong>Reduced motion</strong><small>Reduce water, rotation, and wake animation</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={() => updatePreference("reducedMotion")} /></label>
          <p className="v4-privacy-note"><i>◇</i> Settings, high scores, and voyages are stored in this browser. Clearing site data deletes local saves.</p>
        </section>
      )}

      {snapshot.phase === "playing" && (
        <div className="v4-mobile-controls" aria-label="Touch sailing controls">
          <div className="v4-helm-controls">
            <button type="button" aria-label="Steer left, keyboard A" {...steerButton(-1)}><span aria-hidden="true">←</span><kbd aria-hidden="true">A</kbd></button>
            <button type="button" aria-label="Steer right, keyboard D" {...steerButton(1)}><span aria-hidden="true">→</span><kbd aria-hidden="true">D</kbd></button>
          </div>
          <div className="v4-action-controls">
            <button className="v4-sails-button" type="button" onClick={() => engineRef.current?.toggleSails()}><span>{snapshot.sailsRaised ? "Lower sails" : "Raise sails"}</span><kbd aria-hidden="true">W / S</kbd></button>
            <button className="v4-net-button" type="button" disabled={!snapshot.canFish && snapshot.fishingProgress === 0} onClick={() => engineRef.current?.deployNet()}><span>{snapshot.fishingProgress > 0 ? "Haul net" : "Cast net"}</span><kbd aria-hidden="true">F</kbd></button>
            <button
              className="v4-boost-button"
              type="button"
              aria-label="Hold to boost, keyboard Space"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                engineRef.current?.setBoosting(true);
              }}
              onPointerUp={() => engineRef.current?.setBoosting(false)}
              onPointerCancel={() => engineRef.current?.setBoosting(false)}
            ><span>Boost</span><kbd aria-hidden="true">Space</kbd><i style={{ height: `${snapshot.boost}%` }} /></button>
          </div>
        </div>
      )}

      <footer className="v4-footer">
        <span>Sailing · Auto-docking · Marine life · Harbors · Trading</span>
        <span>{formatCoordinates(snapshot.worldX, snapshot.worldY)} · Quality {snapshot.renderScale}%</span>
      </footer>
    </main>
  );
}
