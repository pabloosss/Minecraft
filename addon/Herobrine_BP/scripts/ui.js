import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import { blueprintNames } from "./blueprints.js";
import {
  cancelAllBuilds,
  forceBuildAtPlayer,
  isBuilding,
  resumeBuild,
} from "./building.js";
import {
  commandAction,
  scheduleNext,
  startController,
  stopController,
} from "./actions.js";
import {
  cancelTunnel,
  isTunneling,
  startTunnel,
} from "./tunnel.js";
import {
  resetHome,
  setHome,
  state,
  updateSettings,
} from "./storage.js";
import {
  allHerobrines,
  cleanupWaypoints,
  formatPos,
  getSurface,
} from "./utils.js";
import { IDS } from "./config.js";

function activityLabel(value) {
  return value === "quiet"
    ? "Cicha"
    : value === "active"
      ? "Aktywna"
      : "Normalna";
}

function yes(value) {
  return value ? "WL." : "WYL.";
}

function entityOrMessage(player) {
  const entity = allHerobrines()[0];
  if (!entity) player.sendMessage("§cNajpierw przywolaj Herobrine'a.");
  return entity;
}

function commandResult(player, result) {
  if (!result?.success) {
    player.sendMessage(`§c${result?.reason ?? "Polecenie nie zostalo wykonane."}`);
  } else {
    player.sendMessage("§7Herobrine przyjal polecenie.");
  }
}

export async function showMainMenu(player) {
  const data = state();
  const entity = allHerobrines()[0];

  const form = new ActionFormData()
    .title("Herobrine: He Is Watching")
    .body(
      `Wersja 0.11\n` +
      `Herobrine: ${entity ? "aktywny" : "brak"}\n` +
      `Dom: ${data.home.status}\n` +
      `Tunel: ${data.tunnel.status} (${data.tunnel.length} blokow)\n` +
      `Pozycja domu: ${formatPos(data.home.origin)}\n` +
      `Akcja: ${data.runtime.currentAction}`,
    )
    .button("Polecenia dla Herobrine'a")
    .button("Budowa i tunel")
    .button("Ustawienia")
    .button(entity ? "Pokaz status" : "Przywolaj Herobrine'a")
    .button("Diagnostyka")
    .button("Zamknij");

  try {
    const response = await form.show(player);
    if (response.canceled) return;

    if (response.selection === 0) return showCommands(player);
    if (response.selection === 1) return showBuildingMenu(player);
    if (response.selection === 2) return showSettings(player);
    if (response.selection === 3) {
      return entity ? showStatus(player) : spawnHerobrine(player);
    }
    if (response.selection === 4) return showDiagnostics(player);
  } catch (e) {
    player.sendMessage(
      `§cBlad menu: ${e}. Zamknij czat/inne okno i uzyj ksiazki ponownie.`,
    );
  }
}

async function showCommands(player) {
  const data = state();
  const form = new ActionFormData()
    .title("Polecenia dla Herobrine'a")
    .body(
      `Biezaca akcja: ${data.runtime.currentAction}\n` +
      `Dom: ${data.home.status}\n` +
      `Tunel: ${data.tunnel.status}`,
    )
    .button("Zbuduj dom przede mna")
    .button("Wznow budowe domu")
    .button("Wykop / rozbuduj tunel")
    .button("Patroluj okolice")
    .button("Obserwuj mnie")
    .button("Nasladuj mnie")
    .button("Zetnij drzewo")
    .button("Wroc do domu")
    .button("Zostaw czerwony znak")
    .button("Stoj w ciemnym domu")
    .button("Zatrzymaj obecna czynnosc")
    .button("Powrot");

  const response = await form.show(player);
  if (response.canceled || response.selection === 11) {
    return showMainMenu(player);
  }

  const entity = entityOrMessage(player);
  if (!entity) return;

  if (response.selection === 0) {
    stopController(entity, "manual_build");
    cancelTunnel(entity);
    forceBuildAtPlayer(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 1) {
    stopController(entity, "manual_resume");
    resumeBuild(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 2) {
    stopController(entity, "manual_tunnel");
    cancelAllBuilds();
    startTunnel(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 3) {
    commandResult(player, commandAction(entity, "patrol"));
  } else if (response.selection === 4) {
    commandResult(player, commandAction(entity, "observe"));
  } else if (response.selection === 5) {
    commandResult(player, commandAction(entity, "mimic"));
  } else if (response.selection === 6) {
    commandResult(player, commandAction(entity, "chop"));
  } else if (response.selection === 7) {
    commandResult(player, commandAction(entity, "home"));
  } else if (response.selection === 8) {
    commandResult(player, commandAction(entity, "warning"));
  } else if (response.selection === 9) {
    commandResult(player, commandAction(entity, "dark_home"));
  } else if (response.selection === 10) {
    cancelAllBuilds();
    cancelTunnel(entity);
    stopController(entity, "book_stop");
    player.sendMessage("§7Herobrine zatrzymal obecna czynnosc.");
  }

  system.runTimeout(() => showCommands(player), 10);
}

async function showBuildingMenu(player) {
  const data = state();
  const entity = allHerobrines()[0];

  const form = new ActionFormData()
    .title("Budowa i tunel")
    .body(
      `Dom: ${data.home.status}\n` +
      `Blok domu: ${data.home.buildIndex}\n` +
      `Pozycja: ${formatPos(data.home.origin)}\n` +
      `Tunel: ${data.tunnel.status}\n` +
      `Dlugosc tunelu: ${data.tunnel.length}`,
    )
    .button("Zbuduj dom przede mna")
    .button("Wznow budowe")
    .button("Wykop / przedluz tunel")
    .button("Reset domu i tunelu")
    .button("Powrot");

  const response = await form.show(player);
  if (response.canceled || response.selection === 4) {
    return showMainMenu(player);
  }
  if (!entity) {
    player.sendMessage("§cNajpierw przywolaj Herobrine'a.");
    return;
  }

  if (response.selection === 0) {
    stopController(entity, "manual_build");
    cancelTunnel(entity);
    forceBuildAtPlayer(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 1) {
    stopController(entity, "manual_resume");
    resumeBuild(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 2) {
    stopController(entity, "manual_tunnel");
    cancelAllBuilds();
    startTunnel(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 3) {
    return confirmReset(player);
  }
}

async function showSettings(player) {
  const data = state();
  const form = new ActionFormData()
    .title("Ustawienia Herobrine")
    .body("Zmiany zapisuja sie w swiecie.")
    .button(`Aktywnosc: ${activityLabel(data.settings.activity)}`)
    .button(`Tryb bezpieczny: ${yes(data.settings.safeMode)}`)
    .button(`Budowanie: ${yes(data.settings.buildingEnabled)}`)
    .button(`Ingerencje: ${yes(data.settings.interferenceEnabled)}`)
    .button(`Debug: ${yes(data.settings.debug)}`)
    .button(
      `Dom: ${
        blueprintNames().find(v => v.id === data.settings.houseVariant)?.name ??
        data.settings.houseVariant
      }`,
    )
    .button("Powrot");

  const response = await form.show(player);
  if (response.canceled || response.selection === 6) {
    return showMainMenu(player);
  }

  if (response.selection === 0) {
    const next =
      data.settings.activity === "quiet"
        ? "normal"
        : data.settings.activity === "normal"
          ? "active"
          : "quiet";
    updateSettings({ activity: next });
  } else if (response.selection === 1) {
    updateSettings({ safeMode: !data.settings.safeMode });
  } else if (response.selection === 2) {
    updateSettings({ buildingEnabled: !data.settings.buildingEnabled });
  } else if (response.selection === 3) {
    updateSettings({
      interferenceEnabled: !data.settings.interferenceEnabled,
    });
  } else if (response.selection === 4) {
    updateSettings({ debug: !data.settings.debug });
  } else if (response.selection === 5) {
    updateSettings({
      houseVariant:
        data.settings.houseVariant === "cabin" ? "watchtower" : "cabin",
    });
  }
  return showSettings(player);
}

async function confirmReset(player) {
  const response = await new MessageFormData()
    .title("Reset domu i tunelu")
    .body(
      "Resetuje zapis budowy i tunelu. Stare bloki pozostana w swiecie. Kontynuowac?",
    )
    .button1("Resetuj")
    .button2("Anuluj")
    .show(player);

  if (response.canceled || response.selection === 1) return;

  const entity = allHerobrines()[0];
  cancelAllBuilds();
  cancelTunnel(entity);
  if (entity) stopController(entity, "reset");
  resetHome();
  cleanupWaypoints();

  player.sendMessage("§7Zapis domu i tunelu zostal wyzerowany.");
  if (entity) startController(entity);
}

function showStatus(player) {
  const data = state();
  const entity = allHerobrines()[0];

  player.sendMessage("§8§l--- STATUS HEROBRINE v0.11 ---");
  player.sendMessage(`§7Encja: §f${entity ? entity.id : "brak"}`);
  player.sendMessage(`§7Akcja: §f${data.runtime.currentAction}`);
  player.sendMessage(
    `§7Dom: §f${data.home.status} ${formatPos(data.home.origin)}`,
  );
  player.sendMessage(`§7Budowa domu: §f${data.home.buildIndex}`);
  player.sendMessage(
    `§7Tunel: §f${data.tunnel.status}, dlugosc ${data.tunnel.length}`,
  );
  player.sendMessage(
    `§7Aktywny job: dom=${isBuilding(entity)}, tunel=${isTunneling(entity)}`,
  );

  if (data.home.pauseReason) {
    player.sendMessage(`§cDom: ${data.home.pauseReason}`);
  }
  if (data.tunnel.pauseReason) {
    player.sendMessage(`§cTunel: ${data.tunnel.pauseReason}`);
  }
  if (data.runtime.lastError) {
    player.sendMessage(`§cOstatni blad: ${data.runtime.lastError}`);
  }
}

function showDiagnostics(player) {
  const data = state();
  player.sendMessage(
    `§7Herobrine: ${allHerobrines().length}, ` +
    `dom=${data.home.status}, tunel=${data.tunnel.status}, ` +
    `akcja=${data.runtime.currentAction}`,
  );
  player.sendMessage("§7Log: Ustawienia -> Tworca -> Content Log GUI/File.");
  player.sendMessage(
    "§7Komendy: hiw:ping | menu | status | spawn | build | resume | tunnel | patrol | observe | mimic | chop | home | warning | stop | reset",
  );
}

export function spawnHerobrine(player) {
  if (allHerobrines().length) {
    player.sendMessage("§eHerobrine juz istnieje w tym swiecie.");
    return;
  }

  const view = player.getViewDirection();
  const x = player.location.x + view.x * 8;
  const z = player.location.z + view.z * 8;
  const surface = getSurface(player.dimension, x, z);
  const location = surface
    ? {
        x: surface.location.x + 0.5,
        y: surface.location.y + 1,
        z: surface.location.z + 0.5,
      }
    : { x, y: player.location.y, z };

  try {
    const entity = player.dimension.spawnEntity(IDS.herobrine, location);
    entity.addTag(IDS.primaryTag);
    startController(entity);
    player.sendMessage("§8Herobrine pojawil sie w swiecie.");
  } catch (e) {
    player.sendMessage(`§cNie udalo sie przywolac: ${e}`);
  }
}

export function handleScriptEvent(event) {
  const player =
    event.sourceEntity?.typeId === "minecraft:player"
      ? event.sourceEntity
      : undefined;
  const command = event.id.replace("hiw:", "");
  const entity = allHerobrines()[0];

  if (command === "menu" && player) return showMainMenu(player);
  if (command === "status" && player) return showStatus(player);
  if (command === "spawn" && player) return spawnHerobrine(player);

  if (command === "reset") {
    cancelAllBuilds();
    cancelTunnel(entity);
    if (entity) stopController(entity, "script_reset");
    resetHome();
    cleanupWaypoints();
    player?.sendMessage("§7Reset domu i tunelu wykonany.");
    if (entity) startController(entity);
    return;
  }

  if (!entity) {
    player?.sendMessage("§cNajpierw przywolaj Herobrine'a.");
    return;
  }

  if (command === "build" && player) {
    stopController(entity, "script_build");
    cancelTunnel(entity);
    forceBuildAtPlayer(entity, player, () => scheduleNext(entity, 50));
    return;
  }

  if (command === "resume") {
    stopController(entity, "script_resume");
    resumeBuild(entity, player, () => scheduleNext(entity, 50));
    return;
  }

  if (command === "tunnel") {
    stopController(entity, "script_tunnel");
    cancelAllBuilds();
    startTunnel(entity, player, () => scheduleNext(entity, 50));
    return;
  }

  if (command === "stop") {
    cancelAllBuilds();
    cancelTunnel(entity);
    stopController(entity, "script_stop");
    player?.sendMessage("§7Herobrine zatrzymany.");
    return;
  }

  const commandMap = {
    patrol: "patrol",
    observe: "observe",
    mimic: "mimic",
    chop: "chop",
    home: "home",
    warning: "warning",
    dark: "dark_home",
  };

  if (commandMap[command]) {
    commandResult(player, commandAction(entity, commandMap[command]));
  }
}
