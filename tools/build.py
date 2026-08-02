from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
dist.mkdir(exist_ok=True)
out = dist / "Herobrine_He_Is_Watching_v0.14.mcaddon"
out.unlink(missing_ok=True)

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
    for pack in ["Herobrine_BP", "Herobrine_RP"]:
        base = root / "addon" / pack
        for file in base.rglob("*"):
            if file.is_file():
                archive.write(file, file.relative_to(root / "addon").as_posix())

print(out)
