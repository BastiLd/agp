#!/usr/bin/env bash
# Erstellt einen Backup-Commit mit Zeitstempel und pusht ihn.
set -euo pipefail
cd "$(dirname "$0")"

git add .
git commit -m "Manuelles Backup $(date +"%Y-%m-%d_%H-%M-%S")" || {
  echo "Nichts zu committen."; exit 0;
}
git push
