// Parser für DiscordChatExporter-JSON in das interne Channel_Model.
// Robust gegen abweichende oder unvollständige Strukturen.
// Reines TypeScript, KEINE Electron-/Node-spezifischen Importe.

import type {
  AttachmentModel,
  ChannelModel,
  EmbedModel,
  MessageModel,
  ReactionModel,
  ReplyToModel,
  UserModel,
} from './types';

// -------- Hilfsfunktionen -----------------------------------------------

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true';
  return fallback;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asIsoTimestamp(v: unknown): string | null {
  if (typeof v !== 'string' || v.length === 0) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickFirst<T>(...values: T[]): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function shortHash(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// -------- Sub-Parser -----------------------------------------------------

function parseAttachment(raw: unknown): AttachmentModel {
  const o = asObject(raw);
  const url = asString(pickFirst(o.url, o.path, o.fileUrl, o.proxyUrl), '');
  const fileName =
    asString(pickFirst(o.fileName, o.filename, o.name), '') ||
    extractFileNameFromUrl(url);
  return {
    id: asString(pickFirst(o.id, o.attachmentId, fileName + '_' + url), shortHash(url + fileName)),
    fileName,
    url,
    localPath: null, // wird später im Main-Process aufgelöst
    fileSizeBytes: asNumber(pickFirst(o.fileSizeBytes, o.size, o.fileSize), 0),
    mimeType: asString(pickFirst(o.contentType, o.mimeType, o.type), ''),
  };
}

function extractFileNameFromUrl(url: string): string {
  if (!url) return '';
  const cleaned = url.split('?')[0].split('#')[0];
  const idx = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
  return idx >= 0 ? decodeURIComponent(cleaned.slice(idx + 1)) : cleaned;
}

function parseEmbed(raw: unknown): EmbedModel {
  const o = asObject(raw);
  const author = asObject(o.author);
  const footer = asObject(o.footer);
  const image = asObject(o.image);
  const thumb = asObject(o.thumbnail);
  return {
    title: asString(o.title, ''),
    description: asString(o.description, ''),
    url: asString(o.url, ''),
    color: typeof o.color === 'number' ? o.color : null,
    timestamp: asIsoTimestamp(o.timestamp),
    authorName: asString(author.name, ''),
    authorUrl: asString(author.url, ''),
    authorIconUrl: asString(pickFirst(author.iconUrl, author.proxyIconUrl), ''),
    footerText: asString(footer.text, ''),
    footerIconUrl: asString(pickFirst(footer.iconUrl, footer.proxyIconUrl), ''),
    imageUrl: asString(pickFirst(image.url, image.proxyUrl), ''),
    thumbnailUrl: asString(pickFirst(thumb.url, thumb.proxyUrl), ''),
    fields: asArray(o.fields).map((f) => {
      const fo = asObject(f);
      return {
        name: asString(fo.name, ''),
        value: asString(fo.value, ''),
        inline: asBool(fo.inline, false),
      };
    }),
  };
}

function parseReaction(raw: unknown): ReactionModel {
  const o = asObject(raw);
  const emoji = asObject(o.emoji);
  return {
    emojiName: asString(pickFirst(emoji.name, o.name), ''),
    emojiId: emoji.id != null ? asString(emoji.id) : null,
    emojiImageUrl: asString(pickFirst(emoji.imageUrl, emoji.url), ''),
    count: asNumber(o.count, 1),
    isAnimated: asBool(emoji.isAnimated, false),
  };
}

function parseReplyTo(raw: unknown, content: string): ReplyToModel | null {
  if (raw == null) return null;

  // Variante 1: messageReference im Discord-Roh-Format
  if (typeof raw === 'string') {
    return { messageId: raw, authorName: '', contentExcerpt: '' };
  }
  const o = asObject(raw);
  const msgId = asString(pickFirst(o.messageId, o.id), '');
  if (!msgId) return null;
  const author = asObject(o.author);
  const excerptRaw = asString(pickFirst(o.contentExcerpt, o.content, content), '');
  const excerpt = excerptRaw.length > 200 ? excerptRaw.slice(0, 200) + '…' : excerptRaw;
  return {
    messageId: msgId,
    authorName: asString(pickFirst(author.name, o.authorName), ''),
    contentExcerpt: excerpt,
  };
}

function parseMessage(raw: unknown): MessageModel {
  const o = asObject(raw);
  const author = asObject(o.author);
  const authorName = asString(
    pickFirst(author.nickname, author.name, author.username, o.authorName),
    'Unbekannt',
  );
  const authorAvatar = asString(
    pickFirst(author.avatarUrl, author.avatar_url, author.avatar, o.authorAvatar),
    '',
  );

  // replyTo / messageReference
  const replyToRaw = pickFirst(o.replyTo, o.reference, o.messageReference);

  return {
    id: asString(o.id, shortHash(JSON.stringify(o))),
    authorId: asString(pickFirst(author.id, o.authorId), ''),
    authorName,
    authorAvatar,
    timestamp: asIsoTimestamp(pickFirst(o.timestamp, o.createdTimestamp, o.created_at)),
    editedTimestamp: asIsoTimestamp(pickFirst(o.editedTimestamp, o.timestampEdited, o.edited_at)),
    content: asString(o.content, ''),
    attachments: asArray(o.attachments).map(parseAttachment),
    embeds: asArray(o.embeds).map(parseEmbed),
    reactions: asArray(o.reactions).map(parseReaction),
    replyTo: parseReplyTo(replyToRaw, asString(o.content, '')),
  };
}

function collectUsers(messages: MessageModel[]): UserModel[] {
  const map = new Map<string, UserModel>();
  for (const m of messages) {
    const key = m.authorId || m.authorName;
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        id: m.authorId,
        name: m.authorName,
        avatarUrl: m.authorAvatar,
      });
    }
  }
  return [...map.values()];
}

// -------- Haupt-Parser ---------------------------------------------------

export interface ParseOptions {
  jsonFilePath: string;
  folderPath: string;
  htmlFilePath: string | null;
}

export interface ParseSuccess {
  ok: true;
  channel: ChannelModel;
}
export interface ParseFailure {
  ok: false;
  errorType: 'json_invalid' | 'missing_required_fields';
  message: string;
  filePath: string;
}
export type ParseResult = ParseSuccess | ParseFailure;

export function parseChannelFromText(text: string, opts: ParseOptions): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e: any) {
    return {
      ok: false,
      errorType: 'json_invalid',
      message: e?.message ?? 'JSON-Parserfehler',
      filePath: opts.jsonFilePath,
    };
  }
  return parseChannelFromObject(raw, opts);
}

export function parseChannelFromObject(raw: unknown, opts: ParseOptions): ParseResult {
  const root = asObject(raw);
  const guild = asObject(root.guild);
  const channel = asObject(root.channel);

  const channelName = asString(
    pickFirst(channel.name, root.channelName, root.name),
    '',
  );
  const messagesRaw = asArray(root.messages);

  // Pflichtfelder: channelName oder messages müssen vorhanden sein.
  if (!channelName && messagesRaw.length === 0) {
    return {
      ok: false,
      errorType: 'missing_required_fields',
      message:
        'JSON enthält weder "channel.name" noch "messages". Sieht nicht nach einem DiscordChatExporter-Export aus.',
      filePath: opts.jsonFilePath,
    };
  }

  const warnings: string[] = [];
  const messages = messagesRaw.map(parseMessage);

  // Sortieren: timestamp aufsteigend, null ans Ende, Tiebreaker: id
  messages.sort((a, b) => {
    const at = a.timestamp ? Date.parse(a.timestamp) : Number.POSITIVE_INFINITY;
    const bt = b.timestamp ? Date.parse(b.timestamp) : Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });

  const guildName = asString(pickFirst(guild.name, root.guildName), '');
  const finalChannelName = channelName || 'Unbekannter Channel';
  const displayName = guildName ? `${guildName} / ${finalChannelName}` : finalChannelName;

  const firstWithTs = messages.find((m) => m.timestamp);
  const lastWithTs = [...messages].reverse().find((m) => m.timestamp);

  const channelId = shortHash(opts.jsonFilePath);

  if (messages.length === 0) {
    warnings.push('Diese Datei enthält keine Nachrichten.');
  }

  const model: ChannelModel = {
    id: channelId,
    folderPath: opts.folderPath,
    jsonFilePath: opts.jsonFilePath,
    htmlFilePath: opts.htmlFilePath,
    displayName,
    channelName: finalChannelName,
    guildName,
    messageCount: messages.length,
    firstMessageAt: firstWithTs?.timestamp ?? null,
    lastMessageAt: lastWithTs?.timestamp ?? null,
    users: collectUsers(messages),
    messages,
    warnings,
  };

  return { ok: true, channel: model };
}

// Round-Trip-Hilfsfunktionen ---------------------------------------------

export function serializeChannel(channel: ChannelModel): string {
  return JSON.stringify(channel);
}

export function deserializeChannel(text: string): ChannelModel {
  return JSON.parse(text);
}
