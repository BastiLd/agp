#!/bin/sh
# ===========================================================================
#  Aufgabenliste - Server starten (Linux, ZimaOS, macOS) ohne Docker
#  Port 8090, damit "tailscale serve --bg 8090" direkt passt.
# ===========================================================================
cd "$(dirname "$0")" || exit 1

export PORT="${PORT:-8090}"
export TZ="${TZ:-Europe/Vienna}"
export DATEN="${DATEN:-$(pwd)/daten}"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js wurde nicht gefunden. Bitte Node ab Version 18 installieren."
  echo ""
  exit 1
fi

if [ ! -f server/server.js ] || [ ! -f public/index.html ]; then
  echo ""
  echo "  server/server.js oder public/index.html fehlt."
  echo "  Dieses Skript gehoert in den entpackten Ordner."
  echo ""
  exit 1
fi

echo ""
echo "  Server startet auf Port $PORT ..."
echo "  Lokal:      http://localhost:$PORT/"
echo "  Im Tailnet: tailscale serve --bg $PORT   und dann die ts.net-Adresse"
echo ""

exec node server/server.js
