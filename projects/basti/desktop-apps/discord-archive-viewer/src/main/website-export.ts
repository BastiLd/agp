// Erzeugt eine eigenständige Single-File-HTML-Website aus den geladenen
// Channels. Die Website hat eigene Sidebar, Suche, Theme-Switcher,
// Statistik, Galerie und Lightbox — komplett offline lauffähig.
//
// Mediendaten werden als data:-URLs eingebettet (limitiert in Größe,
// um die HTML-Datei nicht zu sprengen).

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseChannelFromText } from '../shared/parser';
import { resolveLocalAttachment } from './media-resolver';
import type { ChannelModel } from '../shared/types';

const MAX_INLINE_BYTES = 4 * 1024 * 1024; // 4 MB pro Datei → data-URL

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.gif') return 'image/gif';
  if (e === '.webp') return 'image/webp';
  if (e === '.bmp') return 'image/bmp';
  if (e === '.svg') return 'image/svg+xml';
  if (e === '.mp4') return 'video/mp4';
  if (e === '.webm') return 'video/webm';
  if (e === '.mov') return 'video/quicktime';
  if (e === '.mp3') return 'audio/mpeg';
  if (e === '.ogg') return 'audio/ogg';
  if (e === '.wav') return 'audio/wav';
  if (e === '.m4a') return 'audio/mp4';
  return 'application/octet-stream';
}

function fileToDataUrl(absPath: string): string | null {
  try {
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) return null;
    if (stat.size > MAX_INLINE_BYTES) return null;
    const buf = fs.readFileSync(absPath);
    const mime = mimeFromExt(path.extname(absPath));
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function resolveToDataUrl(folderPath: string, urlOrName: string): string {
  if (!urlOrName) return '';
  if (/^(https?:|data:)/i.test(urlOrName)) return urlOrName;
  const r = resolveLocalAttachment(folderPath, urlOrName);
  if (!r.exists || !r.absolutePath) return '';
  return fileToDataUrl(r.absolutePath) ?? '';
}

interface WebsiteChannel {
  id: string;
  channelName: string;
  guildName: string;
  displayName: string;
  messageCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  messages: Array<{
    i: string;
    aN: string;          // author name
    aA: string;          // author avatar (data url or empty)
    t: string | null;    // timestamp
    e: string | null;    // edited timestamp
    c: string;           // content
    rT?: { aN: string; cE: string } | null;
    at?: Array<{ n: string; u: string; k: 'image' | 'gif' | 'video' | 'audio' | 'file'; s: number; m: string }>;
    em?: Array<{ t: string; d: string; u: string; iU: string; aN: string; aIU: string; fT: string; fIU: string; f: Array<{ n: string; v: string }> }>;
    rx?: Array<{ n: string; iU: string; c: number }>;
  }>;
}

function classifyName(name: string): 'image' | 'gif' | 'video' | 'audio' | 'file' {
  const l = name.toLowerCase();
  if (l.endsWith('.gif')) return 'gif';
  if (/\.(png|jpe?g|webp|bmp)$/i.test(l)) return 'image';
  if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(l)) return 'video';
  if (/\.(mp3|ogg|wav|m4a|flac|aac)$/i.test(l)) return 'audio';
  return 'file';
}

function compactChannel(ch: ChannelModel): WebsiteChannel {
  const folder = ch.folderPath;
  return {
    id: ch.id,
    channelName: ch.channelName,
    guildName: ch.guildName,
    displayName: ch.displayName,
    messageCount: ch.messageCount,
    firstMessageAt: ch.firstMessageAt,
    lastMessageAt: ch.lastMessageAt,
    messages: ch.messages.map((m) => ({
      i: m.id,
      aN: m.authorName,
      aA: resolveToDataUrl(folder, m.authorAvatar),
      t: m.timestamp,
      e: m.editedTimestamp,
      c: m.content,
      rT: m.replyTo ? { aN: m.replyTo.authorName, cE: m.replyTo.contentExcerpt } : null,
      at: m.attachments.map((a) => ({
        n: a.fileName || a.url,
        u: resolveToDataUrl(folder, a.url || a.fileName),
        k: classifyName(a.fileName || a.url),
        s: a.fileSizeBytes || 0,
        m: a.mimeType || '',
      })),
      em: m.embeds.map((e) => ({
        t: e.title, d: e.description, u: e.url,
        iU: resolveToDataUrl(folder, e.imageUrl),
        aN: e.authorName, aIU: resolveToDataUrl(folder, e.authorIconUrl),
        fT: e.footerText, fIU: resolveToDataUrl(folder, e.footerIconUrl),
        f: e.fields.map((f) => ({ n: f.name, v: f.value })),
      })),
      rx: m.reactions.map((r) => ({
        n: r.emojiName, iU: resolveToDataUrl(folder, r.emojiImageUrl), c: r.count,
      })),
    })),
  };
}

function loadAllForChannelMetas(metas: Array<{ id: string; jsonFilePath: string; folderPath: string }>): WebsiteChannel[] {
  const out: WebsiteChannel[] = [];
  for (const m of metas) {
    try {
      const text = fs.readFileSync(m.jsonFilePath, 'utf-8');
      const r = parseChannelFromText(text, { jsonFilePath: m.jsonFilePath, folderPath: m.folderPath, htmlFilePath: null });
      if (r.ok) out.push(compactChannel(r.channel));
    } catch (e) {
      // skip
    }
  }
  return out;
}

export interface WebsiteOptions {
  channelOnly?: { id: string; jsonFilePath: string; folderPath: string };
  allChannels?: Array<{ id: string; jsonFilePath: string; folderPath: string }>;
}

export function generateWebsite(opts: WebsiteOptions): { ok: true; htmlPath: string } | { ok: false; error: string } {
  let channels: WebsiteChannel[] = [];
  if (opts.channelOnly) {
    channels = loadAllForChannelMetas([opts.channelOnly]);
  } else if (opts.allChannels) {
    channels = loadAllForChannelMetas(opts.allChannels);
  }
  if (channels.length === 0) return { ok: false, error: 'Keine Channels für Website verfügbar.' };

  const html = buildHtml(channels);
  const fileName = opts.channelOnly
    ? `discord-archive-${opts.channelOnly.id}.html`
    : `discord-archive-all-${Date.now()}.html`;
  const out = path.join(os.tmpdir(), fileName);
  try {
    fs.writeFileSync(out, html, 'utf-8');
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Schreib-Fehler' };
  }
  return { ok: true, htmlPath: out };
}

/** Wie generateWebsite, aber für bereits geladene (ggf. zusammengeführte) ChannelModel-Objekte. */
export function generateWebsiteForChannels(models: ChannelModel[]): { ok: true; htmlPath: string } | { ok: false; error: string } {
  if (models.length === 0) return { ok: false, error: 'Keine Channels für Website verfügbar.' };
  const channels = models.map(compactChannel);
  const html = buildHtml(channels);
  const fileName = models.length === 1
    ? `discord-archive-${models[0].id}.html`
    : `discord-archive-all-${Date.now()}.html`;
  const out = path.join(os.tmpdir(), fileName);
  try {
    fs.writeFileSync(out, html, 'utf-8');
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Schreib-Fehler' };
  }
  return { ok: true, htmlPath: out };
}

// ----------------------------------------------------------------------
// HTML-Template

function buildHtml(channels: WebsiteChannel[]): string {
  const dataJson = JSON.stringify(channels);
  const safeData = dataJson.replace(/<\/script>/g, '<\\/script>');
  const title = channels.length === 1
    ? `${channels[0].displayName} — Discord Archive`
    : `Discord Archive (${channels.length} Channels)`;

  return `<!doctype html>
<html lang="de" data-theme="dark">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${CSS}</style>
</head>
<body>
<div id="app">
  <aside id="sidebar">
    <div class="sb-head">
      <div class="logo">DA</div>
      <div class="title">Discord Archive</div>
    </div>
    <div class="sb-actions">
      <select id="themeSel" title="Theme"></select>
      <button id="statsBtn" title="Statistik">📊</button>
      <button id="galleryBtn" title="Galerie">🖼</button>
      <button id="aboutBtn" title="Über">ℹ️</button>
    </div>
    <input id="search" placeholder="Suchen…" />
    <div class="sb-filters">
      <input id="searchAuthor" placeholder="Autor" />
      <label><input type="checkbox" id="searchCase" /> Aa</label>
      <select id="searchScope">
        <option value="current">Channel</option>
        <option value="global">Global</option>
      </select>
      <input type="date" id="searchFrom" />
      <input type="date" id="searchTo" />
    </div>
    <div id="channelList"></div>
  </aside>
  <main>
    <header id="mhead">
      <div id="mtitle"></div>
      <div id="mactions">
        <button id="topBtn">↑ Anfang</button>
        <button id="botBtn">↓ Ende</button>
        <button id="filterImg" class="chip" data-f="images">🖼 Bilder</button>
        <button id="filterVid" class="chip" data-f="videos">🎬 Video</button>
        <button id="filterFile" class="chip" data-f="files">📄 Dateien</button>
        <button id="filterAll" class="chip active" data-f="all">Alle</button>
      </div>
    </header>
    <div id="msgs"></div>
    <div id="searchResults"></div>
  </main>
</div>
<div id="lightbox"><img id="lbImg" /><video id="lbVid" controls style="display:none"></video></div>
<div id="modal"><div class="m-inner"><button id="modalClose">✕</button><div id="modalBody"></div></div></div>
<script id="data" type="application/json">${safeData}</script>
<script>${JS}</script>
</body>
</html>`;
}

const CSS = String.raw`
:root, [data-theme='dark'] {
  --bg-app:#1e1f22; --bg-primary:#313338; --bg-secondary:#2b2d31; --bg-tertiary:#1e1f22;
  --bg-floating:#111214; --bg-msg-hover:#2e3035; --bg-input:#1e1f22; --bg-elev:#232428;
  --border:#1f2024; --tx-primary:#f2f3f5; --tx-secondary:#b5bac1; --tx-muted:#80848e;
  --link:#00a8fc; --accent:#5865f2; --accent-h:#4752c4; --warning:#f0b232; --danger:#f23f43;
  --reply:#4e5058;
}
[data-theme='light'] {
  --bg-app:#fff; --bg-primary:#fff; --bg-secondary:#f2f3f5; --bg-tertiary:#e3e5e8;
  --bg-floating:#fff; --bg-msg-hover:#f7f8fa; --bg-input:#ebedef; --bg-elev:#fff;
  --border:#d4d7dc; --tx-primary:#060607; --tx-secondary:#4e5058; --tx-muted:#6d6f78;
  --link:#006ce7; --accent:#5865f2; --accent-h:#4752c4; --warning:#d68a00; --danger:#d83a3e;
  --reply:#c4c9cf;
}
[data-theme='midnight'] {
  --bg-app:#07080a; --bg-primary:#0c0d10; --bg-secondary:#0f1115; --bg-tertiary:#07080a;
  --bg-floating:#050608; --bg-msg-hover:#14171c; --bg-input:#0c0d10; --bg-elev:#14171c;
  --border:#1a1d22; --tx-primary:#e5e9f0; --tx-secondary:#a8b0bd; --tx-muted:#6a7280;
  --link:#7ec8ff; --accent:#7c5cff; --accent-h:#6748e6; --warning:#ffb14e; --danger:#ff5566; --reply:#353a44;
}
[data-theme='synthwave'] {
  --bg-app:#1a0b2e; --bg-primary:#1f0d36; --bg-secondary:#180828; --bg-tertiary:#0d0419;
  --bg-floating:#0a0314; --bg-msg-hover:#2a1147; --bg-input:#180828; --bg-elev:#241140;
  --border:#3a1b58; --tx-primary:#fef3ff; --tx-secondary:#ffb3ec; --tx-muted:#a07fb6;
  --link:#00f0ff; --accent:#ff2bd6; --accent-h:#d622b2; --warning:#ffd23f; --danger:#ff4060; --reply:#a335c8;
}
[data-theme='forest'] {
  --bg-app:#0e1d12; --bg-primary:#162b1c; --bg-secondary:#13261a; --bg-tertiary:#0a1610;
  --bg-floating:#081109; --bg-msg-hover:#1c3624; --bg-input:#102015; --bg-elev:#1c3624;
  --border:#214d2c; --tx-primary:#e8f5e9; --tx-secondary:#a5d6a7; --tx-muted:#739a78;
  --link:#9ccc65; --accent:#66bb6a; --accent-h:#4ca050; --warning:#ffa726; --danger:#ef5350; --reply:#3e6b46;
}
[data-theme='ocean'] {
  --bg-app:#0a1a2a; --bg-primary:#0f2236; --bg-secondary:#0d1c2e; --bg-tertiary:#08141f;
  --bg-floating:#040b13; --bg-msg-hover:#143049; --bg-input:#0a1a2a; --bg-elev:#162d44;
  --border:#1c3a55; --tx-primary:#e1f5fe; --tx-secondary:#b3d7e8; --tx-muted:#7396ad;
  --link:#4fc3f7; --accent:#0288d1; --accent-h:#0277bd; --warning:#ffa000; --danger:#ef5350; --reply:#3a5b78;
}
[data-theme='sakura'] {
  --bg-app:#fff0f5; --bg-primary:#fff7fa; --bg-secondary:#ffe9f1; --bg-tertiary:#fcd9e6;
  --bg-floating:#fff; --bg-msg-hover:#ffe0eb; --bg-input:#ffeff5; --bg-elev:#fff;
  --border:#f0c4d8; --tx-primary:#3d1928; --tx-secondary:#7a3f55; --tx-muted:#a86d80;
  --link:#d81b60; --accent:#ec407a; --accent-h:#d81b60; --warning:#ffa000; --danger:#e53935; --reply:#e8a8c0;
}
[data-theme='dracula'] {
  --bg-app:#282a36; --bg-primary:#2e303f; --bg-secondary:#21222c; --bg-tertiary:#1d1e26;
  --bg-floating:#181920; --bg-msg-hover:#383a4a; --bg-input:#21222c; --bg-elev:#3a3c4d;
  --border:#3a3c4d; --tx-primary:#f8f8f2; --tx-secondary:#bd93f9; --tx-muted:#6272a4;
  --link:#8be9fd; --accent:#bd93f9; --accent-h:#9d77d8; --warning:#f1fa8c; --danger:#ff5555; --reply:#44475a;
}
[data-theme='matrix'] {
  --bg-app:#020602; --bg-primary:#040a04; --bg-secondary:#030803; --bg-tertiary:#020502;
  --bg-floating:#000200; --bg-msg-hover:#072007; --bg-input:#040a04; --bg-elev:#0a1a0a;
  --border:#0f2d10; --tx-primary:#7cffaa; --tx-secondary:#3fdc80; --tx-muted:#1d9b50;
  --link:#88ffaa; --accent:#00e676; --accent-h:#00c853; --warning:#ffea00; --danger:#ff1744; --reply:#1d6638;
}
[data-theme='amoled'] {
  --bg-app:#000; --bg-primary:#000; --bg-secondary:#080808; --bg-tertiary:#000;
  --bg-floating:#000; --bg-msg-hover:#0e0e0e; --bg-input:#000; --bg-elev:#101010;
  --border:#1a1a1a; --tx-primary:#fff; --tx-secondary:#ccc; --tx-muted:#888;
  --link:#4fc3f7; --accent:#fff; --accent-h:#ccc; --warning:#ffd740; --danger:#ff5252; --reply:#2a2a2a;
}

* { box-sizing: border-box; }
html,body { margin:0; padding:0; height:100%; overflow:hidden; background:var(--bg-app); color:var(--tx-primary); font-family:'Segoe UI',sans-serif; font-size:14px; }
button,input,select { font-family:inherit; }
::-webkit-scrollbar { width:10px; }
::-webkit-scrollbar-thumb { background:var(--bg-tertiary); border-radius:5px; }
::-webkit-scrollbar-thumb:hover { background:var(--accent); }

#app { display:grid; grid-template-columns: 320px 1fr; height:100vh; }

/* Sidebar */
#sidebar { background:var(--bg-secondary); border-right:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
.sb-head { padding:14px; display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--border); background:var(--bg-tertiary); }
.logo { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,var(--accent),#9c5cff); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; }
.title { font-weight:800; }
.sb-actions { padding:8px 10px 4px; display:flex; gap:6px; align-items:center; }
.sb-actions select { flex:1; background:var(--bg-input); color:var(--tx-primary); border:1px solid var(--border); border-radius:6px; padding:5px; font-size:12px; }
.sb-actions button { background:var(--bg-elev); border:1px solid var(--border); color:var(--tx-primary); border-radius:6px; padding:4px 8px; cursor:pointer; }
.sb-actions button:hover { background:var(--accent); color:#fff; }
#search { margin:8px 10px 4px; background:var(--bg-input); color:var(--tx-primary); border:1px solid var(--border); border-radius:6px; padding:7px 10px; }
.sb-filters { padding:0 10px; display:flex; flex-wrap:wrap; gap:4px; font-size:11px; color:var(--tx-muted); margin-bottom:6px; }
.sb-filters input, .sb-filters select { background:var(--bg-input); color:var(--tx-primary); border:1px solid var(--border); border-radius:4px; padding:3px 6px; font-size:11px; }
#channelList { flex:1; overflow-y:auto; padding:6px 10px 12px; }
.guild { margin-top:8px; }
.guild-head { font-size:11px; text-transform:uppercase; color:var(--tx-muted); padding:4px 8px; cursor:pointer; user-select:none; display:flex; gap:6px; }
.guild-head:hover { color:var(--tx-primary); }
.ch { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:6px; cursor:pointer; color:var(--tx-secondary); }
.ch:hover { background:var(--bg-msg-hover); color:var(--tx-primary); }
.ch.active { background:color-mix(in srgb,var(--accent) 22%, transparent); color:var(--tx-primary); box-shadow:inset 3px 0 0 var(--accent); }
.ch .h { color:var(--tx-muted); font-weight:700; }
.ch .n { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px; font-weight:600; }
.ch .c { color:var(--tx-muted); font-size:10px; }

/* Main */
main { display:flex; flex-direction:column; overflow:hidden; background:var(--bg-primary); }
#mhead { padding:12px 18px; background:var(--bg-primary); border-bottom:1px solid var(--border); display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
#mtitle { font-weight:800; font-size:17px; flex:1; }
#mactions { display:flex; gap:6px; flex-wrap:wrap; }
#mactions button { background:var(--bg-elev); border:1px solid var(--border); color:var(--tx-primary); border-radius:6px; padding:6px 10px; font-size:12px; cursor:pointer; }
#mactions button:hover { background:var(--accent); color:#fff; }
.chip { background:var(--bg-elev) !important; border:1px solid var(--border) !important; color:var(--tx-secondary) !important; border-radius:999px !important; padding:4px 10px !important; font-size:11px; }
.chip.active { background:var(--accent) !important; color:#fff !important; }

#msgs { flex:1; overflow-y:auto; padding:12px 0; scroll-behavior:smooth; }
.day { display:flex; align-items:center; gap:12px; padding:10px 18px; }
.day::before, .day::after { content:''; flex:1; height:1px; background:var(--border); }
.day span { background:var(--bg-elev); border:1px solid var(--border); padding:3px 12px; border-radius:999px; font-size:11px; font-weight:600; color:var(--tx-secondary); }

.msg { display:grid; grid-template-columns:56px 1fr; gap:12px; padding:6px 18px; }
.msg:hover { background:var(--bg-msg-hover); }
.msg.hl { background:color-mix(in srgb,var(--warning) 25%, transparent); animation: hl 1.2s; }
@keyframes hl { 0% { background:color-mix(in srgb,var(--warning) 60%, transparent); } 100% {} }
.av { width:40px; height:40px; border-radius:50%; background:var(--bg-elev); overflow:hidden; }
.av img { width:100%; height:100%; object-fit:cover; }
.av .ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--accent),#9c5cff); color:#fff; font-weight:700; }
.h-row { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
.author { font-weight:700; }
.ts { color:var(--tx-muted); font-size:11px; }
.edited { color:var(--tx-muted); font-size:10px; font-style:italic; }
.body { white-space:pre-wrap; word-wrap:break-word; overflow-wrap:anywhere; }
.body a { color:var(--link); }
.reply { display:flex; gap:6px; font-size:12px; color:var(--tx-secondary); margin-bottom:4px; border-left:2px solid var(--reply); padding-left:8px; }
.reply b { color:var(--tx-primary); }

.atts { margin-top:6px; display:flex; flex-direction:column; gap:6px; }
.att-img, .att-gif { display:block; max-width:600px; max-height:520px; border-radius:6px; cursor:zoom-in; background:var(--bg-tertiary); }
.att-vid, .att-aud { max-width:600px; border-radius:6px; }
.att-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:10px; max-width:480px; }
.att-card .ic { width:38px; height:38px; background:var(--bg-elev); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:18px; }
.att-card .info { flex:1; min-width:0; }
.att-card .nm { color:var(--link); font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.att-card .sz { color:var(--tx-muted); font-size:11px; }
.att-card.miss { opacity:0.7; border-color:var(--danger); }
.att-card a.dl { color:var(--link); text-decoration:none; font-size:12px; padding:4px 10px; background:var(--bg-elev); border-radius:4px; }
.att-card a.dl:hover { background:var(--accent); color:#fff; }

.embed { margin-top:6px; background:var(--bg-secondary); border-left:4px solid var(--accent); border-radius:6px; padding:10px 12px; max-width:540px; }
.embed .et { color:var(--link); font-weight:700; }
.embed .ed { color:var(--tx-secondary); white-space:pre-wrap; }
.embed img.ei { max-width:100%; max-height:320px; border-radius:6px; margin-top:6px; cursor:zoom-in; }
.embed .auth, .embed .ft { font-size:11px; color:var(--tx-muted); display:flex; align-items:center; gap:4px; }
.embed .auth img, .embed .ft img { width:16px; height:16px; border-radius:50%; }
.embed .ef { margin-top:6px; }
.embed .ef b { color:var(--tx-primary); display:block; font-size:13px; }

.rxs { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
.rx { background:var(--bg-secondary); border:1px solid var(--border); padding:2px 8px; border-radius:14px; font-size:12px; color:var(--tx-secondary); display:flex; align-items:center; gap:4px; }
.rx img { width:18px; height:18px; }

#searchResults { background:var(--bg-secondary); border-top:1px solid var(--border); max-height:35%; overflow-y:auto; }
.sr-hd { position:sticky; top:0; padding:6px 14px; background:var(--bg-tertiary); border-bottom:1px solid var(--border); font-size:11px; color:var(--tx-muted); }
.sr { padding:8px 14px; border-bottom:1px solid var(--border); cursor:pointer; }
.sr:hover { background:var(--bg-msg-hover); }
.sr .c { color:var(--tx-muted); font-size:11px; }

#lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.92); display:none; align-items:center; justify-content:center; z-index:100; cursor:zoom-out; }
#lightbox img, #lightbox video { max-width:92vw; max-height:92vh; border-radius:6px; }

#modal { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:none; align-items:center; justify-content:center; z-index:90; backdrop-filter:blur(2px); }
.m-inner { background:var(--bg-floating); border:1px solid var(--border); border-radius:12px; width:min(900px,92vw); max-height:88vh; padding:18px; overflow-y:auto; position:relative; }
#modalClose { position:absolute; top:10px; right:14px; background:transparent; border:none; color:var(--tx-muted); font-size:18px; cursor:pointer; }

.empty { display:flex; align-items:center; justify-content:center; height:100%; color:var(--tx-muted); padding:40px; flex-direction:column; gap:10px; }
.empty .big { font-size:64px; opacity:0.3; }

.gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:6px; }
.gallery-grid img, .gallery-grid video { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:6px; cursor:zoom-in; background:var(--bg-tertiary); }

.tile { background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; padding:14px; }
.tile .lab { font-size:11px; color:var(--tx-muted); text-transform:uppercase; }
.tile .val { font-size:22px; font-weight:800; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:16px; }
.bar-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; font-size:13px; }
.bar-row .nm { width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bar-row .bar { flex:1; height:10px; background:var(--bg-elev); border-radius:5px; overflow:hidden; }
.bar-row .bf { height:100%; background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 50%,#fff)); }
.bar-row .cnt { width:60px; text-align:right; color:var(--tx-muted); }

mark { background:color-mix(in srgb,var(--warning) 70%, transparent); color:inherit; border-radius:3px; padding:0 2px; }
`;

const JS = String.raw`
(function() {
  const dataEl = document.getElementById('data');
  const channels = JSON.parse(dataEl.textContent);

  // ----- Themes -----
  const THEMES = ['dark','light','midnight','synthwave','forest','ocean','sakura','dracula','matrix','amoled'];
  const themeSel = document.getElementById('themeSel');
  THEMES.forEach(id => {
    const o = document.createElement('option'); o.value = id; o.textContent = id; themeSel.appendChild(o);
  });
  const savedTheme = localStorage.getItem('da-theme') || 'dark';
  themeSel.value = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeSel.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', themeSel.value);
    localStorage.setItem('da-theme', themeSel.value);
  });

  // ----- State -----
  let activeId = channels[0]?.id || null;
  let attachmentFilter = 'all';
  let highlightId = null;
  const scrollMap = new Map();

  // ----- Sidebar (gruppiert nach Guild) -----
  const channelList = document.getElementById('channelList');
  const groups = new Map();
  for (const c of channels) {
    const g = c.guildName || 'Sonstige';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(c);
  }
  const collapsed = new Set();
  function renderSidebar() {
    channelList.innerHTML = '';
    for (const [g, list] of [...groups.entries()].sort()) {
      const wrap = document.createElement('div'); wrap.className = 'guild';
      const h = document.createElement('div'); h.className = 'guild-head';
      h.innerHTML = '<span>' + (collapsed.has(g) ? '▸' : '▾') + '</span>' + escapeHtml(g) + ' <span style="margin-left:auto">' + list.length + '</span>';
      h.onclick = () => { if (collapsed.has(g)) collapsed.delete(g); else collapsed.add(g); renderSidebar(); };
      wrap.appendChild(h);
      if (!collapsed.has(g)) {
        for (const c of list) {
          const el = document.createElement('div');
          el.className = 'ch' + (c.id === activeId ? ' active' : '');
          el.innerHTML = '<span class="h">#</span><span class="n">' + escapeHtml(c.channelName) + '</span><span class="c">' + c.messageCount + '</span>';
          el.onclick = () => selectChannel(c.id);
          wrap.appendChild(el);
        }
      }
      channelList.appendChild(wrap);
    }
  }

  function selectChannel(id) {
    activeId = id;
    highlightId = null;
    attachmentFilter = 'all';
    document.querySelectorAll('#mactions .chip').forEach(b => b.classList.toggle('active', b.dataset.f === 'all'));
    renderSidebar();
    renderChat();
  }

  // ----- Chat -----
  const msgsEl = document.getElementById('msgs');
  const mtitle = document.getElementById('mtitle');

  function renderChat() {
    const ch = channels.find(c => c.id === activeId);
    if (!ch) {
      msgsEl.innerHTML = '<div class="empty"><div class="big">💬</div><div>Wähle einen Channel.</div></div>';
      mtitle.textContent = '';
      return;
    }
    mtitle.innerHTML = '<span style="color:var(--tx-muted)">#</span> ' + escapeHtml(ch.channelName) + ' <span style="color:var(--tx-muted);font-weight:400;font-size:12px">' + escapeHtml(ch.guildName || '') + ' · ' + ch.messageCount + '</span>';
    let html = '';
    let lastDay = '';
    const filtered = ch.messages.filter(m => {
      if (attachmentFilter === 'all') return true;
      if (!m.at || m.at.length === 0) return false;
      return m.at.some(a => attachmentFilter === 'images' ? (a.k === 'image' || a.k === 'gif') :
        attachmentFilter === 'videos' ? a.k === 'video' :
        attachmentFilter === 'files' ? a.k === 'file' : true);
    });
    for (const m of filtered) {
      const day = dayKey(m.t);
      if (day !== lastDay) { html += '<div class="day"><span>' + dayLabel(m.t) + '</span></div>'; lastDay = day; }
      html += renderMsg(m);
    }
    msgsEl.innerHTML = html || '<div class="empty"><div>Keine Nachrichten.</div></div>';
    bindMsgEvents();
    requestAnimationFrame(() => {
      const saved = scrollMap.get(activeId);
      if (saved) msgsEl.scrollTop = saved.top;
      else msgsEl.scrollTop = msgsEl.scrollHeight;
      if (highlightId) {
        const el = msgsEl.querySelector('[data-mid="' + cssEscape(highlightId) + '"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function bindMsgEvents() {
    msgsEl.querySelectorAll('img.zoom').forEach(img => {
      img.onclick = () => openLightbox(img.src);
    });
    msgsEl.querySelectorAll('video.zoom').forEach(v => {
      v.onclick = (e) => { if (e.target === v) openLightbox(v.src, true); };
    });
  }

  msgsEl.addEventListener('scroll', () => {
    if (!activeId) return;
    scrollMap.set(activeId, { top: msgsEl.scrollTop });
  });

  function renderMsg(m) {
    const av = m.aA ? '<img src="' + m.aA + '" alt="">' : '<div class="ph">' + initials(m.aN) + '</div>';
    const ts = formatTs(m.t);
    const edited = m.e ? '<span class="edited">(bearbeitet ' + formatTs(m.e) + ')</span>' : '';
    const reply = m.rT ? '<div class="reply">↩ <b>' + escapeHtml(m.rT.aN || 'Unbekannt') + '</b> ' + escapeHtml(m.rT.cE || '') + '</div>' : '';
    const body = highlightSearch(linkify(escapeHtml(m.c)));
    let atts = '';
    if (m.at && m.at.length) {
      atts = '<div class="atts">' + m.at.map(a => renderAtt(a)).join('') + '</div>';
    }
    let embeds = '';
    if (m.em && m.em.length) {
      embeds = m.em.map(e => renderEmbed(e)).join('');
    }
    let rxs = '';
    if (m.rx && m.rx.length) {
      rxs = '<div class="rxs">' + m.rx.map(r =>
        '<span class="rx">' + (r.iU ? '<img src="' + r.iU + '">' : escapeHtml(r.n)) + '<span>' + r.c + '</span></span>'
      ).join('') + '</div>';
    }
    return '<div class="msg' + (m.i === highlightId ? ' hl' : '') + '" data-mid="' + escapeHtml(m.i) + '">' +
      '<div class="av">' + av + '</div>' +
      '<div>' + reply +
      '<div class="h-row"><span class="author">' + escapeHtml(m.aN) + '</span><span class="ts">' + ts + '</span>' + edited + '</div>' +
      '<div class="body">' + body + '</div>' + atts + embeds + rxs +
      '</div></div>';
  }

  function renderAtt(a) {
    if (!a.u) {
      return '<div class="att-card miss"><div class="ic">⚠</div><div class="info"><div class="nm">' + escapeHtml(a.n) + '</div><div class="sz">Datei fehlt</div></div></div>';
    }
    if (a.k === 'image') return '<img class="att-img zoom" src="' + a.u + '" alt="">';
    if (a.k === 'gif')   return '<img class="att-gif zoom" src="' + a.u + '" alt="">';
    if (a.k === 'video') return '<video class="att-vid" src="' + a.u + '" controls preload="metadata"></video>';
    if (a.k === 'audio') return '<audio class="att-aud" src="' + a.u + '" controls preload="metadata"></audio>';
    return '<div class="att-card"><div class="ic">📄</div><div class="info"><div class="nm">' + escapeHtml(a.n) + '</div><div class="sz">' + humanSize(a.s) + '</div></div><a class="dl" href="' + a.u + '" download="' + escapeHtml(a.n) + '">⬇ Download</a></div>';
  }

  function renderEmbed(e) {
    let html = '<div class="embed">';
    if (e.aN) html += '<div class="auth">' + (e.aIU ? '<img src="' + e.aIU + '">' : '') + '<span>' + escapeHtml(e.aN) + '</span></div>';
    if (e.t) html += '<div class="et">' + (e.u ? '<a href="' + e.u + '" target="_blank">' + escapeHtml(e.t) + '</a>' : escapeHtml(e.t)) + '</div>';
    if (e.d) html += '<div class="ed">' + escapeHtml(e.d) + '</div>';
    if (e.f && e.f.length) html += e.f.map(f => '<div class="ef"><b>' + escapeHtml(f.n) + '</b>' + escapeHtml(f.v) + '</div>').join('');
    if (e.iU) html += '<img class="ei zoom" src="' + e.iU + '" alt="">';
    if (e.fT) html += '<div class="ft">' + (e.fIU ? '<img src="' + e.fIU + '">' : '') + '<span>' + escapeHtml(e.fT) + '</span></div>';
    html += '</div>';
    return html;
  }

  // ----- Search -----
  const searchInput = document.getElementById('search');
  const searchAuthor = document.getElementById('searchAuthor');
  const searchCase = document.getElementById('searchCase');
  const searchScope = document.getElementById('searchScope');
  const searchFrom = document.getElementById('searchFrom');
  const searchTo = document.getElementById('searchTo');
  const searchResults = document.getElementById('searchResults');
  let searchTimeout = null;

  function runSearch() {
    const text = searchInput.value.trim();
    const author = searchAuthor.value.trim();
    const caseS = searchCase.checked;
    const scope = searchScope.value;
    const from = searchFrom.value ? new Date(searchFrom.value + 'T00:00:00').getTime() : null;
    const to = searchTo.value ? new Date(searchTo.value + 'T23:59:59').getTime() : null;

    if (!text && !author && !from && !to) { searchResults.innerHTML = ''; searchResults.style.display = 'none'; renderChat(); return; }

    const targets = scope === 'current' ? channels.filter(c => c.id === activeId) : channels;
    const hits = [];
    for (const c of targets) {
      for (const m of c.messages) {
        if (text) {
          const t = caseS ? m.c : m.c.toLowerCase();
          const q = caseS ? text : text.toLowerCase();
          if (!t.includes(q)) continue;
        }
        if (author) { if (m.aN !== author) continue; }
        if (from || to) {
          if (!m.t) continue;
          const ts = Date.parse(m.t);
          if (Number.isNaN(ts)) continue;
          if (from && ts < from) continue;
          if (to && ts > to) continue;
        }
        hits.push({ c, m });
        if (hits.length >= 500) break;
      }
      if (hits.length >= 500) break;
    }

    searchResults.innerHTML = '<div class="sr-hd">' + hits.length + ' Treffer</div>' + hits.map(h => {
      const excerpt = (h.m.c || '').slice(0, 160);
      return '<div class="sr" data-cid="' + h.c.id + '" data-mid="' + escapeHtml(h.m.i) + '"><div class="c">' + escapeHtml(h.c.displayName) + ' · ' + (h.m.t || '') + '</div><div><b style="color:var(--accent)">' + escapeHtml(h.m.aN) + ':</b> ' + escapeHtml(excerpt) + '</div></div>';
    }).join('');
    searchResults.style.display = 'block';
    searchResults.querySelectorAll('.sr').forEach(el => {
      el.onclick = () => {
        activeId = el.dataset.cid;
        highlightId = el.dataset.mid;
        renderSidebar();
        renderChat();
        setTimeout(() => { highlightId = null; renderChat(); }, 3000);
      };
    });
    renderChat(); // re-render mit Highlight im Body
  }

  [searchInput, searchAuthor, searchFrom, searchTo].forEach(el => el.addEventListener('input', () => {
    clearTimeout(searchTimeout); searchTimeout = setTimeout(runSearch, 350);
  }));
  searchCase.addEventListener('change', runSearch);
  searchScope.addEventListener('change', runSearch);

  function highlightSearch(html) {
    const q = searchInput.value.trim();
    if (!q) return html;
    const safe = q.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(' + safe + ')', searchCase.checked ? 'g' : 'gi');
    return html.replace(/(<[^>]+>)|([^<]+)/g, (_, tag, text) => tag ? tag : text.replace(re, '<mark>$1</mark>'));
  }

  // ----- Top/Bot/Filter -----
  document.getElementById('topBtn').onclick = () => msgsEl.scrollTop = 0;
  document.getElementById('botBtn').onclick = () => msgsEl.scrollTop = msgsEl.scrollHeight;
  document.querySelectorAll('#mactions .chip').forEach(b => {
    b.onclick = () => {
      attachmentFilter = b.dataset.f;
      document.querySelectorAll('#mactions .chip').forEach(x => x.classList.toggle('active', x === b));
      renderChat();
    };
  });

  // ----- Lightbox -----
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbVid = document.getElementById('lbVid');
  function openLightbox(src, isVideo) {
    if (isVideo) { lbVid.src = src; lbVid.style.display = 'block'; lbImg.style.display = 'none'; lbVid.play(); }
    else { lbImg.src = src; lbImg.style.display = 'block'; lbVid.style.display = 'none'; }
    lb.style.display = 'flex';
  }
  lb.onclick = () => { lb.style.display = 'none'; lbImg.src = ''; lbVid.pause(); lbVid.src = ''; };

  // ----- Modal -----
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  document.getElementById('modalClose').onclick = () => modal.style.display = 'none';
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  function openStats() {
    const ch = channels.find(c => c.id === activeId);
    if (!ch) return;
    const s = computeStats(ch);
    let html = '<h2>📊 Statistik · ' + escapeHtml(ch.displayName) + '</h2>';
    html += '<div class="stats-grid">';
    html += tile('Nachrichten', s.totalMessages);
    html += tile('Anhänge', s.totalAttachments);
    html += tile('Reactions', s.totalReactions);
    html += tile('Embeds', s.totalEmbeds);
    html += tile('Autoren', s.uniqueAuthors);
    html += '</div>';
    html += '<h3>Top-Autoren</h3>';
    const max = s.topAuthors[0]?.count || 1;
    html += s.topAuthors.map(a => '<div class="bar-row"><div class="nm">' + escapeHtml(a.name) + '</div><div class="bar"><div class="bf" style="width:' + ((a.count/max)*100).toFixed(0) + '%"></div></div><div class="cnt">' + a.count + '</div></div>').join('');
    if (s.topReactions.length) {
      html += '<h3>Top-Reactions</h3>';
      const mr = s.topReactions[0]?.count || 1;
      html += s.topReactions.map(r => '<div class="bar-row"><div class="nm">' + escapeHtml(r.name) + '</div><div class="bar"><div class="bf" style="width:' + ((r.count/mr)*100).toFixed(0) + '%"></div></div><div class="cnt">' + r.count + '</div></div>').join('');
    }
    modalBody.innerHTML = html; modal.style.display = 'flex';
  }
  function tile(lab, val) { return '<div class="tile"><div class="lab">' + escapeHtml(lab) + '</div><div class="val">' + val + '</div></div>'; }

  function openGallery() {
    const ch = channels.find(c => c.id === activeId);
    if (!ch) return;
    const items = [];
    for (const m of ch.messages) {
      for (const a of (m.at || [])) {
        if (!a.u) continue;
        if (a.k === 'image' || a.k === 'gif') items.push({ k: 'image', src: a.u });
        else if (a.k === 'video') items.push({ k: 'video', src: a.u });
      }
    }
    const html = '<h2>🖼 Galerie · ' + escapeHtml(ch.displayName) + '</h2><div class="gallery-grid">' +
      items.map(it => it.k === 'video'
        ? '<video src="' + it.src + '" controls preload="metadata"></video>'
        : '<img src="' + it.src + '" data-src="' + it.src + '">'
      ).join('') + '</div>';
    modalBody.innerHTML = html;
    modalBody.querySelectorAll('img').forEach(img => img.onclick = () => openLightbox(img.dataset.src));
    modal.style.display = 'flex';
  }

  function openAbout() {
    modalBody.innerHTML = '<h2>Discord Archive Viewer — Web</h2>' +
      '<p>Diese Webseite ist ein eigenständiger Export deines Archives. Sie funktioniert offline und enthält alle Inhalte als eingebettete Daten.</p>' +
      '<p><b>Funktionen:</b></p><ul>' +
      '<li>Channel-Wechsel, gruppiert nach Server</li>' +
      '<li>Suche nach Text / Autor / Datum, lokal & global</li>' +
      '<li>Bilder/GIF/Video/Audio inline + Lightbox</li>' +
      '<li>Dateien als Download-Karte</li>' +
      '<li>Statistik & Galerie</li>' +
      '<li>10 Themes, im Browser persistiert</li></ul>' +
      '<p style="color:var(--tx-muted);font-size:12px">Generiert vom Discord Archive Viewer.</p>';
    modal.style.display = 'flex';
  }

  document.getElementById('statsBtn').onclick = openStats;
  document.getElementById('galleryBtn').onclick = openGallery;
  document.getElementById('aboutBtn').onclick = openAbout;

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
    else if (e.key === 'Escape') {
      if (modal.style.display === 'flex') { modal.style.display = 'none'; return; }
      if (lb.style.display === 'flex') { lb.style.display = 'none'; return; }
      searchInput.value = ''; searchAuthor.value = ''; searchFrom.value = ''; searchTo.value = ''; runSearch();
    }
  });

  // ----- Helpers -----
  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function linkify(html) {
    return html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
  }
  function dayKey(iso) {
    if (!iso) return ''; const d = new Date(iso); if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function dayLabel(iso) {
    if (!iso) return 'Unbekannt'; const d = new Date(iso); if (isNaN(d.getTime())) return iso;
    const today = new Date(); const ymd = (x) => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
    const t = ymd(d), tt = ymd(today), yy = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate()-1));
    if (t === tt) return 'Heute'; if (t === yy) return 'Gestern';
    return d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }
  function formatTs(iso) {
    if (!iso) return '?'; const d = new Date(iso); if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }
  function humanSize(b) {
    if (!b) return '0 B'; const u = ['B','KB','MB','GB','TB']; let i = 0, v = b;
    while (v >= 1024 && i < u.length-1) { v /= 1024; i++; }
    return v.toFixed(v < 10 && i > 0 ? 1 : 0) + ' ' + u[i];
  }
  function initials(n) {
    if (!n) return '?'; return n.split(/\s+/).map(x => x[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
  }
  function cssEscape(s) { return s.replace(/"/g, '\\"'); }

  function computeStats(ch) {
    const authors = new Map(), reactions = new Map();
    let totalAttachments = 0, totalReactions = 0, totalEmbeds = 0;
    for (const m of ch.messages) {
      authors.set(m.aN, (authors.get(m.aN) || 0) + 1);
      totalAttachments += (m.at || []).length;
      totalEmbeds += (m.em || []).length;
      for (const r of (m.rx || [])) { totalReactions += r.c; reactions.set(r.n, (reactions.get(r.n) || 0) + r.c); }
    }
    return {
      totalMessages: ch.messages.length,
      totalAttachments, totalReactions, totalEmbeds,
      uniqueAuthors: authors.size,
      topAuthors: [...authors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name, count]) => ({ name, count })),
      topReactions: [...reactions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name, count]) => ({ name, count })),
    };
  }

  renderSidebar();
  renderChat();
})();
`;

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
