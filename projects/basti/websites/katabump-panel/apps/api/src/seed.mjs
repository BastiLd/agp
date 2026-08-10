import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { planPresets, SEEDED_ALLOC_PORT, SEEDED_SERVER_HOSTNAME, SEEDED_SERVER_ID, SEEDED_SERVER_IP, SEEDED_SERVER_NODE, SEEDED_SERVER_UUID, SEEDED_SFTP_USERNAME } from "@katabump/common";
import { createPool } from "./db.mjs";

const pool = createPool();
const serverRoot = process.env.HOST_SERVER_DATA_ROOT || path.resolve(process.cwd(), 'data/servers');
const backupRoot = process.env.HOST_BACKUP_ROOT || path.resolve(process.cwd(), 'data/backups');
const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!123';

await fs.mkdir(path.join(serverRoot, SEEDED_SERVER_ID), { recursive: true });
await fs.mkdir(path.join(backupRoot, SEEDED_SERVER_ID), { recursive: true });

const userId = 'seed-admin-user';
const allocationId = 'seed-allocation';

const client = await pool.connect();

try {
  await client.query('BEGIN');
  for (const plan of planPresets) {
    await client.query(
      `INSERT INTO plans (slug, name, ram_mb, disk_mb, cpu_percent, io_weight, databases_limit, backups_limit, max_files, renew_period_days, auto_renew)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, ram_mb = EXCLUDED.ram_mb, disk_mb = EXCLUDED.disk_mb, cpu_percent = EXCLUDED.cpu_percent, io_weight = EXCLUDED.io_weight, databases_limit = EXCLUDED.databases_limit, backups_limit = EXCLUDED.backups_limit, max_files = EXCLUDED.max_files, renew_period_days = EXCLUDED.renew_period_days, auto_renew = EXCLUDED.auto_renew`,
      [plan.slug, plan.name, plan.ramMb, plan.diskMb, plan.cpuPercent, plan.ioWeight, plan.databases, plan.backups, plan.maxFiles, plan.renewPeriodDays, plan.autoRenew]
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO users (id, email, password_hash, display_name, role)
     VALUES ($1, $2, $3, 'Account', 'owner')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name`,
    [userId, email, passwordHash]
  );

  const renewalDue = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  await client.query(
    `INSERT INTO servers (id, uuid, owner_user_id, name, description, status, hostname, server_ip, node_label, plan_slug, runtime, startup_command, docker_image, py_file, js_file, additional_py_modules, additional_node_packages, uninstall_node_packages, sftp_username, last_renewed_at, renewal_due_at)
     VALUES ($1,$2,$3,'test','', 'offline',$4,$5,$6,'free','python','python /home/container/app.py','Python 3.14','app.py','','','','',$7,NOW(),$8)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, hostname = EXCLUDED.hostname, server_ip = EXCLUDED.server_ip, node_label = EXCLUDED.node_label, plan_slug = EXCLUDED.plan_slug, startup_command = EXCLUDED.startup_command, docker_image = EXCLUDED.docker_image, py_file = EXCLUDED.py_file, sftp_username = EXCLUDED.sftp_username, renewal_due_at = EXCLUDED.renewal_due_at`,
    [SEEDED_SERVER_ID, SEEDED_SERVER_UUID, userId, SEEDED_SERVER_HOSTNAME, SEEDED_SERVER_IP, SEEDED_SERVER_NODE, SEEDED_SFTP_USERNAME, renewalDue]
  );

  await client.query(
    `INSERT INTO server_allocations (id, server_id, ip, port, notes, is_primary)
     VALUES ($1, $2, $3, $4, '', TRUE)
     ON CONFLICT (id) DO UPDATE SET ip = EXCLUDED.ip, port = EXCLUDED.port, notes = EXCLUDED.notes, is_primary = EXCLUDED.is_primary`,
    [allocationId, SEEDED_SERVER_ID, SEEDED_SERVER_IP, SEEDED_ALLOC_PORT]
  );

  await client.query('COMMIT');
  console.log(`seeded ${email} / ${password}`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}