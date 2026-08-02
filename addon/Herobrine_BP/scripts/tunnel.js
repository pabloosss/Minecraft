import { system } from "@minecraft/server";
import { TUNNEL } from "./config.js";
import { getBlueprint } from "./blueprints.js";
import { goTo, cancelMovement } from "./movement.js";
import {
  recordError,
  setRuntime,
  setTunnel,
  state,
} from "./storage.js";
import {
  blockAt,
  equip,
  isProtectedType,
  isReplaceableType,
  lookAt,
  play,
  sound,
} from "./utils.js";
import { error } from "./logger.js";

let activeJob;
let activeEntityId = "";
let generation = 0;

function directSet(dimension, location, typeId) {
  try {
    dimension.setBlockType(
      {
        x: Math.floor(location.x),
        y: Math.floor(location.y),
        z: Math.floor(location.z),
      },
      typeId,
    );
    return true;
  } catch {
    return false;
  }
}

function protectedBlock(block) {
  return block && isProtectedType(block.typeId);
}

function carve(dimension, location, safeMode) {
  const block = blockAt(dimension, location);
  if (!block) throw new Error("Chunk tunelu nie jest zaladowany.");
  if (protectedBlock(block) && safeMode) {
    throw new Error(`Tunel trafil na chroniony blok ${block.typeId}.`);
  }
  if (block.typeId !== "minecraft:air") {
    directSet(dimension, location, "minecraft:air");
  }
}

function supportFloor(dimension, location) {
  const block = blockAt(dimension, location);
  if (!block) throw new Error("Brak dostepu do podlogi tunelu.");
  if (isProtectedType(block.typeId)) {
    throw new Error(`Chroniony blok pod tunelem: ${block.typeId}.`);
  }
  if (isReplaceableType(block.typeId)) {
    directSet(dimension, location, "minecraft:cobbled_deepslate");
  }
}

function* tunnelGenerator(entity, player, onReady, token) {
  const data = state();
  const home = data.home;
  const blueprint = getBlueprint(home.variant);
  const safeMode = data.settings.safeMode;
  const previousLength = data.tunnel.length ?? 0;
  const firstSection = previousLength === 0;

  const startZ = home.origin.z + blueprint.radius + 1;
  const flatY = home.origin.y - TUNNEL.depth;
  let operationIndex = 0;

  setTunnel({
    status: "building",
    buildIndex: 0,
    pauseReason: "",
  });
  setRuntime({
    currentAction: "tunnel",
    actionStartedTick: system.currentTick,
  });
  equip(entity, "minecraft:iron_pickaxe");

  try {
    if (firstSection) {
      for (let step = 0; step <= TUNNEL.stairLength; step++) {
        const z = startZ + step;
        const floorY = home.origin.y - step;

        for (let xOffset = 0; xOffset <= 1; xOffset++) {
          for (let yOffset = 0; yOffset <= 2; yOffset++) {
            if (!entity.isValid || token !== generation) return;
            const location = {
              x: home.origin.x + xOffset,
              y: floorY + yOffset,
              z,
            };
            lookAt(entity, location);
            play(entity, "animation.hiw.herobrine.attack");
            carve(entity.dimension, location, safeMode);
            operationIndex++;
            setTunnel({ buildIndex: operationIndex });
            for (let wait = 0; wait < TUNNEL.blockDelayTicks; wait++) yield;
          }
          supportFloor(entity.dimension, {
            x: home.origin.x + xOffset,
            y: floorY - 1,
            z,
          });
          yield;
        }
      }
    }

    const extensionStart =
      startZ + TUNNEL.stairLength + 1 + previousLength;
    const extensionEnd =
      extensionStart + TUNNEL.extensionLength - 1;

    for (let z = extensionStart; z <= extensionEnd; z++) {
      if (!entity.isValid || token !== generation) return;

      for (let xOffset = 0; xOffset <= 1; xOffset++) {
        for (let yOffset = 0; yOffset <= 2; yOffset++) {
          const location = {
            x: home.origin.x + xOffset,
            y: flatY + yOffset,
            z,
          };
          lookAt(entity, location);
          play(entity, "animation.hiw.herobrine.attack");
          carve(entity.dimension, location, safeMode);
          operationIndex++;
          setTunnel({ buildIndex: operationIndex });
          sound(entity.dimension, "dig.stone", location, 0.8, 0.35);
          for (let wait = 0; wait < TUNNEL.blockDelayTicks; wait++) yield;
        }

        supportFloor(entity.dimension, {
          x: home.origin.x + xOffset,
          y: flatY - 1,
          z,
        });
        yield;
      }

      const localDepth = z - extensionStart;
      if (localDepth % 4 === 0) {
        for (let y = flatY; y <= flatY + 2; y++) {
          directSet(
            entity.dimension,
            { x: home.origin.x - 1, y, z },
            "minecraft:stripped_spruce_log",
          );
          directSet(
            entity.dimension,
            { x: home.origin.x + 2, y, z },
            "minecraft:stripped_spruce_log",
          );
          yield;
        }
        directSet(
          entity.dimension,
          { x: home.origin.x, y: flatY + 3, z },
          "minecraft:spruce_planks",
        );
        directSet(
          entity.dimension,
          { x: home.origin.x + 1, y: flatY + 3, z },
          "minecraft:spruce_planks",
        );
        directSet(
          entity.dimension,
          { x: home.origin.x - 1, y: flatY + 1, z },
          "minecraft:redstone_torch",
        );
        yield;
      }
    }

    cancelMovement(entity, "tunnel_complete");
    equip(entity, undefined);
    activeJob = undefined;
    activeEntityId = "";

    setTunnel({
      status: "complete",
      length: previousLength + TUNNEL.extensionLength,
      buildIndex: 0,
      pauseReason: "",
    });
    setRuntime({
      currentAction: "idle",
      lastAction: "tunnel",
      actionStartedTick: 0,
    });

    player?.sendMessage(
      `§2[Herobrine] Tunel ma teraz ${previousLength + TUNNEL.extensionLength} blokow dlugosci.`,
    );
    if (onReady) system.run(() => onReady());
  } catch (e) {
    error("tunnel", e);
    activeJob = undefined;
    activeEntityId = "";
    equip(entity, undefined);

    const message = e instanceof Error ? e.message : String(e);
    setTunnel({ status: "paused", pauseReason: message });
    setRuntime({
      currentAction: "tunnel_paused",
      actionStartedTick: 0,
      lastError: message,
    });
    recordError(message);
    player?.sendMessage(`§c[Herobrine] Tunel zatrzymany: ${message}`);
  }
}

export function startTunnel(entity, player, onReady) {
  if (!entity?.isValid || activeJob !== undefined) return false;

  const home = state().home;
  if (home.status !== "complete" || !home.origin) {
    player?.sendMessage("§cNajpierw Herobrine musi ukonczyc dom.");
    return false;
  }

  const blueprint = getBlueprint(home.variant);
  const entrance = {
    x: home.origin.x + 0.5,
    y: home.origin.y,
    z: home.origin.z + blueprint.radius + 1.5,
  };

  goTo(entity, entrance, {
    face: {
      x: home.origin.x,
      y: home.origin.y - 1,
      z: home.origin.z + blueprint.radius + 3,
    },
    retries: 0,
  }).catch(() => {});

  const token = generation;
  activeEntityId = entity.id;
  activeJob = system.runJob(tunnelGenerator(entity, player, onReady, token));
  return true;
}

export function cancelTunnel(entity = undefined) {
  generation++;
  if (activeJob !== undefined) {
    try {
      system.clearJob(activeJob);
    } catch {}
  }
  activeJob = undefined;
  activeEntityId = "";
  if (entity?.isValid) equip(entity, undefined);
}

export function isTunneling(entity = undefined) {
  if (activeJob === undefined) return false;
  return !entity || activeEntityId === entity.id;
}
