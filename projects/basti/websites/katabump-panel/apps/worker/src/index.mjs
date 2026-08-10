import dotenv from "dotenv";
import express from "express";
import { Queue, Worker } from "bullmq";
import { Pool } from "pg";
import cronParser from "cron-parser";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const app = express();
const internalSecret = process.env.INTERNAL_SERVICE_SECRET || "dev-internal-secret";
const agentBaseUrl = process.env.AGENT_BASE_URL || `http://localhost:${process.env.AGENT_PORT || 4100}`;
const redis = { host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT_INTERNAL || 6379) };
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT_INTERNAL || process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "katabump",
  user: process.env.POSTGRES_USER || "katabump",
  password: process.env.POSTGRES_PASSWORD || "katabump"
});

const queue = new Queue("katabump-jobs", { connection: redis });

app.use(express.json());

function internalAuth(req, res, next) {
  if (req.headers["x-internal-service-secret"] !== internalSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function callAgent(path, body) {
  const response = await fetch(`${agentBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-service-secret": internalSecret
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

new Worker(
  "katabump-jobs",
  async (job) => {
    if (job.name === "backup-create") {
      return callAgent(`/internal/servers/${job.data.serverId}/backups/create`, job.data);
    }
    if (job.name === "backup-restore") {
      return callAgent(`/internal/servers/${job.data.serverId}/backups/${job.data.backupId}/restore`, job.data);
    }
    if (job.name === "backup-delete") {
      return callAgent(`/internal/servers/${job.data.serverId}/backups/${job.data.backupId}/delete`, job.data);
    }
    if (job.name === "reinstall") {
      return callAgent(`/internal/servers/${job.data.serverId}/reinstall`, job.data);
    }
    if (job.name === "schedule-action") {
      if (job.data.actionType === "power") {
        return callAgent(`/internal/servers/${job.data.serverId}/power/${job.data.actionPayload}`, job.data);
      }
      return callAgent(`/internal/servers/${job.data.serverId}/command`, { ...job.data, command: job.data.actionPayload });
    }
    return null;
  },
  { connection: redis }
);

app.get("/healthz", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.post("/internal/jobs/backup-create", internalAuth, async (req, res) => {
  const job = await queue.add("backup-create", req.body);
  res.json({ queued: true, jobId: job.id });
});

app.post("/internal/jobs/backup-restore", internalAuth, async (req, res) => {
  const job = await queue.add("backup-restore", req.body);
  res.json({ queued: true, jobId: job.id });
});

app.post("/internal/jobs/backup-delete", internalAuth, async (req, res) => {
  const job = await queue.add("backup-delete", req.body);
  res.json({ queued: true, jobId: job.id });
});

app.post("/internal/jobs/reinstall", internalAuth, async (req, res) => {
  const job = await queue.add("reinstall", req.body);
  res.json({ queued: true, jobId: job.id });
});

async function tickSchedules() {
  const { rows } = await pool.query("SELECT * FROM schedules WHERE is_enabled = TRUE");
  const now = new Date();
  for (const schedule of rows) {
    const referenceDate = schedule.last_run_at || schedule.created_at;
    try {
      const interval = cronParser.parseExpression(schedule.cron_expression, { currentDate: referenceDate, tz: "UTC" });
      const next = interval.next().toDate();
      if (next <= now) {
        await queue.add("schedule-action", {
          serverId: schedule.server_id,
          actorUserId: null,
          actionType: schedule.action_type,
          actionPayload: schedule.action_payload,
          scheduleId: schedule.id
        });
        await pool.query("UPDATE schedules SET last_run_at = NOW(), last_status = 'queued', updated_at = NOW() WHERE id = $1", [schedule.id]);
      }
    } catch {
      await pool.query("UPDATE schedules SET last_status = 'invalid cron', updated_at = NOW() WHERE id = $1", [schedule.id]);
    }
  }
}

async function tickRenewals() {
  const { rows } = await pool.query(
    `SELECT s.id, s.plan_slug, s.renewal_due_at, p.auto_renew, p.renew_period_days
     FROM servers s INNER JOIN plans p ON p.slug = s.plan_slug`
  );
  const now = new Date();
  for (const row of rows) {
    if (!row.renewal_due_at) continue;
    const due = new Date(row.renewal_due_at);
    if (row.auto_renew && due <= now) {
      const nextDue = new Date(now.getTime() + row.renew_period_days * 24 * 60 * 60 * 1000);
      await pool.query("UPDATE servers SET last_renewed_at = NOW(), renewal_due_at = $1 WHERE id = $2", [nextDue.toISOString(), row.id]);
    }
    if (!row.auto_renew && due <= now) {
      await pool.query("UPDATE servers SET status = 'suspended' WHERE id = $1", [row.id]);
    }
  }
}

setInterval(() => {
  tickSchedules().catch((error) => console.error("schedule tick failed", error));
  tickRenewals().catch((error) => console.error("renewal tick failed", error));
}, 30_000);

const port = Number(process.env.WORKER_PORT || 4200);
app.listen(port, () => {
  console.log(`worker listening on ${port}`);
});
