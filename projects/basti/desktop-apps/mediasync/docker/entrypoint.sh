#!/bin/sh
set -e

# Run as the configured user so renamed/moved files keep the right ownership
# on the mounted NAS volumes (LinuxServer-style PUID/PGID).
PUID="${PUID:-1000}"
PGID="${PGID:-1000}"
CONFIG_DIR="${CONFIG_DIR:-/config}"

mkdir -p "$CONFIG_DIR"
chown -R "$PUID:$PGID" "$CONFIG_DIR" 2>/dev/null || true

echo "MediaSync starting as ${PUID}:${PGID} (config: ${CONFIG_DIR})"
exec su-exec "${PUID}:${PGID}" "$@"
