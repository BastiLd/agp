import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type { MoveRequest, MoveResult, MoveResultItem } from './core/types';

/** Total size in bytes of a file or directory (recursive). */
async function pathSize(target: string): Promise<number> {
  const info = await stat(target);
  if (info.isFile()) {
    return info.size;
  }
  if (!info.isDirectory()) {
    return 0;
  }

  let total = 0;
  const entries = await readdir(target, { withFileTypes: true });
  for (const entry of entries) {
    total += await pathSize(join(target, entry.name));
  }
  return total;
}

export async function moveItems(request: MoveRequest): Promise<MoveResult> {
  const mode = request.mode === 'copy' ? 'copy' : 'move';
  const verify = request.verify !== false;
  const targetDir = resolve(request.targetDir);
  const items: MoveResultItem[] = [];

  await mkdir(targetDir, { recursive: true });

  for (const input of request.paths ?? []) {
    const source = resolve(input);
    const target = join(targetDir, basename(source));
    const result: MoveResultItem = { source: input, target, ok: false, bytes: 0, error: null };

    try {
      if (!existsSync(source)) {
        throw new Error('Quelle nicht gefunden.');
      }
      if (resolve(source) === target) {
        throw new Error('Quelle und Ziel sind identisch.');
      }
      if (existsSync(target)) {
        throw new Error('Ziel existiert bereits – wird nicht überschrieben.');
      }

      const sourceBytes = await pathSize(source);
      await cp(source, target, { recursive: true, errorOnExist: true, force: false });

      if (verify) {
        const targetBytes = await pathSize(target);
        if (targetBytes !== sourceBytes) {
          // Roll back the partial copy so we never delete the source after a bad copy.
          await rm(target, { recursive: true, force: true });
          throw new Error(`Verifikation fehlgeschlagen (${sourceBytes} != ${targetBytes} Bytes).`);
        }
      }

      if (mode === 'move') {
        await rm(source, { recursive: true, force: true });
      }

      result.ok = true;
      result.bytes = sourceBytes;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    items.push(result);
  }

  const okCount = items.filter((item) => item.ok).length;
  const failCount = items.length - okCount;
  const verb = mode === 'move' ? 'verschoben' : 'kopiert';

  return {
    ok: failCount === 0,
    mode,
    items,
    message:
      failCount === 0
        ? `${okCount} Element(e) ${verb}.`
        : `${okCount} ${verb}, ${failCount} fehlgeschlagen.`
  };
}
