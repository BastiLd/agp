import path from "node:path";

export const runtimeTemplates = [
  { id: "python-3.14", label: "Python 3.14", image: "python:3.14-alpine", runtime: "python" },
  { id: "node-20", label: "Node 20", image: "node:20-alpine", runtime: "node" },
  { id: "node-21", label: "Node 21", image: "node:21-alpine", runtime: "node" }
];

export const resolveServerPath = (root, serverId) => path.join(root, serverId);
export const resolveBackupPath = (root, serverId) => path.join(root, serverId);

export function buildStartupCommand(server) {
  const parts = [
    "set -e",
    "cd /home/container",
    "if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi",
    "if [ -n \"$ADDITIONAL_PY_MODULES\" ]; then pip install --no-cache-dir $ADDITIONAL_PY_MODULES; fi",
    "if [ -f package.json ]; then npm install --omit=dev; fi",
    "if [ -n \"$ADDITIONAL_NODE_PACKAGES\" ]; then npm install $ADDITIONAL_NODE_PACKAGES; fi",
    "if [ -n \"$UNINSTALL_NODE_PACKAGES\" ]; then npm remove $UNINSTALL_NODE_PACKAGES; fi",
    server.startup_command
  ];
  return parts.join(" && ");
}

export function bytesFromMb(megabytes) {
  return megabytes * 1024 * 1024;
}