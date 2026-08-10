// Erzeugt eine schlanke HTML-Übersicht aus einer Export-JSON, falls keine
// Original-HTML im Channel-Ordner liegt. Speicherort: temp-Verzeichnis.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { pathToFileURL } from 'node:url';
import { parseChannelFromText } from '../shared/parser';
import type { ChannelModel, MessageModel } from '../shared/types';

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(s: string) {
  return escapeHtml(s).replace(/\n/g, '<br/>');
}

function formatTs(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function fileUrlForLocalPath(folderPath: string, relativeOrAbs: string): string {
  if (!relativeOrAbs) return '';
  if (/^https?:\/\//i.test(relativeOrAbs) || /^data:/i.test(relativeOrAbs)) {
    return relativeOrAbs;
  }
  let abs = relativeOrAbs;
  if (!path.isAbsolute(abs)) {
    abs = path.resolve(folderPath, abs);
  }
  if (!fs.existsSync(abs)) return '';
  return pathToFileURL(abs).toString();
}

function renderMessage(m: MessageModel, folderPath: string): string {
  const avatar = fileUrlForLocalPath(folderPath, m.authorAvatar);
  const ts = formatTs(m.timestamp);
  const edited = m.editedTimestamp ? ` <span class="edited">(bearbeitet ${formatTs(m.editedTimestamp)})</span>` : '';

  const reply = m.replyTo
    ? `<div class="reply">↩ <b>${escapeHtml(m.replyTo.authorName)}</b> ${escapeHtml(m.replyTo.contentExcerpt)}</div>`
    : '';

  const attachments = m.attachments.map((a) => {
    const src = fileUrlForLocalPath(folderPath, a.url || a.fileName);
    const name = (a.fileName || a.url).toLowerCase();
    if (/\.(png|jpe?g|webp|bmp|gif)$/i.test(name) && src) {
      return `<div class="attachment"><img src="${src}" alt=""/></div>`;
    }
    if (/\.(mp4|webm|mov)$/i.test(name) && src) {
      return `<div class="attachment"><video src="${src}" controls></video></div>`;
    }
    if (/\.(mp3|ogg|wav|m4a)$/i.test(name) && src) {
      return `<div class="attachment"><audio src="${src}" controls></audio></div>`;
    }
    if (src) {
      return `<div class="attachment file"><a href="${src}">📄 ${escapeHtml(a.fileName || 'Datei')}</a></div>`;
    }
    return `<div class="attachment missing">⚠ Datei fehlt: ${escapeHtml(a.fileName || a.url)}</div>`;
  }).join('');

  const reactions = m.reactions.length
    ? `<div class="reactions">${m.reactions.map((r) => {
        const img = fileUrlForLocalPath(folderPath, r.emojiImageUrl);
        return img
          ? `<span class="reaction"><img src="${img}" alt=""/> ${r.count}</span>`
          : `<span class="reaction">${escapeHtml(r.emojiName)} ${r.count}</span>`;
      }).join('')}</div>`
    : '';

  const embeds = m.embeds.map((e) => {
    const img = fileUrlForLocalPath(folderPath, e.imageUrl);
    return `<div class="embed">
      ${e.authorName ? `<div class="embed-author">${escapeHtml(e.authorName)}</div>` : ''}
      ${e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : ''}
      ${e.description ? `<div class="embed-desc">${nl2br(e.description)}</div>` : ''}
      ${e.fields.map((f) => `<div class="embed-field"><b>${escapeHtml(f.name)}</b><div>${nl2br(f.value)}</div></div>`).join('')}
      ${img ? `<img class="embed-image" src="${img}" alt=""/>` : ''}
      ${e.footerText ? `<div class="embed-footer">${escapeHtml(e.footerText)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="message">
    <div class="avatar">${avatar ? `<img src="${avatar}" alt=""/>` : ''}</div>
    <div class="body">
      ${reply}
      <div class="meta"><span class="author">${escapeHtml(m.authorName)}</span> <span class="ts">${ts}</span>${edited}</div>
      <div class="content">${nl2br(m.content)}</div>
      ${attachments}
      ${embeds}
      ${reactions}
    </div>
  </div>`;
}

function renderHtml(channel: ChannelModel): string {
  const css = `
  body { background:#36393f; color:#dcddde; font-family:'Segoe UI',Helvetica,Arial,sans-serif; margin:0; padding:0; }
  header { padding:14px 20px; background:#202225; position:sticky; top:0; }
  header h1 { margin:0; font-size:18px; }
  header .sub { color:#999; font-size:12px; }
  main { max-width:1100px; margin:0 auto; padding:16px; }
  .message { display:grid; grid-template-columns:48px 1fr; gap:12px; padding:8px 12px; border-radius:6px; }
  .message:hover { background:#32353b; }
  .avatar { width:40px; height:40px; border-radius:50%; background:#40444b; overflow:hidden; }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .meta { display:flex; gap:8px; align-items:baseline; }
  .author { color:#fff; font-weight:600; }
  .ts { color:#999; font-size:11px; }
  .edited { color:#999; font-size:10px; font-style:italic; }
  .content { white-space:pre-wrap; line-height:1.5; }
  .reply { font-size:12px; color:#b9bbbe; border-left:2px solid #4f545c; padding-left:8px; margin-bottom:4px; }
  .attachment img { max-width:480px; max-height:360px; border-radius:6px; margin-top:6px; }
  .attachment video, .attachment audio { max-width:480px; margin-top:6px; }
  .attachment.file a { color:#00aff4; }
  .attachment.missing { color:#ed4245; padding:8px; border:1px dashed #ed4245; border-radius:6px; }
  .embed { margin-top:6px; padding:10px 12px; background:#2f3136; border-left:4px solid #5865f2; border-radius:4px; max-width:520px; }
  .embed-title { color:#00aff4; font-weight:700; margin-bottom:4px; }
  .embed-desc { color:#dcddde; }
  .embed-field { margin-top:6px; }
  .embed-image { max-width:100%; max-height:300px; margin-top:6px; border-radius:4px; }
  .embed-footer { font-size:11px; color:#999; margin-top:6px; }
  .reactions { margin-top:6px; display:flex; gap:6px; flex-wrap:wrap; }
  .reaction { background:#2f3136; padding:2px 6px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; font-size:12px; }
  .reaction img { width:16px; height:16px; }
  `;

  const body = channel.messages.map((m) => renderMessage(m, channel.folderPath)).join('\n');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(channel.displayName)}</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <h1># ${escapeHtml(channel.channelName)}</h1>
    <div class="sub">${escapeHtml(channel.guildName || '')} · ${channel.messageCount} Nachrichten · ${channel.firstMessageAt ? formatTs(channel.firstMessageAt) : '?'} – ${channel.lastMessageAt ? formatTs(channel.lastMessageAt) : '?'}</div>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

export function generateHtmlForChannel(jsonFilePath: string): { ok: true; htmlPath: string } | { ok: false; error: string } {
  let text: string;
  try {
    text = fs.readFileSync(jsonFilePath, 'utf-8');
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Lese-Fehler' };
  }
  const folderPath = path.dirname(jsonFilePath);
  const r = parseChannelFromText(text, { jsonFilePath, folderPath, htmlFilePath: null });
  if (!r.ok) return { ok: false, error: r.message };
  return generateHtmlForChannelModel(r.channel);
}

/** Wie generateHtmlForChannel, aber für ein bereits geladenes (ggf. aus mehreren Quellen zusammengeführtes) ChannelModel. */
export function generateHtmlForChannelModel(channel: ChannelModel): { ok: true; htmlPath: string } | { ok: false; error: string } {
  const html = renderHtml(channel);
  const out = path.join(os.tmpdir(), `discord-archive-viewer-${channel.id}.html`);
  try {
    fs.writeFileSync(out, html, 'utf-8');
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Schreib-Fehler' };
  }
  return { ok: true, htmlPath: out };
}
