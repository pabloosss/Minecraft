from pathlib import Path
import json
import re
import sys
import uuid

root = Path(__file__).resolve().parents[1]
addon = root / "addon"
errors = []

json_files = list(addon.rglob("*.json"))
for path in json_files:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path.relative_to(root)}: invalid JSON: {exc}")

manifest_paths = [addon / "Herobrine_BP" / "manifest.json", addon / "Herobrine_RP" / "manifest.json"]
seen_uuids = set()
for path in manifest_paths:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        continue
    if data.get("format_version") != 2:
        errors.append(f"{path.relative_to(root)}: format_version must be 2")
    header = data.get("header", {})
    if header.get("min_engine_version", [0,0,0]) < [1,26,30]:
        errors.append(f"{path.relative_to(root)}: min_engine_version must be >= 1.26.30")
    for value in [header.get("uuid"), *[m.get("uuid") for m in data.get("modules", [])]]:
        if not value:
            errors.append(f"{path.relative_to(root)}: missing UUID")
            continue
        try:
            uuid.UUID(value)
        except ValueError:
            errors.append(f"{path.relative_to(root)}: invalid UUID {value}")
        if value in seen_uuids:
            errors.append(f"Duplicate UUID: {value}")
        seen_uuids.add(value)

script_dir = addon / "Herobrine_BP" / "scripts"
js_files = list(script_dir.glob("*.js"))
all_js = "\n".join(path.read_text(encoding="utf-8") for path in js_files)
if '@minecraft/server' not in all_js:
    errors.append("No @minecraft/server import found")

import_pattern = re.compile(r'from\s+["\'](\./[^"\']+)["\']')
for path in js_files:
    text = path.read_text(encoding="utf-8")
    for relative in import_pattern.findall(text):
        target = (path.parent / relative).resolve()
        if not target.exists():
            errors.append(f"{path.relative_to(root)}: missing import {relative}")
    if ".isValid()" in text:
        errors.append(f"{path.relative_to(root)}: use Entity.isValid property, not isValid()")
    if "teleport(" in text:
        errors.append(f"{path.relative_to(root)}: scripted teleport detected")

required = [
    addon / "Herobrine_BP" / "entities" / "herobrine.json",
    addon / "Herobrine_BP" / "entities" / "waypoint.json",
    addon / "Herobrine_RP" / "textures" / "entity" / "herobrine.png",
    addon / "Herobrine_RP" / "textures" / "entity" / "hiw_waypoint.png",
]
for path in required:
    if not path.exists():
        errors.append(f"Missing required file: {path.relative_to(root)}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"Validation OK: {len(json_files)} JSON files, {len(js_files)} script modules")
