import { BlockPermutation, EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { IDS } from "./config.js";
import { debug, error } from "./logger.js";

const REPLACEABLE = new Set([
  "minecraft:air", "minecraft:short_grass", "minecraft:tall_grass", "minecraft:fern",
  "minecraft:large_fern", "minecraft:deadbush", "minecraft:snow_layer", "minecraft:vine",
  "minecraft:glow_lichen", "minecraft:seagrass", "minecraft:tall_seagrass",
]);

const BAD_GROUND_WORDS = ["water", "lava", "leaves", "log", "wood", "ice", "cactus", "powder_snow"];
const PROTECTED_WORDS = [
  "chest", "barrel", "furnace", "crafting_table", "planks", "bricks", "glass", "door",
  "bed", "bookshelf", "concrete", "terracotta", "wool", "shulker", "redstone", "rail",
  "lantern", "torch", "sign", "banner", "anvil", "hopper", "dispenser", "observer",
];

export function isValid(entity) {
  try { return Boolean(entity?.isValid); } catch { return false; }
}

export function distance(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distance2D(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function floorPos(value) {
  return { x: Math.floor(value.x), y: Math.floor(value.y), z: Math.floor(value.z) };
}

export function formatPos(value) {
  if (!value) return "brak";
  return `${Math.floor(value.x)} ${Math.floor(value.y)} ${Math.floor(value.z)}`;
}

export function blockAt(dimension, location) {
  try { return dimension.getBlock(floorPos(location)); } catch { return undefined; }
}

export function isReplaceableType(typeId) {
  if (!typeId) return true;
  return REPLACEABLE.has(typeId) || typeId.includes("flower") || typeId.includes("sapling") ||
    typeId.includes("mushroom") || typeId.includes("roots") || typeId.includes("bush");
}

export function isBadGround(typeId) {
  return !typeId || BAD_GROUND_WORDS.some(word => typeId.includes(word));
}

export function isProtectedType(typeId) {
  return Boolean(typeId && PROTECTED_WORDS.some(word => typeId.includes(word)));
}

export function getSurface(dimension, x, z) {
  try {
    let block = dimension.getTopmostBlock({
      x: Math.floor(x),
      z: Math.floor(z),
    });
    if (!block) return undefined;

    for (let i = 0; i < 48 && block; i++) {
      const typeId = block.typeId;
      const canopy =
        typeId.includes("leaves") ||
        typeId.includes("_log") ||
        typeId.includes("_wood") ||
        typeId.includes("_stem") ||
        typeId.includes("mushroom_block");

      if (!isReplaceableType(typeId) && !canopy) break;

      block = dimension.getBlock({
        x: block.location.x,
        y: block.location.y - 1,
        z: block.location.z,
      });
    }

    if (!block || isBadGround(block.typeId)) return undefined;
    return block;
  } catch {
    return undefined;
  }
}

export function isChunkLoaded(dimension, location) {
  try { return dimension.isChunkLoaded(location); } catch { return false; }
}

export function safePlace(dimension, location, typeId, allowReplace = true) {
  try {
    const block = blockAt(dimension, location);
    if (!block) return false;
    if (block.typeId === typeId) return true;
    if (!allowReplace && !isReplaceableType(block.typeId)) return false;
    if (allowReplace && !isReplaceableType(block.typeId)) return false;
    const permutation = BlockPermutation.resolve(typeId);
    if (typeof block.trySetPermutation === "function") return block.trySetPermutation(permutation);
    block.setPermutation(permutation);
    return true;
  } catch (e) {
    error("place", e);
    return false;
  }
}

export function equip(entity, itemId) {
  if (!isValid(entity)) return;
  try {
    const component = entity.getComponent("minecraft:equippable");
    if (!component) return;
    if (itemId) component.setEquipment(EquipmentSlot.Mainhand, new ItemStack(itemId, 1));
    else component.setEquipment(EquipmentSlot.Mainhand);
  } catch (e) { debug("equip", String(e), system.currentTick); }
}

export function play(entity, animation) {
  if (!isValid(entity)) return;
  try { entity.playAnimation(animation); } catch {}
}

export function lookAt(entity, target) {
  if (!isValid(entity)) return;
  try { entity.lookAt(target); } catch {}
}

export function smoke(dimension, location) {
  try { dimension.spawnParticle("minecraft:basic_smoke_particle", { x: location.x + 0.5, y: location.y + 0.8, z: location.z + 0.5 }); } catch {}
}

export function sound(dimension, id, location, pitch = 0.8, volume = 0.7) {
  try { dimension.playSound(id, location, { pitch, volume }); } catch {}
}

export function allHerobrines() {
  const result = [];
  for (const id of ["overworld", "nether", "the_end"]) {
    try { result.push(...world.getDimension(id).getEntities({ type: IDS.herobrine })); } catch {}
  }
  return result.filter(isValid);
}

export function allWaypoints() {
  const result = [];
  for (const id of ["overworld", "nether", "the_end"]) {
    try { result.push(...world.getDimension(id).getEntities({ type: IDS.waypoint })); } catch {}
  }
  return result.filter(isValid);
}

export function cleanupWaypoints() {
  for (const entity of allWaypoints()) {
    try { entity.remove(); } catch {}
  }
}

export function nearestPlayer(entity, maxDistance = 128) {
  let selected;
  let best = maxDistance * maxDistance;
  for (const player of world.getAllPlayers()) {
    try {
      if (player.dimension.id !== entity.dimension.id) continue;
      const dx = player.location.x - entity.location.x;
      const dy = player.location.y - entity.location.y;
      const dz = player.location.z - entity.location.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < best) { best = d2; selected = player; }
    } catch {}
  }
  return selected;
}

export function randomBetween(min, max) { return min + Math.random() * (max - min); }
export function randomInt(min, max) { return Math.floor(randomBetween(min, max + 1)); }
export function choose(values) { return values[Math.floor(Math.random() * values.length)]; }
