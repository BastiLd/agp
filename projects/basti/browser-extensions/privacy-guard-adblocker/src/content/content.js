(function initPrivacyGuardContent() {
  const constants = globalThis.PrivacyGuardConstants;
  if (!constants || window.__privacyGuardContentLoaded) {
    return;
  }
  window.__privacyGuardContentLoaded = true;

  const {
    TRACKER_SIGNATURES,
    COOKIE_REJECT_TEXT,
    COOKIE_ACCEPT_TEXT,
    I18N
  } = constants;

  const AD_SELECTORS = [
    "[id^='google_ads_']",
    "[id*='google_ads']",
    "[id*='div-gpt-ad']",
    "[id*='ad-slot']",
    "[class*='ad-slot']",
    "[class*='ad_container']",
    "[class*='ad-container']",
    "[data-ad]",
    "[data-ad-unit]",
    "[data-testid*='ad']",
    "iframe[src*='doubleclick.net']",
    "iframe[src*='googlesyndication.com']",
    "iframe[src*='adnxs.com']",
    "iframe[src*='taboola.com']",
    "iframe[src*='outbrain.com']",
    "ins.adsbygoogle"
  ];

  const COOKIE_DIALOG_SELECTORS = [
    "[id*='cookie' i]",
    "[class*='cookie' i]",
    "[id*='consent' i]",
    "[class*='consent' i]",
    "[aria-label*='cookie' i]",
    "[aria-label*='consent' i]",
    "[role='dialog']"
  ];

  let config = null;
  let detectionCache = new Set();
  let pendingEvents = [];
  let flushTimer = null;
  let observer = null;
  let lastCookieActionAt = 0;
  let scanCount = 0;
  let cosmeticRules = null;

  boot();

  async function boot() {
    config = await requestConfig();
    if (!config.enabled) {
      return;
    }
    cosmeticRules = await loadCosmeticRules();
    scanPage();
    observer = new MutationObserver(() => scheduleScan());
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  function scheduleScan() {
    if (scanCount > 200) {
      return;
    }
    window.clearTimeout(window.__privacyGuardScanTimer);
    window.__privacyGuardScanTimer = window.setTimeout(scanPage, 300);
  }

  function scanPage() {
    scanCount += 1;
    if (config.cosmeticEnabled && !isYouTubePage()) {
      hideAdElements();
      applyCosmeticRules();
    }
    detectTrackers();
    if (config.cookieHelperEnabled) {
      handleCookiePrompts();
    }
    maybeShowPageWarning();
  }

  async function requestConfig() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_CONTENT_CONFIG",
        url: location.href
      });
      return response?.ok ? response : { enabled: false };
    } catch {
      return { enabled: false };
    }
  }

  function hideAdElements() {
    for (const selector of AD_SELECTORS) {
      for (const node of document.querySelectorAll(selector)) {
        if (node instanceof HTMLElement && !node.classList.contains("pg-hidden")) {
          node.classList.add("pg-hidden");
          queueEvent({
            category: "ads",
            label: "Ad element hidden",
            source: selector,
            selector,
            blocked: true
          });
        }
      }
    }
  }

  function applyCosmeticRules() {
    const rules = getCosmeticSelectorsForHost(location.hostname);
    if (!rules.length) {
      return;
    }
    const exceptions = getCosmeticExceptionsForHost(location.hostname);
    for (const selector of rules) {
      if (!isSafeSelector(selector)) {
        continue;
      }
      let nodes = [];
      try {
        nodes = document.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || node.classList.contains("pg-hidden") || matchesAny(node, exceptions)) {
          continue;
        }
        if (!canHideElement(node)) {
          continue;
        }
        node.classList.add("pg-hidden");
        queueEvent({
          category: "ads",
          label: "Cosmetic rule hidden",
          source: location.hostname,
          selector,
          rulesetId: "cosmetic",
          blocked: true
        });
      }
    }
  }

  function detectTrackers() {
    const nodes = document.querySelectorAll("script[src], iframe[src], img[src], source[src], link[href]");
    for (const node of nodes) {
      const source = node.getAttribute("src") || node.getAttribute("href") || "";
      if (!source || detectionCache.has(source)) {
        continue;
      }
      const lowerSource = source.toLowerCase();
      for (const signature of TRACKER_SIGNATURES) {
        const matchedDomain = signature.domains.find((domain) => lowerSource.includes(domain));
        if (matchedDomain) {
          detectionCache.add(source);
          queueEvent({
            category: signature.category,
            label: signature.label,
            source: matchedDomain,
            blocked: node.classList?.contains("pg-hidden") || false
          });
          break;
        }
      }
    }
  }

  function handleCookiePrompts() {
    if (Date.now() - lastCookieActionAt < 2500) {
      return;
    }
    const mode = config.settings?.cookieMode || "rejectPreferred";
    if (mode === "detectOnly") {
      const prompt = findVisibleCookiePrompt();
      if (prompt) {
        reportCookie("detected", "detect-only");
      }
      return;
    }

    const providerAction = runCmpProvider();
    if (providerAction === "handled") {
      return;
    }

    const prompt = findVisibleCookiePrompt();
    if (!prompt || prompt.dataset.pgCookieHandled === "1") {
      return;
    }
    const button = findRejectButton(prompt, mode === "aggressive");
    if (!button) {
      reportCookie("detected", "no-safe-reject");
      prompt.dataset.pgCookieHandled = "1";
      return;
    }
    button.click();
    prompt.dataset.pgCookieHandled = "1";
    lastCookieActionAt = Date.now();
    reportCookie("rejected", button.textContent || button.getAttribute("aria-label") || "reject");
  }

  function runCmpProvider() {
    const providers = [
      {
        name: "OneTrust",
        root: "#onetrust-consent-sdk, #onetrust-banner-sdk",
        reject: "#onetrust-reject-all-handler, button[id*='reject-all' i]"
      },
      {
        name: "Usercentrics",
        root: "#usercentrics-root, [data-testid='uc-app-container'], [id*='usercentrics' i]",
        reject: "[data-testid='uc-deny-all-button'], [data-testid='uc-reject-all-button'], button[id*='deny' i], button[id*='reject' i]"
      },
      {
        name: "Didomi",
        root: "#didomi-host, .didomi-popup-container",
        reject: "#didomi-notice-disagree-button, button[class*='disagree' i]"
      },
      {
        name: "Cookiebot",
        root: "#CybotCookiebotDialog",
        reject: "#CybotCookiebotDialogBodyButtonDecline, button[id*='Decline' i]"
      },
      {
        name: "Quantcast",
        root: "#qc-cmp2-container, .qc-cmp2-container",
        reject: "button[mode='secondary'], button[aria-label*='reject' i], button[class*='reject' i]"
      }
    ];
    for (const provider of providers) {
      const root = document.querySelector(provider.root);
      if (!(root instanceof HTMLElement) || !isVisible(root)) {
        continue;
      }
      if (root.dataset.pgCmpHandled === "1") {
        return "detected";
      }
      const button = [...root.querySelectorAll(provider.reject)]
        .find((candidate) => candidate instanceof HTMLElement && isVisible(candidate) && !isAcceptButton(candidate));
      if (button) {
        root.dataset.pgCmpHandled = "1";
        button.click();
        reportCookie("rejected", `${provider.name}: ${button.textContent || button.getAttribute("aria-label") || "reject"}`);
        return "handled";
      }
      root.dataset.pgCmpHandled = "1";
      reportCookie("detected", `${provider.name}: no-safe-reject`);
      return "detected";
    }
    return "";
  }

  function findVisibleCookiePrompt() {
    const candidates = [];
    for (const selector of COOKIE_DIALOG_SELECTORS) {
      candidates.push(...document.querySelectorAll(selector));
    }
    return candidates.find((node) => {
      if (!(node instanceof HTMLElement) || !isVisible(node)) {
        return false;
      }
      const text = compactText(node);
      if (text.length < 12 || text.length > 6000) {
        return false;
      }
      return text.includes("cookie") ||
        text.includes("cookies") ||
        text.includes("consent") ||
        text.includes("datenschutz") ||
        text.includes("privacy") ||
        text.includes("tracking");
    });
  }

  function findRejectButton(prompt, aggressive) {
    const controls = [...prompt.querySelectorAll("button, [role='button'], input[type='button'], input[type='submit'], a")];
    const scored = controls
      .filter((control) => control instanceof HTMLElement && isVisible(control))
      .map((control) => ({ control, text: compactText(control) || compactTextFromValue(control) }))
      .filter((entry) => entry.text)
      .map((entry) => ({
        ...entry,
        rejectScore: scoreRejectText(entry.text, aggressive),
        acceptScore: scoreAcceptText(entry.text)
      }))
      .filter((entry) => entry.rejectScore > 0 && entry.rejectScore >= entry.acceptScore)
      .map((entry) => ({ ...entry, score: entry.rejectScore }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.control || null;
  }

  function scoreRejectText(text, aggressive) {
    let score = 0;
    for (const rejectText of COOKIE_REJECT_TEXT) {
      if (text === rejectText) {
        score = Math.max(score, 100);
      } else if (text.includes(rejectText)) {
        score = Math.max(score, 70);
      }
    }
    if (aggressive && /settings|preferences|anpassen|auswahl|manage/.test(text)) {
      score = Math.max(score, 15);
    }
    return score;
  }

  function scoreAcceptText(text) {
    let score = 0;
    for (const acceptText of COOKIE_ACCEPT_TEXT) {
      if (text === acceptText) {
        score = Math.max(score, 100);
      } else if (text.includes(acceptText)) {
        score = Math.max(score, 40);
      }
    }
    return score;
  }

  function isAcceptButton(node) {
    const text = compactText(node) || compactTextFromValue(node);
    return COOKIE_ACCEPT_TEXT.some((acceptText) => text === acceptText || text.includes(acceptText));
  }

  function maybeShowPageWarning() {
    const settings = config.settings || {};
    if (!settings.pageWarnings || document.querySelector(".pg-page-warning")) {
      return;
    }
    const highRiskCount = [...detectionCache].length;
    if (highRiskCount < 4) {
      return;
    }
    const lang = settings.language === "en" ? "en" : "de";
    const copy = I18N[lang];
    const warning = document.createElement("div");
    warning.className = "pg-page-warning";
    warning.innerHTML = `<strong>${escapeHtml(copy.pageWarningTitle)}</strong><div>${escapeHtml(copy.pageWarningBody)}</div>`;
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = copy.dismiss;
    close.addEventListener("click", () => warning.remove());
    warning.append(close);
    document.documentElement.append(warning);
  }

  function queueEvent(event) {
    pendingEvents.push(event);
    if (flushTimer) {
      return;
    }
    flushTimer = window.setTimeout(flushEvents, 800);
  }

  async function flushEvents() {
    const events = pendingEvents.splice(0, pendingEvents.length);
    flushTimer = null;
    if (!events.length) {
      return;
    }
    try {
      await chrome.runtime.sendMessage({
        type: "CONTENT_DETECTION",
        url: location.href,
        events
      });
    } catch {
      // The background worker can be unavailable during extension reloads.
    }
  }

  async function reportCookie(status, label) {
    try {
      await chrome.runtime.sendMessage({
        type: "COOKIE_ACTION",
        url: location.href,
        status,
        label
      });
    } catch {
      // Ignore transient extension reload errors.
    }
  }

  function isVisible(node) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 8 &&
      rect.height > 8 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity || 1) > 0.05;
  }

  function compactText(node) {
    return (node.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function compactTextFromValue(node) {
    return String(node.value || node.getAttribute("aria-label") || node.getAttribute("title") || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  async function loadCosmeticRules() {
    const [index, exceptions] = await Promise.all([
      readExtensionJson("cosmetic/cosmetic-index.json", {}),
      readExtensionJson("cosmetic/cosmetic-exceptions.json", {})
    ]);
    return { index, exceptions };
  }

  async function readExtensionJson(path, fallback) {
    try {
      const response = await fetch(chrome.runtime.getURL(path), { cache: "no-store" });
      return response.ok ? response.json() : fallback;
    } catch {
      return fallback;
    }
  }

  function getCosmeticSelectorsForHost(hostname) {
    return getCosmeticValues(cosmeticRules?.index || {}, hostname);
  }

  function getCosmeticExceptionsForHost(hostname) {
    return getCosmeticValues(cosmeticRules?.exceptions || {}, hostname);
  }

  function getCosmeticValues(index, hostname) {
    const host = hostname.replace(/^www\./, "").toLowerCase();
    const values = [];
    for (const [domain, selectors] of Object.entries(index)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        values.push(...selectors);
      }
    }
    return [...new Set(values)];
  }

  function isSafeSelector(selector) {
    if (!selector || selector.length > 220 || /:-abp-|:has|:contains|xpath|script|style/i.test(selector)) {
      return false;
    }
    return !/^(html|body|main|form|button|input|#app|#root|\[role=['"]?main['"]?\])$/i.test(selector.trim());
  }

  function canHideElement(node) {
    const deniedTags = new Set(["HTML", "BODY", "MAIN", "FORM", "INPUT", "BUTTON"]);
    if (deniedTags.has(node.tagName)) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    const nodeArea = rect.width * rect.height;
    return nodeArea / viewportArea < 0.6;
  }

  function matchesAny(node, selectors) {
    return selectors.some((selector) => {
      try {
        return node.matches(selector) || Boolean(node.closest(selector));
      } catch {
        return false;
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function isYouTubePage() {
    return location.hostname === "youtube.com" ||
      location.hostname.endsWith(".youtube.com") ||
      location.hostname === "youtu.be";
  }
})();
