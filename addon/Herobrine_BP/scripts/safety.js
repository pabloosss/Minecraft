import { system } from "@minecraft/server";
import { state } from "./storage.js";
import { isBuilding, rescueActiveBuilder } from "./building.js";
import { isTunneling, rescueActiveTunneler } from "./tunnel.js";
import { isRepairing } from "./maintenance.js";
import { entityInsideBlocks, healWorker, teleportWorkerSafely } from "./worker_safety.js";
import { getSurface, isValid, nearestPlayer } from "./utils.js";
const counters = new Map(); const cooldowns = new Map();
function genericRescue(entity) { const player = nearestPlayer(entity, 96); const home = state().home; const candidates = []; if (player) candidates.push({x: player.location.x + 4,y: player.location.y,z: player.location.z + 4}); if (home.origin) candidates.push({x: home.origin.x,y: home.origin.y,z: home.origin.z - 8}); candidates.push(entity.location); for (const candidate of candidates) { const surface = getSurface(entity.dimension, candidate.x, candidate.z); if (!surface) continue; if (teleportWorkerSafely(entity, {x: surface.location.x + 0.5,y: surface.location.y + 1,z: surface.location.z + 0.5}, player?.location ?? home.origin)) return true; } return false; }
export function rescueNow(entity) { if (!isValid(entity)) return false; if (isBuilding(entity) && rescueActiveBuilder(entity)) return true; if (isTunneling(entity) && rescueActiveTunneler(entity)) return true; return genericRescue(entity); }
export function safetyTick(entity) { if (!isValid(entity)) return; healWorker(entity); if (!state().settings.rescueEnabled) return; const inside = entityInsideBlocks(entity); const previous = counters.get(entity.id) ?? 0; counters.set(entity.id, inside ? previous + 1 : 0); if (!inside || previous < 1) return; const nextAllowed = cooldowns.get(entity.id) ?? 0; if (system.currentTick < nextAllowed) return; cooldowns.set(entity.id, system.currentTick + 20 * 6); if (isRepairing(entity)) { genericRescue(entity); return; } rescueNow(entity); counters.set(entity.id, 0); }
