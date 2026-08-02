from pathlib import Path
import json
import re
import sys
import uuid

root = Path(__file__).resolve().parents[1]
addon = root / "addon"
bp = addon / "Herobrine_BP"
rp = addon / "Herobrine_RP"
script_dir = bp / "scripts"
errors = []

json_files = list(addon.rglob("*.json"))
for path in json_files:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path.relative_to(root)}: invalid JSON: {exc}")

seen_uuids = set()
for path in [bp / "manifest.json", rp / "manifest.json"]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        continue
    if data.get("format_version") != 2:
        errors.append(f"{path.relative_to(root)}: format_version must be 2")
    if data.get("header", {}).get("version") != [0, 14, 0]:
        errors.append(f"{path.relative_to(root)}: expected version 0.14.0")
    if data.get("header", {}).get("min_engine_version", [0, 0, 0]) < [1, 26, 30]:
        errors.append(f"{path.relative_to(root)}: min_engine_version must be >= 1.26.30")
    values = [data.get("header", {}).get("uuid")]
    values.extend(module.get("uuid") for module in data.get("modules", []))
    for value in values:
        if not value:
            errors.append(f"{path.relative_to(root)}: missing UUID")
            continue
        try:
            uuid.UUID(value)
        except ValueError:
            errors.append(f"{path.relative_to(root)}: invalid UUID {value}")
        if value in seen_uuids:
            errors.append(f"duplicate UUID: {value}")
        seen_uuids.add(value)

js_files = list(script_dir.glob("*.js"))
import_pattern = re.compile(r'from\s+["\'](\./[^"\']+)["\']')
for path in js_files:
    text = path.read_text(encoding="utf-8")
    for relative in import_pattern.findall(text):
        if not (path.parent / relative).resolve().exists():
            errors.append(f"{path.relative_to(root)}: missing import {relative}")

for path in [
    bp / "entities" / "herobrine.json",
    bp / "entities" / "waypoint.json",
    script_dir / "movement.js",
    script_dir / "maintenance.js",
    script_dir / "safety.js",
    rp / "textures" / "entity" / "herobrine.png",
    rp / "textures" / "entity" / "hiw_waypoint.png",
]:
    if not path.exists():
        errors.append(f"missing required file: {path.relative_to(root)}")

blueprints_text = (script_dir / "blueprints.js").read_text(encoding="utf-8")
if "minecraft:nether_bricks" in blueprints_text:
    errors.append("blueprints.js: use minecraft:nether_brick, not minecraft:nether_bricks")

movement_text = (script_dir / "movement.js").read_text(encoding="utf-8")
actions_text = (script_dir / "actions.js").read_text(encoding="utf-8")
maintenance_text = (script_dir / "maintenance.js").read_text(encoding="utf-8")
config_text = (script_dir / "config.js").read_text(encoding="utf-8")
entity_text = (bp / "entities" / "herobrine.json").read_text(encoding="utf-8")

for required in ["routePoints", "detourCandidates", "hiw:set_move_walk", "hiw:set_move_sprint"]:
    if required not in movement_text and required not in entity_text:
        errors.append(f"movement architecture missing {required}")
if '"hiw:move_walk"' not in entity_text or '"hiw:move_sprint"' not in entity_text:
    errors.append("herobrine.json: missing walk/sprint component groups")
if '"can_jump": true' not in entity_text or '"max_turn": 30.0' not in entity_text:
    errors.append("herobrine.json: navigation/turning settings not applied")
if "generation" not in actions_text or "active(entity, token)" not in actions_text:
    errors.append("actions.js: missing cancellation generation/token checks")
if "repairHome" not in maintenance_text or "inspectHome" not in maintenance_text:
    errors.append("maintenance.js: repair/inspection missing")

pace_matches = re.findall(
    r"paceTicks:\s*\{\s*slow:\s*(\d+),\s*normal:\s*(\d+),\s*fast:\s*(\d+)\s*\}",
    config_text,
)
if len(pace_matches) < 2:
    errors.append("config.js: missing build/tunnel pace maps")
else:
    for values in pace_matches[:2]:
        if min(int(value) for value in values) < 4:
            errors.append("config.js: pace delay must be at least 4 ticks")

for path in js_files:
    text = path.read_text(encoding="utf-8")
    if "teleport(" in text and path.name != "worker_safety.js":
        errors.append(f"{path.relative_to(root)}: teleport allowed only in worker_safety.js")
if "system.runInterval" in (script_dir / "worker_safety.js").read_text(encoding="utf-8"):
    errors.append("worker_safety.js: emergency helper must not own an interval")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"Validation OK: {len(json_files)} JSON files, {len(js_files)} script modules")
