/* eslint-disable no-console */
(function () {
  'use strict';

  // ============================================================
  // CHS Instagram Audit Helper — content.js v2.2
  // ============================================================

  if (window.__igAuditRunning) return;
  window.__igAuditRunning = true;

  // ============================================================
  // KONSTANTEN
  // ============================================================
  const MAX_POSTS     = 120;
  const CAPTION_MAX   = 60;
  const SCAN_INTERVAL = 3000;
  const OVERLAY_ATTR  = 'data-ig-overlay';
  const POST_URL_RE   = /\/(p|reel|tv)\/([A-Za-z0-9_-]{5,50})/;
  const POST_LINK_SEL = 'a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]';

  // ============================================================
  // STATE
  // ============================================================
  const posts       = new Map();
  const processed   = new Set();
  const fetchQueue  = [];
  let queueRunning  = false;
  let pageJsonCache = new Map();
  let mutObserver   = null;
  let panelEl       = null;
  let panelTimer    = null;
  let scanTimer     = null;
  let navLocked     = false;

  // Lightbox
  let lightboxEl = null;
  let lbPost     = null;
  let lbIndex    = 0;

  const dbg = {
    linksFound: 0, overlaysSet: 0, pageJsonOk: false,
    fromPage: 0, fromFetch: 0, lastError: '', active: false,
  };

  // ============================================================
  // HILFSFUNKTIONEN
  // ============================================================

  function isProfilePage() {
    const p = location.pathname;
    if (/^\/(p|reel|tv|stories|explore|reels|accounts|direct|live|ar|music|locations|tags|directory|privacy|api|graphql)\//i.test(p)) return false;
    if (p === '/' || p === '') return false;
    return /^\/[A-Za-z0-9_.]{1,30}\/?$/.test(p);
  }

  function getAccountName() {
    return location.pathname.replace(/\//g, '').trim() || 'unbekannt';
  }

  function normalizePostUrl(href) {
    if (!href) return null;
    const m = href.match(POST_URL_RE);
    if (!m) return null;
    return { type: m[1], code: m[2], url: `https://www.instagram.com/${m[1]}/${m[2]}/?hl=de` };
  }

  function formatDate(value) {
    if (value === undefined || value === null) return '?';
    let ts;
    if (typeof value === 'number') {
      ts = value > 1e10 ? value : value * 1000;
    } else if (typeof value === 'string') {
      ts = /^\d+$/.test(value.trim())
        ? (n => n > 1e10 ? n : n * 1000)(parseInt(value.trim(), 10))
        : Date.parse(value);
    } else return '?';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '?';
    return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatNumber(n) {
    if (n === undefined || n === null) return '?';
    const num = Number(n);
    if (!isFinite(num)) return '?';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.', ',') + ' M';
    if (num >= 1_000)     return (num / 1_000).toFixed(1).replace('.', ',') + ' K';
    return num.toLocaleString('de-AT');
  }

  function typeLabel(t) {
    if (t === 'reel' || t === 'tv') return 'Reel';
    if (t === 'carousel')           return 'Carousel';
    return 'Bild';
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function clearEl(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function tsToMs(ts) {
    if (ts === undefined || ts === null) return NaN;
    const n = typeof ts === 'number' ? ts : (typeof ts === 'string' && /^\d+$/.test(ts.trim()) ? parseInt(ts, 10) : NaN);
    if (!isNaN(n)) return n > 1e10 ? n : n * 1000;
    return Date.parse(ts);
  }

  // ============================================================
  // JSON WALKER
  // ============================================================

  function walkJson(value, callback, seen, depth) {
    if (depth > 45 || value === null || typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);
    callback(value);
    const vals = Array.isArray(value) ? value : Object.values(value);
    for (const v of vals) {
      if (v !== null && typeof v === 'object') walkJson(v, callback, seen, depth + 1);
    }
  }

  // ============================================================
  // BILD-URL-EXTRAKTION
  // ============================================================

  function extractImageUrls(obj) {
    const urls = [];
    function add(url) {
      if (typeof url === 'string' && url.startsWith('https://') && !urls.includes(url)) urls.push(url);
    }
    add(obj.display_url); add(obj.thumbnail_src); add(obj.thumbnail_url);
    if (obj.image_versions2?.candidates?.[0]?.url) add(obj.image_versions2.candidates[0].url);
    if (Array.isArray(obj.carousel_media)) {
      for (const item of obj.carousel_media) {
        add(item.display_url);
        if (item.image_versions2?.candidates?.[0]?.url) add(item.image_versions2.candidates[0].url);
      }
    }
    if (obj.edge_sidecar_to_children?.edges) {
      for (const edge of obj.edge_sidecar_to_children.edges) {
        if (edge.node) add(edge.node.display_url);
      }
    }
    return urls;
  }

  // ============================================================
  // METRIKEN-EXTRAKTION
  // ============================================================

  function extractMetrics(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const r = {};

    for (const k of ['taken_at_timestamp','taken_at','device_timestamp','created_at','datePublished','uploadDate','dateCreated','published_at']) {
      if (obj[k] !== undefined && obj[k] !== null) { r.timestamp = obj[k]; break; }
    }

    if (obj.like_count !== undefined)                              r.likes = parseInt(obj.like_count, 10);
    else if (obj.likeCount !== undefined)                          r.likes = parseInt(obj.likeCount, 10);
    else if (obj.edge_liked_by?.count !== undefined)               r.likes = parseInt(obj.edge_liked_by.count, 10);
    else if (obj.edge_media_preview_like?.count !== undefined)     r.likes = parseInt(obj.edge_media_preview_like.count, 10);

    if (obj.comment_count !== undefined)                                    r.comments = parseInt(obj.comment_count, 10);
    else if (obj.commentCount !== undefined)                                r.comments = parseInt(obj.commentCount, 10);
    else if (obj.edge_media_to_comment?.count !== undefined)                r.comments = parseInt(obj.edge_media_to_comment.count, 10);
    else if (obj.edge_media_to_parent_comment?.count !== undefined)         r.comments = parseInt(obj.edge_media_to_parent_comment.count, 10);

    if (obj.video_view_count !== undefined)      r.views = parseInt(obj.video_view_count, 10);
    else if (obj.view_count !== undefined)       r.views = parseInt(obj.view_count, 10);
    else if (obj.play_count !== undefined)       r.views = parseInt(obj.play_count, 10);
    else if (obj.ig_play_count !== undefined)    r.views = parseInt(obj.ig_play_count, 10);

    let caption;
    if (typeof obj.accessibility_caption === 'string' && obj.accessibility_caption) caption = obj.accessibility_caption;
    else if (typeof obj.description === 'string' && obj.description)                caption = obj.description;
    else if (obj.caption) { caption = typeof obj.caption === 'string' ? obj.caption : obj.caption?.text; }
    if (!caption && obj.edge_media_to_caption?.edges?.[0]?.node?.text) caption = obj.edge_media_to_caption.edges[0].node.text;
    if (caption) r.caption = String(caption).trim().slice(0, 500);

    const hasCarousel = obj.carousel_media || (obj.edge_sidecar_to_children?.edges?.length > 0);
    if (hasCarousel) {
      r.mediaType = 'carousel';
      r.carouselCount = Array.isArray(obj.carousel_media) ? obj.carousel_media.length
        : (obj.edge_sidecar_to_children?.edges?.length || 0);
    } else if (
      ['GraphVideo','XDTGraphVideo','GraphReel','XDTGraphReel'].includes(obj.__typename) ||
      ['clips','reels'].includes(obj.product_type) || obj.media_type === 2 || obj.is_video === true
    ) { r.mediaType = 'reel'; }
    else if (obj.media_type === 1 || ['GraphImage','XDTGraphImage'].includes(obj.__typename)) { r.mediaType = 'image'; }

    const imgUrls = extractImageUrls(obj);
    if (imgUrls.length > 0) r.imageUrls = imgUrls;

    return r;
  }

  // ============================================================
  // JSON-LD + SEITEN-JSON
  // ============================================================

  function parseJsonLd(html) {
    const r = {};
    const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1]);
        if (d.uploadDate || d.datePublished) r.timestamp = d.uploadDate || d.datePublished;
        if (d.description) r.caption = d.description.slice(0, 500);
        if (Array.isArray(d.interactionStatistic)) {
          for (const s of d.interactionStatistic) {
            const it = s.interactionType?.['@type'] || s.interactionType || '';
            if (/Like/i.test(it))    r.likes    = parseInt(s.userInteractionCount, 10);
            if (/Comment/i.test(it)) r.comments = parseInt(s.userInteractionCount, 10);
          }
        }
      } catch (_) { }
    }
    return r;
  }

  function tryParseJson(text) {
    const trimmed = text.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length < 5_000_000) {
      try { return JSON.parse(trimmed); } catch (_) { }
    }
    for (const pat of [
      /window\._sharedData\s*=\s*(\{[\s\S]+?\});\s*(?:\/\/|<\/script>|$)/m,
      /window\.__additionalData\s*=\s*(\{[\s\S]+?\});\s*(?:\/\/|<\/script>|$)/m,
    ]) {
      const mm = text.match(pat);
      if (mm) { try { return JSON.parse(mm[1]); } catch (_) { } }
    }
    const idx = text.indexOf('"shortcode"');
    if (idx > -1) {
      let s = idx;
      while (s > 0 && text[s] !== '{') s--;
      let depth = 0, e = s;
      for (; e < Math.min(text.length, s + 50000); e++) {
        if (text[e] === '{') depth++;
        else if (text[e] === '}') { depth--; if (depth === 0) { e++; break; } }
      }
      if (depth === 0 && e > s) { try { return JSON.parse(text.slice(s, e)); } catch (_) { } }
    }
    return null;
  }

  function scanScriptsForPosts(doc, results) {
    for (const script of doc.querySelectorAll('script')) {
      const text = script.textContent;
      if (!text || text.length < 40) continue;
      if (!text.includes('shortcode') && !text.includes('taken_at') && !text.includes('like_count') && !text.includes('edge_liked_by')) continue;
      let parsed = null;
      if (script.type === 'application/json') { try { parsed = JSON.parse(text.trim()); } catch (_) { } }
      if (!parsed) parsed = tryParseJson(text);
      if (!parsed) continue;
      walkJson(parsed, (obj) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
        const code = obj.shortcode || obj.code;
        if (!code || typeof code !== 'string' || !POST_URL_RE.test(`/p/${code}/`)) return;
        if (results.has(code)) return;
        const metrics = extractMetrics(obj);
        if (Object.keys(metrics).length >= 1) results.set(code, metrics);
      }, new WeakSet(), 0);
    }
  }

  function parseCurrentPageJson() {
    const results = new Map();
    scanScriptsForPosts(document, results);
    if (results.size > 0) { dbg.pageJsonOk = true; dbg.fromPage = results.size; }
    return results;
  }

  function parsePostHtml(html, targetCode) {
    const result = Object.assign({}, parseJsonLd(html));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scriptResults = new Map();
    scanScriptsForPosts(doc, scriptResults);
    const direct = scriptResults.get(targetCode);
    if (direct) Object.assign(result, direct);
    else if (scriptResults.size > 0) Object.assign(result, scriptResults.values().next().value);
    return result;
  }

  // ============================================================
  // QUEUE & DATENLADEN
  // ============================================================

  function enqueuePost(post) {
    fetchQueue.push(post);
    if (!queueRunning) processQueue();
  }

  async function processQueue() {
    if (queueRunning) return;
    queueRunning = true;
    while (fetchQueue.length > 0) {
      const post = fetchQueue.shift();
      if (!post || post.status === 'loaded') continue;
      await loadPostData(post);
      if (fetchQueue.length > 0) await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
    }
    queueRunning = false;
    updatePanel();
  }

  async function loadPostData(post) {
    post.status = 'loading';
    renderOverlay(post);
    try {
      const cached = pageJsonCache.get(post.code);
      if (cached && cached.timestamp !== undefined) {
        mergeMetrics(post, cached);
        post.status = 'loaded'; post.source = 'page-json';
        finalizePost(post); renderOverlay(post); renderNavArrows(post); updatePanel();
        return;
      }
      if (cached) mergeMetrics(post, cached);
      // Bei Retry den Background-Cache umgehen, sonst kommt dieselbe leere Antwort zurück
      const response = await fetchPostViaBackground(post.type, post.code, (post.retries || 0) > 0);
      if (response.ok && response.html) {
        const metrics = parsePostHtml(response.html, post.code);
        if (Object.keys(metrics).length > 0) {
          mergeMetrics(post, metrics);
          post.status = 'loaded'; post.source = 'fetch'; dbg.fromFetch++;
        } else {
          post.status = post.metrics.timestamp ? 'loaded' : 'unavailable';
          post.source = 'fetch-empty';
        }
      } else {
        dbg.lastError = response.error || 'Fetch fehlgeschlagen';
        post.status = post.metrics.timestamp ? 'loaded' : 'unavailable';
        post.source = 'fetch-error';
      }
      // Unvollständige Daten (kein Datum oder keine Likes) → bis zu 2× erneut versuchen
      if ((post.metrics.timestamp === undefined || post.metrics.likes === undefined) && (post.retries || 0) < 2) {
        post.retries = (post.retries || 0) + 1;
        post.status = 'loading';
        setTimeout(() => enqueuePost(post), 2000 * post.retries);
      }
    } catch (err) {
      dbg.lastError = err.message; post.status = 'error';
    }
    finalizePost(post); renderOverlay(post); renderNavArrows(post); updatePanel();
  }

  function mergeMetrics(post, newData) {
    for (const [key, val] of Object.entries(newData)) {
      if (val === undefined || val === null) continue;
      if (key === 'imageUrls') {
        if (!post.metrics.imageUrls) post.metrics.imageUrls = [];
        for (const url of val) {
          if (!post.metrics.imageUrls.includes(url)) post.metrics.imageUrls.push(url);
        }
      } else if (post.metrics[key] === undefined) {
        post.metrics[key] = val;
      }
    }
  }

  function finalizePost(post) {
    if (post.metrics.carouselCount > 1) post.totalImages = post.metrics.carouselCount;
    if (!post.metrics.mediaType) {
      post.metrics.mediaType = (post.type === 'reel' || post.type === 'tv') ? 'reel' : 'image';
    }
  }

  async function fetchPostViaBackground(postType, code) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'FETCH_INSTAGRAM_POST', postType, code }, (resp) => {
          if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
          else resolve(resp || { ok: false, error: 'Keine Antwort' });
        });
      } catch (err) { resolve({ ok: false, error: err.message }); }
    });
  }

  // ============================================================
  // OVERLAY
  // ============================================================

  function findTileContainer(anchor) {
    let e = anchor;
    for (let i = 0; i < 8; i++) {
      e = e.parentElement;
      if (!e || e === document.body || e === document.documentElement) break;
      const tag = e.tagName.toLowerCase();
      if (tag === 'article' || tag === 'li') return e;
      if (tag === 'div' && (e.hasAttribute('tabindex') || e.getAttribute('role'))) return e;
      if (tag === 'div' && e.offsetWidth >= 80 && e.offsetHeight >= 70) return e;
    }
    return anchor.parentElement || anchor;
  }

  function ensureOverlay(anchor) {
    const norm = normalizePostUrl(anchor.href);
    if (!norm) return;
    const { type, code } = norm;
    if (processed.has(code) || posts.size >= MAX_POSTS) return;
    processed.add(code); dbg.linksFound++;

    const container = findTileContainer(anchor);
    if (!container) return;
    if (window.getComputedStyle(container).position === 'static') container.style.position = 'relative';
    // Verwaiste Overlays (z.B. nach Navigation-Reset) entfernen statt abzubrechen,
    // sonst landet der Post nie wieder in der Liste → Panel zeigt 0
    container.querySelectorAll(`.ig-overlay[${OVERLAY_ATTR}], .ig-nav-container`).forEach(n => n.remove());

    const overlay = el('div', 'ig-overlay');
    overlay.setAttribute(OVERLAY_ATTR, code);
    overlay.setAttribute('data-ig-type', type);

    // Klick auf Overlay-Info → Lightbox öffnen
    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'pointer';
    overlay.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const post = posts.get(code);
      if (post) openLightbox(post, post.currentImageIndex - 1);
    });

    container.appendChild(overlay);

    const navContainer = el('div', 'ig-nav-container');
    navContainer.setAttribute('data-ig-nav', code);
    container.appendChild(navContainer);

    const post = {
      type, code, url: norm.url, anchor, container, overlay, navContainer,
      status: 'loading', metrics: {}, currentImageIndex: 1, totalImages: 1, source: '',
    };
    posts.set(code, post); dbg.overlaysSet++;

    renderOverlay(post); renderNavArrows(post); enqueuePost(post);
  }

  function renderOverlay(post) {
    const ov = post.overlay;
    if (!ov) return;
    clearEl(ov);

    if (post.status === 'loading') {
      ov.appendChild(el('span', 'ig-status-loading', '⏳ Lädt …'));
      return;
    }
    if (post.status === 'unavailable' || post.status === 'error') {
      ov.appendChild(el('span', 'ig-status-error', '⚠️ Nicht verfügbar'));
      return;
    }

    const m = post.metrics;
    const t = m.mediaType || post.type;

    ov.appendChild(el('span', `ig-badge ig-badge-${t}`, typeLabel(t)));

    const dateLine = el('div', 'ig-line ig-date');
    dateLine.textContent = '📅 ' + formatDate(m.timestamp);
    ov.appendChild(dateLine);

    const metLine = el('div', 'ig-line ig-metrics');
    const metric1 = (t === 'reel' || t === 'tv') && m.views !== undefined
      ? '▶ ' + formatNumber(m.views)
      : '♥ ' + formatNumber(m.likes);
    metLine.textContent = metric1 + '  💬 ' + formatNumber(m.comments);
    ov.appendChild(metLine);

    if (m.caption) {
      const cap = el('div', 'ig-line ig-caption');
      cap.textContent = m.caption.slice(0, CAPTION_MAX) + (m.caption.length > CAPTION_MAX ? '…' : '');
      ov.appendChild(cap);
    }

    if (t === 'carousel' && post.totalImages > 1) {
      const ind = el('div', 'ig-line ig-carousel-indicator');
      ind.textContent = `${post.currentImageIndex} / ${post.totalImages}  🔍 Klick für Details`;
      ov.appendChild(ind);
    } else {
      const hint = el('div', 'ig-line ig-carousel-indicator', '🔍 Klick für Details');
      ov.appendChild(hint);
    }
  }

  // ============================================================
  // KACHEL-BILD DIREKT TAUSCHEN (kein Popup!)
  // ============================================================

  function swapTileImage(post, newIndex) {
    const urls = post.metrics.imageUrls || [];
    if (urls.length === 0) return false;
    const url = urls[newIndex];
    if (!url) return false;

    // Suche img im Anchor oder Container
    const imgEl = post.anchor.querySelector('img') || post.container.querySelector('img');
    if (!imgEl) return false;

    // Original sichern
    if (!imgEl.dataset.igOrigSrc) {
      imgEl.dataset.igOrigSrc    = imgEl.src;
      imgEl.dataset.igOrigSrcset = imgEl.srcset || '';
    }

    imgEl.style.transition = 'opacity 0.14s ease';
    imgEl.style.opacity    = '0.45';

    const tmp = new Image();
    tmp.onload = () => {
      imgEl.srcset   = '';
      imgEl.src      = url;
      imgEl.style.opacity = '1';
    };
    tmp.onerror = () => {
      imgEl.style.opacity = '1';
      // CDN-Fehler → Lightbox als Fallback
      openLightbox(post, newIndex);
    };
    tmp.src = url;
    return true;
  }

  // ============================================================
  // NAV-PFEILE
  // ============================================================

  function renderNavArrows(post) {
    const nav = post.navContainer;
    if (!nav) return;
    clearEl(nav);

    const t      = post.metrics.mediaType || post.type;
    const total  = post.totalImages;
    const isC    = t === 'carousel' && total > 1;
    const hasImg = (post.metrics.imageUrls || []).length > 0;

    const makeBtn = (side, icon, label) => {
      const btn = el('button', `ig-nav-arrow ig-nav-${side}`, icon);
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', hasImg ? label + ' (direkt im Bild)' : label + ' (öffnet Lightbox)');
      btn.style.display = isC ? '' : 'none';
      return btn;
    };

    const leftBtn  = makeBtn('left', '◀', 'Vorheriges Bild');
    const rightBtn = makeBtn('right', '▶', 'Nächstes Bild');

    if (post.currentImageIndex <= 1)          leftBtn.classList.add('ig-nav-disabled');
    if (post.currentImageIndex >= total)      rightBtn.classList.add('ig-nav-disabled');

    leftBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (post.currentImageIndex <= 1) return;
      post.currentImageIndex--;
      renderOverlay(post); renderNavArrows(post);
      if (!swapTileImage(post, post.currentImageIndex - 1)) {
        openLightbox(post, post.currentImageIndex - 1);
      }
    });

    rightBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (post.currentImageIndex >= post.totalImages) return;
      post.currentImageIndex++;
      renderOverlay(post); renderNavArrows(post);
      if (!swapTileImage(post, post.currentImageIndex - 1)) {
        openLightbox(post, post.currentImageIndex - 1);
      }
    });

    nav.appendChild(leftBtn);
    nav.appendChild(rightBtn);
  }

  // ============================================================
  // LIGHTBOX
  // ============================================================

  function createLightbox() {
    lightboxEl = el('div'); lightboxEl.id = 'ig-lightbox';
    lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });

    const card = el('div', 'ig-lightbox-card');
    card.addEventListener('click', e => e.stopPropagation());

    // Header
    const header = el('div', 'ig-lightbox-header');
    const titleSpan = el('span', 'ig-lightbox-title', '');
    titleSpan.id = 'ig-lb-title';
    header.appendChild(titleSpan);
    const closeBtn = el('button', 'ig-lightbox-close', '×');
    closeBtn.addEventListener('click', closeLightbox);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Bild-Bereich
    const imgWrap = el('div', 'ig-lightbox-image-wrap');

    const prevBtn = el('button', 'ig-lb-nav ig-lb-prev', '❮');
    prevBtn.id = 'ig-lb-prev';
    prevBtn.addEventListener('click', () => navigateLightbox(-1));

    const imgEl = document.createElement('img');
    imgEl.className = 'ig-lightbox-img'; imgEl.id = 'ig-lb-img'; imgEl.alt = 'Instagram Post';
    imgEl.style.display = 'none';

    const loadingEl = el('div', 'ig-lightbox-loading', '⏳ Bild wird geladen …');
    loadingEl.id = 'ig-lb-loading';

    const noImgEl = el('div', 'ig-lightbox-no-img', '');
    noImgEl.id = 'ig-lb-noimg'; noImgEl.style.display = 'none';

    const nextBtn = el('button', 'ig-lb-nav ig-lb-next', '❯');
    nextBtn.id = 'ig-lb-next';
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    imgWrap.appendChild(prevBtn); imgWrap.appendChild(imgEl);
    imgWrap.appendChild(loadingEl); imgWrap.appendChild(noImgEl);
    imgWrap.appendChild(nextBtn);
    card.appendChild(imgWrap);

    // Dots
    const dotsEl = el('div', 'ig-lb-dots'); dotsEl.id = 'ig-lb-dots';
    card.appendChild(dotsEl);

    // Footer
    const footer = el('div', 'ig-lightbox-footer'); footer.id = 'ig-lb-footer';
    card.appendChild(footer);

    lightboxEl.appendChild(card);
    document.body.appendChild(lightboxEl);

    document.addEventListener('keydown', (e) => {
      if (!lightboxEl?.classList.contains('ig-lb-open')) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateLightbox(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateLightbox(1); }
      if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
    });
  }

  function openLightbox(post, index) {
    if (!lightboxEl) createLightbox();
    lbPost  = post;
    lbIndex = Math.max(0, Math.min(index, Math.max(0, post.totalImages - 1)));
    updateLightbox();
    lightboxEl.classList.add('ig-lb-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('ig-lb-open');
    document.body.style.overflow = '';
    lbPost = null;
  }

  function navigateLightbox(dir) {
    if (!lbPost) return;
    const total = Math.max(lbPost.totalImages, (lbPost.metrics.imageUrls || []).length, 1);
    lbIndex = Math.max(0, Math.min(total - 1, lbIndex + dir));
    lbPost.currentImageIndex = lbIndex + 1;

    // Auch im Tile tauschen
    swapTileImage(lbPost, lbIndex);
    renderOverlay(lbPost); renderNavArrows(lbPost);
    updateLightbox();
  }

  function updateLightbox() {
    if (!lightboxEl || !lbPost) return;
    const post  = lbPost;
    const urls  = post.metrics.imageUrls || [];
    const total = Math.max(post.totalImages, urls.length, 1);
    const idx   = lbIndex;
    const t     = post.metrics.mediaType || post.type;

    const titleEl = lightboxEl.querySelector('#ig-lb-title');
    if (titleEl) titleEl.textContent = `${typeLabel(t)}  ·  ${idx + 1} / ${total}`;

    const imgEl   = lightboxEl.querySelector('#ig-lb-img');
    const loadEl  = lightboxEl.querySelector('#ig-lb-loading');
    const noImgEl = lightboxEl.querySelector('#ig-lb-noimg');
    const url     = urls[idx];

    if (imgEl && loadEl && noImgEl) {
      if (url) {
        loadEl.style.display = ''; imgEl.style.display = 'none'; noImgEl.style.display = 'none';
        const tmp = new Image();
        tmp.onload  = () => { imgEl.src = url; imgEl.style.display = ''; loadEl.style.display = 'none'; };
        tmp.onerror = () => {
          loadEl.style.display = 'none'; imgEl.style.display = 'none'; noImgEl.style.display = '';
          noImgEl.textContent = '⚠️ Bild konnte nicht geladen werden.\nDas CDN blockiert möglicherweise direkten Zugriff.';
        };
        tmp.src = url;
      } else {
        loadEl.style.display = 'none'; imgEl.style.display = 'none'; noImgEl.style.display = '';
        noImgEl.textContent = post.status === 'loading'
          ? '⏳ Post wird noch geladen …'
          : '📷 Kein Vorschaubild verfügbar.\nDie Bilddaten wurden nicht im Instagram-JSON gefunden.';
      }
    }

    const prevBtn = lightboxEl.querySelector('#ig-lb-prev');
    const nextBtn = lightboxEl.querySelector('#ig-lb-next');
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= total - 1;

    // Klickbare Dots
    const dotsEl = lightboxEl.querySelector('#ig-lb-dots');
    if (dotsEl) {
      clearEl(dotsEl);
      const maxDots = Math.min(total, 15);
      for (let i = 0; i < maxDots; i++) {
        const dot = el('div', 'ig-lb-dot' + (i === idx ? ' active' : ''));
        const capturedI = i;
        dot.addEventListener('click', () => {
          lbIndex = capturedI;
          if (lbPost) { lbPost.currentImageIndex = capturedI + 1; swapTileImage(lbPost, capturedI); renderOverlay(lbPost); renderNavArrows(lbPost); }
          updateLightbox();
        });
        dot.style.cursor = 'pointer';
        dotsEl.appendChild(dot);
      }
    }

    // Footer
    const footer = lightboxEl.querySelector('#ig-lb-footer');
    if (footer) {
      clearEl(footer);
      const m = post.metrics;
      footer.appendChild(el('span', 'ig-lb-meta', '📅 ' + formatDate(m.timestamp)));
      footer.appendChild(el('span', 'ig-lb-meta', '♥ ' + formatNumber(m.likes)));
      footer.appendChild(el('span', 'ig-lb-meta', '💬 ' + formatNumber(m.comments)));
      if ((t === 'reel' || t === 'tv') && m.views !== undefined) {
        footer.appendChild(el('span', 'ig-lb-meta', '▶ ' + formatNumber(m.views)));
      }
      if (m.caption) {
        const capEl = el('div', 'ig-lb-caption', m.caption.slice(0, 120) + (m.caption.length > 120 ? '…' : ''));
        footer.appendChild(capEl);
      }
      const openLink = document.createElement('a');
      openLink.href = post.url + (url ? `&img_index=${idx + 1}` : '');
      openLink.target = '_blank'; openLink.rel = 'noopener noreferrer';
      openLink.className = 'ig-lb-open-link';
      openLink.textContent = '↗ Auf Instagram öffnen';
      footer.appendChild(openLink);
    }
  }

  // ============================================================
  // GRID SCANNING
  // ============================================================

  function scanGridPosts() {
    const fresh = parseCurrentPageJson();
    for (const [code, metrics] of fresh) pageJsonCache.set(code, metrics);
    const links = document.querySelectorAll(POST_LINK_SEL);
    let added = 0;
    for (const link of links) {
      if (posts.size >= MAX_POSTS) break;
      if (!link.href) continue;
      const norm = normalizePostUrl(link.href);
      if (!norm || processed.has(norm.code)) continue;
      ensureOverlay(link); added++;
    }
    if (added > 0 || posts.size > 0) updatePanel();
    return added;
  }

  // ============================================================
  // MUTATION OBSERVER
  // ============================================================

  function setupMutationObserver() {
    if (mutObserver) mutObserver.disconnect();
    mutObserver = new MutationObserver((mutations) => {
      if (navLocked) return;
      let hasNew = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.classList?.contains('ig-overlay') || node.classList?.contains('ig-nav-container') ||
              node.id === 'ig-panel' || node.id === 'ig-lightbox') continue;
          const tag = node.tagName?.toLowerCase();
          if (tag === 'a' && POST_URL_RE.test(node.href || '')) { hasNew = true; break; }
          if (node.querySelector?.(POST_LINK_SEL)) { hasNew = true; break; }
        }
        if (hasNew) break;
      }
      if (!hasNew) return;
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(() => { scanTimer = null; scanGridPosts(); }, 250);
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================================
  // AUDIT-ANALYSE
  // ============================================================

  function analyzePostingFrequency() {
    const loaded = Array.from(posts.values()).filter(p => p.metrics.timestamp !== undefined);
    if (loaded.length < 2) return { perWeek: '?', label: 'Zu wenig Daten', totalDays: 0, oldest: null, newest: null };

    const ms = loaded.map(p => tsToMs(p.metrics.timestamp)).filter(n => !isNaN(n)).sort((a,b) => b - a);
    if (ms.length < 2) return { perWeek: '?', label: 'Zu wenig Daten', totalDays: 0, oldest: null, newest: null };

    const newest  = ms[0];
    const oldest  = ms[ms.length - 1];
    const days    = Math.max(1, Math.round((newest - oldest) / 86_400_000));
    const perWeek = ((ms.length / days) * 7).toFixed(1);
    const pw      = parseFloat(perWeek);
    let label;
    if (pw >= 14) label = 'mehrmals täglich';
    else if (pw >= 7) label = 'täglich';
    else if (pw >= 4) label = 'mehrmals wöchentlich';
    else if (pw >= 1) label = 'wöchentlich';
    else label = 'selten';

    return { perWeek, label, totalDays: days, oldest, newest };
  }

  function analyzePostTypes() {
    const all = Array.from(posts.values()).filter(p => p.status === 'loaded');
    if (all.length === 0) return { carouselPct: 0, reelPct: 0, imagePct: 0, summary: 'Keine Daten', carousel: 0, reel: 0, image: 0, total: 0 };
    const counts = { carousel: 0, reel: 0, image: 0 };
    for (const p of all) {
      const t = p.metrics.mediaType || p.type;
      if (t === 'carousel') counts.carousel++;
      else if (t === 'reel' || t === 'tv') counts.reel++;
      else counts.image++;
    }
    const total = all.length;
    const pct = (n) => Math.round(n / total * 100);
    return {
      ...counts, total,
      carouselPct: pct(counts.carousel),
      reelPct: pct(counts.reel),
      imagePct: pct(counts.image),
      summary: `Carousel ${pct(counts.carousel)}%  ·  Reels ${pct(counts.reel)}%  ·  Bilder ${pct(counts.image)}%`,
    };
  }

  function analyzeEngagement() {
    const loaded = Array.from(posts.values()).filter(p => p.status === 'loaded');
    const withLikes    = loaded.filter(p => !isNaN(p.metrics.likes));
    const withComments = loaded.filter(p => !isNaN(p.metrics.comments));
    const avgLikes    = withLikes.length    > 0 ? Math.round(withLikes.reduce((s,p) => s + p.metrics.likes, 0) / withLikes.length) : 0;
    const avgComments = withComments.length > 0 ? Math.round(withComments.reduce((s,p) => s + p.metrics.comments, 0) / withComments.length) : 0;
    const maxLikes    = withLikes.length    > 0 ? Math.max(...withLikes.map(p => p.metrics.likes)) : 0;
    const topPost     = withLikes.find(p => p.metrics.likes === maxLikes);
    return { avgLikes, avgComments, maxLikes, topPost };
  }

  function detectCategories() {
    const kwMap = {
      'Mode/Fashion':        ['mode','fashion','kollektion','style','kleid','design','bekleidung','textil'],
      'Kunst/Kreativität':   ['kunst','kreativ','design','grafik','illustration','zeichn','gestalten','kreativität'],
      'Wirtschaft/BWL':      ['wirtschaft','bwl','rechnungswesen','buchhaltung','marketing','management','betrieb'],
      'Events/Feiern':       ['event','fest','feier','abschluss','matura','abend','ball','veranstaltung'],
      'Unterricht/Projekte': ['unterricht','projekt','klasse','schule','lernen','aufgabe','präsentation'],
      'Exkursionen/Reisen':  ['exkursion','ausflug','besuch','besichtigung','fahrt','reise','graz','wien'],
      'International':       ['erasmus','international','austausch','ausland','europa','england','italy'],
      'Sport/Bewegung':      ['sport','turnen','fitness','lauf','spiel','turnier','volleyball'],
    };
    const cats = {};
    for (const p of posts.values()) {
      if (!p.metrics.caption) continue;
      const cap = p.metrics.caption.toLowerCase();
      for (const [cat, words] of Object.entries(kwMap)) {
        if (words.some(w => cap.includes(w))) cats[cat] = (cats[cat] || 0) + 1;
      }
    }
    return Object.entries(cats).sort((a,b) => b[1]-a[1]).filter(([,n]) => n > 0)
      .map(([cat, n]) => `${cat} (${n} Posts)`).slice(0, 6);
  }

  function getTopWords(n) {
    const STOP = new Set(['und','der','die','das','in','von','mit','zu','ist','ein','eine','für','auf','an','im','am','bei','nach','aus','wie','oder','aber','auch','ich','wir','ihr','sie','er','es','du','hat','war','nicht','noch','schon','jetzt','the','and','a','an','of','to','for','is','it','at','by','this','that','with','from','have','are','was','been','has','we','our','you','your','their','beim','sind','wird','wurden','haben','alle','dem','den','des','bei','zum','als']);
    const freq = new Map();
    for (const p of posts.values()) {
      if (!p.metrics.caption) continue;
      for (const w of (p.metrics.caption.toLowerCase().match(/[a-zäöüß]{4,}/g) || [])) {
        if (!STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
      }
    }
    return [...freq.entries()].sort((a,b) => b[1]-a[1]).slice(0, n);
  }

  function generateStrengths(freq, types, engagement) {
    const s = [];
    if (parseFloat(freq.perWeek) >= 5) s.push(`Sehr hohe Posting-Frequenz (Ø ${freq.perWeek} Posts/Woche) – der Account ist täglich aktiv`);
    else if (parseFloat(freq.perWeek) >= 2) s.push(`Regelmäßige Posting-Aktivität (Ø ${freq.perWeek} Posts/Woche)`);
    else s.push(`Kontinuierliche Berichterstattung über das Schulleben`);

    if (types.carouselPct >= 50) s.push(`Starke Nutzung von Carousel-Posts (${types.carouselPct}%) – ideal für mehrteilige Projekte und ausführliche Berichte`);
    if (engagement.maxLikes >= 200) s.push(`Einzelne Posts mit hoher Reichweite (bis zu ${engagement.maxLikes} Likes)`);
    else if (engagement.avgLikes >= 100) s.push(`Solides Engagement mit Ø ${engagement.avgLikes} Likes pro Post`);

    const topics = getTopWords(4).map(([w]) => w);
    if (topics.length >= 3) s.push(`Vielfältige Themenabdeckung: ${topics.join(', ')} u.v.m.`);
    if (types.reelPct > 0) s.push(`Mix aus Formaten (Carousel + Reels + Bilder) sorgt für Abwechslung im Feed`);

    // Fallback-Stärken
    const extras = [
      'Regelmäßige Dokumentation von Schulprojekten und Events',
      'Authentische Einblicke in den Schulalltag',
      'Professionelle visuelle Qualität der Posts',
      'Gute Balance zwischen Unterrichtsinhalten und Schulevents',
    ];
    for (const e of extras) { if (s.length < 5 && !s.includes(e)) s.push(e); }
    return s.slice(0, 5);
  }

  function generateImprovements(freq, types, engagement) {
    const imp = [];
    if (engagement.avgComments < 3) imp.push(`Kommentar-Interaktion steigern (aktuell Ø ${engagement.avgComments}/Post): Fragen in Captions stellen, Abstimmungen/Umfragen nutzen`);
    if (types.reelPct < 20) imp.push(`Mehr Reels produzieren (aktuell ${types.reelPct}%) – Kurzvideos erreichen junge Zielgruppen deutlich besser`);
    if (parseFloat(freq.perWeek) < 3) imp.push(`Posting-Frequenz erhöhen (aktuell ${freq.perWeek}/Woche) – Algorithmus bevorzugt regelmäßige Aktivität`);
    imp.push('Konsistente Hashtag-Strategie entwickeln (#CHSVillach, #Schulprojekt, #HLAVillach, etc.)');
    imp.push('Stories und Highlights stärker nutzen für tagesaktuelle Inhalte und Rückblicke');
    imp.push('Schüler aktiver in Content-Erstellung einbeziehen (User Generated Content, Behind-the-Scenes)');
    imp.push('Call-to-Action in Captions einbauen: „Schreib uns in den Kommentaren…"');
    return imp.slice(0, 5);
  }

  function generateFazit(freq, types, engagement, username) {
    const pw = parseFloat(freq.perWeek);
    const freqStr = pw >= 7 ? 'täglich aktiver' : pw >= 3 ? 'regelmäßig aktiver' : 'aktiver';
    return `Der Instagram-Account @${username} präsentiert sich als ${freqStr} und vielfältiger Social-Media-Kanal der Schule. Mit durchschnittlich ${freq.perWeek} Posts pro Woche (${freq.label}) über einen Zeitraum von ${freq.totalDays} Tagen dokumentiert der Account das Schulleben umfassend und regelmäßig. Die Stärke liegt besonders in der konsequenten Nutzung von Carousel-Posts (${types.carouselPct}%), die ausführliche Einblicke in Projekte und Veranstaltungen ermöglichen. Die thematische Vielfalt spiegelt das breite Bildungsangebot der Schule gut wider. Mit durchschnittlich ${engagement.avgLikes} Likes pro Post zeigt der Account ein solides Engagement der Follower. Verbesserungspotenzial besteht vor allem bei der Kommentar-Interaktion (Ø ${engagement.avgComments}) sowie einer stärkeren Nutzung von Reels (${types.reelPct}%), da Kurzvideos bei jungen Zielgruppen besonders gut ankommen. Insgesamt hinterlässt der Account einen professionellen und engagierten Eindruck, der das Schulimage positiv nach außen trägt und als wertvolles Informationsmedium für Schüler, Eltern und Interessierte dient.`;
  }

  function generateAuditReport() {
    const username   = getAccountName();
    const all        = Array.from(posts.values());
    const loaded     = all.filter(p => p.status === 'loaded');
    const freq       = analyzePostingFrequency();
    const types      = analyzePostTypes();
    const engagement = analyzeEngagement();
    const topWords   = getTopWords(8);
    const cats       = detectCategories();
    const strengths  = generateStrengths(freq, types, engagement);
    const imps       = generateImprovements(freq, types, engagement);

    const line = (t='') => t;
    const sep  = (c='━') => c.repeat(52);

    const oldest = freq.oldest ? formatDate(freq.oldest) : '?';
    const newest = freq.newest ? formatDate(freq.newest) : '?';

    const lines = [
      sep('═'),
      `SOCIAL MEDIA AUDIT — @${username}`,
      `Erstellt am: ${new Date().toLocaleDateString('de-AT')} mit CHS Instagram Audit Helper`,
      sep('═'),
      `Analysierte Posts: ${loaded.length} von ${all.length} gefundenen`,
      freq.totalDays > 0 ? `Analysezeitraum: ${oldest} – ${newest} (${freq.totalDays} Tage)` : '',
      line(),
      sep(),
      'SCHRITT 1: DIE 5 ANALYSEFRAGEN',
      sep(),
      line(),
      '1. WIE OFT WIRD GEPOSTET?',
      `   ${loaded.length} Posts in ${freq.totalDays} Tagen`,
      `   → Durchschnitt: ${freq.perWeek} Posts/Woche`,
      `   → Bewertung: ${freq.label}`,
      freq.perWeek >= 7 ? '   → Der Account postet täglich bis mehrmals täglich – sehr aktiv!' :
        freq.perWeek >= 3 ? '   → Regelmäßige, mehrmals wöchentliche Aktivität.' :
          '   → Posting-Frequenz könnte erhöht werden.',
      line(),
      '2. WELCHE THEMEN KOMMEN VOR?',
      topWords.length > 0 ? `   Häufigste Begriffe in Captions: ${topWords.map(([w,n]) => `${w} (${n}×)`).join(', ')}` : '   (Captions nicht verfügbar)',
      cats.length > 0 ? `   Erkannte Themen-Kategorien:\n${cats.map(c => `   • ${c}`).join('\n')}` : '',
      line(),
      '3. SPRICHT DER ACCOUNT SCHÜLER AN?',
      `   Post-Typen: ${types.summary}`,
      `   Engagement: Ø ${engagement.avgLikes} Likes / Ø ${engagement.avgComments} Kommentare pro Post`,
      types.carouselPct >= 50
        ? '   → Viele Carousel-Posts zeigen Projekte ausführlich – gut für Schüler-Interesse.'
        : '   → Mehr Carousel/Reel-Content könnte Schüler besser ansprechen.',
      engagement.avgLikes >= 150
        ? '   → Hohes Engagement deutet auf gute Resonanz bei der Zielgruppe hin.'
        : '   → Engagement-Steigerung durch interaktive Formate möglich.',
      line(),
      '4. WAS GEFÄLLT PERSÖNLICH AN DEM ACCOUNT?',
      ...strengths.slice(0, 3).map(s => `   + ${s}`),
      line(),
      '5. WAS FEHLT AUF DEM ACCOUNT?',
      ...imps.slice(0, 3).map(i => `   − ${i}`),
      line(),
      sep(),
      'SCHRITT 2: STÄRKEN & VERBESSERUNGSVORSCHLÄGE',
      sep(),
      line(),
      '✅ STÄRKEN DES ACCOUNTS:',
      ...strengths.slice(0, 3).map((s, i) => `${i + 1}. ${s}`),
      line(),
      '🔧 VERBESSERUNGSVORSCHLÄGE:',
      ...imps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`),
      line(),
      sep(),
      'SCHRITT 3: FAZIT',
      sep(),
      line(),
      generateFazit(freq, types, engagement, username),
      line(),
      sep(),
      'ROHDATEN',
      sep(),
      `Vollständige Daten als CSV: Klicke im Panel auf "📋 CSV kopieren"`,
      `Analysierte Posts: ${loaded.length}`,
      engagement.topPost ? `Top-Post (${engagement.maxLikes} Likes): ${engagement.topPost.url}` : '',
      sep('═'),
    ];

    return lines.filter(l => l !== undefined).join('\n');
  }

  // ============================================================
  // PANEL
  // ============================================================

  function createPanel() {
    if (document.getElementById('ig-panel')) { panelEl = document.getElementById('ig-panel'); return; }

    panelEl = el('div'); panelEl.id = 'ig-panel';

    const header = el('div', 'ig-panel-header');
    header.appendChild(el('span', 'ig-panel-title', '📊 Instagram Audit'));

    const toggleBtn = el('button', 'ig-panel-toggle', '−');
    toggleBtn.addEventListener('click', () => {
      const body = panelEl.querySelector('.ig-panel-body');
      if (!body) return;
      const hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      toggleBtn.textContent = hidden ? '−' : '+';
    });
    header.appendChild(toggleBtn);
    panelEl.appendChild(header);
    makeDraggable(panelEl, header);

    const body = el('div', 'ig-panel-body');
    body.appendChild(el('div', 'ig-panel-stats'));
    body.appendChild(el('div', 'ig-panel-top'));
    body.appendChild(el('div', 'ig-panel-words'));

    // Audit-Sektion
    const auditDiv = el('div', 'ig-panel-audit');
    auditDiv.id = 'ig-panel-audit';
    body.appendChild(auditDiv);

    // Buttons
    const btnDiv = el('div', 'ig-panel-buttons');

    const scanBtn = el('button', 'ig-btn', '🔄 Neu scannen');
    scanBtn.addEventListener('click', () => scanGridPosts());

    const csvBtn = el('button', 'ig-btn', '📋 CSV kopieren');
    csvBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateCSV()).then(() => {
        csvBtn.textContent = '✅ Kopiert!';
        setTimeout(() => { csvBtn.textContent = '📋 CSV kopieren'; }, 2200);
      }).catch(() => {
        csvBtn.textContent = '❌ Fehler';
        setTimeout(() => { csvBtn.textContent = '📋 CSV kopieren'; }, 2200);
      });
    });

    const auditBtn = el('button', 'ig-btn ig-btn-primary', '📋 Audit-Bericht');
    auditBtn.id = 'ig-btn-audit';
    auditBtn.addEventListener('click', () => {
      const report = generateAuditReport();
      navigator.clipboard.writeText(report).then(() => {
        auditBtn.textContent = '✅ Bericht kopiert!';
        setTimeout(() => { auditBtn.textContent = '📋 Audit-Bericht'; }, 3000);
      }).catch(() => {
        // Fallback: neues Fenster
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre style="font-family:monospace;white-space:pre-wrap;padding:20px;background:#111;color:#eee;">${report.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`);
          win.document.close();
        }
      });
    });

    const debugBtn = el('button', 'ig-btn', '🐛 Debug');
    debugBtn.addEventListener('click', () => {
      const debugDiv = panelEl.querySelector('#ig-panel-debug');
      if (!debugDiv) return;
      dbg.active = !dbg.active;
      debugDiv.style.display = dbg.active ? '' : 'none';
      debugBtn.textContent = dbg.active ? '🐛 Debug ▲' : '🐛 Debug';
      if (dbg.active) _renderPanel();
    });

    btnDiv.appendChild(scanBtn);
    btnDiv.appendChild(csvBtn);
    btnDiv.appendChild(auditBtn);
    btnDiv.appendChild(debugBtn);
    body.appendChild(btnDiv);

    const debugDiv = el('div', 'ig-panel-debug');
    debugDiv.id = 'ig-panel-debug';
    debugDiv.style.display = 'none';
    body.appendChild(debugDiv);

    panelEl.appendChild(body);
    document.body.appendChild(panelEl);
  }

  function makeDraggable(panel, handle) {
    let startX, startY, startRight, startBottom;
    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; e.preventDefault();
      const r = panel.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startRight  = window.innerWidth  - r.right;
      startBottom = window.innerHeight - r.bottom;
      const move = (ev) => {
        panel.style.right  = Math.max(0, startRight  - (ev.clientX - startX)) + 'px';
        panel.style.bottom = Math.max(0, startBottom - (ev.clientY - startY)) + 'px';
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  function updatePanel() {
    if (!panelEl) return;
    if (panelTimer) return;
    panelTimer = setTimeout(() => { panelTimer = null; _renderPanel(); }, 220);
  }

  function _renderPanel() {
    if (!panelEl) return;
    const statsDiv = panelEl.querySelector('.ig-panel-stats');
    const topDiv   = panelEl.querySelector('.ig-panel-top');
    const wordsDiv = panelEl.querySelector('.ig-panel-words');
    const auditDiv = panelEl.querySelector('#ig-panel-audit');
    const debugDiv = panelEl.querySelector('#ig-panel-debug');

    const all    = Array.from(posts.values());
    const loaded = all.filter(p => p.status === 'loaded');
    const errors = all.filter(p => p.status === 'unavailable' || p.status === 'error');

    const dated = loaded
      .filter(p => p.metrics.timestamp !== undefined)
      .map(p => ({ post: p, ms: tsToMs(p.metrics.timestamp) }))
      .filter(x => !isNaN(x.ms))
      .sort((a, b) => b.ms - a.ms);

    const newest = dated[0]?.post;
    const oldest = dated[dated.length - 1]?.post;
    const avgGap = dated.length > 1
      ? ((dated[0].ms - dated[dated.length-1].ms) / 86_400_000 / (dated.length-1)).toFixed(1) + ' Tage'
      : '?';

    const withLikes    = loaded.filter(p => !isNaN(p.metrics.likes));
    const withComments = loaded.filter(p => !isNaN(p.metrics.comments));
    const avgLikes    = withLikes.length    > 0 ? Math.round(withLikes.reduce((s,p) => s + p.metrics.likes, 0) / withLikes.length)       : '?';
    const avgComments = withComments.length > 0 ? Math.round(withComments.reduce((s,p) => s + p.metrics.comments, 0) / withComments.length) : '?';

    // ---- Stats ----
    if (statsDiv) {
      clearEl(statsDiv);
      for (const rowDef of [
        [['Gefunden:', String(all.length)], ['Fehler:', String(errors.length)]],
        [['Geladen:',  String(loaded.length)], ['Queue:', String(fetchQueue.length)]],
        [['Neuester:', newest ? formatDate(newest.metrics.timestamp) : '?']],
        [['Ältester:', oldest ? formatDate(oldest.metrics.timestamp) : '?']],
        [['Ø Abstand:', avgGap]],
        [['Ø Likes:', formatNumber(avgLikes)], ['Ø Komm:', formatNumber(avgComments)]],
      ]) {
        const row = el('div', 'ig-stat-row');
        for (const [label, val] of rowDef) {
          row.appendChild(el('span', 'ig-stat-label', label));
          row.appendChild(el('strong', null, val));
        }
        statsDiv.appendChild(row);
      }
    }

    // ---- Top 3 ----
    if (topDiv) {
      clearEl(topDiv);
      const top3 = [...loaded].filter(p => !isNaN(p.metrics.likes)).sort((a,b) => b.metrics.likes - a.metrics.likes).slice(0, 3);
      if (top3.length > 0) {
        topDiv.appendChild(el('div', 'ig-panel-heading', '🏆 TOP 3 NACH LIKES'));
        top3.forEach((p, i) => {
          const item = el('div', 'ig-top-item');
          const link = document.createElement('a');
          link.href = p.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.className = 'ig-top-link';
          link.textContent = `${i+1}. ♥ ${formatNumber(p.metrics.likes)}`;
          item.appendChild(link);
          item.appendChild(el('span', 'ig-top-date', ' · ' + formatDate(p.metrics.timestamp)));
          topDiv.appendChild(item);
        });
      }
    }

    // ---- Caption-Wörter ----
    if (wordsDiv) {
      clearEl(wordsDiv);
      const words = getTopWords(3);
      if (words.length > 0) {
        wordsDiv.appendChild(el('div', 'ig-panel-heading', '💬 TOP CAPTION-WÖRTER'));
        wordsDiv.appendChild(el('div', 'ig-words', words.map(([w,n]) => `${w} (${n})`).join('  ·  ')));
      }
    }

    // ---- Audit-Schnellanalyse ----
    if (auditDiv && loaded.length >= 3) {
      clearEl(auditDiv);
      auditDiv.appendChild(el('div', 'ig-panel-heading', '📋 AUDIT-SCHNELLANALYSE'));

      const freq  = analyzePostingFrequency();
      const types = analyzePostTypes();
      const eng   = analyzeEngagement();

      const quickRows = [
        ['Frequenz:', `${freq.perWeek}/Woche (${freq.label})`],
        ['Typen:', types.summary],
        ['Top-Likes:', `♥ ${eng.maxLikes}`],
      ];
      for (const [label, val] of quickRows) {
        const row = el('div', 'ig-audit-row');
        row.appendChild(el('span', 'ig-stat-label', label));
        row.appendChild(el('span', 'ig-audit-val', val));
        auditDiv.appendChild(row);
      }

      const cats = detectCategories();
      if (cats.length > 0) {
        auditDiv.appendChild(el('div', 'ig-audit-cats',
          cats.slice(0, 3).map(c => c.split(' (')[0]).join('  ·  ')));
      }

      const hint = el('div', 'ig-audit-hint', '▲ "Audit-Bericht" kopiert alle 5 Fragen + Stärken + Fazit für das Arbeitsblatt!');
      auditDiv.appendChild(hint);
    }

    // ---- Debug ----
    if (debugDiv && dbg.active) {
      clearEl(debugDiv);
      for (const [label, val] of [
        ['URL:', location.href.slice(0, 55) + (location.href.length > 55 ? '…' : '')],
        ['Profil:', isProfilePage() ? 'Ja ✅' : 'Nein'],
        ['Links:', String(dbg.linksFound)],
        ['Overlays:', String(dbg.overlaysSet)],
        ['Seiten-JSON:', dbg.pageJsonOk ? `Ja ✅ (${dbg.fromPage})` : 'Nein ❌'],
        ['Per Fetch:', String(dbg.fromFetch)],
        ['Queue:', String(fetchQueue.length) + (queueRunning ? ' (aktiv)' : '')],
        ['Letzter Err:', dbg.lastError || '—'],
      ]) {
        const row = el('div', 'ig-debug-row');
        row.appendChild(el('span', 'ig-debug-label', label));
        row.appendChild(el('span', null, val));
        debugDiv.appendChild(row);
      }
    }
  }

  // ============================================================
  // CSV
  // ============================================================

  function generateCSV() {
    const rows = ['Typ;Code;URL;Datum;Likes;Kommentare;Views;Caption;Quelle;Status'];
    for (const p of posts.values()) {
      const m = p.metrics;
      const cells = [
        p.type, p.code, p.url,
        m.timestamp !== undefined ? formatDate(m.timestamp) : '',
        m.likes     !== undefined ? String(m.likes)     : '',
        m.comments  !== undefined ? String(m.comments)  : '',
        m.views     !== undefined ? String(m.views)     : '',
        (m.caption || '').replace(/;/g, ',').replace(/[\r\n]+/g, ' ').slice(0, 200),
        p.source || '', p.status || '',
      ];
      rows.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'));
    }
    return rows.join('\r\n');
  }

  // ============================================================
  // SPA-NAVIGATION
  // ============================================================

  function observeNavigation() {
    // Nur auf Pfad-Wechsel reagieren — Query/Hash-Änderungen (z.B. ?hl=de, ?img_index=)
    // dürfen den Scan-Zustand NICHT löschen
    let lastPath = location.pathname;
    const check = () => {
      if (location.pathname === lastPath) return;
      lastPath = location.pathname;
      navLocked = true;
      document.querySelectorAll('.ig-overlay, .ig-nav-container').forEach(n => n.remove());
      posts.clear(); processed.clear(); pageJsonCache.clear();
      fetchQueue.length = 0; queueRunning = false;
      Object.assign(dbg, { linksFound:0, overlaysSet:0, pageJsonOk:false, fromPage:0, fromFetch:0, lastError:'' });
      closeLightbox();
      setTimeout(() => { navLocked = false; scanGridPosts(); }, 1200);
    };
    const origPush    = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState    = function(...a) { origPush(...a);    setTimeout(check, 50); };
    history.replaceState = function(...a) { origReplace(...a); setTimeout(check, 50); };
    window.addEventListener('popstate', () => setTimeout(check, 50));
    setInterval(check, 1500);
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    if (!location.hostname.includes('instagram.com')) return;

    createPanel();
    setupMutationObserver();
    observeNavigation();

    let scrollDebounce = null;
    window.addEventListener('scroll', () => {
      if (scrollDebounce) return;
      scrollDebounce = setTimeout(() => { scrollDebounce = null; scanGridPosts(); }, 600);
    }, { passive: true });

    setTimeout(() => scanGridPosts(), 600);
    setTimeout(() => scanGridPosts(), 2200);
    setInterval(() => { if (!navLocked) scanGridPosts(); }, SCAN_INTERVAL);
  }

  init();

})();
