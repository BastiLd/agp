'use strict';

// ============================================================
// CHS Instagram Audit Helper — background.js
// Service Worker: sicheres, gecachtes Fetching von Posts
// ============================================================

const postCache = new Map();   // cacheKey -> { html, url, time }
const CACHE_TTL  = 10 * 60 * 1000;  // 10 Minuten
const MIN_DELAY  = 800;
const JITTER     = 400;

const VALID_TYPES = new Set(['p', 'reel', 'tv']);
const CODE_RE     = /^[A-Za-z0-9_-]{5,50}$/;

let lastFetchTime   = 0;
let fetchInProgress = false;
const requestQueue  = [];

// ---- Validation ------------------------------------------------
function isValidRequest(postType, code) {
  return VALID_TYPES.has(postType) && CODE_RE.test(code);
}

// ---- Delay helper ----------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- Core fetch ------------------------------------------------
async function doFetch(postType, code) {
  const cacheKey = `${postType}:${code}`;
  const now = Date.now();

  if (postCache.has(cacheKey)) {
    const entry = postCache.get(cacheKey);
    if (now - entry.time < CACHE_TTL) {
      return { ok: true, html: entry.html, url: entry.url, fromCache: true };
    }
    postCache.delete(cacheKey);
  }

  const url = `https://www.instagram.com/${postType}/${code}/?hl=de`;

  try {
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    if (!resp.ok) {
      return { ok: false, error: `HTTP ${resp.status} ${resp.statusText}` };
    }

    const html = await resp.text();
    postCache.set(cacheKey, { html, url, time: Date.now() });
    return { ok: true, html, url };

  } catch (err) {
    return { ok: false, error: err.message || 'Netzwerkfehler' };
  }
}

// ---- Rate-limited queue ----------------------------------------
async function processQueue() {
  if (fetchInProgress || requestQueue.length === 0) return;
  fetchInProgress = true;

  while (requestQueue.length > 0) {
    const item = requestQueue.shift();
    if (!item) continue;

    // Enforce minimum delay between requests
    const elapsed = Date.now() - lastFetchTime;
    const wait = Math.max(0, MIN_DELAY + Math.random() * JITTER - elapsed);
    if (wait > 0) await sleep(wait);

    try {
      const result = await doFetch(item.postType, item.code);
      item.resolve(result);
    } catch (err) {
      item.resolve({ ok: false, error: err.message });
    }

    lastFetchTime = Date.now();
  }

  fetchInProgress = false;
}

// ---- Message listener ------------------------------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'FETCH_INSTAGRAM_POST') return false;

  const { postType, code } = message;

  if (!isValidRequest(postType, code)) {
    sendResponse({ ok: false, error: 'Ungültige Parameter' });
    return true;
  }

  // Fast-path: cache hit (synchronous check before queuing)
  const cacheKey = `${postType}:${code}`;
  if (postCache.has(cacheKey)) {
    const entry = postCache.get(cacheKey);
    if (Date.now() - entry.time < CACHE_TTL) {
      sendResponse({ ok: true, html: entry.html, url: entry.url, fromCache: true });
      return true;
    }
  }

  // Enqueue and process
  new Promise(resolve => {
    requestQueue.push({ postType, code, resolve });
    processQueue();
  }).then(result => {
    try { sendResponse(result); } catch (_) { /* Port might be closed */ }
  });

  return true; // Keep message channel open for async response
});
