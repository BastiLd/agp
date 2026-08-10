import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { planPresets, loginSchema, serverDetailsSchema, startupSchema, scheduleSchema, subuserSchema, databaseSchema, allocationNoteSchema, SEEDED_SERVER_ID } from "@katabump/common";
import { createPool } from "./db.mjs";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const app = express();
const pool = createPool();
const PgStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";
const runtimeTokenSecret = process.env.RUNTIME_TOKEN_SECRET || "dev-runtime-secret";
const internalSecret = process.env.INTERNAL_SERVICE_SECRET || "dev-internal-secret";
const workerBaseUrl = process.env.WORKER_BASE_URL || `http://localhost:${process.env.WORKER_PORT || 4200}`;
const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:8080";
const sessionCookieSecure = (() => {
  try {
    return new URL(publicAppUrl).protocol === "https:";
  } catch {
    return false;
  }
})();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PgStore({ pool, tableName: "session", createTableIfMissing: false }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieSecure,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false
});

function keyBuffer() {
  return createHash("sha256").update(process.env.DATA_ENCRYPTION_KEY || "dev-encryption-key").digest();
}

function encryptSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decryptSecret(value) {
  const buffer = Buffer.from(value, "base64url");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyBuffer(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
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

async function getServerForUser(serverId, userId) {
  const { rows } = await pool.query(
    `SELECT s.*, p.name AS plan_name, p.ram_mb, p.disk_mb, p.cpu_percent, p.io_weight, p.databases_limit, p.backups_limit, p.max_files, p.renew_period_days, p.auto_renew
     FROM servers s
     INNER JOIN plans p ON p.slug = s.plan_slug
     WHERE s.id = $1 AND s.owner_user_id = $2`,
    [serverId, userId]
  );
  return rows[0] || null;
}

async function getAllocations(serverId) {
  const { rows } = await pool.query(
    "SELECT * FROM server_allocations WHERE server_id = $1 ORDER BY is_primary DESC, port ASC",
    [serverId]
  );
  return rows;
}

async function getCounts(serverId) {
  const result = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM server_databases WHERE server_id = $1", [serverId]),
    pool.query("SELECT COUNT(*)::int AS count FROM backups WHERE server_id = $1", [serverId]),
    pool.query("SELECT COUNT(*)::int AS count FROM schedules WHERE server_id = $1", [serverId]),
    pool.query("SELECT COUNT(*)::int AS count FROM subusers WHERE server_id = $1", [serverId])
  ]);
  return {
    databases: result[0].rows[0].count,
    backups: result[1].rows[0].count,
    schedules: result[2].rows[0].count,
    subusers: result[3].rows[0].count
  };
}

async function workerRequest(path, payload) {
  const response = await fetch(`${workerBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-service-secret": internalSecret
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Worker request failed with ${response.status}`);
  }

  return response.json();
}

async function mariaAdmin() {
  return mysql.createConnection({
    host: process.env.MARIADB_HOST || "localhost",
    port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER || "katabump",
    password: process.env.MARIADB_PASSWORD || "katabump",
    database: process.env.MARIADB_DATABASE || "katabump",
    multipleStatements: true
  });
}

app.get("/healthz", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [credentials.email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(credentials.password, user.password_hash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    req.session.user = { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
    await new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
    res.json({ user: req.session.user });
  } catch (error) {
    res.status(400).json({ error: error.message || "Login failed" });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  await new Promise((resolve) => req.session.destroy(() => resolve()));
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

app.get("/api/config", (_req, res) => {
  res.json({
    brandName: process.env.DEFAULT_BRAND_NAME || "KataBump",
    discordUrl: process.env.DISCORD_URL || "https://discord.gg/example",
    supportCenterUrl: process.env.SUPPORT_CENTER_URL || "https://example.com/support",
    footer: process.env.DEFAULT_BRAND_FOOTER || "Pterodactyl 2015 - 2026",
    subfooter: process.env.DEFAULT_BRAND_SUBFOOTER || "Designed by KataBump",
    defaultServerId: SEEDED_SERVER_ID,
    publicAppUrl
  });
});

app.get("/api/servers", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.name, s.status, s.hostname, s.server_ip, s.node_label, s.plan_slug, s.docker_image, p.ram_mb, p.disk_mb, p.cpu_percent
     FROM servers s INNER JOIN plans p ON p.slug = s.plan_slug WHERE owner_user_id = $1 ORDER BY created_at ASC`,
    [req.session.user.id]
  );
  res.json({ items: rows });
});

app.get("/api/servers/:serverId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const allocations = await getAllocations(server.id);
  const counts = await getCounts(server.id);
  res.json({
    server: {
      ...server,
      plan: {
        slug: server.plan_slug,
        name: server.plan_name,
        ramMb: server.ram_mb,
        diskMb: server.disk_mb,
        cpuPercent: server.cpu_percent,
        ioWeight: server.io_weight,
        databases: server.databases_limit,
        backups: server.backups_limit,
        maxFiles: server.max_files,
        renewPeriodDays: server.renew_period_days,
        autoRenew: server.auto_renew
      },
      allocations,
      counts,
      sftpAddress: `sftp://${process.env.SFTP_PUBLIC_HOST || 'localhost'}:${process.env.SFTP_PUBLIC_PORT || 2022}`
    }
  });
});

app.patch("/api/servers/:serverId/details", requireAuth, async (req, res) => {
  try {
    const payload = serverDetailsSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    await pool.query(
      "UPDATE servers SET name = $1, description = $2, updated_at = NOW() WHERE id = $3",
      [payload.name, payload.description || "", server.id]
    );
    await logActivity(server.id, req.session.user.id, "server.details.updated", payload);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid payload" });
  }
});

app.patch("/api/servers/:serverId/startup", requireAuth, async (req, res) => {
  try {
    const payload = startupSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    await pool.query(
      `UPDATE servers
       SET startup_command = $1,
           docker_image = $2,
           py_file = $3,
           js_file = $4,
           additional_py_modules = $5,
           additional_node_packages = $6,
           uninstall_node_packages = $7,
           runtime = CASE WHEN LOWER($2) LIKE 'python%' THEN 'python' ELSE 'node' END,
           updated_at = NOW()
       WHERE id = $8`,
      [payload.startupCommand, payload.dockerImage, payload.pyFile || "", payload.jsFile || "", payload.additionalPyModules || "", payload.additionalNodePackages || "", payload.uninstallNodePackages || "", server.id]
    );
    await logActivity(server.id, req.session.user.id, "server.startup.updated", payload);
    res.json({ ok: true, requiresRestart: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid payload" });
  }
});

app.get("/api/servers/:serverId/runtime-token", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const token = jwt.sign({ serverId: server.id, userId: req.session.user.id }, runtimeTokenSecret, { expiresIn: "2h" });
  res.json({ token });
});

app.get("/api/servers/:serverId/activity", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query(
    "SELECT id, action, details, created_at FROM activity_logs WHERE server_id = $1 ORDER BY created_at DESC LIMIT 100",
    [server.id]
  );
  res.json({ items: rows });
});

app.get("/api/servers/:serverId/databases", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT id, name, username, endpoint, created_at FROM server_databases WHERE server_id = $1 ORDER BY created_at ASC", [server.id]);
  res.json({ items: rows, limit: server.databases_limit, disabled: server.databases_limit === 0 });
});

app.post("/api/servers/:serverId/databases", requireAuth, async (req, res) => {
  try {
    const payload = databaseSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    if (server.databases_limit === 0) {
      res.status(400).json({ error: "Databases cannot be created for this server." });
      return;
    }
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM server_databases WHERE server_id = $1", [server.id]);
    if (rows[0].count >= server.databases_limit) {
      res.status(400).json({ error: "Database quota reached." });
      return;
    }
    const suffix = randomBytes(3).toString("hex");
    const username = `${server.id.slice(0, 6)}_${suffix}`;
    const password = randomBytes(12).toString("base64url");
    const endpoint = `${process.env.MARIADB_HOST || 'localhost'}:${process.env.MARIADB_PORT || 3306}`;
    const dbName = payload.name;
    const connection = await mariaAdmin();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`CREATE USER IF NOT EXISTS '${username}'@'%' IDENTIFIED BY '${password}'`);
    await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'%'`);
    await connection.query(`FLUSH PRIVILEGES`);
    await connection.end();
    const databaseId = `db_${randomBytes(6).toString('hex')}`;
    await pool.query(
      "INSERT INTO server_databases (id, server_id, name, username, password_enc, endpoint) VALUES ($1, $2, $3, $4, $5, $6)",
      [databaseId, server.id, dbName, username, encryptSecret(password), endpoint]
    );
    await logActivity(server.id, req.session.user.id, "database.created", { name: dbName, username });
    res.status(201).json({ id: databaseId, name: dbName, username, password, endpoint });
  } catch (error) {
    res.status(400).json({ error: error.message || "Database creation failed" });
  }
});

app.post("/api/servers/:serverId/databases/:databaseId/reset-password", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM server_databases WHERE id = $1 AND server_id = $2", [req.params.databaseId, server.id]);
  const database = rows[0];
  if (!database) {
    res.status(404).json({ error: "Database not found" });
    return;
  }
  const newPassword = randomBytes(12).toString("base64url");
  const connection = await mariaAdmin();
  await connection.query(`ALTER USER '${database.username}'@'%' IDENTIFIED BY '${newPassword}'`);
  await connection.query(`FLUSH PRIVILEGES`);
  await connection.end();
  await pool.query("UPDATE server_databases SET password_enc = $1 WHERE id = $2", [encryptSecret(newPassword), database.id]);
  await logActivity(server.id, req.session.user.id, "database.password.reset", { databaseId: database.id });
  res.json({ password: newPassword });
});

app.delete("/api/servers/:serverId/databases/:databaseId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM server_databases WHERE id = $1 AND server_id = $2", [req.params.databaseId, server.id]);
  const database = rows[0];
  if (!database) {
    res.status(404).json({ error: "Database not found" });
    return;
  }
  const connection = await mariaAdmin();
  await connection.query(`DROP DATABASE IF EXISTS \`${database.name}\``);
  await connection.query(`DROP USER IF EXISTS '${database.username}'@'%'`);
  await connection.query(`FLUSH PRIVILEGES`);
  await connection.end();
  await pool.query("DELETE FROM server_databases WHERE id = $1", [database.id]);
  await logActivity(server.id, req.session.user.id, "database.deleted", { name: database.name });
  res.json({ ok: true });
});

app.get("/api/servers/:serverId/backups", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM backups WHERE server_id = $1 ORDER BY created_at DESC", [server.id]);
  res.json({ items: rows, limit: server.backups_limit, disabled: server.backups_limit === 0 });
});

app.post("/api/servers/:serverId/backups", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  if (server.backups_limit === 0) {
    res.status(400).json({ error: "Backups cannot be created for this server because the backup limit is set to 0." });
    return;
  }
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM backups WHERE server_id = $1", [server.id]);
  if (rows[0].count >= server.backups_limit) {
    res.status(400).json({ error: "Backup quota reached." });
    return;
  }
  const response = await workerRequest("/internal/jobs/backup-create", { serverId: server.id, actorUserId: req.session.user.id });
  res.status(202).json(response);
});

app.post("/api/servers/:serverId/backups/:backupId/restore", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const response = await workerRequest("/internal/jobs/backup-restore", { serverId: server.id, backupId: req.params.backupId, actorUserId: req.session.user.id });
  res.status(202).json(response);
});

app.delete("/api/servers/:serverId/backups/:backupId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const response = await workerRequest("/internal/jobs/backup-delete", { serverId: server.id, backupId: req.params.backupId, actorUserId: req.session.user.id });
  res.status(202).json(response);
});

app.get("/api/servers/:serverId/allocations", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  res.json({ items: await getAllocations(server.id) });
});

app.patch("/api/servers/:serverId/allocations/:allocationId", requireAuth, async (req, res) => {
  try {
    const payload = allocationNoteSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    await pool.query(
      "UPDATE server_allocations SET notes = $1 WHERE id = $2 AND server_id = $3",
      [payload.notes, req.params.allocationId, server.id]
    );
    await logActivity(server.id, req.session.user.id, "allocation.updated", { allocationId: req.params.allocationId, notes: payload.notes });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid payload" });
  }
});

app.get("/api/servers/:serverId/schedules", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM schedules WHERE server_id = $1 ORDER BY created_at ASC", [server.id]);
  res.json({ items: rows });
});

app.post("/api/servers/:serverId/schedules", requireAuth, async (req, res) => {
  try {
    const payload = scheduleSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    const scheduleId = `sch_${randomBytes(6).toString('hex')}`;
    await pool.query(
      "INSERT INTO schedules (id, server_id, name, cron_expression, action_type, action_payload, is_enabled) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [scheduleId, server.id, payload.name, payload.cronExpression, payload.actionType, payload.actionPayload, payload.isEnabled]
    );
    await logActivity(server.id, req.session.user.id, "schedule.created", payload);
    res.status(201).json({ id: scheduleId });
  } catch (error) {
    res.status(400).json({ error: error.message || "Schedule creation failed" });
  }
});

app.patch("/api/servers/:serverId/schedules/:scheduleId", requireAuth, async (req, res) => {
  try {
    const payload = scheduleSchema.partial().parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    const current = await pool.query("SELECT * FROM schedules WHERE id = $1 AND server_id = $2", [req.params.scheduleId, server.id]);
    if (!current.rows[0]) {
      res.status(404).json({ error: "Schedule not found" });
      return;
    }
    const merged = { ...current.rows[0], ...payload };
    await pool.query(
      `UPDATE schedules SET name = $1, cron_expression = $2, action_type = $3, action_payload = $4, is_enabled = $5, updated_at = NOW() WHERE id = $6 AND server_id = $7`,
      [merged.name, merged.cron_expression, merged.action_type, merged.action_payload, merged.is_enabled, req.params.scheduleId, server.id]
    );
    await logActivity(server.id, req.session.user.id, "schedule.updated", payload);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Schedule update failed" });
  }
});

app.delete("/api/servers/:serverId/schedules/:scheduleId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  await pool.query("DELETE FROM schedules WHERE id = $1 AND server_id = $2", [req.params.scheduleId, server.id]);
  await logActivity(server.id, req.session.user.id, "schedule.deleted", { scheduleId: req.params.scheduleId });
  res.json({ ok: true });
});

app.get("/api/servers/:serverId/subusers", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT id, email, display_name, permissions, status, created_at FROM subusers WHERE server_id = $1 ORDER BY created_at ASC", [server.id]);
  res.json({ items: rows });
});

app.post("/api/servers/:serverId/subusers", requireAuth, async (req, res) => {
  try {
    const payload = subuserSchema.parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    const subuserId = `sub_${randomBytes(6).toString('hex')}`;
    const inviteToken = randomBytes(18).toString("base64url");
    await pool.query(
      "INSERT INTO subusers (id, server_id, email, display_name, permissions, invite_token) VALUES ($1,$2,$3,$4,$5::jsonb,$6)",
      [subuserId, server.id, payload.email, payload.displayName, JSON.stringify(payload.permissions), inviteToken]
    );
    await logActivity(server.id, req.session.user.id, "subuser.created", { email: payload.email, permissions: payload.permissions });
    res.status(201).json({ id: subuserId, inviteToken });
  } catch (error) {
    res.status(400).json({ error: error.message || "Subuser creation failed" });
  }
});

app.patch("/api/servers/:serverId/subusers/:subuserId", requireAuth, async (req, res) => {
  try {
    const payload = subuserSchema.partial().parse(req.body);
    const server = await getServerForUser(req.params.serverId, req.session.user.id);
    if (!server) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    const current = await pool.query("SELECT * FROM subusers WHERE id = $1 AND server_id = $2", [req.params.subuserId, server.id]);
    const row = current.rows[0];
    if (!row) {
      res.status(404).json({ error: "Subuser not found" });
      return;
    }
    await pool.query(
      "UPDATE subusers SET email = $1, display_name = $2, permissions = $3::jsonb WHERE id = $4 AND server_id = $5",
      [payload.email || row.email, payload.displayName || row.display_name, JSON.stringify(payload.permissions || row.permissions), row.id, server.id]
    );
    await logActivity(server.id, req.session.user.id, "subuser.updated", { subuserId: row.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || "Subuser update failed" });
  }
});

app.delete("/api/servers/:serverId/subusers/:subuserId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  await pool.query("DELETE FROM subusers WHERE id = $1 AND server_id = $2", [req.params.subuserId, server.id]);
  await logActivity(server.id, req.session.user.id, "subuser.deleted", { subuserId: req.params.subuserId });
  res.json({ ok: true });
});

app.post("/api/servers/:serverId/reinstall", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const response = await workerRequest("/internal/jobs/reinstall", { serverId: server.id, actorUserId: req.session.user.id });
  res.status(202).json(response);
});

app.post("/api/servers/:serverId/renew", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const plan = planPresets.find((item) => item.slug === server.plan_slug);
  const due = new Date(Date.now() + (plan?.renewPeriodDays || 30) * 24 * 60 * 60 * 1000).toISOString();
  await pool.query("UPDATE servers SET last_renewed_at = NOW(), renewal_due_at = $1 WHERE id = $2", [due, server.id]);
  await logActivity(server.id, req.session.user.id, "server.renewed", { due });
  res.json({ ok: true, renewalDueAt: due });
});

app.get("/api/servers/:serverId/database-secrets/:databaseId", requireAuth, async (req, res) => {
  const server = await getServerForUser(req.params.serverId, req.session.user.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const { rows } = await pool.query("SELECT * FROM server_databases WHERE id = $1 AND server_id = $2", [req.params.databaseId, server.id]);
  const database = rows[0];
  if (!database) {
    res.status(404).json({ error: "Database not found" });
    return;
  }
  res.json({ password: decryptSecret(database.password_enc) });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.API_PORT || 4000);
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
