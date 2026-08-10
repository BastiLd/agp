import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  parseChannelFromText,
  type ParseOptions,
} from '../shared/parser';
import { parsePackageChannel, mergeChannelModels } from '../shared/package-parser';
import type {
  ChannelLoadError,
  ChannelModel,
  ChannelSourceRef,
  FolderEntry,
  ScanResult,
  ScanResultChannelMeta,
} from '../shared/types';

const MAX_DEPTH = 20;

export interface ScanProgressCallback {
  (info: {
    phase: 'starting' | 'scanning' | 'parsing' | 'done';
    scannedCount: number;
    totalEstimate: number;
    currentPath: string;
  }): void;
}

interface FoundJson {
  jsonFilePath: string;
  folderPath: string;
}

interface FoundPackageUnit {
  folderPath: string;
  channelJsonPath: string;
  messagesJsonPath: string;
  entry: FolderEntry;
}

function shortHash(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function isJsonFile(name: string) {
  return name.toLowerCase().endsWith('.json');
}

function isHtmlFile(name: string) {
  return name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm');
}

function findHtmlSibling(folder: string, jsonFile: string): string | null {
  const base = path.basename(jsonFile, path.extname(jsonFile));
  try {
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    const exact = entries.find(
      (e) => e.isFile() && path.basename(e.name, path.extname(e.name)) === base && isHtmlFile(e.name),
    );
    if (exact) return path.join(folder, exact.name);
    const anyHtml = entries.find((e) => e.isFile() && isHtmlFile(e.name));
    return anyHtml ? path.join(folder, anyHtml.name) : null;
  } catch {
    return null;
  }
}

/**
 * Durchsucht einen registrierten Ordner rekursiv. Erkennt dabei:
 *  - "Paket"-Channel-Ordner (Discords offizieller Datenexport): Verzeichnis
 *    mit channel.json + messages.json.
 *  - index.json (Label-Zuordnung channelId -> "Name in Server").
 *  - klassische DiscordChatExporter-JSON-Dateien (alles andere *.json).
 */
function walkRecursive(
  entry: FolderEntry,
  startPath: string,
  onJson: (j: FoundJson) => void,
  onPackageUnit: (u: FoundPackageUnit) => void,
  onIndexJson: (filePath: string) => void,
  onError: (path: string, reason: string) => void,
  onProgress: (currentPath: string, scannedCount: number) => void,
) {
  let scanned = 0;
  const stack: Array<{ p: string; depth: number }> = [{ p: startPath, depth: 0 }];

  while (stack.length > 0) {
    const { p, depth } = stack.pop()!;
    if (depth > MAX_DEPTH) continue;

    let stat: fs.Stats;
    try {
      stat = fs.statSync(p);
    } catch (e: any) {
      onError(p, e?.message ?? 'Pfad nicht erreichbar');
      continue;
    }

    if (stat.isDirectory()) {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(p, { withFileTypes: true });
      } catch (e: any) {
        onError(p, e?.message ?? 'Verzeichnis nicht lesbar');
        continue;
      }
      scanned++;
      onProgress(p, scanned);

      const fileNames = new Set(entries.filter((e) => e.isFile()).map((e) => e.name.toLowerCase()));
      const isPackageUnit = fileNames.has('channel.json') && fileNames.has('messages.json');

      if (isPackageUnit) {
        const channelJsonEnt = entries.find((e) => e.isFile() && e.name.toLowerCase() === 'channel.json')!;
        const messagesJsonEnt = entries.find((e) => e.isFile() && e.name.toLowerCase() === 'messages.json')!;
        onPackageUnit({
          folderPath: p,
          channelJsonPath: path.join(p, channelJsonEnt.name),
          messagesJsonPath: path.join(p, messagesJsonEnt.name),
          entry,
        });
      }

      for (const ent of entries) {
        const full = path.join(p, ent.name);
        if (ent.isDirectory()) {
          stack.push({ p: full, depth: depth + 1 });
        } else if (ent.isFile()) {
          const lower = ent.name.toLowerCase();
          if (lower === 'index.json') {
            onIndexJson(full);
            continue;
          }
          if (isPackageUnit && (lower === 'channel.json' || lower === 'messages.json')) {
            continue; // bereits als Paket-Einheit erfasst
          }
          if (isJsonFile(ent.name)) onJson({ jsonFilePath: full, folderPath: p });
        }
      }
    } else if (stat.isFile() && isJsonFile(p)) {
      onJson({ jsonFilePath: p, folderPath: path.dirname(p) });
    }
  }
}

function parsePackageUnit(
  unit: FoundPackageUnit,
  indexLabels: Map<string, string>,
): { ok: true; channel: ChannelModel; ref: ChannelSourceRef } | { ok: false; error: ChannelLoadError } {
  let channelJsonRaw: unknown;
  let messagesRaw: unknown;
  try {
    channelJsonRaw = JSON.parse(fs.readFileSync(unit.channelJsonPath, 'utf-8'));
  } catch (e: any) {
    return { ok: false, error: { filePath: unit.channelJsonPath, errorType: 'json_invalid', message: e?.message ?? 'JSON-Parserfehler' } };
  }
  try {
    messagesRaw = JSON.parse(fs.readFileSync(unit.messagesJsonPath, 'utf-8'));
  } catch (e: any) {
    return { ok: false, error: { filePath: unit.messagesJsonPath, errorType: 'json_invalid', message: e?.message ?? 'JSON-Parserfehler' } };
  }

  const cjId = (channelJsonRaw as any)?.id != null ? String((channelJsonRaw as any).id) : null;
  const indexLabel = cjId ? indexLabels.get(cjId) : undefined;
  const personLabel = unit.entry.personLabel?.trim() || 'Ich';

  const result = parsePackageChannel(channelJsonRaw, messagesRaw, {
    folderPath: unit.folderPath,
    channelJsonPath: unit.channelJsonPath,
    messagesJsonPath: unit.messagesJsonPath,
    personId: unit.entry.id,
    personLabel,
    indexLabel,
  });
  if (!result.ok) {
    return { ok: false, error: { filePath: unit.channelJsonPath, errorType: result.errorType, message: result.message } };
  }
  const ref: ChannelSourceRef = {
    format: 'package',
    channelJsonPath: unit.channelJsonPath,
    messagesJsonPath: unit.messagesJsonPath,
    folderPath: unit.folderPath,
    folderEntryId: unit.entry.id,
    personLabel,
    indexLabel,
  };
  return { ok: true, channel: result.channel, ref };
}

export async function scanFolders(
  folders: FolderEntry[],
  onProgress: ScanProgressCallback,
): Promise<ScanResult> {
  onProgress({ phase: 'starting', scannedCount: 0, totalEstimate: 0, currentPath: '' });

  const errors: ChannelLoadError[] = [];
  const skippedFolders: Array<{ path: string; reason: string }> = [];
  const scannedFolders: string[] = [];
  const foundJson: FoundJson[] = [];
  const foundPackageUnits: FoundPackageUnit[] = [];
  const indexJsonPaths = new Set<string>();

  for (const f of folders) {
    if (!fs.existsSync(f.path)) {
      skippedFolders.push({ path: f.path, reason: 'Pfad existiert nicht' });
      continue;
    }
    walkRecursive(
      f,
      f.path,
      (j) => foundJson.push(j),
      (u) => foundPackageUnits.push(u),
      (idx) => indexJsonPaths.add(idx),
      (p, reason) => skippedFolders.push({ path: p, reason }),
      (currentPath, n) => {
        scannedFolders.push(currentPath);
        onProgress({ phase: 'scanning', scannedCount: n, totalEstimate: 0, currentPath });
      },
    );
  }

  // index.json-Labels zusammenführen (channelId -> "Name in Server" / "Direct Message with X")
  const indexLabels = new Map<string, string>();
  for (const idxPath of indexJsonPaths) {
    try {
      const parsed = JSON.parse(fs.readFileSync(idxPath, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') indexLabels.set(k, v);
        }
      }
    } catch {
      skippedFolders.push({ path: idxPath, reason: 'index.json nicht lesbar' });
    }
  }

  const channels: ScanResultChannelMeta[] = [];
  const channelSources: Record<string, ChannelSourceRef[]> = {};

  // ---- Paket-Format (Discord-Datenexport): nach Channel-ID gruppieren & mergen ----
  const packageModelsById = new Map<string, ChannelModel[]>();
  let parsed = 0;
  for (const unit of foundPackageUnits) {
    parsed++;
    onProgress({ phase: 'parsing', scannedCount: parsed, totalEstimate: foundPackageUnits.length + foundJson.length, currentPath: unit.channelJsonPath });
    const r = parsePackageUnit(unit, indexLabels);
    if (!r.ok) {
      errors.push(r.error);
      continue;
    }
    const list = packageModelsById.get(r.channel.id) ?? [];
    list.push(r.channel);
    packageModelsById.set(r.channel.id, list);
    const refs = channelSources[r.channel.id] ?? [];
    refs.push(r.ref);
    channelSources[r.channel.id] = refs;
  }

  for (const [id, models] of packageModelsById.entries()) {
    const merged = mergeChannelModels(models);
    channels.push({
      id,
      jsonFilePath: merged.jsonFilePath,
      folderPath: merged.folderPath,
      htmlFilePath: null,
      channelName: merged.channelName,
      guildName: merged.guildName,
      displayName: merged.displayName,
      messageCount: merged.messageCount,
      firstMessageAt: merged.firstMessageAt,
      lastMessageAt: merged.lastMessageAt,
      available: true,
      warnings: merged.warnings,
      sourceCount: models.length,
    });
  }

  // ---- Klassisches DiscordChatExporter-Format: 1 JSON-Datei = 1 Channel ----
  const uniqueByPath = new Map<string, FoundJson>();
  for (const j of foundJson) {
    uniqueByPath.set(path.resolve(j.jsonFilePath), j);
  }

  for (const j of uniqueByPath.values()) {
    parsed++;
    onProgress({
      phase: 'parsing',
      scannedCount: parsed,
      totalEstimate: foundPackageUnits.length + uniqueByPath.size,
      currentPath: j.jsonFilePath,
    });

    let text: string;
    try {
      text = fs.readFileSync(j.jsonFilePath, 'utf-8');
    } catch (e: any) {
      errors.push({ filePath: j.jsonFilePath, errorType: 'io_error', message: e?.message ?? 'Datei nicht lesbar' });
      continue;
    }

    const opts: ParseOptions = {
      jsonFilePath: j.jsonFilePath,
      folderPath: j.folderPath,
      htmlFilePath: findHtmlSibling(j.folderPath, j.jsonFilePath),
    };
    const result = parseChannelFromText(text, opts);
    if (!result.ok) {
      errors.push({ filePath: j.jsonFilePath, errorType: result.errorType, message: result.message });
      continue;
    }
    const c = result.channel;
    channels.push({
      id: c.id,
      jsonFilePath: c.jsonFilePath,
      folderPath: c.folderPath,
      htmlFilePath: c.htmlFilePath,
      channelName: c.channelName,
      guildName: c.guildName,
      displayName: c.displayName,
      messageCount: c.messageCount,
      firstMessageAt: c.firstMessageAt,
      lastMessageAt: c.lastMessageAt,
      available: true,
      warnings: c.warnings,
      sourceCount: 1,
    });
    channelSources[c.id] = [{ format: 'dce', jsonFilePath: c.jsonFilePath, folderPath: c.folderPath }];
  }

  channels.sort((a, b) => a.displayName.localeCompare(b.displayName));

  onProgress({ phase: 'done', scannedCount: parsed, totalEstimate: parsed, currentPath: '' });

  return { channels, errors, scannedFolders, skippedFolders, channelSources };
}

/** Lädt einen Channel frisch von der Platte und führt ggf. mehrere Quellen (Personen) zusammen. */
export function loadChannelMerged(
  channelId: string,
  sources: ChannelSourceRef[] | undefined,
): { ok: true; channel: ChannelModel } | { ok: false; error: ChannelLoadError } {
  if (!sources || sources.length === 0) {
    return { ok: false, error: { filePath: '', errorType: 'unknown', message: 'Channel nicht im Index. Bitte neu scannen.' } };
  }

  const models: ChannelModel[] = [];
  let lastError: ChannelLoadError | null = null;

  for (const src of sources) {
    if (src.format === 'dce') {
      let text: string;
      try {
        text = fs.readFileSync(src.jsonFilePath, 'utf-8');
      } catch (e: any) {
        lastError = { filePath: src.jsonFilePath, errorType: 'io_error', message: e?.message ?? 'Datei nicht lesbar' };
        continue;
      }
      const html = findHtmlSibling(src.folderPath, src.jsonFilePath);
      const r = parseChannelFromText(text, { jsonFilePath: src.jsonFilePath, folderPath: src.folderPath, htmlFilePath: html });
      if (!r.ok) {
        lastError = { filePath: r.filePath, errorType: r.errorType, message: r.message };
        continue;
      }
      models.push(r.channel);
    } else {
      let channelJsonRaw: unknown;
      let messagesRaw: unknown;
      try {
        channelJsonRaw = JSON.parse(fs.readFileSync(src.channelJsonPath, 'utf-8'));
        messagesRaw = JSON.parse(fs.readFileSync(src.messagesJsonPath, 'utf-8'));
      } catch (e: any) {
        lastError = { filePath: src.channelJsonPath, errorType: 'json_invalid', message: e?.message ?? 'JSON-Parserfehler' };
        continue;
      }
      const r = parsePackageChannel(channelJsonRaw, messagesRaw, {
        folderPath: src.folderPath,
        channelJsonPath: src.channelJsonPath,
        messagesJsonPath: src.messagesJsonPath,
        personId: src.folderEntryId,
        personLabel: src.personLabel,
        indexLabel: src.indexLabel,
      });
      if (!r.ok) {
        lastError = { filePath: src.channelJsonPath, errorType: r.errorType, message: r.message };
        continue;
      }
      models.push(r.channel);
    }
  }

  if (models.length === 0) {
    return { ok: false, error: lastError ?? { filePath: '', errorType: 'unknown', message: 'Channel konnte nicht geladen werden.' } };
  }

  return { ok: true, channel: mergeChannelModels(models) };
}

export { shortHash };
