import { ItemStack, system, world } from "@minecraft/server";
import { IDS } from "./config.js";
import { loadState, setRuntime, state } from "./storage.js";
import {
  allHerobrines,
  allWaypoints,
  cleanupWaypoints,
  distance,
  isValid,
  lookAt,
  nearestPlayer,
  play,
  smoke,
  sound,
} from "./utils.js";
import { hasMovement } from "./movement.js";
import {
  recoverController,
  startController,
} from "./actions.js";
import { isBuilding } from "./building.js";
import { isTunneling } from "./tunnel.js";
import { handleScriptEvent, showMainMenu } from "./ui.js";
import { info } from "./logger.js";

const GUIDE_KEY = "hiw:v11_guide_received";
const proximityCooldown = new Map();

function choosePrimary(preferred = undefined) {
  const entities = allHerobrines();

  let primary =
    preferred && isValid(preferred)
      ? preferred
      : entities.find(entity => entity.hasTag(IDS.primaryTag));

  if (!primary && entities.length) primary = entities[0];

  if (primary && !primary.hasTag(IDS.primaryTag)) {
    try {
      primary.addTag(IDS.primaryTag);
    } catch {}
  }

  for (const entity of entities) {
    if (primary && entity.id !== primary.id) {
      try {
        entity.remove();
      } catch {}
    }
  }

  return primary;
}

function initializePrimary(primary, force = false) {
  if (!isValid(primary)) return undefined;

  const previousId = state().runtime.activeEntityId;
  const isNewPrimary = force || previousId !== primary.id;

  if (isNewPrimary) {
    try {
      primary.triggerEvent("hiw:set_idle");
    } catch {}

    setRuntime({
      activeEntityId: primary.id,
      currentAction: "idle",
      actionStartedTick: 0,
      lastError: "",
    });
  }

  startController(primary);
  return primary;
}

function maintainSingleton(preferred = undefined, forceInitialize = false) {
  const primary = choosePrimary(preferred);
  if (!primary) return undefined;

  const activeId = state().runtime.activeEntityId;
  if (forceInitialize || activeId !== primary.id) {
    return initializePrimary(primary, true);
  }

  return primary;
}

function giveGuide(player) {
  if (player.getDynamicProperty(GUIDE_KEY)) return;

  try {
    player
      .getComponent("minecraft:inventory")
      ?.container
      ?.addItem(new ItemStack(IDS.guide, 1));

    player.setDynamicProperty(GUIDE_KEY, true);
    player.sendMessage(
      "§fOtrzymales §4Dziennik Herobrine'a§f. " +
      "Ksiazka zawiera teraz osobne polecenia.",
    );
  } catch {}
}

system.run(() => {
  loadState();
  cleanupWaypoints();

  const primary = maintainSingleton(undefined, true);
  if (primary) startController(primary);

  info("startup", "Herobrine v0.11 uruchomiony.");
});

world.afterEvents.playerSpawn.subscribe(event => {
  if (!event.initialSpawn) return;

  system.runTimeout(() => {
    giveGuide(event.player);
    event.player.sendMessage(
      "§2[HIW] Rdzen v0.11 dziala. Otworz ksiazke i wybierz Polecenia.",
    );

    const primary = maintainSingleton();
    if (primary) startController(primary);
  }, 20);
});

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack?.typeId === IDS.guide) {
    system.run(() => showMainMenu(event.source));
  }
});

world.afterEvents.entitySpawn.subscribe(event => {
  if (event.entity?.typeId !== IDS.herobrine) return;

  system.runTimeout(() => {
    const primary = maintainSingleton(event.entity, true);
    const player = primary ? nearestPlayer(primary) : undefined;
    player?.sendMessage(
      "§8[HIW] Herobrine otrzymal kontroler v0.11.",
    );
  }, 5);
});

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id === "hiw:ping") {
    const player =
      event.sourceEntity?.typeId === "minecraft:player"
        ? event.sourceEntity
        : undefined;

    const primary = maintainSingleton();
    const data = state();

    player?.sendMessage("§2[HIW] Skrypt v0.11 dziala.");
    player?.sendMessage(
      `§7Herobrine=${primary ? "tak" : "nie"}, ` +
      `akcja=${data.runtime.currentAction}, ` +
      `dom=${data.home.status}, tunel=${data.tunnel.status}, ` +
      `ruch=${primary && hasMovement(primary) ? "tak" : "nie"}, ` +
      `jobDom=${primary && isBuilding(primary) ? "tak" : "nie"}, ` +
      `jobTunel=${primary && isTunneling(primary) ? "tak" : "nie"}`,
    );
    return;
  }

  if (event.id.startsWith("hiw:")) {
    handleScriptEvent(event);
  }
});

system.runInterval(() => {
  const primary = maintainSingleton();
  if (
    !primary ||
    hasMovement(primary) ||
    isBuilding(primary) ||
    isTunneling(primary)
  ) {
    return;
  }

  const data = state();
  if (!["idle", "observe"].includes(data.runtime.currentAction)) return;

  const player = nearestPlayer(primary, 8);
  if (!player) return;

  const currentDistance = distance(primary.location, player.location);
  if (currentDistance > 4.5) return;

  const nextAllowed = proximityCooldown.get(primary.id) ?? 0;
  if (system.currentTick < nextAllowed) return;
  proximityCooldown.set(primary.id, system.currentTick + 20 * 8);

  try {
    primary.triggerEvent("hiw:set_freeze");
  } catch {}

  lookAt(primary, player.location);
  play(primary, "animation.hiw.herobrine.stare");
  sound(primary.dimension, "ambient.cave", primary.location, 0.5, 0.8);

  player.onScreenDisplay.setActionBar(
    "§8Herobrine zauwazyl, ze podchodzisz...",
  );

  if (currentDistance <= 2.8) {
    smoke(primary.dimension, primary.location);
    try {
      primary.addEffect("invisibility", 30, { showParticles: false });
    } catch {}
  }

  system.runTimeout(() => {
    if (!isValid(primary)) return;

    try {
      primary.removeEffect("invisibility");
      primary.triggerEvent("hiw:set_idle");
    } catch {}

    startController(primary);
  }, 35);
}, 10);

system.runInterval(() => {
  const primary = maintainSingleton();

  if (!primary && allWaypoints().length) {
    cleanupWaypoints();
    return;
  }

  if (primary) recoverController(primary);

  const data = state();
  if (data.settings.debug) {
    for (const player of world.getAllPlayers()) {
      player.onScreenDisplay.setActionBar(
        `§8HIW v0.11 | dom ${data.home.status} ${data.home.buildIndex} | ` +
        `tunel ${data.tunnel.status} ${data.tunnel.length} | ` +
        `${data.runtime.currentAction}`,
      );
    }
  }
}, 100);
