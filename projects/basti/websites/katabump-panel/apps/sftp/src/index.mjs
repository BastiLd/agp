import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { generateKeyPairSync } from "node:crypto";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import ssh2 from "ssh2";
import { Pool } from "pg";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const { Server, utils } = ssh2;
const { OPEN_MODE, STATUS_CODE } = utils.sftp;
const hostKeyPath = process.env.SFTP_HOST_KEY_PATH || path.resolve(process.cwd(), "../../data/sftp-hostkey.pem");
const serverRoot = process.env.HOST_SERVER_DATA_ROOT || path.resolve(process.cwd(), "../../data/servers");
const port = Number(process.env.SFTP_PORT || 2022);
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT_INTERNAL || process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "katabump",
  user: process.env.POSTGRES_USER || "katabump",
  password: process.env.POSTGRES_PASSWORD || "katabump"
});

async function ensureHostKey() {
  try {
    return await fs.readFile(hostKeyPath, "utf8");
  } catch {
    await fs.mkdir(path.dirname(hostKeyPath), { recursive: true });
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    });
    await fs.writeFile(hostKeyPath, privateKey, "utf8");
    return privateKey;
  }
}

function safePath(root, requested) {
  const relative = (requested || "/").replace(/^\//, "");
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("Invalid path");
  }
  return resolved;
}

function openFlags(pflags) {
  if ((pflags & OPEN_MODE.CREAT) && (pflags & OPEN_MODE.TRUNC)) {
    return "w+";
  }
  if ((pflags & OPEN_MODE.WRITE) && (pflags & OPEN_MODE.READ)) {
    return "r+";
  }
  if (pflags & OPEN_MODE.WRITE) {
    return "w";
  }
  return "r";
}

const hostKey = await ensureHostKey();
const handles = new Map();
let handleIndex = 1;

const sshServer = new Server({ hostKeys: [hostKey] }, (client) => {
  client.on("authentication", async (ctx) => {
    if (ctx.method !== "password") {
      ctx.reject();
      return;
    }
    const { rows } = await pool.query(
      `SELECT s.id, u.password_hash
       FROM servers s
       INNER JOIN users u ON u.id = s.owner_user_id
       WHERE s.sftp_username = $1`,
      [ctx.username]
    );
    const row = rows[0];
    if (!row) {
      ctx.reject();
      return;
    }
    const ok = await bcrypt.compare(ctx.password, row.password_hash);
    if (!ok) {
      ctx.reject();
      return;
    }
    client.serverId = row.id;
    client.rootPath = path.join(serverRoot, row.id);
    await fs.mkdir(client.rootPath, { recursive: true });
    ctx.accept();
  });

  client.on("ready", () => {
    client.on("session", (accept) => {
      const session = accept();
      session.on("sftp", (accept) => {
        const sftpStream = accept();

        sftpStream.on("REALPATH", (reqid, givenPath) => {
          sftpStream.name(reqid, [{ filename: "/", longname: "/", attrs: {} }]);
        });

        sftpStream.on("STAT", async (reqid, givenPath) => {
          try {
            const stat = await fs.stat(safePath(client.rootPath, givenPath));
            sftpStream.attrs(reqid, stat);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("LSTAT", async (reqid, givenPath) => {
          try {
            const stat = await fs.lstat(safePath(client.rootPath, givenPath));
            sftpStream.attrs(reqid, stat);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("OPENDIR", async (reqid, givenPath) => {
          try {
            const resolved = safePath(client.rootPath, givenPath);
            const entries = await fs.readdir(resolved, { withFileTypes: true });
            const id = handleIndex++;
            handles.set(id, { type: "dir", root: resolved, entries, offset: 0 });
            const handle = Buffer.alloc(4);
            handle.writeUInt32BE(id, 0);
            sftpStream.handle(reqid, handle);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("READDIR", async (reqid, handle) => {
          const id = handle.readUInt32BE(0);
          const dir = handles.get(id);
          if (!dir) {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
            return;
          }
          const batch = dir.entries.slice(dir.offset, dir.offset + 50);
          dir.offset += batch.length;
          if (!batch.length) {
            sftpStream.status(reqid, STATUS_CODE.EOF);
            return;
          }
          const out = await Promise.all(batch.map(async (entry) => {
            const stat = await fs.stat(path.join(dir.root, entry.name));
            return { filename: entry.name, longname: entry.name, attrs: stat };
          }));
          sftpStream.name(reqid, out);
        });

        sftpStream.on("OPEN", async (reqid, givenPath, pflags) => {
          try {
            const resolved = safePath(client.rootPath, givenPath);
            await fs.mkdir(path.dirname(resolved), { recursive: true });
            const file = await fs.open(resolved, openFlags(pflags), 0o644);
            const id = handleIndex++;
            handles.set(id, { type: "file", file });
            const handle = Buffer.alloc(4);
            handle.writeUInt32BE(id, 0);
            sftpStream.handle(reqid, handle);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("READ", async (reqid, handle, offset, length) => {
          const file = handles.get(handle.readUInt32BE(0));
          if (!file) {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
            return;
          }
          const buffer = Buffer.alloc(length);
          const { bytesRead } = await file.file.read(buffer, 0, length, Number(offset));
          if (bytesRead === 0) {
            sftpStream.status(reqid, STATUS_CODE.EOF);
            return;
          }
          sftpStream.data(reqid, buffer.subarray(0, bytesRead));
        });

        sftpStream.on("WRITE", async (reqid, handle, offset, data) => {
          const file = handles.get(handle.readUInt32BE(0));
          if (!file) {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
            return;
          }
          await file.file.write(data, 0, data.length, Number(offset));
          sftpStream.status(reqid, STATUS_CODE.OK);
        });

        sftpStream.on("CLOSE", async (reqid, handle) => {
          const id = handle.readUInt32BE(0);
          const entry = handles.get(id);
          if (entry?.type === "file") {
            await entry.file.close();
          }
          handles.delete(id);
          sftpStream.status(reqid, STATUS_CODE.OK);
        });

        sftpStream.on("REMOVE", async (reqid, givenPath) => {
          try {
            await fs.unlink(safePath(client.rootPath, givenPath));
            sftpStream.status(reqid, STATUS_CODE.OK);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("MKDIR", async (reqid, givenPath) => {
          try {
            await fs.mkdir(safePath(client.rootPath, givenPath), { recursive: true });
            sftpStream.status(reqid, STATUS_CODE.OK);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("RMDIR", async (reqid, givenPath) => {
          try {
            await fs.rmdir(safePath(client.rootPath, givenPath));
            sftpStream.status(reqid, STATUS_CODE.OK);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });

        sftpStream.on("RENAME", async (reqid, oldPath, newPath) => {
          try {
            await fs.rename(safePath(client.rootPath, oldPath), safePath(client.rootPath, newPath));
            sftpStream.status(reqid, STATUS_CODE.OK);
          } catch {
            sftpStream.status(reqid, STATUS_CODE.FAILURE);
          }
        });
      });
    });
  });
});

sshServer.listen(port, "0.0.0.0", () => {
  console.log(`sftp listening on ${port}`);
});

