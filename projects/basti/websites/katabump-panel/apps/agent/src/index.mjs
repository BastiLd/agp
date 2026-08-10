import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import multer from "multer";
import jwt from "jsonwebtoken";
import Docker from "dockerode";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import * as tar from "tar";
import AdmZip from "adm-zip";
import mime from "mime-types";
import { SEEDED_SERVER_ID } from "@katabump/common";
import { buildStartupCommand, bytesFromMb, resolveBackupPath, resolveServerPath, runtimeTemplates } from "@katabump/runtime";
import { Pool } from "pg";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, { path: "/runtime/socket.io", cors: { origin: true, credentials: true } });
const dockerConnection = process.env.DOCKER_SOCKET_PATH
  ? { socketPath: process.env.DOCKER_SOCKET_PATH }
  : process.platform === "win32"
    ? { socketPath: "//./pipe/docker_engine" }
    : { socketPath: "/var/run/docker.sock" };
const docker = new Docker(dockerConnection);
const upload = multer({ dest: path.join(os.tmpdir(), "katabump-uploads") });
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT_INTERNAL || process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "katabump",
  user: process.env.POSTGRES_USER || "katabump",
  password: process.env.POSTGRES_PASSWORD || "katabump"
});
const runtimeTokenSecret = process.env.RUNTIME_TOKEN_SECRET || "dev-runtime-secret";
const internalSecret = process.env.INTERNAL_SERVICE_SECRET || "dev-internal-secret";
const serverRoot = process.env.HOST_SERVER_DATA_ROOT || path.resolve(process.cwd(), "../../data/servers");
const backupRoot = process.env.HOST_BACKUP_ROOT || path.resolve(process.cwd(), "../../data/backups");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

function runtimeAuth(req, res, next) {
  try {
    const token = ((req.headers.authorization || "").replace(/^Bearer\s+/i, "")) || String(req.query.token || "");
    const payload = jwt.verify(token, runtimeTokenSecret);
    if (payload.serverId !== req.params.serverId) {
      res.status(403).json({ error: "Invalid runtime token" });
      return;
    }
    req.runtime = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

function internalAuth(req, res, next) {
  if (req.headers["x-internal-service-secret"] !== internalSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function logActivity(serverId, actorUserId, action, details = {}) {
  await pool.query(
    "INSERT INTO activity_logs (server_id, actor_user_id, action, details) VALUES ($1, $2, $3, $4::jsonb)",
    [serverId, actorUserId || null, action, JSON.stringify(details)]
  );
}

async function getServer(serverId) {
  const { rows } = await pool.query(
    `SELECT s.*, p.ram_mb, p.disk_mb, p.cpu_percent, p.io_weight, p.max_files
     FROM servers s INNER JOIN plans p ON p.slug = s.plan_slug WHERE s.id = $1`,
    [serverId]
  );
  return rows[0] || null;
}

function resolveImage(serverRow) {
  return runtimeTemplates.find((template) => template.label === serverRow.docker_image || template.id === serverRow.docker_image)?.image
    || (serverRow.docker_image.toLowerCase().includes("python") ? "python:3.14-alpine" : "node:20-alpine");
}

function safePath(serverId, requested = "/") {
  const base = resolveServerPath(serverRoot, serverId);
  const normalized = (requested || "/").replace(/^\/home\/container/, "").replace(/^\//, "");
  const resolved = path.resolve(base, normalized);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error("Invalid path");
  }
  return resolved;
}

function containerName(serverId) {
  return `katabump-${serverId}`;
}

async function ensureServerDir(serverId) {
  await fs.mkdir(resolveServerPath(serverRoot, serverId), { recursive: true });
  await fs.mkdir(resolveBackupPath(backupRoot, serverId), { recursive: true });
}

async function ensureImage(image) {
  try {
    await docker.getImage(image).inspect();
  } catch {
    const stream = await docker.pull(image);
    await new Promise((resolve, reject) => docker.modem.followProgress(stream, (error) => (error ? reject(error) : resolve())));
  }
}

async function getContainer(serverId) {
  const name = containerName(serverId);
  const containers = await docker.listContainers({ all: true, filters: { name: [name] } });
  if (!containers.length) {
    return null;
  }
  return docker.getContainer(containers[0].Id);
}

async function ensureContainer(serverRow) {
  await ensureServerDir(serverRow.id);
  let container = await getContainer(serverRow.id);
  if (container) {
    return container;
  }
  const image = resolveImage(serverRow);
  await ensureImage(image);
  const created = await docker.createContainer({
    name: containerName(serverRow.id),
    Image: image,
    WorkingDir: "/home/container",
    Cmd: ["sh", "-lc", buildStartupCommand(serverRow)],
    Tty: false,
    Env: [
      `SERVER_ID=${serverRow.id}`,
      `ADDITIONAL_PY_MODULES=${serverRow.additional_py_modules || ""}`,
      `ADDITIONAL_NODE_PACKAGES=${serverRow.additional_node_packages || ""}`,
      `UNINSTALL_NODE_PACKAGES=${serverRow.uninstall_node_packages || ""}`,
      `PY_FILE=${serverRow.py_file || ""}`,
      `JS_FILE=${serverRow.js_file || ""}`
    ],
    HostConfig: {
      Binds: [`${resolveServerPath(serverRoot, serverRow.id)}:/home/container`],
      Memory: bytesFromMb(Number(serverRow.ram_mb)),
      NanoCPUs: Number(serverRow.cpu_percent) * 10000000,
      RestartPolicy: { Name: "unless-stopped" }
    },
    Labels: {
      "com.katabump.server-id": serverRow.id,
      "com.katabump.panel": "true"
    }
  });
  return created;
}

async function updateServerStatus(serverId, status) {
  await pool.query("UPDATE servers SET status = $1, updated_at = NOW() WHERE id = $2", [status, serverId]);
}

async function diskUsage(serverId) {
  const root = resolveServerPath(serverRoot, serverId);
  let total = 0;
  let files = 0;
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        total += stat.size;
        files += 1;
      }
    }
  }
  await walk(root);
  return { total, files };
}

async function runtimeStats(serverRow) {
  const usage = await diskUsage(serverRow.id);
  const container = await getContainer(serverRow.id);
  if (!container) {
    return {
      status: "offline",
      cpuUsage: `Offline / ${serverRow.cpu_percent}%`,
      memoryUsage: `0 Bytes / ${serverRow.ram_mb} MiB`,
      diskUsage: `${usage.total} Bytes / ${serverRow.disk_mb} MiB`,
      inboundOutbound: "Offline"
    };
  }
  const inspect = await container.inspect();
  if (!inspect.State.Running) {
    return {
      status: "offline",
      cpuUsage: `Offline / ${serverRow.cpu_percent}%`,
      memoryUsage: `0 Bytes / ${serverRow.ram_mb} MiB`,
      diskUsage: `${usage.total} Bytes / ${serverRow.disk_mb} MiB`,
      inboundOutbound: "Offline"
    };
  }
  const stats = await container.stats({ stream: false });
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = systemDelta > 0 ? ((cpuDelta / systemDelta) * (stats.cpu_stats.online_cpus || 1) * 100).toFixed(1) : "0.0";
  const memoryBytes = stats.memory_stats.usage || 0;
  const networkValues = Object.values(stats.networks || {});
  const inbound = networkValues.reduce((sum, network) => sum + (network.rx_bytes || 0), 0);
  const outbound = networkValues.reduce((sum, network) => sum + (network.tx_bytes || 0), 0);
  return {
    status: "running",
    cpuUsage: `${cpuPercent}% / ${serverRow.cpu_percent}%`,
    memoryUsage: `${memoryBytes} Bytes / ${serverRow.ram_mb} MiB`,
    diskUsage: `${usage.total} Bytes / ${serverRow.disk_mb} MiB`,
    inboundOutbound: `${inbound} Bytes / ${outbound} Bytes`
  };
}

async function listDirectory(serverId, requestedPath) {
  const resolved = safePath(serverId, requestedPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const items = await Promise.all(entries.map(async (entry) => {
    const full = path.join(resolved, entry.name);
    const stat = await fs.stat(full);
    const relative = path.relative(resolveServerPath(serverRoot, serverId), full).replace(/\\/g, "/");
    return {
      name: entry.name,
      size: entry.isDirectory() ? null : stat.size,
      isDirectory: entry.isDirectory(),
      updatedAt: stat.mtime.toISOString(),
      path: `/home/container/${relative}`.replace(/\/$/, "")
    };
  }));
  return items.sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name));
}

async function streamLogs(socket, serverRow) {
  const container = await getContainer(serverRow.id);
  if (!container) {
    socket.emit("console:line", "container@katabump~ Server marked as offline...");
    return () => {};
  }
  const inspect = await container.inspect();
  if (!inspect.State.Running) {
    socket.emit("console:line", "container@katabump~ Server marked as offline...");
    return () => {};
  }
  const stream = await container.logs({ follow: true, stdout: true, stderr: true, tail: 100 });
  stream.on("data", (chunk) => {
    const text = chunk.toString("utf8").replace(/\u0000/g, "").trim();
    if (text) {
      socket.emit("console:line", text);
    }
  });
  stream.on("error", (error) => socket.emit("console:line", error.message));
  return () => stream.destroy();
}

async function execCommand(serverRow, command, onLine) {
  const container = await ensureContainer(serverRow);
  const inspect = await container.inspect();
  if (!inspect.State.Running) {
    throw new Error("Server is offline");
  }
  const exec = await container.exec({ AttachStdout: true, AttachStderr: true, Cmd: ["sh", "-lc", command] });
  const stream = await exec.start({ hijack: false, stdin: false });
  stream.on("data", (chunk) => onLine(chunk.toString("utf8").replace(/\u0000/g, "")));
  await new Promise((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
}

app.get("/healthz", async (_req, res) => {
  await pool.query("SELECT 1");
  await docker.ping();
  res.json({ ok: true });
});

app.get("/runtime/servers/:serverId/stats", runtimeAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  res.json(await runtimeStats(serverRow));
});

app.post("/runtime/servers/:serverId/power/:action", runtimeAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  const action = req.params.action;
  const container = await ensureContainer(serverRow);
  const inspect = await container.inspect();

  if (action === "start") {
    if (!inspect.State.Running) {
      await container.start();
    }
    await updateServerStatus(serverRow.id, "running");
  } else if (action === "stop") {
    if (inspect.State.Running) {
      await container.stop({ t: 5 }).catch(() => {});
    }
    await updateServerStatus(serverRow.id, "offline");
  } else if (action === "restart") {
    if (inspect.State.Running) {
      await container.restart({ t: 5 });
    } else {
      await container.start();
    }
    await updateServerStatus(serverRow.id, "running");
  } else {
    res.status(400).json({ error: "Invalid power action" });
    return;
  }

  await logActivity(serverRow.id, req.runtime.userId, `server.power.${action}`, {});
  res.json({ ok: true });
});

app.get("/runtime/servers/:serverId/files", runtimeAuth, async (req, res) => {
  const items = await listDirectory(req.params.serverId, req.query.path || "/home/container");
  res.json({ items });
});

app.get("/runtime/servers/:serverId/files/content", runtimeAuth, async (req, res) => {
  const filePath = safePath(req.params.serverId, String(req.query.path || ""));
  const content = await fs.readFile(filePath, "utf8");
  res.json({ content });
});

app.put("/runtime/servers/:serverId/files/content", runtimeAuth, async (req, res) => {
  const filePath = safePath(req.params.serverId, req.body.path);
  await fs.writeFile(filePath, req.body.content || "", "utf8");
  await logActivity(req.params.serverId, req.runtime.userId, "file.updated", { path: req.body.path });
  res.json({ ok: true });
});

app.post("/runtime/servers/:serverId/files/folder", runtimeAuth, async (req, res) => {
  const folderPath = safePath(req.params.serverId, path.join(req.body.parent || "/home/container", req.body.name || "New Folder"));
  await fs.mkdir(folderPath, { recursive: true });
  await logActivity(req.params.serverId, req.runtime.userId, "folder.created", { path: req.body.parent, name: req.body.name });
  res.status(201).json({ ok: true });
});

app.post("/runtime/servers/:serverId/files/file", runtimeAuth, async (req, res) => {
  const filePath = safePath(req.params.serverId, path.join(req.body.parent || "/home/container", req.body.name || "new-file.txt"));
  await fs.writeFile(filePath, req.body.content || "", "utf8");
  await logActivity(req.params.serverId, req.runtime.userId, "file.created", { path: req.body.parent, name: req.body.name });
  res.status(201).json({ ok: true });
});

app.patch("/runtime/servers/:serverId/files/rename", runtimeAuth, async (req, res) => {
  const source = safePath(req.params.serverId, req.body.path);
  const target = path.join(path.dirname(source), req.body.name);
  await fs.rename(source, target);
  await logActivity(req.params.serverId, req.runtime.userId, "file.renamed", { path: req.body.path, name: req.body.name });
  res.json({ ok: true });
});

app.patch("/runtime/servers/:serverId/files/move", runtimeAuth, async (req, res) => {
  const source = safePath(req.params.serverId, req.body.from);
  const target = safePath(req.params.serverId, req.body.to);
  await fs.rename(source, target);
  await logActivity(req.params.serverId, req.runtime.userId, "file.moved", { from: req.body.from, to: req.body.to });
  res.json({ ok: true });
});

app.delete("/runtime/servers/:serverId/files", runtimeAuth, async (req, res) => {
  const target = safePath(req.params.serverId, req.body.path);
  const stat = await fs.stat(target);
  if (stat.isDirectory()) {
    await fs.rm(target, { recursive: true, force: true });
  } else {
    await fs.unlink(target);
  }
  await logActivity(req.params.serverId, req.runtime.userId, "file.deleted", { path: req.body.path });
  res.json({ ok: true });
});

app.post("/runtime/servers/:serverId/files/upload", runtimeAuth, upload.array("files"), async (req, res) => {
  const parent = req.body.path || "/home/container";
  const destination = safePath(req.params.serverId, parent);
  for (const file of req.files || []) {
    const target = path.join(destination, file.originalname);
    await fs.copyFile(file.path, target);
    await fs.unlink(file.path);
  }
  await logActivity(req.params.serverId, req.runtime.userId, "file.uploaded", { path: parent, files: (req.files || []).map((file) => file.originalname) });
  res.status(201).json({ ok: true });
});

app.post("/runtime/servers/:serverId/files/extract", runtimeAuth, async (req, res) => {
  const archivePath = safePath(req.params.serverId, req.body.path);
  const destination = safePath(req.params.serverId, req.body.destination || path.dirname(req.body.path));
  const zip = new AdmZip(archivePath);
  zip.extractAllTo(destination, true);
  await logActivity(req.params.serverId, req.runtime.userId, "file.extracted", { path: req.body.path, destination: req.body.destination });
  res.json({ ok: true });
});

app.get("/runtime/servers/:serverId/files/download", runtimeAuth, async (req, res) => {
  const requested = String(req.query.path || "");
  const filePath = safePath(req.params.serverId, requested);
  const name = path.basename(filePath);
  res.setHeader("content-type", mime.lookup(name) || "application/octet-stream");
  res.download(filePath, name);
});

app.post("/internal/servers/:serverId/reinstall", internalAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  const container = await getContainer(serverRow.id);
  if (container) {
    const inspect = await container.inspect();
    if (inspect.State.Running) {
      await container.stop({ t: 5 }).catch(() => {});
    }
  }
  const root = resolveServerPath(serverRoot, serverRow.id);
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root);
  for (const entry of entries) {
    const target = path.join(root, entry);
    await fs.rm(target, { recursive: true, force: true });
  }
  await updateServerStatus(serverRow.id, "offline");
  await logActivity(serverRow.id, req.body.actorUserId || null, "server.reinstall", {});
  res.json({ ok: true });
});

app.post("/internal/servers/:serverId/command", internalAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  const lines = [];
  await execCommand(serverRow, req.body.command, (line) => lines.push(line));
  await logActivity(serverRow.id, req.body.actorUserId || null, "server.command.executed", { command: req.body.command });
  res.json({ ok: true, output: lines.join("") });
});

app.post("/internal/servers/:serverId/power/:action", internalAuth, async (req, res) => {
  req.headers.authorization = `Bearer ${jwt.sign({ serverId: req.params.serverId, userId: req.body.actorUserId || "system" }, runtimeTokenSecret, { expiresIn: "5m" })}`;
  runtimeAuth(req, res, async () => {
    const serverRow = await getServer(req.params.serverId);
    const action = req.params.action;
    const container = await ensureContainer(serverRow);
    const inspect = await container.inspect();
    if (action === "start") {
      if (!inspect.State.Running) {
        await container.start();
      }
      await updateServerStatus(serverRow.id, "running");
    } else if (action === "stop") {
      if (inspect.State.Running) {
        await container.stop({ t: 5 }).catch(() => {});
      }
      await updateServerStatus(serverRow.id, "offline");
    } else if (action === "restart") {
      if (inspect.State.Running) {
        await container.restart({ t: 5 });
      } else {
        await container.start();
      }
      await updateServerStatus(serverRow.id, "running");
    }
    await logActivity(serverRow.id, req.body.actorUserId || null, `server.power.${action}`, { source: "worker" });
    res.json({ ok: true });
  });
});

app.post("/internal/servers/:serverId/backups/create", internalAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  await ensureServerDir(serverRow.id);
  const backupId = `bkp_${Date.now()}`;
  const fileName = `${backupId}.tar.gz`;
  const backupDir = resolveBackupPath(backupRoot, serverRow.id);
  const targetFile = path.join(backupDir, fileName);
  await tar.c({ gzip: true, cwd: resolveServerPath(serverRoot, serverRow.id), file: targetFile }, ["."]);
  const hash = createHash("sha256");
  const read = fssync.createReadStream(targetFile);
  await new Promise((resolve, reject) => {
    read.on("data", (chunk) => hash.update(chunk));
    read.on("end", resolve);
    read.on("error", reject);
  });
  const stat = await fs.stat(targetFile);
  await pool.query(
    "INSERT INTO backups (id, server_id, name, file_path, size_bytes, checksum, status) VALUES ($1,$2,$3,$4,$5,$6,'completed')",
    [backupId, serverRow.id, `${serverRow.name}-${new Date().toISOString()}`, targetFile, stat.size, hash.digest("hex")]
  );
  await logActivity(serverRow.id, req.body.actorUserId || null, "backup.created", { backupId });
  res.json({ ok: true, backupId });
});

app.post("/internal/servers/:serverId/backups/:backupId/restore", internalAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  const { rows } = await pool.query("SELECT * FROM backups WHERE id = $1 AND server_id = $2", [req.params.backupId, serverRow.id]);
  const backup = rows[0];
  if (!backup) {
    res.status(404).json({ error: "Backup not found" });
    return;
  }
  await tar.x({ file: backup.file_path, cwd: resolveServerPath(serverRoot, serverRow.id), strip: 0 });
  await logActivity(serverRow.id, req.body.actorUserId || null, "backup.restored", { backupId: backup.id });
  res.json({ ok: true });
});

app.post("/internal/servers/:serverId/backups/:backupId/delete", internalAuth, async (req, res) => {
  const serverRow = await getServer(req.params.serverId);
  const { rows } = await pool.query("SELECT * FROM backups WHERE id = $1 AND server_id = $2", [req.params.backupId, serverRow.id]);
  const backup = rows[0];
  if (!backup) {
    res.status(404).json({ error: "Backup not found" });
    return;
  }
  await fs.rm(backup.file_path, { force: true });
  await pool.query("DELETE FROM backups WHERE id = $1", [backup.id]);
  await logActivity(serverRow.id, req.body.actorUserId || null, "backup.deleted", { backupId: backup.id });
  res.json({ ok: true });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
    socket.data.runtime = jwt.verify(token, runtimeTokenSecret);
    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", async (socket) => {
  const serverId = socket.data.runtime.serverId;
  const serverRow = await getServer(serverId);
  const stopStreaming = await streamLogs(socket, serverRow);
  socket.on("console:command", async (command) => {
    if (!command?.trim()) {
      return;
    }
    try {
      socket.emit("console:line", `$ ${command}`);
      await execCommand(serverRow, command, (line) => socket.emit("console:line", line));
      await logActivity(serverRow.id, socket.data.runtime.userId, "server.command.executed", { command });
    } catch (error) {
      socket.emit("console:line", error.message);
    }
  });
  socket.on("disconnect", () => {
    stopStreaming();
  });
});

const port = Number(process.env.AGENT_PORT || 4100);
server.listen(port, () => {
  console.log(`agent listening on ${port}`);
});


