(async function() {
  if (globalThis.__AUTO_CAPTURE_RUNNING) return;
  globalThis.__AUTO_CAPTURE_RUNNING = true;
  try {
    const jobId = globalThis.__AUTO_CAPTURE_JOB_ID__ || 0;
    const recursive = !!globalThis.__AUTO_CAPTURE_RECURSIVE__;

    // 1. Extract links so the background page can queue same-origin sub-pages.
    // Sign-out links are skipped: following one ends the session, after which
    // every remaining queued page just renders the login gate instead of the
    // content we came for.
    const links = Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href && href.startsWith('http'))
      .filter(href => !isSessionEndingUrl(href));

    try {
      chrome.runtime.sendMessage({ action: "linksFound", links, jobId });
    } catch (e) {
      console.warn("Could not send links", e);
    }

    // 1b. Many dashboards/SPAs navigate through a client-side "tab switcher"
    // (e.g. <button data-tab="..."> or an ARIA role="tab" group) that swaps
    // visible content without ever changing the URL, so the link-based crawl
    // above can never discover those views. Click through such a group.
    const tabButtons = recursive ? detectTabButtons() : [];

    if (tabButtons.length > 1) {
      try {
        chrome.runtime.sendMessage({ action: "tabsPlanned", jobId, total: tabButtons.length });
      } catch (e) {}
      const originalActive = tabButtons.find(t => isTabActive(t.el)) || tabButtons[0];
      for (let t = 0; t < tabButtons.length; t++) {
        try {
          tabButtons[t].el.click();
        } catch (e) {
          console.warn("Could not click tab", tabButtons[t].label, e);
        }
        // Wait for the panel swap to actually land before shooting it,
        // otherwise a slow view renders into the *next* tab's screenshot and
        // every file ends up holding the wrong page.
        await waitForTabToSettle(tabButtons[t].el);
        await runOneCapture(tabButtons[t].label, t === tabButtons.length - 1, t + 1, tabButtons.length);
      }
      try { originalActive.el.click(); } catch (e) {}
    } else {
      await runOneCapture(null, true, 1, 1);
    }
  } catch (error) {
    console.error("Critical error in content script:", error);
    try {
      chrome.runtime.sendMessage({ action: "pageCaptureFailed", jobId: globalThis.__AUTO_CAPTURE_JOB_ID__ || 0 });
    } catch (e) {}
  } finally {
    globalThis.__AUTO_CAPTURE_RUNNING = false;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Waits until the clicked tab is marked active and the content area has
  // stopped changing size, so we never photograph a half-rendered panel.
  async function waitForTabToSettle(btn) {
    const deadline = Date.now() + 4000;
    let lastSignature = null;
    let stableFor = 0;

    while (Date.now() < deadline) {
      await sleep(200);
      const signature = [
        isTabActive(btn) ? 1 : 0,
        document.body.scrollHeight,
        document.body.textContent.length
      ].join('|');

      if (signature === lastSignature) {
        stableFor += 200;
        if (stableFor >= 400 && isTabActive(btn)) return;
      } else {
        stableFor = 0;
        lastSignature = signature;
      }
    }
  }

  // Recognises URLs that would log the user out / destroy the session, so the
  // crawler never navigates into one and locks itself out of the rest of the site.
  function isSessionEndingUrl(href) {
    let path;
    try {
      const u = new URL(href);
      path = (u.pathname + u.search).toLowerCase();
    } catch (e) {
      return false;
    }
    return /(^|[\/_?&=-])(logout|log-out|signout|sign-out|abmelden|ausloggen|logoff)([\/_?&=-]|$)/.test(path);
  }

  // Finds a group of sibling elements that look like a client-side tab bar:
  // several elements sharing a parent, marked with [data-tab] or the ARIA
  // role="tab" convention. Picks the largest such group on the page.
  function detectTabButtons() {
    for (const sel of ['[data-tab]', '[role="tab"]']) {
      let nodes;
      try {
        nodes = Array.from(document.querySelectorAll(sel));
      } catch (e) {
        continue;
      }
      const groups = new Map();
      for (const el of nodes) {
        if (el.disabled) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const parent = el.parentElement;
        if (!parent) continue;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(el);
      }
      let best = null;
      for (const group of groups.values()) {
        if (group.length >= 2 && (!best || group.length > best.length)) best = group;
      }
      if (best && best.length <= 30) {
        return best.map(el => ({
          el,
          label: (el.getAttribute('data-tab') || el.textContent || '').trim().slice(0, 40) || null
        }));
      }
    }
    return [];
  }

  function isTabActive(el) {
    return el.classList.contains('active') ||
      el.classList.contains('selected') ||
      el.getAttribute('aria-selected') === 'true';
  }

  // Lifts the height/overflow constraints that keep a page's content trapped
  // inside an inner scroll pane, so the whole thing flows into the document
  // and the window can scroll it top to bottom like an ordinary long page.
  // This is what makes app-shell layouts (fixed sidebar + independently
  // scrolling content, e.g. `html,body{height:100%;overflow:hidden}`)
  // capturable at all: without it window.scrollTo() moves nothing and every
  // screenshot comes back showing the same first viewport.
  // Returns a function that puts every touched style back.
  function unlockPageScrolling() {
    const undo = [];
    const force = (el, prop, value) => {
      undo.push([el, prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
      el.style.setProperty(prop, value, 'important');
    };

    const open = (el) => {
      force(el, 'height', 'auto');
      force(el, 'max-height', 'none');
      force(el, 'overflow', 'visible');
    };

    open(document.documentElement);
    open(document.body);

    let all = [];
    try {
      all = Array.from(document.body.querySelectorAll('*'));
    } catch (e) {}

    for (const el of all) {
      // Only elements that actually clip overflowing content need opening.
      if (el.scrollHeight - el.clientHeight <= 4) continue;
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'visible') continue;
      open(el);
    }

    return () => {
      for (const [el, prop, value, priority] of undo) {
        if (value) el.style.setProperty(prop, value, priority);
        else el.style.removeProperty(prop);
      }
    };
  }

  // Captures the current view (whatever tab/page is showing right now):
  // scrolls through it in viewport-sized chunks, screenshots each chunk and
  // stitches them into one full-page image, then reports it back.
  async function runOneCapture(label, isLastTab, tabIndex, tabTotal) {
    const jobId = globalThis.__AUTO_CAPTURE_JOB_ID__ || 0;

    // --- fixed/sticky overlay handling -------------------------------------
    // Hide fixed/sticky overlays so they are not repeated once per viewport
    // chunk. Detection is re-run on every scroll step (not just once at the
    // top), because some bars (e.g. a video player that only becomes sticky
    // once you scroll past it, or unsticks again further down) don't exist
    // yet - or have already stopped sticking - when the page is first measured.
    const currentlyHidden = new Set();

    const findOverlayElements = () => {
      const found = [];
      let all;
      try {
        all = document.body.querySelectorAll('*');
      } catch (e) {
        return found;
      }
      for (const el of all) {
        const style = window.getComputedStyle(el);
        const pos = style.position;
        if (pos !== 'fixed' && pos !== 'sticky') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        if (pos === 'fixed') {
          found.push(el);
          continue;
        }

        // position: sticky only needs hiding while it is actually pinned
        // (stuck) against the viewport edge it sticks to. Once it scrolls
        // past that point it becomes a normal, non-overlapping element and
        // should be captured in its natural resting spot.
        const stickyTop = parseFloat(style.top);
        const stickyBottom = parseFloat(style.bottom);
        const stuckTop = !Number.isNaN(stickyTop) && rect.top <= stickyTop + 2;
        const stuckBottom = !Number.isNaN(stickyBottom) && (window.innerHeight - rect.bottom) <= stickyBottom + 2;
        if (stuckTop || stuckBottom) found.push(el);
      }
      return found;
    };

    const syncOverlayHiding = () => {
      const overlaySet = new Set(findOverlayElements());

      for (const el of currentlyHidden) {
        if (!overlaySet.has(el)) {
          el.style.removeProperty('visibility');
          currentlyHidden.delete(el);
        }
      }
      for (const el of overlaySet) {
        if (!currentlyHidden.has(el)) {
          // setProperty(..., 'important') beats any !important visibility
          // rule the page's own stylesheet may declare - a plain
          // el.style.visibility assignment can silently lose that fight.
          el.style.setProperty('visibility', 'hidden', 'important');
          currentlyHidden.add(el);
        }
      }
    };

    const restoreAllOverlays = () => {
      for (const el of currentlyHidden) {
        el.style.removeProperty('visibility');
      }
      currentlyHidden.clear();
    };

    // --- prepare the page --------------------------------------------------
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    const originalScrollY = window.scrollY || 0;
    document.documentElement.style.scrollBehavior = 'auto';

    // Hide scrollbars for the duration of the capture so they aren't baked
    // into every stitched strip. Done with a stylesheet rather than
    // overflow:hidden (what the reference extension does) because
    // overflow:hidden also blocks the scrolling we depend on. Injected before
    // anything is measured, since removing the scrollbar changes clientWidth.
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.textContent =
      '::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}' +
      'html{scrollbar-width:none!important}';
    document.documentElement.appendChild(scrollbarStyle);

    const relockPage = unlockPageScrolling();
    await sleep(350); // let the unlocked layout reflow before measuring

    const dpr = window.devicePixelRatio || 1;
    const clientHeight = document.documentElement.clientHeight;
    const measureFullHeight = () => Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      clientHeight
    );

    // Re-measured on every step because lazy-loading / infinite-scroll pages
    // keep growing taller as you scroll, so a single upfront measurement goes
    // stale and cuts the capture short.
    let fullHeight = measureFullHeight();
    let maxScroll = Math.max(0, fullHeight - clientHeight);
    const MAX_CAPTURES = 60; // safety limit

    const captures = [];
    let currentScroll = 0;
    let lastScrollPos = -1;

    // --- scroll & shoot ---------------------------------------------------
    // Everything that mutates the page lives in this try, so the finally can
    // always put the layout back. Leaving a page unlocked would leave the
    // user staring at a visibly broken site until they reload it.
    try {
      for (let i = 0; i < MAX_CAPTURES; i++) {
        window.scrollTo(0, currentScroll);

        if (i > 0) syncOverlayHiding();

        // Chrome limits captureVisibleTab to 2 calls per second!
        // 1000ms guarantees we never exceed that, and also gives lazy-loaded
        // images/content time to render in before we shoot.
        await sleep(1000);

        const newFullHeight = measureFullHeight();
        if (newFullHeight !== fullHeight) {
          fullHeight = newFullHeight;
          maxScroll = Math.max(0, fullHeight - clientHeight);
        }

        const actualScroll = Math.round(window.scrollY || document.documentElement.scrollTop || 0);

        // If the view refused to move, we've reached the end (or it can't
        // scroll at all). Another shot would be a duplicate that the stitcher
        // discards, leaving blank filler in the output - so stop here.
        if (i > 0 && actualScroll === lastScrollPos) break;
        lastScrollPos = actualScroll;

        try {
          const response = await chrome.runtime.sendMessage({ action: "captureVisibleTab", jobId });
          if (response && response.dataUrl) {
            captures.push({
              dataUrl: response.dataUrl,
              y: actualScroll,
              viewportHeight: clientHeight
            });
          }
        } catch (err) {
          console.error("Failed to capture tab chunk:", err);
        }

        if (currentScroll >= maxScroll) break;
        currentScroll = Math.min(maxScroll, currentScroll + clientHeight);
      }
    } finally {
      restoreAllOverlays();
      relockPage();
      scrollbarStyle.remove();
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      window.scrollTo(0, originalScrollY);
    }

    if (captures.length === 0) {
      if (isLastTab) chrome.runtime.sendMessage({ action: "pageCaptureFailed", jobId });
      return;
    }

    // Size the canvas to what was actually captured, not to what the page
    // claimed to be tall - otherwise a page that stopped scrolling early
    // leaves a huge blank area at the bottom of the stitched image.
    const coveredHeight = captures.reduce(
      (max, c) => Math.max(max, (c.y || 0) + (c.viewportHeight || clientHeight)), 0);
    const finalHeight = Math.min(coveredHeight, Math.max(fullHeight, clientHeight));

    const stitchPayload = {
      jobId,
      captures,
      width: document.documentElement.clientWidth,
      height: finalHeight,
      viewportHeight: clientHeight,
      devicePixelRatio: dpr,
      label,
      isLastTab,
      tabIndex,
      tabTotal
    };

    try {
      const dataUrl = await stitchImages(stitchPayload);
      chrome.runtime.sendMessage({ action: "captureComplete", jobId, dataUrl, label, isLastTab, tabIndex, tabTotal });
    } catch (err) {
      console.error("Local stitching failed, falling back to offscreen:", err);
      chrome.runtime.sendMessage({
        action: "stitchCaptures",
        ...stitchPayload
      });
    }
  }

  async function stitchImages({ captures, width, height, viewportHeight, devicePixelRatio }) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));

    let drawnUntil = 0;
    for (const capture of captures) {
      const img = await loadImage(capture.dataUrl);
      const captureY = Math.max(0, Math.round(capture.y || 0));
      const captureHeight = capture.viewportHeight || viewportHeight || (img.height / devicePixelRatio);
      const sourceTop = Math.max(0, drawnUntil - captureY);
      const destinationY = captureY + sourceTop;
      const drawHeight = Math.min(captureHeight - sourceTop, height - destinationY);

      if (drawHeight <= 0) continue;

      ctx.drawImage(
        img,
        0,
        Math.floor(sourceTop * devicePixelRatio),
        img.width,
        Math.floor(drawHeight * devicePixelRatio),
        0,
        Math.floor(destinationY * devicePixelRatio),
        canvas.width,
        Math.floor(drawHeight * devicePixelRatio)
      );
      drawnUntil = Math.max(drawnUntil, destinationY + drawHeight);
    }

    return canvas.toDataURL(captures[0].dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
})();
