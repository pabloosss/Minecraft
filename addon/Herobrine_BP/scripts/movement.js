import { system } from "@minecraft/server";
import { IDS, MOVEMENT } from "./config.js";
import { debug, error } from "./logger.js";
import { cleanupWaypoints, distance, isChunkLoaded, isValid } from "./utils.js";

const jobs = new Map();

function finish(entity, job, success, reason) {
  if (jobs.get(entity.id) !== job) return;
  if (job.interval !== undefined) system.clearRun(job.interval);
  try {
    if (job.waypoint?.isValid) job.waypoint.remove();
  } catch {}
  try {
    if (entity.isValid) entity.triggerEvent("hiw:set_idle");
  } catch {}
  jobs.delete(entity.id);
  job.resolve({ success, reason });
}

export function cancelMovement(entity, reason = "cancelled") {
  const job = jobs.get(entity.id);
  if (job) finish(entity, job, false, reason);
}

function goToOnce(entity, target, options = {}) {
  cancelMovement(entity, "replaced");
  return new Promise(resolve => {
    if (!isValid(entity)) return resolve({ success: false, reason: "invalid_entity" });
    const destination = { x: target.x, y: target.y, z: target.z };
    if (!isChunkLoaded(entity.dimension, destination)) {
      return resolve({ success: false, reason: "unloaded_chunk" });
    }

    cleanupWaypoints();
    let waypoint;
    try {
      waypoint = entity.dimension.spawnEntity(IDS.waypoint, destination);
    } catch (e) {
      error("movement-spawn", e);
      return resolve({ success: false, reason: "waypoint_spawn" });
    }

    try {
      entity.triggerEvent("hiw:set_move");
    } catch {}

    const job = {
      waypoint,
      resolve,
      started: system.currentTick,
      lastProgress: system.currentTick,
      lastDistance: distance(entity.location, destination),
      interval: undefined,
    };
    jobs.set(entity.id, job);

    const arrival = options.arrivalRadius ?? MOVEMENT.arrivalRadius;
    const timeout = options.timeoutTicks ?? MOVEMENT.timeoutTicks;

    job.interval = system.runInterval(() => {
      if (!isValid(entity) || !waypoint?.isValid) return finish(entity, job, false, "invalid");
      const current = distance(entity.location, destination);
      if (current <= arrival) return finish(entity, job, true, "arrived");

      if (job.lastDistance - current >= MOVEMENT.progressEpsilon) {
        job.lastDistance = current;
        job.lastProgress = system.currentTick;
      }
      if (system.currentTick - job.lastProgress > MOVEMENT.stuckTicks) {
        return finish(entity, job, false, "stuck");
      }
      if (system.currentTick - job.started > timeout) {
        return finish(entity, job, false, "timeout");
      }
      if (options.face) {
        try {
          entity.lookAt(options.face);
        } catch {}
      }
      debug("move", `d=${current.toFixed(1)}`, system.currentTick);
    }, MOVEMENT.pollTicks);
  });
}

export async function goTo(entity, target, options = {}) {
  const retries = Math.max(0, options.retries ?? 0);
  let result;
  for (let attempt = 0; attempt <= retries; attempt++) {
    result = await goToOnce(entity, target, options);
    if (result.success || !["stuck", "timeout", "invalid"].includes(result.reason)) return result;
    if (!isValid(entity)) return result;
    await new Promise(resolve => system.runTimeout(resolve, 12));
  }
  return result ?? { success: false, reason: "unknown" };
}

export function hasMovement(entity) {
  return jobs.has(entity.id);
}

export function movementStatus(entity) {
  const job = jobs.get(entity.id);
  return job ? { started: job.started, lastDistance: job.lastDistance } : undefined;
}
