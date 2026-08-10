import type { ChannelData, Message, Channel, Guild } from '../types';

type Json = unknown;

function isObj(v: Json): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asObj(v: Json): Record<string, Json> {
  return isObj(v) ? v : {};
}

function asArr(v: Json): Json[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: Json, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function asStringOrNull(v: Json): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

function asNumber(v: Json, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asBool(v: Json): boolean {
  return Boolean(v);
}

/**
 * Parses a single DiscordChatExporter JSON file and normalizes its content.
 * @param file The file to parse
 * @returns A promise that resolves to ChannelData
 */
export async function parseDiscordJson(file: File): Promise<ChannelData> {
  const content = await file.text();
  let rawData: Json;

  try {
    rawData = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unbekannt';
    throw new Error(`Ungültiges JSON-Format in Datei "${file.name}": ${msg}`, {
      cause: err,
    });
  }

  if (!isObj(rawData)) {
    throw new Error(`Die Datei "${file.name}" enthält kein gültiges JSON-Objekt.`);
  }

  const messagesRaw = rawData.messages;
  if (!Array.isArray(messagesRaw)) {
    throw new Error(
      `Die Datei "${file.name}" scheint kein DiscordChatExporter-Export zu sein. ` +
      `Es fehlt das Feld "messages" (Array).`,
    );
  }

  const channelInfoRaw = asObj(rawData.channel);
  const guildInfoRaw = isObj(rawData.guild) ? rawData.guild : null;

  if (!isObj(rawData.channel)) {
    console.warn(
      `Die Datei "${file.name}" hat kein "channel"-Feld. Es wird ein Platzhalter verwendet.`,
    );
  }

  // Normalize Channel Info
  const channelInfo: Channel = {
    id: asString(
      channelInfoRaw.id,
      String(Math.floor(Math.random() * 100000000)),
    ),
    type: asString(channelInfoRaw.type, 'GuildText'),
    name: asString(channelInfoRaw.name, file.name.replace(/\.json$/i, '')),
    topic: asStringOrNull(channelInfoRaw.topic),
    category: asStringOrNull(channelInfoRaw.category),
  };

  // Normalize Guild Info
  const guildInfo: Guild | null = guildInfoRaw
    ? {
        id: asString(guildInfoRaw.id, ''),
        name: asString(guildInfoRaw.name, 'Discord Server'),
        iconUrl: asStringOrNull(guildInfoRaw.iconUrl),
      }
    : null;

  // Normalize and validate messages
  const messages: Message[] = messagesRaw.map((m: Json, idx: number) => {
    const msg = asObj(m);

    const authorRaw = asObj(msg.author);
    const author = {
      id: asString(authorRaw.id, `unknown-${idx}`),
      name: asString(authorRaw.name, 'Unbekannter User'),
      discriminator: asString(authorRaw.discriminator, '0000'),
      nickname: asStringOrNull(authorRaw.nickname),
      color: asStringOrNull(authorRaw.color),
      avatarUrl: asString(authorRaw.avatarUrl, ''),
      isBot: asBool(authorRaw.isBot),
    };

    const attachments = asArr(msg.attachments).map((a: Json) => {
      const att = asObj(a);
      return {
        id: asString(att.id, Math.random().toString()),
        url: asString(att.url, ''),
        fileName: asString(att.fileName, ''),
        fileSize: asNumber(att.fileSize, 0),
      };
    });

    const embeds = asArr(msg.embeds).map((e: Json) => {
      const emb = asObj(e);
      const thumbObj = asObj(emb.thumbnail);
      const imageObj = asObj(emb.image);
      const authorObj = isObj(emb.author) ? emb.author : null;
      const footerObj = isObj(emb.footer) ? emb.footer : null;

      return {
        title: asStringOrNull(emb.title),
        description: asStringOrNull(emb.description),
        url: asStringOrNull(emb.url),
        timestamp: asStringOrNull(emb.timestamp),
        color: asStringOrNull(emb.color),
        thumbnail: thumbObj.url ? { url: asString(thumbObj.url, '') } : null,
        image: imageObj.url ? { url: asString(imageObj.url, '') } : null,
        author: authorObj
          ? {
              name: asString(authorObj.name, ''),
              url: authorObj.url ? asString(authorObj.url) : undefined,
              iconUrl: authorObj.iconUrl ? asString(authorObj.iconUrl) : undefined,
            }
          : null,
        fields: asArr(emb.fields).map((f: Json) => {
          const fld = asObj(f);
          return {
            name: asString(fld.name, ''),
            value: asString(fld.value, ''),
            isInline: asBool(fld.isInline),
          };
        }),
        footer: footerObj
          ? {
              text: asString(footerObj.text, ''),
              iconUrl: footerObj.iconUrl ? asString(footerObj.iconUrl) : undefined,
            }
          : null,
      };
    });

    const reactions = asArr(msg.reactions).map((r: Json) => {
      const react = asObj(r);
      const emojiRaw = asObj(react.emoji);
      return {
        emoji: {
          id: asStringOrNull(emojiRaw.id),
          name: asString(emojiRaw.name, '❓'),
          isAnimated: asBool(emojiRaw.isAnimated),
        },
        count: asNumber(react.count, 0),
      };
    });

    const mentions = asArr(msg.mentions).map((men: Json) => {
      const m = asObj(men);
      return {
        id: asString(m.id, ''),
        name: asString(m.name, ''),
      };
    });

    const refRaw = isObj(msg.reference) ? msg.reference : null;
    const reference = refRaw
      ? {
          messageId: asString(refRaw.messageId, ''),
          channelId: asString(refRaw.channelId, ''),
          guildId: asString(refRaw.guildId, ''),
        }
      : null;

    return {
      id: asString(msg.id, `msg-${idx}`),
      type: asString(msg.type, 'Default'),
      timestamp: asString(msg.timestamp, new Date().toISOString()),
      timestampEdited: asStringOrNull(msg.timestampEdited),
      callEndedTimestamp: asStringOrNull(msg.callEndedTimestamp),
      isPinned: asBool(msg.isPinned),
      content: asString(msg.content, ''),
      author,
      attachments,
      embeds,
      reactions,
      mentions,
      reference,
    };
  });

  // Sort messages ascending (oldest first, newest last / bottom)
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    channelInfo,
    messages,
    guildInfo,
  };
}
