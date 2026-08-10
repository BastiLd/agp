import { spawn } from 'node:child_process';

const rendererUrl = 'http://127.0.0.1:5173';
const isWindows = process.platform === 'win32';
const npmBin = isWindows ? 'npm.cmd' : 'npm';
const electronBin = isWindows ? 'electron.cmd' : 'electron';
const smokeExitMs = Number.parseInt(process.env.OBBYMM_DESKTOP_SMOKE_EXIT_MS ?? '', 10);

const children = new Set();

function run(command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    shell: isWindows,
    stdio: 'inherit',
  });

  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}

function stopAll(code = 0) {
  for (const child of children) {
    child.kill();
  }
  process.exit(code);
}

async function waitForRenderer(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(rendererUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  throw new Error(`Timed out waiting for Vite at ${rendererUrl}`);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

const vite = run(npmBin, ['run', 'dev:web', '--', '--host', '127.0.0.1']);

vite.on('exit', (code) => {
  stopAll(code ?? 1);
});

try {
  await waitForRenderer();
  const electron = run(electronBin, ['.'], { VITE_DEV_SERVER_URL: rendererUrl });
  electron.on('exit', (code) => stopAll(code ?? 0));

  if (Number.isFinite(smokeExitMs) && smokeExitMs > 0) {
    setTimeout(() => stopAll(0), smokeExitMs);
  }
} catch (error) {
  console.error(error);
  stopAll(1);
}
