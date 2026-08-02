export const IDS = Object.freeze({
  herobrine: "hiw:herobrine",
  waypoint: "hiw:waypoint",
  guide: "hiw:guide",
  stateKey: "hiw:state_v14",
  primaryTag: "hiw_primary",
});

export const DEFAULT_SETTINGS = Object.freeze({
  activity: "normal",
  movementMode: "normal",
  buildPace: "normal",
  autonomous: true,
  proximityScares: true,
  rescueEnabled: true,
  safeMode: true,
  buildingEnabled: true,
  interferenceEnabled: true,
  debug: false,
  houseVariant: "cabin",
});

export const ACTIVITY_DELAY = Object.freeze({
  quiet: [20 * 20, 20 * 40],
  normal: [20 * 9, 20 * 18],
  active: [20 * 4, 20 * 9],
});

export const SITE = Object.freeze({minRadius: 12,maxRadius: 30,ringStep: 3,samplesPerRing: 20,footprintRadius: 6,maxSlope: 3,manualMaxSlope: 4});
export const BUILD = Object.freeze({paceTicks: {slow: 10,normal: 6,fast: 4},preparationColumnDelayTicks: 2,saveEveryBlocks: 5,stationTimeoutTicks: 20 * 16,rescueDistance: 14});
export const TUNNEL = Object.freeze({extensionLength: 12,paceTicks: {slow: 9,normal: 6,fast: 4},stairLength: 4,depth: 4});
export const MOVEMENT = Object.freeze({pollTicks: 5,arrivalRadius: 1.9,sprintArrivalRadius: 2.2,timeoutTicks: 20 * 24,segmentTimeoutTicks: 20 * 13,stuckTicks: 20 * 7,progressEpsilon: 0.10,segmentLength: 10,sprintThreshold: 14,detourDistance: 4,maxDetours: 2});
