// Erzeugt eine Markdown-Datei aus einem Channel-JSON.
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseChannelFromText } from '../shared/parser';
import type { ChannelModel } from '../shared/types';

function fmtTs(iso: string | null): string {
  if (!iso) return '?';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export function exportMarkdownForChannel(jsonFilePath: string): { ok: true; filePath: string } | { ok: false; error: string } {
  let text: string;
  try { text = fs.readFileSync(jsonFilePath, 'utf-8'); }
  catch (e: any) { return { ok: false, error: e?.message ?? 'Lese-Fehler' }; }
  const folderPath = path.dirname(jsonFilePath);
  const r = parseChannelFromText(text, { jsonFilePath, folderPath, htmlFilePath: null });
  if (!r.ok) return { ok: false, error: r.message };
  return exportMarkdownForChannelModel(r.channel);
}

/** Wie exportMarkdownForChannel, aber für ein bereits geladenes (ggf. zusammengeführtes) ChannelModel. */
export function exportMarkdownForChannelModel(c: ChannelModel): { ok: true; filePath: string } | { ok: false; error: string } {
  const lines: string[] = [];
  lines.push(`# ${c.displayName}`);
  lines.push('');
  lines.push(`> ${c.guildName} · ${c.messageCount} Nachrichten · ${fmtTs(c.firstMessageAt)} – ${fmtTs(c.lastMessageAt)}`);
  lines.push('');
  for (const m of c.messages) {
    lines.push(`## ${m.authorName} — ${fmtTs(m.timestamp)}${m.editedTimestamp ? ' (bearbeitet ' + fmtTs(m.editedTimestamp) + ')' : ''}`);
    if (m.replyTo) lines.push(`> Antwort an **${m.replyTo.authorName}**: ${m.replyTo.contentExcerpt}`);
    if (m.content) lines.push(m.content);
    for (const a of m.attachments) lines.push(`- 📎 \`${a.fileName || a.url}\``);
    for (const e of m.embeds) {
      if (e.title) lines.push(`> **${e.title}**`);
      if (e.description) lines.push('> ' + e.description.replace(/\n/g, '\n> '));
    }
    if (m.reactions.length) lines.push(m.reactions.map((r) => `${r.emojiName} ${r.count}`).join(' · '));
    lines.push('');
  }
  const out = path.join(os.tmpdir(), `discord-archive-${c.id}.md`);
  try { fs.writeFileSync(out, lines.join('\n'), 'utf-8'); }
  catch (e: any) { return { ok: false, error: e?.message ?? 'Schreib-Fehler' }; }
  return { ok: true, filePath: out };
}
