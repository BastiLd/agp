#!/usr/bin/env bash
# Baut die Mod fuer alle unter versions/<mc>/ definierten Minecraft-Versionen.
# Multi-Project-Setup ist im Root build.gradle definiert; ein einziges
# `./gradlew build` baut alle Subprojekte und sammelt die JARs in build/libs/.

set -euo pipefail
cd "$(dirname "$0")"

./gradlew build "$@"

echo
echo "Fertig. JARs liegen in build/libs/ (alle Versionen) und unter"
echo "versions/<mc>/build/libs/ (pro MC-Version)."
