#!/usr/bin/env bash
set -euo pipefail

SCREEN_NAME="minebox"
SERVER_DIR="/home/vboxuser/minebox/server"
JAVA_BIN="/home/vboxuser/java21/bin/java"
JAR_FILE="server.jar"
MIN_RAM="512M"
MAX_RAM="3G"

cd "$SERVER_DIR"

if screen -list | grep -q "\.${SCREEN_NAME}"; then
  echo "Minecraft screen '$SCREEN_NAME' already exists."
  exit 0
fi

screen -dmS "$SCREEN_NAME" "$JAVA_BIN" -Xms"$MIN_RAM" -Xmx"$MAX_RAM" -jar "$JAR_FILE" nogui

echo "Minecraft started in screen: $SCREEN_NAME"
