# Architecture

## Runtime modules

- `main.js` — lifecycle, singleton enforcement and periodic recovery.
- `storage.js` — one versioned JSON state stored in world dynamic properties.
- `movement.js` — native pathfinding via a temporary invisible waypoint entity.
- `site.js` — incremental, low-cost building-site scan.
- `building.js` — resumable block-by-block construction with cancellation and pause reasons.
- `actions.js` — one-action-at-a-time scheduler and horror behaviors.
- `ui.js` — journal, settings and diagnostics.
- `logger.js` — throttled Content Log messages.

## Stability rules

1. Never move Herobrine by teleporting every tick.
2. Never start a second action while another action or build is active.
3. Never place a block over a non-replaceable block.
4. Never build in an unloaded chunk.
5. Save construction progress regularly and skip already-correct blocks after reload.
6. Safe Mode is enabled by default.
7. A watchdog resets actions that exceed 90 seconds.
