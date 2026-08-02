import { system } from "@minecraft/server";
import { BUILD } from "./config.js";
import { getBlueprint } from "./blueprints.js";
import { findBuildingSite, findSiteInFront } from "./site.js";
import { cancelMovement, goTo, hasMovement } from "./movement.js";
import {
  recordError,
  resetHome,
  setHome,
  setRuntime,
  state,
} from "./storage.js";
import {
  blockAt,
  distance,
  equip,
  isProtectedType,
  isReplaceableType,
  lookAt,
  play,
  sound,
} from "./utils.js";
import { error, info } from "./logger.js";

let activeJob;
let activeEntityId = "";
let generation = 0;
let searchActive = false;

function absolute(origin, offset) {
  return {
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    z: origin.z + offset.z,
  };
}

function sortedBlocks(blueprint) {
  return [...blueprint.blocks].sort(
    (a, b) =>
      a.phase - b.phase ||
      String(a.zone).localeCompare(String(b.zone)) ||
      a.offset.y - b.offset.y,
  );
}

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

function naturalObstacle(typeId) {
  if (!typeId) return false;
  return (
    typeId.includes("leaves") ||
    typeId.includes("_log") ||
    typeId.includes("_wood") ||
    typeId.includes("_stem") ||
    typeId.includes("dirt") ||
    typeId.includes("grass_block") ||
    typeId.includes("stone") ||
    typeId.includes("deepslate") ||
    typeId.includes("sand") ||
    typeId.includes("gravel") ||
    typeId.includes("snow")
  );
}

function workPoint(origin, block, blueprint) {
  const target = absolute(origin, block.offset);
  const r = blueprint.radius + 2;

  if (block.zone === "north") {
    return { x: target.x + 0.5, y: origin.y, z: origin.z - r };
  }
  if (block.zone === "south") {
    return { x: target.x + 0.5, y: origin.y, z: origin.z + r };
  }
  if (block.zone === "west") {
    return { x: origin.x - r, y: origin.y, z: target.z + 0.5 };
  }
  if (block.zone === "east") {
    return { x: origin.x + r, y: origin.y, z: target.z + 0.5 };
  }
  if (block.zone === "roof") {
    return { x: origin.x + r, y: origin.y, z: origin.z - r };
  }
  if (block.zone === "inside") {
    return { x: origin.x + 0.5, y: origin.y + 1, z: origin.z - 1.5 };
  }

  const dx = block.offset.x;
  const dz = block.offset.z;
  if (Math.abs(dx) >= Math.abs(dz)) {
    return {
      x: target.x + (dx >= 0 ? -1.7 : 1.7),
      y: origin.y,
      z: target.z + 0.5,
    };
  }
  return {
    x: target.x + 0.5,
    y: origin.y,
    z: target.z + (dz >= 0 ? -1.7 : 1.7),
  };
}

function cleanup(entity) {
  if (activeJob !== undefined) {
    activeJob = undefined;
  }
  activeEntityId = "";
  equip(entity, undefined);
}

function pauseBuild(entity, message) {
  cleanup(entity);
  setHome({ status: "paused", pauseReason: message });
  setRuntime({
    currentAction: "build_paused",
    actionStartedTick: 0,
    lastError: message,
  });
  recordError(message);
}

function* preparationGenerator(entity, origin, blueprint, token) {
  const radius = blueprint.radius + 1;
  const dimension = entity.dimension;

  setHome({ status: "preparing", pauseReason: "" });
  setRuntime({
    currentAction: "preparing_site",
    actionStartedTick: system.currentTick,
  });
  equip(entity, "minecraft:iron_shovel");

  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      if (!entity.isValid || token !== generation) return;

      const worldX = origin.x + x;
      const worldZ = origin.z + z;

      for (let y = origin.y - 4; y <= origin.y - 1; y++) {
        const block = blockAt(dimension, { x: worldX, y, z: worldZ });
        if (!block) throw new Error("Chunk terenu zostal odladowany.");
        if (isProtectedType(block.typeId)) {
          throw new Error(
            `Chroniony blok ${block.typeId} pod miejscem budowy.`,
          );
        }
        if (isReplaceableType(block.typeId)) {
          directSet(
            dimension,
            { x: worldX, y, z: worldZ },
            y === origin.y - 1 ? "minecraft:dirt" : "minecraft:stone",
          );
        }
        yield;
      }

      for (let y = origin.y; y <= origin.y + blueprint.height + 2; y++) {
        const location = { x: worldX, y, z: worldZ };
        const block = blockAt(dimension, location);
        if (!block) throw new Error("Chunk domu zostal odladowany.");

        if (isProtectedType(block.typeId)) {
          throw new Error(
            `Chroniony blok ${block.typeId} przy ${worldX} ${y} ${worldZ}.`,
          );
        }

        if (
          block.typeId !== "minecraft:air" &&
          (isReplaceableType(block.typeId) || naturalObstacle(block.typeId))
        ) {
          directSet(dimension, location, "minecraft:air");
        }
        yield;
      }

      const support = { x: worldX, y: origin.y - 1, z: worldZ };
      const supportBlock = blockAt(dimension, support);
      if (!supportBlock) throw new Error("Brak dostepu do fundamentu.");
      if (isProtectedType(supportBlock.typeId)) {
        throw new Error(`Chroniony fundament ${supportBlock.typeId}.`);
      }
      directSet(dimension, support, "minecraft:dirt");
      yield;
    }
  }

  setHome({ prepared: true, status: "building", pauseReason: "" });
}

function* houseGenerator(entity, player, onReady, token) {
  const data = state();
  const home = data.home;
  const blueprint = getBlueprint(home.variant);
  const blocks = sortedBlocks(blueprint);
  let index = Math.max(0, Math.min(home.buildIndex ?? 0, blocks.length));
  let lastZone = "";
  let lastWorkPoint;

  try {
    if (!home.prepared) {
      yield* preparationGenerator(entity, home.origin, blueprint, token);
    }

    if (!entity.isValid || token !== generation) return;

    setHome({ status: "building", pauseReason: "" });
    setRuntime({
      currentAction: "building",
      actionStartedTick: system.currentTick,
    });
    equip(entity, "minecraft:iron_axe");

    while (entity.isValid && token === generation && index < blocks.length) {
      const block = blocks[index];
      const target = absolute(home.origin, block.offset);
      const existing = blockAt(entity.dimension, target);

      if (!existing) {
        throw new Error("Chunk domu nie jest zaladowany.");
      }
      if (isProtectedType(existing.typeId)) {
        throw new Error(
          `Chroniony blok ${existing.typeId} przy ${target.x} ${target.y} ${target.z}.`,
        );
      }

      const point = workPoint(home.origin, block, blueprint);
      const changedZone = block.zone !== lastZone;
      const changedPosition =
        !lastWorkPoint || distance(lastWorkPoint, point) >= 2.5;

      if ((changedZone || changedPosition) && !hasMovement(entity)) {
        goTo(entity, point, {
          timeoutTicks: BUILD.moveTimeoutTicks,
          face: target,
          retries: 0,
        }).catch(() => {});
        lastZone = block.zone;
        lastWorkPoint = point;

        for (let wait = 0; wait < BUILD.movementPauseTicks; wait++) {
          yield;
        }
      }

      lookAt(entity, {
        x: target.x + 0.5,
        y: target.y + 0.5,
        z: target.z + 0.5,
      });
      play(entity, "animation.hiw.herobrine.attack");

      if (existing.typeId !== block.typeId) {
        if (!directSet(entity.dimension, target, block.typeId)) {
          throw new Error(`Nie udalo sie postawic ${block.typeId}.`);
        }
        sound(entity.dimension, block.sound, target, 0.82, 0.45);
      }

      index++;
      if (index % BUILD.saveEveryBlocks === 0) {
        setHome({ buildIndex: index });
      }

      if (player && index % 25 === 0) {
        try {
          player.onScreenDisplay.setActionBar(
            `§8Budowa domu: ${index}/${blocks.length}`,
          );
        } catch {}
      }

      for (let delay = 0; delay < BUILD.blockDelayTicks; delay++) {
        yield;
      }
    }

    if (!entity.isValid || token !== generation) return;

    cancelMovement(entity, "build_complete");
    cleanup(entity);
    setHome({
      status: "complete",
      prepared: true,
      buildIndex: blocks.length,
      pauseReason: "",
    });
    setRuntime({
      currentAction: "idle",
      lastAction: "building",
      actionStartedTick: 0,
    });

    sound(entity.dimension, "ambient.cave", home.origin, 0.5, 1.0);
    if (player) {
      try {
        player.sendMessage("§2[Herobrine] Dom zostal ukonczony.");
      } catch {}
    }
    info("build", `Dom ${home.variant} zakonczony.`);
    if (onReady) system.run(() => onReady());
  } catch (e) {
    error("build", e);
    pauseBuild(
      entity,
      `Blad budowy: ${e instanceof Error ? e.message : String(e)}`,
    );
    if (player) {
      try {
        player.sendMessage(
          `§c[Herobrine] Budowa zatrzymana: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      } catch {}
    }
  } finally {
    if (activeEntityId === entity.id) {
      cleanup(entity);
    }
  }
}

function launchBuild(entity, player, onReady) {
  if (!entity?.isValid || activeJob !== undefined) return false;
  const token = generation;
  activeEntityId = entity.id;
  const generator = houseGenerator(entity, player, onReady, token);
  activeJob = system.runJob(generator);
  return true;
}

export function ensureHome(entity, player, onReady) {
  if (!entity?.isValid || activeJob !== undefined) return;
  const value = state();

  const dimensionId = entity.dimension.id;
  if (dimensionId !== "minecraft:overworld" && dimensionId !== "overworld") {
    setHome({
      status: "paused",
      pauseReason: "Dom mozna budowac tylko w Overworldzie.",
    });
    player?.sendMessage(
      "§c[Herobrine] Budowanie domu dziala tylko w normalnym swiecie.",
    );
    return;
  }

  if (value.home.status === "complete" && value.home.origin) {
    onReady?.();
    return;
  }

  if (
    ["preparing", "building", "paused"].includes(value.home.status) &&
    value.home.origin
  ) {
    if (value.home.status === "paused") {
      setHome({ status: "building", pauseReason: "" });
    }
    launchBuild(entity, player, onReady);
    return;
  }

  if (!value.settings.buildingEnabled || searchActive) return;

  searchActive = true;
  setHome({ status: "searching", pauseReason: "" });
  setRuntime({
    currentAction: "site_search",
    actionStartedTick: system.currentTick,
  });

  findBuildingSite(
    entity,
    player,
    value.settings.houseVariant,
    site => {
      searchActive = false;

      if (!site) {
        setHome({
          status: "none",
          pauseReason:
            "Nie znaleziono miejsca automatycznie. Uzyj ksiazki i opcji Buduj dom przede mna.",
        });
        recordError(
          "Brak automatycznego miejsca na dom. Uzyj polecenia w ksiazce.",
        );
        player?.sendMessage(
          "§e[Herobrine] Nie znalazlem miejsca automatycznie. " +
          "Stan na otwartym terenie, patrz przed siebie i wybierz w ksiazce " +
          "§fZbuduj dom przede mna§e.",
        );
        return;
      }

      setHome({
        status: "building",
        dimension: entity.dimension.id,
        origin: site.origin,
        variant: value.settings.houseVariant,
        prepared: false,
        buildIndex: 0,
        pauseReason: "",
      });
      launchBuild(entity, player, onReady);
    },
  );
}

export function forceBuildAtPlayer(entity, player, onReady) {
  if (!entity?.isValid || !player?.isValid) return false;

  const site = findSiteInFront(player, state().settings.houseVariant);
  if (!site) {
    player.sendMessage(
      "§c[Herobrine] Nie ma bezpiecznego miejsca przed toba. " +
      "Wyjdz na otwarty teren i sprobuj ponownie.",
    );
    return false;
  }

  cancelAllBuilds();
  resetHome();
  setHome({
    status: "building",
    dimension: player.dimension.id,
    origin: site.origin,
    variant: state().settings.houseVariant,
    prepared: false,
    buildIndex: 0,
    pauseReason: "",
  });

  player.sendMessage(
    `§7[Herobrine] Buduje dom przy ${site.origin.x} ${site.origin.y} ${site.origin.z}.`,
  );

  goTo(
    entity,
    {
      x: site.origin.x + getBlueprint(state().settings.houseVariant).radius + 2,
      y: site.origin.y,
      z: site.origin.z,
    },
    { face: site.origin, retries: 0 },
  ).catch(() => {});

  return launchBuild(entity, player, onReady);
}

export function resumeBuild(entity, player, onReady) {
  if (state().home.status === "paused") {
    setHome({ status: "building", pauseReason: "" });
  }
  ensureHome(entity, player, onReady);
}

export function cancelAllBuilds() {
  generation++;
  searchActive = false;
  if (activeJob !== undefined) {
    try {
      system.clearJob(activeJob);
    } catch {}
  }
  activeJob = undefined;
  activeEntityId = "";
}

export function isBuilding(entity = undefined) {
  if (activeJob === undefined) return false;
  return !entity || activeEntityId === entity.id;
}
