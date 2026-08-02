export const IDS = Object.freeze({
  herobrine: "hiw:herobrine",
  waypoint: "hiw:waypoint",
  guide: "hiw:guide",
  stateKey: "hiw:state_v11",
  primaryTag: "hiw_primary",
});

export const DEFAULT_SETTINGS = Object.freeze({
  activity: "normal",       // quiet | normal | active
  safeMode: true,
  buildingEnabled: true,
  interferenceEnabled: true,
  debug: false,
  houseVariant: "cabin",    // cabin | watchtower
});

export const ACTIVITY_DELAY = Object.freeze({
  quiet: [20 * 18, 20 * 35],
  normal: [20 * 7, 20 * 15],
  active: [20 * 3, 20 * 7],
});

export const SITE = Object.freeze({
  minRadius: 12,
  maxRadius: 30,
  ringStep: 3,
  samplesPerRing: 20,
  footprintRadius: 6,
  maxSlope: 3,
  manualMaxSlope: 4,
});

export const BUILD = Object.freeze({
  blockDelayTicks: 2,
  saveEveryBlocks: 8,
  movementPauseTicks: 12,
  moveTimeoutTicks: 20 * 18,
  retryDelayTicks: 20 * 8,
});

export const TUNNEL = Object.freeze({
  extensionLength: 12,
  blockDelayTicks: 2,
  stairLength: 4,
  depth: 4,
});

export const MOVEMENT = Object.freeze({
  pollTicks: 5,
  arrivalRadius: 1.8,
  timeoutTicks: 20 * 20,
  stuckTicks: 20 * 12,
  progressEpsilon: 0.15,
});
