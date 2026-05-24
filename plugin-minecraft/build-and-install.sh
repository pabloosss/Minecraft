#!/usr/bin/env bash
set -e

PLUGIN_NAME="MineBoxUltimate.jar"
MINEBOX_PLUGIN_DIR="/home/vboxuser/minebox/server/plugins"

cd "$(dirname "$0")"

echo "[MineBox] Buduję plugin..."
gradle build

echo "[MineBox] Kopiuję plugin do: ${MINEBOX_PLUGIN_DIR}/${PLUGIN_NAME}"
mkdir -p "${MINEBOX_PLUGIN_DIR}"
cp "build/libs/${PLUGIN_NAME}" "${MINEBOX_PLUGIN_DIR}/${PLUGIN_NAME}"

echo "[MineBox] Gotowe. Plugin jest tutaj:"
echo "${MINEBOX_PLUGIN_DIR}/${PLUGIN_NAME}"
echo ""
echo "Teraz zrestartuj serwer Minecraft:"
echo "screen -S minebox -p 0 -X stuff 'stop\\n'"
echo "/home/vboxuser/minebox/scripts/start_minecraft_screen.sh"
