import { EquipmentSlot, system, world } from "@minecraft/server";
import { ACTIVITY_DELAY } from "./config.js";
import { getBlueprint } from "./blueprints.js";
import { ensureHome, isBuilding } from "./building.js";
import { isTunneling } from "./tunnel.js";
import { cancelMovement, goTo } from "./movement.js";
import { setRuntime, state } from "./storage.js";
import {
  blockAt,
  distance,
  equip,
  getSurface,
  isReplaceableType,
  lookAt,
  nearestPlayer,
  play,
  randomBetween,
  safePlace,
  smoke,
  sound,
} from "./utils.js";
import { error } from "./logger.js";

const controllers = new Map();

function runtime(entity) {
  let value = controllers.get(entity.id);
  if (!value) {
    value = { busy: false, timer: undefined, last: "", started: 0 };
    controllers.set(entity.id, value);
  }
  return value;
}

function absolute(origin, offset) {
  return { x: origin.x + offset.x, y: origin.y + offset.y, z: origin.z + offset.z };
}

function delayForActivity() {
  const range = ACTIVITY_DELAY[state().settings.activity] ?? ACTIVITY_DELAY.normal;
  return Math.floor(randomBetween(range[0], range[1]));
}

function armTimer(entity, delay) {
  const value = runtime(entity);
  if (value.timer !== undefined) system.clearRun(value.timer);
  value.timer = system.runTimeout(() => {
    value.timer = undefined;
    chooseAction(entity);
  }, delay);
}

function finish(entity, name) {
  if (!entity?.isValid) return;
  const value = runtime(entity);
  value.busy = false;
  value.last = name;
  setRuntime({ currentAction: "idle", lastAction: name, actionStartedTick: 0 });
  armTimer(entity, delayForActivity());
}

async function homeRoutine(entity) {
  const data = state().home;
  if (!data.origin) return finish(entity, "home");
  const blueprint = getBlueprint(data.variant);
  const player = nearestPlayer(entity);

  for (const station of blueprint.stations) {
    if (!entity.isValid) return;
    equip(entity, station.item);
    const target = absolute(data.origin, station.offset);
    const moved = await goTo(entity, target, {
      arrivalRadius: 1.7,
      face: player?.location,
      retries: 1,
    });
    if (!moved.success) break;
    if (player && station.name === "wejscie") lookAt(entity, player.location);
    play(entity, station.animation);
    await new Promise(resolve => system.runTimeout(resolve, station.wait));
  }

  equip(entity, undefined);
  finish(entity, "home");
}

async function patrol(entity) {
  const home = state().home;
  if (!home.origin) return finish(entity, "patrol");
  const player = nearestPlayer(entity);

  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = randomBetween(7, 14);
    const surface = getSurface(
      entity.dimension,
      home.origin.x + Math.cos(angle) * radius,
      home.origin.z + Math.sin(angle) * radius,
    );
    if (!surface) continue;
    const moved = await goTo(
      entity,
      {
        x: surface.location.x + 0.5,
        y: surface.location.y + 1,
        z: surface.location.z + 0.5,
      },
      { face: player?.location, retries: 1 },
    );
    if (!moved.success) break;
    if (player && Math.random() < 0.6) {
      lookAt(entity, player.location);
      play(entity, "animation.hiw.herobrine.stare");
    }
    await new Promise(resolve => system.runTimeout(resolve, 30));
  }
  finish(entity, "patrol");
}

async function observe(entity) {
  const player = nearestPlayer(entity);
  if (!player) return finish(entity, "observe");
  const view = player.getViewDirection();
  const side = Math.random() < 0.5 ? -1 : 1;
  const point = {
    x: player.location.x - view.x * 16 + view.z * 6 * side,
    z: player.location.z - view.z * 16 - view.x * 6 * side,
  };
  const surface = getSurface(player.dimension, point.x, point.z);
  if (!surface) return finish(entity, "observe");

  equip(entity, Math.random() < 0.35 ? "minecraft:iron_sword" : undefined);
  const moved = await goTo(
    entity,
    {
      x: surface.location.x + 0.5,
      y: surface.location.y + 1,
      z: surface.location.z + 0.5,
    },
    { face: player.location, retries: 1 },
  );

  if (moved.success) {
    try {
      entity.triggerEvent("hiw:set_freeze");
    } catch {}
    lookAt(entity, player.location);
    play(entity, "animation.hiw.herobrine.stare");
    try {
      player.onScreenDisplay.setActionBar("§8Ktos obserwuje cie z oddali...");
    } catch {}

    let waited = 0;
    while (entity.isValid && waited < 140) {
      lookAt(entity, player.location);
      if (distance(entity.location, player.location) < 5) {
        smoke(entity.dimension, entity.location);
        sound(entity.dimension, "ambient.cave", entity.location, 0.5, 0.8);
        try {
          entity.addEffect("invisibility", 40, { showParticles: false });
        } catch {}
        break;
      }
      waited += 10;
      await new Promise(resolve => system.runTimeout(resolve, 10));
    }
    try {
      entity.triggerEvent("hiw:set_idle");
      entity.removeEffect("invisibility");
    } catch {}
  }

  equip(entity, undefined);
  finish(entity, "observe");
}

async function mimic(entity) {
  const player = nearestPlayer(entity);
  if (!player) return finish(entity, "mimic");

  try {
    const held = player
      .getComponent("minecraft:equippable")
      ?.getEquipment(EquipmentSlot.Mainhand);
    const equipment = entity.getComponent("minecraft:equippable");
    if (held && equipment) equipment.setEquipment(EquipmentSlot.Mainhand, held.clone());
  } catch {}

  const until = system.currentTick + 20 * 10;
  while (entity.isValid && player.isValid && system.currentTick < until) {
    try {
      entity.isSneaking = player.isSneaking;
    } catch {}
    const direction = player.getViewDirection();
    lookAt(entity, {
      x: entity.location.x + direction.x * 10,
      y: entity.location.y + 1 + direction.y * 10,
      z: entity.location.z + direction.z * 10,
    });
    if (system.currentTick % 40 < 5) play(entity, "animation.hiw.herobrine.attack");
    await new Promise(resolve => system.runTimeout(resolve, 5));
  }

  try {
    entity.isSneaking = false;
  } catch {}
  equip(entity, undefined);
  finish(entity, "mimic");
}

async function warning(entity) {
  const player = nearestPlayer(entity);
  if (!player || !state().settings.interferenceEnabled) return finish(entity, "warning");
  const angle = Math.random() * Math.PI * 2;
  const surface = getSurface(
    player.dimension,
    player.location.x + Math.cos(angle) * 5,
    player.location.z + Math.sin(angle) * 5,
  );
  if (!surface) return finish(entity, "warning");

  const target = { x: surface.location.x, y: surface.location.y + 1, z: surface.location.z };
  if (!isReplaceableType(blockAt(player.dimension, target)?.typeId)) return finish(entity, "warning");

  equip(entity, "minecraft:redstone_torch");
  const moved = await goTo(
    entity,
    { x: target.x + 0.5, y: target.y, z: target.z + 0.5 },
    { face: player.location, retries: 1 },
  );
  if (moved.success) {
    play(entity, "animation.hiw.herobrine.attack");
    await new Promise(resolve => system.runTimeout(resolve, 6));
    safePlace(player.dimension, target, "minecraft:redstone_torch", true);
    sound(player.dimension, "ambient.cave", target, 0.55, 0.7);
  }
  equip(entity, undefined);
  finish(entity, "warning");
}

function findTree(entity, radius = 15) {
  const baseY = Math.floor(entity.location.y);
  for (let r = 3; r <= radius; r++) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const x = Math.floor(entity.location.x + Math.cos(angle) * r);
      const z = Math.floor(entity.location.z + Math.sin(angle) * r);
      for (let y = baseY - 5; y <= baseY + 9; y++) {
        const block = blockAt(entity.dimension, { x, y, z });
        if (!block?.typeId?.includes("_log")) continue;
        const below = blockAt(entity.dimension, { x, y: y - 1, z });
        if (below?.typeId === block.typeId) continue;
        return block;
      }
    }
  }
  return undefined;
}

function saplingFor(logId) {
  const map = {
    "minecraft:mangrove_log": "minecraft:mangrove_propagule",
    "minecraft:crimson_stem": "minecraft:crimson_fungus",
    "minecraft:warped_stem": "minecraft:warped_fungus",
  };
  return map[logId] ?? logId.replace("_log", "_sapling");
}

async function chop(entity) {
  const tree = findTree(entity);
  if (!tree) return finish(entity, "chop");
  equip(entity, "minecraft:iron_axe");

  const surface = getSurface(entity.dimension, tree.location.x + 1, tree.location.z);
  const target = surface
    ? { x: surface.location.x + 0.5, y: surface.location.y + 1, z: surface.location.z + 0.5 }
    : { x: tree.location.x + 1.5, y: tree.location.y, z: tree.location.z + 0.5 };
  const moved = await goTo(entity, target, { face: tree.location, retries: 1 });

  if (moved.success) {
    for (let i = 0; i < 3; i++) {
      play(entity, "animation.hiw.herobrine.attack");
      sound(entity.dimension, "dig.wood", tree.location, 0.9, 0.5);
      await new Promise(resolve => system.runTimeout(resolve, 8));
    }

    if (!state().settings.safeMode) {
      const logType = tree.typeId;
      for (let dy = 0; dy < 6; dy++) {
        const block = blockAt(entity.dimension, {
          x: tree.location.x,
          y: tree.location.y + dy,
          z: tree.location.z,
        });
        if (block?.typeId !== logType) break;
        try {
          entity.dimension.setBlockType(block.location, "minecraft:air");
        } catch {}
      }
      safePlace(entity.dimension, tree.location, saplingFor(logType), true);
    }
  }

  equip(entity, undefined);
  finish(entity, "chop");
}

async function darkHome(entity) {
  const home = state().home;
  if (!home.origin) return finish(entity, "dark_home");
  const target = { x: home.origin.x + 0.5, y: home.origin.y + 1, z: home.origin.z + 0.5 };
  const moved = await goTo(entity, target, { arrivalRadius: 1.5, retries: 1 });
  if (moved.success) {
    try {
      entity.triggerEvent("hiw:set_freeze");
    } catch {}
    play(entity, "animation.hiw.herobrine.stare");
    await new Promise(resolve => system.runTimeout(resolve, 20 * 8));
    try {
      entity.triggerEvent("hiw:set_idle");
    } catch {}
  }
  finish(entity, "dark_home");
}

function weightedChoice(entries) {
  const last = state().runtime.lastAction;
  const filtered = entries.filter(([name]) => name !== last);
  const values = filtered.length ? filtered : entries;
  let roll = Math.random() * values.reduce((sum, item) => sum + item[1], 0);
  for (const item of values) {
    roll -= item[1];
    if (roll <= 0) return item[0];
  }
  return values[0][0];
}

export function chooseAction(entity) {
  if (!entity?.isValid || isBuilding(entity) || isTunneling(entity)) return;
  const value = runtime(entity);
  if (value.busy) return;
  if (state().home.status !== "complete") {
    return ensureHome(entity, nearestPlayer(entity), () => scheduleNext(entity, 20));
  }

  value.busy = true;
  value.started = system.currentTick;
  const night = (() => {
    try {
      const time = world.getTimeOfDay();
      return time > 12500 && time < 23500;
    } catch {
      return false;
    }
  })();

  const selected = weightedChoice([
    ["home", night ? 18 : 11],
    ["patrol", 12],
    ["observe", 15],
    ["mimic", 8],
    ["warning", 7],
    ["chop", 6],
    ["dark_home", night ? 12 : 3],
  ]);
  setRuntime({ currentAction: selected, actionStartedTick: system.currentTick });

  const map = {
    home: homeRoutine,
    patrol,
    observe,
    mimic,
    warning,
    chop,
    dark_home: darkHome,
  };
  Promise.resolve(map[selected](entity)).catch(e => {
    error(`action-${selected}`, e);
    finish(entity, selected);
  });
}

export function scheduleNext(entity, delay = undefined) {
  if (!entity?.isValid) return;
  const value = runtime(entity);
  value.busy = false;
  armTimer(entity, delay ?? delayForActivity());
}

export function startController(entity) {
  if (!entity?.isValid) return;
  const value = runtime(entity);
  if (value.timer !== undefined || value.busy) return;
  ensureHome(entity, nearestPlayer(entity), () => scheduleNext(entity, 40));
}

export function recoverController(entity) {
  if (!entity?.isValid || isBuilding(entity) || isTunneling(entity)) return;
  const value = runtime(entity);
  if (value.busy && system.currentTick - value.started > 20 * 90) {
    cancelMovement(entity, "watchdog");
    value.busy = false;
    setRuntime({
      currentAction: "idle",
      actionStartedTick: 0,
      lastError: "Watchdog zresetowal zawieszona akcje.",
    });
    scheduleNext(entity, 40);
  } else if (!value.busy && value.timer === undefined) {
    startController(entity);
  }
}

export function stopController(entity, reason = "manual_stop") {
  if (!entity?.isValid) return;
  const value = runtime(entity);
  if (value.timer !== undefined) {
    system.clearRun(value.timer);
    value.timer = undefined;
  }
  cancelMovement(entity, reason);
  value.busy = false;
  value.started = 0;
  try {
    entity.triggerEvent("hiw:set_idle");
  } catch {}
  equip(entity, undefined);
  setRuntime({
    currentAction: "idle",
    actionStartedTick: 0,
    lastError: "",
  });
}

export function commandAction(entity, name) {
  if (!entity?.isValid) {
    return { success: false, reason: "Herobrine nie istnieje." };
  }
  if (isBuilding(entity)) {
    return { success: false, reason: "Herobrine teraz buduje dom." };
  }
  if (isTunneling(entity)) {
    return { success: false, reason: "Herobrine teraz kopie tunel." };
  }

  const map = {
    home: homeRoutine,
    patrol,
    observe,
    mimic,
    warning,
    chop,
    dark_home: darkHome,
  };
  const action = map[name];
  if (!action) {
    return { success: false, reason: `Nieznane polecenie ${name}.` };
  }

  stopController(entity, `command_${name}`);
  const value = runtime(entity);
  value.busy = true;
  value.started = system.currentTick;
  value.last = name;
  setRuntime({
    currentAction: name,
    actionStartedTick: system.currentTick,
    lastError: "",
  });

  Promise.resolve(action(entity)).catch(e => {
    error(`command-${name}`, e);
    finish(entity, name);
  });

  return { success: true, reason: "" };
}

export function controllerStatus(entity) {
  return controllers.get(entity.id);
}
