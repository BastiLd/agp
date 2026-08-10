import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const envPath = path.join(rootDir, ".env");
const envTemplatePath = path.join(rootDir, ".env.local.example");
const args = new Set(process.argv.slice(2));
const prepareOnly = args.has("--prepare-only");

function fail(message) {
  console.error(`\n[dev:local] ${message}`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const isWindowsScript = process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = isWindowsScript
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command, ...commandArgs], {
          cwd: rootDir,
          stdio: "inherit",
          env: process.env,
          ...options
        })
      : spawn(command, commandArgs, {
          cwd: rootDir,
          stdio: "inherit",
          env: process.env,
          ...options
        });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function waitForPort(name, port, attempts = 60) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await checkPort("127.0.0.1", port)) {
      console.log(`[dev:local] ${name} is ready on port ${port}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  fail(`${name} did not become reachable on port ${port}`);
}

async function ensureEnvFile() {
  try {
    await fs.access(envPath);
    console.log("[dev:local] Using existing .env");
  } catch {
    await fs.copyFile(envTemplatePath, envPath);
    console.log("[dev:local] Created .env from .env.local.example");
  }
}

async function ensureDataDirs() {
  await fs.mkdir(path.join(rootDir, "data", "servers"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "data", "backups"), { recursive: true });
}

async function preflight() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isFinite(major) || major < 20 || major >= 26) {
    fail(`Node ${process.version} is not supported. Use Node 20-25.`);
  }

  console.log(`[dev:local] Node ${process.version}`);

  try {
    await run("docker", ["info"], { stdio: "ignore" });
  } catch {
    fail("Docker Desktop is not running. Start Docker Desktop first, then rerun npm run dev:local.");
  }
}

async function main() {
  await preflight();
  await ensureEnvFile();
  await ensureDataDirs();

  console.log("[dev:local] Starting PostgreSQL, Redis and MariaDB");
  await run("docker", ["compose", "-f", "compose.local.yaml", "up", "-d"]);

  await waitForPort("PostgreSQL", 5432);
  await waitForPort("Redis", 6379);
  await waitForPort("MariaDB", 3306);

  console.log("[dev:local] Running migrations and seed");
  await run(npmBin, ["run", "dev:setup"]);

  if (prepareOnly) {
    console.log("[dev:local] Local infrastructure is ready.");
    return;
  }

  console.log("[dev:local] Starting local services");
  await run(npmBin, ["run", "dev"]);
}

main().catch((error) => {
  fail(error.message || String(error));
});




