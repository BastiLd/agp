CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  avatar_color TEXT NOT NULL DEFAULT '#2E86FF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

CREATE TABLE IF NOT EXISTS plans (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ram_mb INTEGER NOT NULL,
  disk_mb INTEGER NOT NULL,
  cpu_percent INTEGER NOT NULL,
  io_weight INTEGER NOT NULL,
  databases_limit INTEGER NOT NULL,
  backups_limit INTEGER NOT NULL,
  max_files INTEGER NOT NULL,
  renew_period_days INTEGER NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  hostname TEXT NOT NULL,
  server_ip TEXT NOT NULL,
  node_label TEXT NOT NULL,
  plan_slug TEXT NOT NULL REFERENCES plans(slug),
  runtime TEXT NOT NULL DEFAULT 'python',
  startup_command TEXT NOT NULL,
  docker_image TEXT NOT NULL,
  py_file TEXT NOT NULL DEFAULT '',
  js_file TEXT NOT NULL DEFAULT '',
  additional_py_modules TEXT NOT NULL DEFAULT '',
  additional_node_packages TEXT NOT NULL DEFAULT '',
  uninstall_node_packages TEXT NOT NULL DEFAULT '',
  sftp_username TEXT NOT NULL UNIQUE,
  last_renewed_at TIMESTAMPTZ,
  renewal_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_allocations (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  ip TEXT NOT NULL,
  port INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_server_allocations_server ON server_allocations(server_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_server ON activity_logs(server_id, created_at DESC);

CREATE TABLE IF NOT EXISTS server_databases (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_enc TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_server_databases_server ON server_databases(server_id);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backups_server ON backups(server_id, created_at DESC);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_payload TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'never',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedules_server ON schedules(server_id);

CREATE TABLE IF NOT EXISTS subusers (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'invited',
  invite_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subusers_server ON subusers(server_id);