// Parser für Discords offiziellen persönlichen Datenexport ("Paket").
// Struktur: <root>/messages/index.json (channelId -> Label) und
// <root>/messages/c<channelId>/{channel.json, messages.json}.
// channel.json: {id, type, name?, guild?:{id,name}, recipients?:string[]}
// messages.json: [{ID, Timestamp, Contents, Attachments}] — NUR die eigenen
// gesendeten Nachrichten der exportierenden Person (Discord exportiert keine
// fremden Nachrichten). Reines TypeScript, KEINE Node-/Electron-Importe.

import type { AttachmentModel, ChannelModel, MessageModel, UserModel } from './types';

export interface ParsePackageOptions {
  folderPath: string;
  channelJsonPath: string;
  messagesJsonPath: string;
  /** Stabiler Bezeichner der Quelle (z. B. FolderEntry-ID). */
  personId: string;
  /** Anzeigename der Person, deren Nachrichten das sind. */
  personLabel: string;
  /** Label aus index.json, z. B. "allgemein in Freunde Server" oder "Direct Message with x#0". */
  indexLabel?: string;
}

export type ParsePackageResult =
  | { ok: true; channel: ChannelModel }
  | { ok: false; errorType: 'json_invalid' | 'missing_required_fields'; message: string };

function extractFileNameFromUrl(url: string): string {
  if (!url) return '';
  const cleaned = url.split('?')[0].split('#')[0];
  const idx = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
  return idx >= 0 ? decodeSafe(cleaned.slice(idx + 1)) : cleaned;
}

function decodeSafe(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

const MIME_MAP: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', mp4: 'video/mp4', webm: 'video/webm',
  mov: 'video/quicktime', mkv: 'video/x-matroska', mp3: 'audio/mpeg',
  ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4',
};

function guessMime(fileName: string): string {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function parseAttachments(raw: string): AttachmentModel[] {
  if (!raw) return [];
  return raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => {
      const fileName = extractFileNameFromUrl(url);
      return {
        id: url,
        fileName,
        url,
        localPath: null,
        fileSizeBytes: 0,
        mimeType: guessMime(fileName),
      };
    });
}

function toIsoTimestamp(ts: string): string | null {
  if (!ts) return null;
  // Discords Paket-Export schreibt "YYYY-MM-DD HH:MM:SS" in UTC ohne Zeitzone.
  let iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
  if (!/[zZ]$|[+-]\d\d:\d\d$/.test(iso)) iso += 'Z';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function deriveNamesFromIndexLabel(label: string | undefined): { channelName: string; guildName: string } | null {
  if (!label || label === 'None') return null;
  const m = label.match(/^(.*) in (.*)$/);
  if (m) return { channelName: m[1], guildName: m[2] };
  return { channelName: label, guildName: '' };
}

export function parsePackageChannel(
  channelJsonRaw: unknown,
  messagesRaw: unknown,
  opts: ParsePackageOptions,
): ParsePackageResult {
  const cj = channelJsonRaw && typeof channelJsonRaw === 'object' ? (channelJsonRaw as any) : null;
  if (!cj || cj.id == null) {
    return { ok: false, errorType: 'missing_required_fields', message: 'channel.json enthält keine gültige Channel-ID.' };
  }
  const type = String(cj.type || 'UNKNOWN');
  const idxNames = deriveNamesFromIndexLabel(opts.indexLabel);

  let channelName = '';
  let guildName = '';

  if (cj.name) {
    channelName = String(cj.name);
    guildName = cj.guild?.name ? String(cj.guild.name) : '';
  } else if (type === 'DM') {
    guildName = 'Direktnachrichten';
    if (idxNames) {
      channelName = idxNames.channelName.replace(/^Direct Message with /, '');
    } else if (Array.isArray(cj.recipients) && cj.recipients.length) {
      channelName = `Direktnachricht (${cj.recipients.join(', ')})`;
    } else {
      channelName = 'Direktnachricht';
    }
  } else if (type === 'GROUP_DM') {
    guildName = 'Gruppen-Chats';
    channelName = idxNames ? idxNames.channelName : 'Gruppenchat';
  } else {
    // GUILD_TEXT ohne Namensfeld oder unbekannter Typ
    if (idxNames) {
      channelName = idxNames.channelName;
      guildName = idxNames.guildName;
    } else {
      channelName = `Channel ${cj.id}`;
      guildName = 'Unbekannter Server';
    }
  }
  if (!channelName) channelName = `Channel ${cj.id}`;

  const messagesArr = Array.isArray(messagesRaw) ? messagesRaw : [];
  const messages: MessageModel[] = messagesArr.map((raw: any) => ({
    id: String(raw?.ID ?? ''),
    authorId: opts.personId,
    authorName: opts.personLabel,
    authorAvatar: '',
    timestamp: toIsoTimestamp(String(raw?.Timestamp ?? '')),
    editedTimestamp: null,
    content: String(raw?.Contents ?? ''),
    attachments: parseAttachments(String(raw?.Attachments ?? '')),
    embeds: [],
    reactions: [],
    replyTo: null,
  }));

  messages.sort((a, b) => {
    const at = a.timestamp ? Date.parse(a.timestamp) : Number.POSITIVE_INFINITY;
    const bt = b.timestamp ? Date.parse(b.timestamp) : Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });

  const firstWithTs = messages.find((m) => m.timestamp);
  const lastWithTs = [...messages].reverse().find((m) => m.timestamp);
  const displayName = guildName ? `${guildName} / ${channelName}` : channelName;
  const users: UserModel[] = [{ id: opts.personId, name: opts.personLabel, avatarUrl: '' }];

  const warnings: string[] = [];
  if (messages.length === 0) {
    warnings.push(`Von „${opts.personLabel}" liegen hier keine Nachrichten vor (Discord exportiert nur selbst gesendete Nachrichten).`);
  }

  const channel: ChannelModel = {
    id: String(cj.id),
    folderPath: opts.folderPath,
    jsonFilePath: opts.messagesJsonPath,
    htmlFilePath: null,
    displayName,
    channelName,
    guildName,
    messageCount: messages.length,
    firstMessageAt: firstWithTs?.timestamp ?? null,
    lastMessageAt: lastWithTs?.timestamp ?? null,
    users,
    messages,
    warnings,
  };
  return { ok: true, channel };
}

/** Führt mehrere Sichten desselben Channels (z. B. von verschiedenen Personen exportiert) zu einer zusammen. */
export function mergeChannelModels(models: ChannelModel[]): ChannelModel {
  if (models.length === 1) return models[0];

  const byId = new Map<string, MessageModel>();
  for (const model of models) {
    for (const m of model.messages) {
      if (!byId.has(m.id)) byId.set(m.id, m);
    }
  }
  const messages = [...byId.values()].sort((a, b) => {
    const at = a.timestamp ? Date.parse(a.timestamp) : Number.POSITIVE_INFINITY;
    const bt = b.timestamp ? Date.parse(b.timestamp) : Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });

  // Bevorzuge einen "sprechenden" Namen (nicht den generischen Fallback).
  const named = models.find((m) => !/^Channel \d+$/.test(m.channelName)) ?? models[0];

  const usersById = new Map<string, UserModel>();
  for (const model of models) for (const u of model.users) if (!usersById.has(u.id)) usersById.set(u.id, u);

  const warnings = [...new Set(models.flatMap((m) => m.warnings))].filter(
    (w) => messages.length === 0 || !w.includes('keine Nachrichten vor'),
  );

  const firstWithTs = messages.find((m) => m.timestamp);
  const lastWithTs = [...messages].reverse().find((m) => m.timestamp);

  return {
    id: named.id,
    folderPath: models[0].folderPath,
    jsonFilePath: models[0].jsonFilePath,
    htmlFilePath: null,
    displayName: named.displayName,
    channelName: named.channelName,
    guildName: named.guildName,
    messageCount: messages.length,
    firstMessageAt: firstWithTs?.timestamp ?? null,
    lastMessageAt: lastWithTs?.timestamp ?? null,
    users: [...usersById.values()],
    messages,
    warnings,
  };
}
