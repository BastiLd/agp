#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec, spawn } = require('child_process');

const APP_ID = 'claude-token-dashboard';
const HOST = '127.0.0.1';
const BASE_PORT = Number(process.env.PORT) || 5175;
const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const PUBLIC_DIR = path.join(__dirname, 'public');
const BLOCK_MS = 5 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const SHOULD_OPEN = process.argv.includes('--open');
// Only used for the greeting in the UI ("Guten Abend, Basti").
const USER_NAME = (() => {
  try {
    return os.userInfo().username || '';
  } catch {
    return '';
  }
})();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Parsed result per file, re-used as long as mtime and size are unchanged.
const fileCache = new Map();

async function findJsonlFiles(dir, depth = 0, out = []) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (depth < 5 && e.name !== 'memory') await findJsonlFiles(p, depth + 1, out);
    } else if (e.isFile() && e.name.endsWith('.jsonl')) {
      out.push(p);
    }
  }
  return out;
}

function stripTags(text) {
  return text
    .replace(/<([a-zA-Z][\w-]*)[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractUserText(message) {
  if (!message) return '';
  const c = message.content;
  const parts = [];
  if (typeof c === 'string') parts.push(c);
  else if (Array.isArray(c)) {
    for (const b of c) if (b && b.type === 'text' && typeof b.text === 'string') parts.push(b.text);
  }
  for (const p of parts) {
    const t = stripTags(p);
    if (t && !t.startsWith('<') && !/^Caveat:/i.test(t)) return t;
  }
  return '';
}

function extractAssistantText(message) {
  const c = message && message.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter((b) => b && b.type === 'text').map((b) => b.text).join(' ');
  return '';
}

function classifyLimit(text) {
  if (/5[- ]?hour|session limit|5-stunden/i.test(text)) return '5h';
  if (/week/i.test(text)) return 'weekly';
  if (/month|spend/i.test(text)) return 'monthly';
  return 'other';
}

async function parseFile(file) {
  const isSubagentFile = file.split(path.sep).includes('subagents');
  const fallbackSid = isSubagentFile
    ? path.basename(path.dirname(path.dirname(file)))
    : path.basename(file, '.jsonl');
  const messages = new Map();
  const sessions = new Map();
  const limits = [];
  let parseErrors = 0;

  const meta = (sid) => {
    let m = sessions.get(sid);
    if (!m) {
      m = { customTitle: '', aiTitle: '', firstPrompt: '', cwd: '', firstTs: Infinity, lastTs: -Infinity };
      sessions.set(sid, m);
    }
    return m;
  };

  const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 20 });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let needPrompt = !isSubagentFile;

  for await (const line of rl) {
    if (!line || line.charCodeAt(0) !== 123) continue;
    const isAssistant = line.includes('"type":"assistant"');
    const isTitle = line.includes('"type":"custom-title"') || line.includes('"type":"ai-title"');
    const isUser = needPrompt && line.includes('"type":"user"');
    if (!isAssistant && !isTitle && !isUser) continue;

    let d;
    try {
      d = JSON.parse(line);
    } catch {
      parseErrors++;
      continue;
    }
    const sid = d.sessionId || fallbackSid;
    const m = meta(sid);
    if (d.cwd && !m.cwd) m.cwd = d.cwd;
    const ts = d.timestamp ? Date.parse(d.timestamp) : NaN;
    if (Number.isFinite(ts)) {
      if (ts < m.firstTs) m.firstTs = ts;
      if (ts > m.lastTs) m.lastTs = ts;
    }

    if (d.type === 'custom-title' && d.customTitle) {
      m.customTitle = String(d.customTitle);
    } else if (d.type === 'ai-title' && d.aiTitle) {
      m.aiTitle = String(d.aiTitle);
    } else if (d.type === 'user') {
      if (!d.isMeta && !d.isSidechain && !m.firstPrompt) {
        const text = extractUserText(d.message);
        if (text) {
          m.firstPrompt = text.slice(0, 160);
          needPrompt = false;
        }
      }
    } else if (d.type === 'assistant' && d.message && d.message.usage) {
      const msg = d.message;
      if (msg.model === '<synthetic>') {
        if (d.isApiErrorMessage) {
          const text = extractAssistantText(msg).trim();
          if (/limit/i.test(text) && Number.isFinite(ts)) {
            limits.push({ t: ts, type: classifyLimit(text), text: text.slice(0, 200), sid });
          }
        }
        continue;
      }
      if (!Number.isFinite(ts)) continue;
      const u = msg.usage;
      const ev = {
        t: ts,
        sid,
        model: msg.model || 'unbekannt',
        i: u.input_tokens || 0,
        o: u.output_tokens || 0,
        th: (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0,
        cw: u.cache_creation_input_tokens || 0,
        cr: u.cache_read_input_tokens || 0,
        sub: d.isSidechain || isSubagentFile ? 1 : 0,
      };
      // The same message.id is written once per content block (thinking, text, tool_use)
      // with the same usage snapshot — it must only be counted once.
      const id = msg.id || d.requestId || d.uuid;
      const prev = messages.get(id);
      if (!prev) messages.set(id, ev);
      else mergeMax(prev, ev);
    }
  }

  return { messages, sessions, limits, parseErrors, isSubagentFile };
}

function mergeMax(a, b) {
  a.t = Math.min(a.t, b.t);
  a.i = Math.max(a.i, b.i);
  a.o = Math.max(a.o, b.o);
  a.th = Math.max(a.th, b.th);
  a.cw = Math.max(a.cw, b.cw);
  a.cr = Math.max(a.cr, b.cr);
}

async function parseCached(file) {
  let st;
  try {
    st = await fsp.stat(file);
  } catch {
    return null;
  }
  const cached = fileCache.get(file);
  if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) return { ...cached, file };
  const result = await parseFile(file);
  const entry = { mtimeMs: st.mtimeMs, size: st.size, result };
  fileCache.set(file, entry);
  return { ...entry, file };
}

function projectNameFromCwd(cwd) {
  if (!cwd) return '';
  const parts = cwd.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] || cwd;
}

async function computeUsage() {
  const started = Date.now();
  const files = await findJsonlFiles(PROJECTS_DIR);
  for (const cachedFile of fileCache.keys()) if (!files.includes(cachedFile)) fileCache.delete(cachedFile);

  const parsed = [];
  for (const f of files) {
    try {
      const p = await parseCached(f);
      if (p) parsed.push(p);
    } catch {
      /* unreadable file — skip */
    }
  }
  // Oldest files first: when a resumed chat copies earlier messages into a new file,
  // the tokens stay credited to the original chat.
  parsed.sort((a, b) => a.mtimeMs - b.mtimeMs);

  const allMessages = new Map();
  const sessionMeta = new Map();
  const limits = [];
  let parseErrors = 0;

  for (const { result } of parsed) {
    parseErrors += result.parseErrors;
    for (const [sid, m] of result.sessions) {
      const cur = sessionMeta.get(sid);
      if (!cur) {
        sessionMeta.set(sid, { ...m });
        continue;
      }
      if (!result.isSubagentFile) {
        if (m.customTitle) cur.customTitle = m.customTitle;
        if (m.aiTitle && !cur.aiTitle) cur.aiTitle = m.aiTitle;
        if (m.firstPrompt && !cur.firstPrompt) cur.firstPrompt = m.firstPrompt;
        // Subagents may run in a sub-folder; the chat's own starting folder names the project.
        if (m.cwd) cur.cwd = m.cwd;
      } else if (m.cwd && !cur.cwd) cur.cwd = m.cwd;
      cur.firstTs = Math.min(cur.firstTs, m.firstTs);
      cur.lastTs = Math.max(cur.lastTs, m.lastTs);
    }
    for (const [id, ev] of result.messages) {
      const prev = allMessages.get(id);
      if (!prev) allMessages.set(id, { ...ev });
      else mergeMax(prev, ev);
    }
    limits.push(...result.limits);
  }

  const events = Array.from(allMessages.values()).sort((a, b) => a.t - b.t);

  const sessionIndex = new Map();
  const sessions = [];
  const modelIndex = new Map();
  const models = [];
  const idxSession = (sid) => {
    let i = sessionIndex.get(sid);
    if (i === undefined) {
      const m = sessionMeta.get(sid) || { cwd: '', firstTs: NaN, lastTs: NaN };
      i = sessions.length;
      sessionIndex.set(sid, i);
      sessions.push({
        id: sid,
        title: m.customTitle || m.aiTitle || m.firstPrompt || 'Ohne Titel',
        project: projectNameFromCwd(m.cwd) || 'Unbekanntes Projekt',
        cwd: m.cwd || '',
        firstTs: Number.isFinite(m.firstTs) ? m.firstTs : null,
        lastTs: Number.isFinite(m.lastTs) ? m.lastTs : null,
      });
    }
    return i;
  };
  const idxModel = (name) => {
    let i = modelIndex.get(name);
    if (i === undefined) {
      i = models.length;
      modelIndex.set(name, i);
      models.push(name);
    }
    return i;
  };

  const compact = events.map((e) => [e.t, idxSession(e.sid), idxModel(e.model), e.i, e.o, e.th, e.cw, e.cr, e.sub]);

  // Claude plans count usage in 5-hour blocks that begin with the first message
  // (rounded down to the full hour) — same heuristic as common usage tools.
  const blocks = [];
  let cur = null;
  for (const e of events) {
    if (!cur || e.t >= cur.end) {
      const start = Math.floor(e.t / HOUR_MS) * HOUR_MS;
      cur = { start, end: start + BLOCK_MS, i: 0, o: 0, th: 0, cw: 0, cr: 0, messages: 0, limit: null };
      blocks.push(cur);
    }
    cur.i += e.i;
    cur.o += e.o;
    cur.th += e.th;
    cur.cw += e.cw;
    cur.cr += e.cr;
    cur.messages++;
  }
  limits.sort((a, b) => a.t - b.t);
  const outLimits = [];
  const seenLimit = new Set();
  for (const l of limits) {
    const key = `${l.t}|${l.text}`;
    if (seenLimit.has(key)) continue;
    seenLimit.add(key);
    const block = blocks.find((b) => l.t >= b.start && l.t < b.end);
    if (block && !block.limit) block.limit = { type: l.type, text: l.text, t: l.t };
    outLimits.push({ t: l.t, type: l.type, text: l.text, s: sessionIndex.has(l.sid) ? sessionIndex.get(l.sid) : idxSession(l.sid) });
  }

  return {
    app: APP_ID,
    generatedAt: Date.now(),
    durationMs: Date.now() - started,
    sourceDir: PROJECTS_DIR,
    user: USER_NAME,
    files: files.length,
    parseErrors,
    sessions,
    models,
    events: compact,
    blocks,
    limits: outLimits,
  };
}

let inFlight = null;
let lastResult = null;
let lastComputedAt = 0;

function getUsage() {
  if (lastResult && Date.now() - lastComputedAt < 3000) return Promise.resolve(lastResult);
  if (!inFlight) {
    inFlight = computeUsage()
      .then((r) => {
        lastResult = r;
        lastComputedAt = Date.now();
        return r;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  try {
    const data = await fsp.readFile(filePath);
    send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Nicht gefunden', 'text/plain; charset=utf-8');
  }
}

function readBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > limit) {
        reject(new Error('Anfrage zu groß'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Opens the project folder of a chat in the file manager. Only folders known from the logs
// can be opened; the custom header forces a CORS preflight (never answered), so other
// websites cannot trigger this.
async function openFolder(req, res) {
  const origin = req.headers.origin;
  if (req.headers['x-token-dashboard'] !== '1' || (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    return send(res, 403, JSON.stringify({ error: 'Nicht erlaubt' }), MIME['.json']);
  }
  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch {
    return send(res, 400, JSON.stringify({ error: 'Ungültige Anfrage' }), MIME['.json']);
  }
  const data = await getUsage();
  const session = data.sessions.find((s) => s.id === body.sessionId);
  if (!session || !session.cwd) return send(res, 404, JSON.stringify({ error: 'Chat oder Ordner unbekannt' }), MIME['.json']);
  try {
    if (!(await fsp.stat(session.cwd)).isDirectory()) throw new Error();
  } catch {
    return send(res, 404, JSON.stringify({ error: 'Der Ordner existiert nicht mehr' }), MIME['.json']);
  }
  const cmd = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [session.cwd], { detached: true, stdio: 'ignore' }).unref();
  return send(res, 200, JSON.stringify({ ok: true, path: session.cwd }), MIME['.json']);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${HOST}`);
  if (req.method === 'POST' && pathname === '/api/open') {
    try {
      return await openFolder(req, res);
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: String(err && err.message) }), MIME['.json']);
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  try {
    if (pathname === '/api/health') return send(res, 200, JSON.stringify({ app: APP_ID }), MIME['.json']);
    if (pathname === '/api/usage') {
      const data = await getUsage();
      return send(res, 200, JSON.stringify(data), MIME['.json']);
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    return send(res, 500, JSON.stringify({ error: String(err && err.message) }), MIME['.json']);
  }
});

function openBrowser(url) {
  const cmd =
    process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function isOurServer(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: HOST, port, path: '/api/health', timeout: 1500 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body).app === APP_ID);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function start(port, attemptsLeft) {
  server.once('error', async (err) => {
    if (err.code !== 'EADDRINUSE') throw err;
    if (await isOurServer(port)) {
      const url = `http://localhost:${port}`;
      console.log(`Das Dashboard läuft bereits: ${url}`);
      if (SHOULD_OPEN) openBrowser(url);
      process.exit(0);
    }
    if (attemptsLeft <= 0) {
      console.error('Kein freier Port gefunden.');
      process.exit(1);
    }
    start(port + 1, attemptsLeft - 1);
  });
  server.listen(port, HOST, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  Claude Token-Dashboard läuft auf ${url}`);
    console.log(`  Datenquelle: ${PROJECTS_DIR}`);
    console.log('  Beenden mit Strg+C\n');
    getUsage()
      .then((r) => console.log(`  ${r.files} Log-Dateien, ${r.events.length} Nachrichten eingelesen (${r.durationMs} ms)`))
      .catch((e) => console.error('  Fehler beim Einlesen:', e.message));
    if (SHOULD_OPEN) openBrowser(url);
  });
}

start(BASE_PORT, 10);
