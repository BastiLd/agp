# Katabump-Style Control Panel

Self-hosted Docker control panel for bot and app containers, packaged as a ZimaOS-importable compose app and styled to match the supplied Katabump screenshots as closely as possible.

## What is included

- `web`: Nginx-served React SPA with the Katabump-style shell and all required routes
- `api`: Express control plane with PostgreSQL sessions, metadata, quotas, seeds, and CRUD endpoints
- `agent`: Docker runtime, live console websocket, file manager backend, power actions, and backup file operations
- `worker`: Redis-backed queue worker for backups, reinstalls, schedules, and renewals
- `sftp`: SSH/SFTP sidecar that authenticates against the panel user password and points at the same server volume as the Files page
- `postgres`: control-plane metadata and sessions
- `redis`: worker queue
- `mariadb`: provisioned user databases for servers with non-zero DB quota

## ZimaOS deployment

1. Copy this repository to your ZimaOS host.
2. Copy `.env.example` to `.env` and edit it.
3. In ZimaOS, open `Custom Install` and import [compose.yaml](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/compose.yaml).
4. Make sure these host paths exist and are writable:
   - `${HOST_SERVER_DATA_ROOT}`
   - `${HOST_BACKUP_ROOT}`
5. Start the stack.
6. Open `http://localhost:${APP_PORT}` or `http://<your-zimaos-host>:${APP_PORT}`.

## Required mounted volumes

Persistent data is stored in mounted volumes or bind mounts only.

- `${HOST_SERVER_DATA_ROOT}`: managed server files, one directory per server ID
- `${HOST_BACKUP_ROOT}`: backup archives, one directory per server ID
- `postgres-data`: PostgreSQL data
- `redis-data`: Redis appendonly data
- `mariadb-data`: MariaDB data
- `sftp-keys`: persisted SSH host keys for SFTP

## Required ports

- `${APP_PORT}`: web UI
- `${SFTP_PORT}`: SFTP

The API, agent, worker, PostgreSQL, Redis, and MariaDB stay internal to the compose network.

## Environment variables

Use [.env.example](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/.env.example) as the full reference.

Important values:

- `HOST_SERVER_DATA_ROOT`: absolute host path for managed server files. This same path is used by the panel, agent, SFTP service, and managed runtime containers.
- `HOST_BACKUP_ROOT`: absolute host path for backup archives.
- `SESSION_SECRET`: secure random session secret.
- `RUNTIME_TOKEN_SECRET`: secure random secret for runtime websocket and file tokens.
- `INTERNAL_SERVICE_SECRET`: internal shared secret between API, agent, and worker.
- `DATA_ENCRYPTION_KEY`: encryption key for stored database passwords.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`: first login credentials.
- `SFTP_PUBLIC_HOST` and `SFTP_PUBLIC_PORT`: values shown on the Settings page. For local Docker usage, `localhost` is the sensible default.

## First login

Default values from `.env.example`:

- Email: `admin@example.com`
- Password: `ChangeMe!123`

The seeded server matches the screenshots:

- server name: `test`
- server ID: `171faeea`
- plan: `FREE`
- status: `Offline`
- hostname: `51.75.118.165:20119`
- node label: `GRA-N47 - Gratuit`

## Managed server containers

The runtime agent creates a dedicated Docker container per managed server.

Behavior:

- working directory: `/home/container`
- bind mount source: `${HOST_SERVER_DATA_ROOT}/{serverId}`
- startup command stored in the control plane and executed through `sh -lc`
- Python templates auto-install from `requirements.txt`
- Node templates auto-install from `package.json`
- extra dependencies use the Startup page variables
- start, stop, restart, reinstall, logs, file browsing, uploads, and command execution are all real runtime actions

## SFTP behavior

The SFTP service points at the same files shown in the Files page.

- username is stored per server and seeded to `686f00b3b6ac3a5.171faeea`
- password is the same as the panel account password
- SFTP root is the server directory behind `/home/container`

## Branding

Brand assets live in [branding](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/branding).

Current assets:

- [branding/logo.svg](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/branding/logo.svg)
- [branding/hero-python.svg](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/branding/hero-python.svg)

To change branding:

1. Replace those files.
2. Rebuild the `web` image.
3. Update the footer strings in `.env` if needed.

## Adding more runtime templates

Edit [packages/runtime/src/index.mjs](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/packages/runtime/src/index.mjs).

Each template needs:

- `id`
- `label`
- `image`
- `runtime`

Then rebuild the stack.

## Local development

Use Node `20.x` through `25.x` and make sure Docker Desktop is running before you start the local stack.

```powershell
npm.cmd install
npm.cmd run dev:local
```

Local endpoints:

- web: `http://localhost:5173`
- api: `http://localhost:4000`
- agent runtime: `http://localhost:4100`
- worker: `http://localhost:4200`
- sftp: `sftp://localhost:2022`

`npm run dev:local` does the following for you:

- creates `.env` from [.env.local.example](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/.env.local.example) if needed
- ensures `data/servers` and `data/backups` exist
- starts PostgreSQL, Redis, and MariaDB from [compose.local.yaml](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/compose.local.yaml)
- waits for the local ports to come up
- runs migrations and seed data
- starts the API, agent, worker, SFTP service, and Vite web app

The local flow uses [compose.local.yaml](/d:/Meine%20Projekte/Katabump%20als%20Docker%20Container/compose.local.yaml) only for PostgreSQL, Redis, and MariaDB. The panel services themselves still run directly via `npm run dev`.

Helpful commands:

```powershell
npm.cmd run dev:local -- --prepare-only
npm.cmd run dev:infra
npm.cmd run dev:setup
npm.cmd run dev
npm.cmd run dev:infra:down
```

## Production

```powershell
docker compose up -d --build
```

## Health checks

Every service in `compose.yaml` has a health check.

- `api`: `/healthz`
- `agent`: `/healthz`
- `worker`: `/healthz`
- `web`: proxied `/healthz`
- `postgres`, `redis`, `mariadb`: native health commands
- `sftp`: TCP port probe

## Screenshot-based verification notes

The following visual features were matched directly against the screenshots in this thread:

- 300px-class dark sidebar with grouped uppercase headings
- red full-row active navigation highlight with orange accent edge
- compact server mini-card and green/restart/red power buttons
- small search square near the upper-left of the content area
- muted purple cards on a dark navy canvas
- orange square stat icons aligned to the right
- centered low footer copy
- exact empty states for Activity, Files, Databases, Backups, Schedules, and Users
- Startup, Settings, Dashboard, Console, and Network card structure and order

## Assumptions

- The screenshots are the primary source of truth for spacing and page structure.
- The seeded demo server starts offline with an empty container volume, which matches the screenshots. If you start it before uploading files, the runtime container will fail until an app exists in `/home/container`.
- Database and backup quotas are enforced by the control plane and worker, while disk and file-count quotas are enforced on the panel side rather than through kernel-level filesystem quotas.
