let debugEnabled = false;
const lastMessageTick = new Map();

export function setDebugEnabled(value) {
  debugEnabled = Boolean(value);
}

export function debug(category, message, tick = 0) {
  if (!debugEnabled) return;
  const key = `${category}:${message}`;
  const previous = lastMessageTick.get(key) ?? -999999;
  if (tick - previous < 20) return;
  lastMessageTick.set(key, tick);
  console.warn(`[HIW][${category}] ${message}`);
}

export function info(category, message) {
  if (debugEnabled) console.warn(`[HIW][${category}] ${message}`);
}

export function warn(category, message) {
  console.warn(`[HIW][${category}][WARN] ${message}`);
}

export function error(category, value) {
  const message = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
  console.warn(`[HIW][${category}][ERROR] ${message}`);
}
