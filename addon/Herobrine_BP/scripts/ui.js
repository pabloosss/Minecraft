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
  cancelRepair,
  inspectHome,
  isRepairing,
  repairHome,
} from "./maintenance.js";
import {
  resetHome,
  state,
  updateSettings,
} from "./storage.js";
import {
  allHerobrines,
  cleanupWaypoints,
  formatPos,
  getSurface,
} from "./utils.js";
import { rescueNow } from "./safety.js";
import { IDS } from "./config.js";

function activityLabel(value) {
  return value === "quiet" ? "Cicha" : value === "active" ? "Aktywna" : "Normalna";
}
function movementLabel(value) {
  return value === "careful" ? "Ostrozny" : value === "fast" ? "Szybki" : "Normalny";
}
function paceLabel(value) {
  return value === "slow" ? "Wolne" : value === "fast" ? "Szybkie" : "Normalne";
}
function yes(value) { return value ? "WL." : "WYL."; }

function entityOrMessage(player) {
  const entity = allHerobrines()[0];
  if (!entity) player.sendMessage("§cNajpierw przywolaj Herobrine'a.");
  return entity;
}

function commandResult(player, result) {
  player.sendMessage(
    result?.success
      ? "§7Herobrine przyjal polecenie."
      : `§c${result?.reason ?? "Polecenie nie zostalo wykonane."}`,
  );
}

function stopEverything(entity, reason) {
  cancelAllBuilds();
  cancelTunnel(entity);
  cancelRepair(entity);
  if (entity) stopController(entity, reason);
}

export async function showMainMenu(player) {
  const data = state();
  const entity = allHerobrines()[0];
  const form = new ActionFormData()
    .title("Herobrine: He Is Watching")
    .body(
      `Wersja 0.14\n` +
      `Herobrine: ${entity ? "aktywny" : "brak"}\n` +
      `Dom: ${data.home.status}\n` +
      `Tunel: ${data.tunnel.status} (${data.tunnel.length} blokow)\n` +
      `Pozycja domu: ${formatPos(data.home.origin)}\n` +
      `Akcja: ${data.runtime.currentAction}`,
    )
    .button("Ruch i obecność")
    .button("Straszenie i interakcje")
    .button("Budowa, tunel i naprawa")
    .button("Ustawienia")
    .button(entity ? "Pokaz status" : "Przywolaj Herobrine'a")
    .button("Diagnostyka")
    .button("Zamknij");

  try {
    const response = await form.show(player);
    if (response.canceled) return;
    if (response.selection === 0) return showMovementMenu(player);
    if (response.selection === 1) return showInteractionMenu(player);
    if (response.selection === 2) return showBuildingMenu(player);
    if (response.selection === 3) return showSettings(player);
    if (response.selection === 4) return entity ? showStatus(player) : spawnHerobrine(player);
    if (response.selection === 5) return showDiagnostics(player);
  } catch (e) {
    player.sendMessage(`§cBlad menu: ${e}. Zamknij inne okno i uzyj ksiazki ponownie.`);
  }
}

async function showMovementMenu(player) {
  const form = new ActionFormData()
    .title("Ruch i obecność")
    .body("Kazde nowe polecenie anuluje poprzednia czynnosc.")
    .button("Podejdz do mnie")
    .button("Podazaj za mna przez 35 s")
    .button("Czekaj tutaj przez 60 s")
    .button("Patroluj okolice")
    .button("Pilnuj domu")
    .button("Wroc do domu")
    .button("Wyciagnij z blokow")
    .button("Zatrzymaj obecna czynnosc")
    .button("Powrot");
  const response = await form.show(player);
  if (response.canceled || response.selection === 8) return showMainMenu(player);
  const entity = entityOrMessage(player);
  if (!entity) return;

  if (response.selection === 6) {
    stopEverything(entity, "manual_rescue");
    player.sendMessage(rescueNow(entity) ? "§2Herobrine zostal przeniesiony w bezpieczne miejsce." : "§cNie znaleziono bezpiecznego miejsca.");
  } else if (response.selection === 7) {
    stopEverything(entity, "book_stop");
    player.sendMessage("§7Herobrine zatrzymal obecna czynnosc.");
  } else {
    const map = ["come", "follow", "wait", "patrol", "guard", "home"];
    commandResult(player, commandAction(entity, map[response.selection]));
  }
}

async function showInteractionMenu(player) {
  const form = new ActionFormData()
    .title("Straszenie i interakcje")
    .button("Obserwuj mnie z oddali")
    .button("Nasladuj mnie")
    .button("Zetnij drzewo")
    .button("Zostaw czerwony znak")
    .button("Stoj w ciemnym domu")
    .button("Powrot");
  const response = await form.show(player);
  if (response.canceled || response.selection === 5) return showMainMenu(player);
  const entity = entityOrMessage(player);
  if (!entity) return;
  const map = ["observe", "mimic", "chop", "warning", "dark_home"];
  commandResult(player, commandAction(entity, map[response.selection]));
}

async function showBuildingMenu(player) {
  const data = state();
  const entity = allHerobrines()[0];
  const form = new ActionFormData()
    .title("Budowa, tunel i naprawa")
    .body(
      `Dom: ${data.home.status}\n` +
      `Blok domu: ${data.home.buildIndex}\n` +
      `Tunel: ${data.tunnel.status}\n` +
      `Dlugosc tunelu: ${data.tunnel.length}`,
    )
    .button("Zbuduj dom przede mna")
    .button("Wznow budowe domu")
    .button("Wykop / przedluz tunel")
    .button("Sprawdz stan domu")
    .button("Napraw brakujace bloki domu")
    .button("Reset domu i tunelu")
    .button("Powrot");
  const response = await form.show(player);
  if (response.canceled || response.selection === 6) return showMainMenu(player);
  if (!entity) {
    player.sendMessage("§cNajpierw przywolaj Herobrine'a.");
    return;
  }

  if (response.selection === 0) {
    stopEverything(entity, "manual_build");
    forceBuildAtPlayer(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 1) {
    stopEverything(entity, "manual_resume");
    resumeBuild(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 2) {
    stopEverything(entity, "manual_tunnel");
    startTunnel(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 3) {
    const report = inspectHome(entity);
    player.sendMessage(
      `§7Dom: poprawne=${report.correct}/${report.total}, brakujace=${report.missing}, zablokowane=${report.blocked}`,
    );
  } else if (response.selection === 4) {
    stopEverything(entity, "manual_repair");
    repairHome(entity, player, () => scheduleNext(entity, 50));
  } else if (response.selection === 5) {
    return confirmReset(player);
  }
}

async function showSettings(player) {
  const data = state();
  const form = new ActionFormData()
    .title("Ustawienia Herobrine")
    .body("Zmiany zapisuja sie w swiecie.")
    .button(`Aktywnosc: ${activityLabel(data.settings.activity)}`)
    .button(`Ruch: ${movementLabel(data.settings.movementMode)}`)
    .button(`Tempo budowy: ${paceLabel(data.settings.buildPace)}`)
    .button(`Samodzielne akcje: ${yes(data.settings.autonomous)}`)
    .button(`Straszenie z bliska: ${yes(data.settings.proximityScares)}`)
    .button(`Ratowanie z blokow: ${yes(data.settings.rescueEnabled)}`)
    .button(`Tryb bezpieczny: ${yes(data.settings.safeMode)}`)
    .button(`Budowanie: ${yes(data.settings.buildingEnabled)}`)
    .button(`Ingerencje: ${yes(data.settings.interferenceEnabled)}`)
    .button(`Debug: ${yes(data.settings.debug)}`)
    .button(`Dom: ${blueprintNames().find(v => v.id === data.settings.houseVariant)?.name ?? data.settings.houseVariant}`)
    .button("Powrot");
  const response = await form.show(player);
  if (response.canceled || response.selection === 11) return showMainMenu(player);

  if (response.selection === 0) {
    const next = data.settings.activity === "quiet" ? "normal" : data.settings.activity === "normal" ? "active" : "quiet";
    updateSettings({ activity: next });
  } else if (response.selection === 1) {
    const next = data.settings.movementMode === "careful" ? "normal" : data.settings.movementMode === "normal" ? "fast" : "careful";
    updateSettings({ movementMode: next });
  } else if (response.selection === 2) {
    const next = data.settings.buildPace === "slow" ? "normal" : data.settings.buildPace === "normal" ? "fast" : "slow";
    updateSettings({ buildPace: next });
  } else if (response.selection === 3) updateSettings({ autonomous: !data.settings.autonomous });
  else if (response.selection === 4) updateSettings({ proximityScares: !data.settings.proximityScares });
  else if (response.selection === 5) updateSettings({ rescueEnabled: !data.settings.rescueEnabled });
  else if (response.selection === 6) updateSettings({ safeMode: !data.settings.safeMode });
  else if (response.selection === 7) updateSettings({ buildingEnabled: !data.settings.buildingEnabled });
  else if (response.selection === 8) updateSettings({ interferenceEnabled: !data.settings.interferenceEnabled });
  else if (response.selection === 9) updateSettings({ debug: !data.settings.debug });
  else if (response.selection === 10) updateSettings({ houseVariant: data.settings.houseVariant === "cabin" ? "watchtower" : "cabin" });
  return showSettings(player);
}

async function confirmReset(player) {
  const response = await new MessageFormData()
    .title("Reset domu i tunelu")
    .body("Resetuje zapis budowy i tunelu. Stare bloki pozostana w swiecie. Kontynuowac?")
    .button1("Resetuj")
    .button2("Anuluj")
    .show(player);
  if (response.canceled || response.selection === 1) return;
  const entity = allHerobrines()[0];
  stopEverything(entity, "reset");
  resetHome();
  cleanupWaypoints();
  player.sendMessage("§7Zapis domu i tunelu zostal wyzerowany.");
  if (entity) startController(entity);
}

function showStatus(player) {
  const data = state();
  const entity = allHerobrines()[0];
  const repair = entity ? isRepairing(entity) : false;
  player.sendMessage("§8§l--- STATUS HEROBRINE v0.14 ---");
  player.sendMessage(`§7Encja: §f${entity ? entity.id : "brak"}`);
  player.sendMessage(`§7Akcja: §f${data.runtime.currentAction}`);
  player.sendMessage(`§7Dom: §f${data.home.status} ${formatPos(data.home.origin)}`);
  player.sendMessage(`§7Budowa domu: §f${data.home.buildIndex}`);
  player.sendMessage(`§7Tunel: §f${data.tunnel.status}, dlugosc ${data.tunnel.length}`);
  player.sendMessage(`§7Aktywne: dom=${entity && isBuilding(entity)}, tunel=${entity && isTunneling(entity)}, naprawa=${repair}`);
  if (data.home.pauseReason) player.sendMessage(`§cDom: ${data.home.pauseReason}`);
  if (data.tunnel.pauseReason) player.sendMessage(`§cTunel: ${data.tunnel.pauseReason}`);
  if (data.runtime.lastError) player.sendMessage(`§cOstatni blad: ${data.runtime.lastError}`);
}

function showDiagnostics(player) {
  const data = state();
  player.sendMessage(
    `§7Herobrine: ${allHerobrines().length}, dom=${data.home.status}, tunel=${data.tunnel.status}, akcja=${data.runtime.currentAction}`,
  );
  player.sendMessage("§7Komendy: ping, menu, status, spawn, build, resume, tunnel, repair, inspect, come, follow, wait, patrol, guard, observe, mimic, chop, home, warning, rescue, stop, reset");
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
    ? { x: surface.location.x + 0.5, y: surface.location.y + 1, z: surface.location.z + 0.5 }
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
  const player = event.sourceEntity?.typeId === "minecraft:player" ? event.sourceEntity : undefined;
  const command = event.id.replace("hiw:", "");
  const entity = allHerobrines()[0];
  if (command === "menu" && player) return showMainMenu(player);
  if (command === "status" && player) return showStatus(player);
  if (command === "spawn" && player) return spawnHerobrine(player);

  if (command === "reset") {
    stopEverything(entity, "script_reset");
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
    stopEverything(entity, "script_build");
    forceBuildAtPlayer(entity, player, () => scheduleNext(entity, 50));
  } else if (command === "resume") {
    stopEverything(entity, "script_resume");
    resumeBuild(entity, player, () => scheduleNext(entity, 50));
  } else if (command === "tunnel") {
    stopEverything(entity, "script_tunnel");
    startTunnel(entity, player, () => scheduleNext(entity, 50));
  } else if (command === "repair") {
    stopEverything(entity, "script_repair");
    repairHome(entity, player, () => scheduleNext(entity, 50));
  } else if (command === "inspect") {
    const report = inspectHome(entity);
    player?.sendMessage(`§7Dom: poprawne=${report.correct}/${report.total}, brakujace=${report.missing}, zablokowane=${report.blocked}`);
  } else if (command === "rescue") {
    stopEverything(entity, "script_rescue");
    player?.sendMessage(rescueNow(entity) ? "§2Herobrine uratowany." : "§cBrak bezpiecznego miejsca.");
  } else if (command === "stop") {
    stopEverything(entity, "script_stop");
    player?.sendMessage("§7Herobrine zatrzymany.");
  } else {
    const commandMap = {
      come: "come", follow: "follow", wait: "wait", patrol: "patrol", guard: "guard",
      observe: "observe", mimic: "mimic", chop: "chop", home: "home",
      warning: "warning", dark: "dark_home",
    };
    if (commandMap[command]) commandResult(player, commandAction(entity, commandMap[command]));
  }
}
