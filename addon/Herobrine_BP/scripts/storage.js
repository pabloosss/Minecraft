import { world } from "@minecraft/server";
import { DEFAULT_SETTINGS, IDS } from "./config.js";
import { error, info, setDebugEnabled, warn } from "./logger.js";

let cache;

function freshState() {
  return {
    schema: 3,
    settings: { ...DEFAULT_SETTINGS },
    home: {
      status: "none",       // none | searching | preparing | building | paused | complete
      dimension: "",
      origin: undefined,
      variant: "cabin",
      prepared: false,
      buildIndex: 0,
      pauseReason: "",
    },
    tunnel: {
      status: "none",       // none | building | paused | complete
      length: 0,
      buildIndex: 0,
      pauseReason: "",
    },
    runtime: {
      activeEntityId: "",
      currentAction: "idle",
      actionStartedTick: 0,
      lastAction: "",
      lastError: "",
    },
  };
}

function mergeState(value) {
  const base = freshState();
  if (!value || typeof value !== "object") return base;
  return {
    ...base,
    ...value,
    settings: { ...base.settings, ...(value.settings ?? {}) },
    home: { ...base.home, ...(value.home ?? {}) },
    tunnel: { ...base.tunnel, ...(value.tunnel ?? {}) },
    runtime: { ...base.runtime, ...(value.runtime ?? {}) },
    schema: 3,
  };
}

export function loadState() {
  try {
    const raw = world.getDynamicProperty(IDS.stateKey);
    cache = typeof raw === "string" ? mergeState(JSON.parse(raw)) : freshState();
  } catch (e) {
    error("storage", e);
    cache = freshState();
    cache.runtime.lastError = "Uszkodzony zapis stanu - utworzono nowy.";
  }
  setDebugEnabled(cache.settings.debug);
  saveState();
  info("storage", "Stan v0.11 zostal zaladowany.");
  return cache;
}

export function state() {
  if (!cache) return loadState();
  return cache;
}

export function saveState() {
  if (!cache) return;
  try {
    world.setDynamicProperty(IDS.stateKey, JSON.stringify(cache));
  } catch (e) {
    error("storage-save", e);
  }
}

export function updateSettings(patch) {
  const value = state();
  value.settings = { ...value.settings, ...patch };
  setDebugEnabled(value.settings.debug);
  saveState();
  return value.settings;
}

export function setHome(patch) {
  const value = state();
  value.home = { ...value.home, ...patch };
  saveState();
  return value.home;
}

export function setTunnel(patch) {
  const value = state();
  value.tunnel = { ...value.tunnel, ...patch };
  saveState();
  return value.tunnel;
}

export function setRuntime(patch) {
  const value = state();
  value.runtime = { ...value.runtime, ...patch };
  saveState();
  return value.runtime;
}

export function recordError(message) {
  warn("runtime", message);
  setRuntime({ lastError: String(message) });
}

export function resetHome() {
  const value = state();
  const fresh = freshState();
  value.home = fresh.home;
  value.tunnel = fresh.tunnel;
  value.runtime.currentAction = "idle";
  value.runtime.actionStartedTick = 0;
  value.runtime.lastError = "";
  saveState();
}

export function resetTunnel() {
  const value = state();
  value.tunnel = freshState().tunnel;
  saveState();
}
