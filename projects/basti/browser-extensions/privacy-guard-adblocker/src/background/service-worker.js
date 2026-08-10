importScripts("../common/constants.js");

const {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_SITE_RULES,
  RULESET_DEFINITIONS,
  RESOURCE_TYPES,
  I18N
} = globalThis.PrivacyGuardConstants;

const SESSION_RULE_ID_START = 5000000;
const USER_BLOCK_RULE_ID_START = 4000000;
const REMOTE_RULE_ID_START = 4100000;
const MAX_REMOTE_RULES = 5000;
const MAX_EVENTS_PER_HOST = 40;
const MAX_DEBUG_EVENTS = 150;
const RULESET_CATEGORIES = {
  ads_static: "ads",
  privacy_static: "privacy",
  regional_de_static: "regional",
  cookies_static: "consent",
  youtube_static: "youtube",
  annoyances_static: "annoyance",
  security_static: "security",
  url_tracking_static: "url_tracking",
  security_plus_static: "security",
  _dynamic: "dynamic",
  _session: "session"
};

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await refreshRuntimeRules();
  await scheduleRemoteUpdates();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await refreshRuntimeRules();
  await scheduleRemoteUpdates();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "remoteRulesUpdate") {
    updateRemoteRules().catch((error) => console.warn("Remote rules update failed", error));
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadgeForTab(tabId).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateBadgeForTab(tabId).catch(() => {});
  }
});

if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    recordRuleMatch(info).catch(() => {});
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.warn("Privacy Guard message error", error);
      sendResponse({ ok: false, error: error.message || String(error) });
    });
  return true;
});

async function handleMessage(message, sender) {
  if (!message || typeof message.type !== "string") {
    return { ok: false, error: "Invalid message" };
  }

  switch (message.type) {
    case "GET_CONTENT_CONFIG":
      return getContentConfig(message.url || sender.tab?.url || "");
    case "CONTENT_DETECTION":
      await recordContentDetections(message.url || sender.tab?.url || "", message.events || []);
      if (sender.tab?.id) {
        await updateBadgeForTab(sender.tab.id);
      }
      return { ok: true };
    case "COOKIE_ACTION":
      await recordCookieAction(message.url || sender.tab?.url || "", message.status, message.label);
      if (sender.tab?.id) {
        await updateBadgeForTab(sender.tab.id);
      }
      return { ok: true };
    case "GET_POPUP_DATA":
      return getPopupData(message.tabId, message.url);
    case "SET_SITE_ENABLED":
      return setSiteEnabled(message.url, Boolean(message.enabled));
    case "SAVE_SETTINGS":
      return saveSettings(message.settings || {});
    case "SAVE_SITE_RULES":
      return saveSiteRules(message.siteRules || {});
    case "GET_OPTIONS_DATA":
      return getOptionsData();
    case "GET_RULESET_STATUS":
      return getRulesetStatus();
    case "SET_RULESET_ENABLED":
      return setRulesetEnabled(message.rulesetId, Boolean(message.enabled));
    case "SET_SITE_PROTECTION_SCOPE":
      return setSiteProtectionScope(message.url, message.scope || {});
    case "GET_DEBUG_MATCHES":
      return getDebugMatches(message.tabId, message.url);
    case "RUN_LIST_UPDATE":
      return updateRemoteRules();
    case "CLEAR_SITE_DEBUG":
      return clearSiteDebug(message.url);
    case "RUN_REMOTE_UPDATE":
      return updateRemoteRules();
    case "CLEAR_STATS":
      await chrome.storage.local.set({ [STORAGE_KEYS.stats]: {} });
      await updateAllBadges();
      return { ok: true };
    default:
      return { ok: false, error: `Unknown message type: ${message.type}` };
  }
}

async function ensureDefaults() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.settings,
    STORAGE_KEYS.siteRules,
    STORAGE_KEYS.stats,
    STORAGE_KEYS.remote,
    STORAGE_KEYS.rulesetMeta,
    STORAGE_KEYS.debug
  ]);
  const settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.settings] || {}) });
  const siteRules = normalizeSiteRules({ ...DEFAULT_SITE_RULES, ...(data[STORAGE_KEYS.siteRules] || {}) });
  const stats = data[STORAGE_KEYS.stats] || {};
  const remote = data[STORAGE_KEYS.remote] || { lastStatus: "never", ruleCount: 0 };
  const debug = Array.isArray(data[STORAGE_KEYS.debug]) ? data[STORAGE_KEYS.debug] : [];
  const rulesetMeta = await loadBundledRulesetMeta(data[STORAGE_KEYS.rulesetMeta] || {});
  await chrome.storage.local.set({
    [STORAGE_KEYS.settings]: settings,
    [STORAGE_KEYS.siteRules]: siteRules,
    [STORAGE_KEYS.stats]: stats,
    [STORAGE_KEYS.remote]: remote,
    [STORAGE_KEYS.rulesetMeta]: rulesetMeta,
    [STORAGE_KEYS.debug]: debug.slice(0, MAX_DEBUG_EVENTS)
  });
  await applyRulesetDefaults(settings);
}

async function getOptionsData() {
  await ensureDefaults();
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.settings,
    STORAGE_KEYS.siteRules,
    STORAGE_KEYS.stats,
    STORAGE_KEYS.remote,
    STORAGE_KEYS.rulesetMeta,
    STORAGE_KEYS.debug
  ]);
  const rulesetStatus = await getRulesetStatus();
  return {
    ok: true,
    settings: data[STORAGE_KEYS.settings],
    siteRules: data[STORAGE_KEYS.siteRules],
    stats: data[STORAGE_KEYS.stats],
    remote: data[STORAGE_KEYS.remote],
    rulesetMeta: data[STORAGE_KEYS.rulesetMeta],
    debug: data[STORAGE_KEYS.debug],
    rulesetStatus,
    limits: {
      maxRemoteRules: MAX_REMOTE_RULES
    }
  };
}

async function getContentConfig(url) {
  await ensureDefaults();
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.siteRules]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const siteRules = data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES;
  const host = getHost(url);
  const scope = getHostScope(host, siteRules, settings);
  return {
    ok: true,
    enabled: scope.networkEnabled || scope.cosmeticEnabled || scope.cookieHelperEnabled,
    networkEnabled: scope.networkEnabled,
    cosmeticEnabled: scope.cosmeticEnabled,
    cookieHelperEnabled: scope.cookieHelperEnabled,
    host,
    settings,
    language: settings.language in I18N ? settings.language : "de"
  };
}

async function getPopupData(tabId, url) {
  await ensureDefaults();
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.settings,
    STORAGE_KEYS.siteRules,
    STORAGE_KEYS.stats,
    STORAGE_KEYS.remote,
    STORAGE_KEYS.debug
  ]);
  const host = getHost(url);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const siteRules = data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES;
  const stats = data[STORAGE_KEYS.stats] || {};
  const hostStats = stats[host] || createEmptyHostStats(host);
  const scope = getHostScope(host, siteRules, settings);
  const enabled = scope.networkEnabled || scope.cosmeticEnabled || scope.cookieHelperEnabled;
  if (tabId) {
    await updateBadge(tabId, hostStats, enabled, settings);
  }
  return {
    ok: true,
    host,
    enabled,
    scope,
    settings,
    siteRules,
    stats: hostStats,
    remote: data[STORAGE_KEYS.remote] || {},
    debug: getDebugForHost(data[STORAGE_KEYS.debug] || [], host).slice(0, 12),
    rulesetStatus: await getRulesetStatus()
  };
}

async function setSiteEnabled(url, enabled) {
  const host = getHost(url);
  if (!host) {
    return { ok: false, error: "Missing host" };
  }
  const data = await chrome.storage.local.get([STORAGE_KEYS.siteRules]);
  const siteRules = normalizeSiteRules(data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES);
  const disabled = new Set(siteRules.disabledHosts);
  const scopedHosts = { ...siteRules.scopedHosts };
  if (enabled) {
    disabled.delete(host);
    scopedHosts[host] = {
      ...(scopedHosts[host] || {}),
      networkEnabled: true,
      cosmeticEnabled: true,
      cookieHelperEnabled: true
    };
  } else {
    disabled.add(host);
    scopedHosts[host] = {
      ...(scopedHosts[host] || {}),
      networkEnabled: false,
      cosmeticEnabled: false,
      cookieHelperEnabled: false
    };
  }
  siteRules.disabledHosts = [...disabled].sort();
  siteRules.scopedHosts = scopedHosts;
  await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: siteRules });
  await refreshRuntimeRules();
  await updateAllBadges();
  return { ok: true, host, enabled };
}

async function saveSettings(partialSettings) {
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings]);
  const settings = sanitizeSettings({ ...(data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS), ...partialSettings });
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  await scheduleRemoteUpdates();
  await applyRulesetDefaults(settings);
  await refreshRuntimeRules();
  await updateAllBadges();
  return { ok: true, settings };
}

async function saveSiteRules(input) {
  const siteRules = normalizeSiteRules(input);
  await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: siteRules });
  await refreshRuntimeRules();
  await updateAllBadges();
  return { ok: true, siteRules };
}

async function setSiteProtectionScope(url, partialScope) {
  const host = getHost(url);
  if (!host) {
    return { ok: false, error: "Missing host" };
  }
  const data = await chrome.storage.local.get([STORAGE_KEYS.siteRules]);
  const siteRules = normalizeSiteRules(data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES);
  const current = siteRules.scopedHosts[host] || {};
  siteRules.scopedHosts[host] = {
    networkEnabled: partialScope.networkEnabled !== undefined ? Boolean(partialScope.networkEnabled) : current.networkEnabled !== false,
    cosmeticEnabled: partialScope.cosmeticEnabled !== undefined ? Boolean(partialScope.cosmeticEnabled) : current.cosmeticEnabled !== false,
    cookieHelperEnabled: partialScope.cookieHelperEnabled !== undefined ? Boolean(partialScope.cookieHelperEnabled) : current.cookieHelperEnabled !== false,
    temporaryUntil: Number(partialScope.temporaryUntil || current.temporaryUntil || 0)
  };
  if (Object.values(siteRules.scopedHosts[host]).slice(0, 3).every((value) => value === false)) {
    siteRules.disabledHosts = [...new Set([...siteRules.disabledHosts, host])].sort();
  } else {
    siteRules.disabledHosts = siteRules.disabledHosts.filter((entry) => entry !== host);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: siteRules });
  await refreshRuntimeRules();
  await updateAllBadges();
  return { ok: true, host, scope: siteRules.scopedHosts[host] };
}

async function getRulesetStatus() {
  await ensureRulesetMetaOnly();
  const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
  const availableStaticRuleCount = await chrome.declarativeNetRequest.getAvailableStaticRuleCount().catch(() => null);
  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
  const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
  const data = await chrome.storage.local.get([STORAGE_KEYS.rulesetMeta, STORAGE_KEYS.settings]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const meta = data[STORAGE_KEYS.rulesetMeta] || {};
  return {
    ok: true,
    availableStaticRuleCount,
    dynamicRuleCount: dynamicRules.length,
    sessionRuleCount: sessionRules.length,
    rulesets: RULESET_DEFINITIONS.map((definition) => ({
      ...definition,
      enabled: enabledRulesets.includes(definition.id),
      defaultEnabled: settings.rulesetDefaults?.[definition.id] ?? definition.defaultEnabled,
      meta: meta[definition.id] || {}
    }))
  };
}

async function setRulesetEnabled(rulesetId, enabled) {
  if (!RULESET_DEFINITIONS.some((definition) => definition.id === rulesetId)) {
    return { ok: false, error: "Unknown ruleset" };
  }
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabled ? [rulesetId] : [],
    disableRulesetIds: enabled ? [] : [rulesetId]
  });
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings]);
  const settings = sanitizeSettings(data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS);
  settings.rulesetDefaults = { ...settings.rulesetDefaults, [rulesetId]: enabled };
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return getRulesetStatus();
}

async function applyRulesetDefaults(settings) {
  const enableRulesetIds = [];
  const disableRulesetIds = [];
  for (const definition of RULESET_DEFINITIONS) {
    const enabled = settings.rulesetDefaults?.[definition.id] ?? definition.defaultEnabled;
    if (enabled) {
      enableRulesetIds.push(definition.id);
    } else {
      disableRulesetIds.push(definition.id);
    }
  }
  await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds, disableRulesetIds });
}

async function ensureRulesetMetaOnly() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.rulesetMeta]);
  if (!data[STORAGE_KEYS.rulesetMeta]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.rulesetMeta]: await loadBundledRulesetMeta({}) });
  }
}

async function loadBundledRulesetMeta(existingMeta) {
  const meta = { ...existingMeta };
  const generatedMeta = await readExtensionJson("metadata/ruleset-meta.json", {});
  for (const definition of RULESET_DEFINITIONS) {
    const ruleset = await readExtensionJson(`rules/${definition.id}.json`, []);
    const generated = generatedMeta[definition.id] || {};
    meta[definition.id] = {
      name: definition.name,
      category: definition.category,
      source: generated.source || definition.source,
      idStart: definition.idStart,
      ruleCount: Array.isArray(ruleset) ? ruleset.length : 0,
      generatedAt: generated.generatedAt || meta[definition.id]?.generatedAt || "",
      sha256: generated.sha256 || meta[definition.id]?.sha256 || "",
      lastError: meta[definition.id]?.lastError || ""
    };
  }
  return meta;
}

async function readExtensionJson(path, fallback) {
  try {
    const response = await fetch(chrome.runtime.getURL(path), { cache: "no-store" });
    return response.ok ? response.json() : fallback;
  } catch {
    return fallback;
  }
}

async function refreshRuntimeRules() {
  await updateNetworkPauseSessionRules();
  await updateUserBlockRules();
}

async function updateNetworkPauseSessionRules() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.siteRules]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const siteRules = normalizeSiteRules(data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES);
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  const removeRuleIds = existing
    .map((rule) => rule.id)
    .filter((id) => id >= SESSION_RULE_ID_START);
  const pausedHosts = getNetworkPausedHosts(siteRules, settings).slice(0, 1000);
  const addRules = settings.protectionEnabled
    ? pausedHosts.map((host, index) => ({
        id: SESSION_RULE_ID_START + index,
        priority: 10000,
        action: { type: "allowAllRequests" },
        condition: {
          requestDomains: [host],
          resourceTypes: ["main_frame", "sub_frame"]
        }
      }))
    : [];
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
}

async function updateUserBlockRules() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.siteRules]);
  const siteRules = normalizeSiteRules(data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing
    .map((rule) => rule.id)
    .filter((id) => id >= USER_BLOCK_RULE_ID_START && id < REMOTE_RULE_ID_START);
  const addRules = siteRules.blockedHosts.slice(0, 1000).map((host, index) => ({
    id: USER_BLOCK_RULE_ID_START + index,
    priority: 9000,
    action: { type: "block" },
    condition: {
      requestDomains: [host],
      resourceTypes: RESOURCE_TYPES.filter((type) => type !== "main_frame")
    }
  }));
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

async function updateRemoteRules() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.remote]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const remoteState = data[STORAGE_KEYS.remote] || {};
  if (!settings.remoteRulesEnabled || !settings.remoteRulesUrl) {
    const nextState = {
      ...remoteState,
      lastStatus: "missing-url",
      lastError: "",
      lastChecked: Date.now()
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.remote]: nextState });
    return { ok: false, status: "missing-url" };
  }

  try {
    const response = await fetch(settings.remoteRulesUrl, {
      cache: "no-store",
      credentials: "omit"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const sourceRules = Array.isArray(payload) ? payload : payload.rules;
    if (!Array.isArray(sourceRules)) {
      throw new Error("Remote payload must be an array or { rules: [] }");
    }
    const addRules = sourceRules
      .slice(0, MAX_REMOTE_RULES)
      .map((rule, index) => sanitizeRemoteRule(rule, REMOTE_RULE_ID_START + index))
      .filter(Boolean);
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing
      .map((rule) => rule.id)
      .filter((id) => id >= REMOTE_RULE_ID_START);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
    const nextSettings = { ...settings, lastRemoteUpdate: Date.now() };
    const nextState = {
      lastStatus: "ok",
      lastError: "",
      lastChecked: Date.now(),
      ruleCount: addRules.length
    };
    await chrome.storage.local.set({
      [STORAGE_KEYS.settings]: nextSettings,
      [STORAGE_KEYS.remote]: nextState
    });
    return { ok: true, status: "ok", ruleCount: addRules.length };
  } catch (error) {
    const nextState = {
      ...remoteState,
      lastStatus: "failed",
      lastError: error.message || String(error),
      lastChecked: Date.now()
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.remote]: nextState });
    return { ok: false, status: "failed", error: nextState.lastError };
  }
}

function sanitizeRemoteRule(rule, id) {
  if (!rule || typeof rule !== "object") {
    return null;
  }
  const actionType = rule.action?.type;
  if (actionType !== "block" && actionType !== "upgradeScheme") {
    return null;
  }
  const condition = rule.condition || {};
  const cleanCondition = {};
  if (typeof condition.urlFilter === "string" && condition.urlFilter.length <= 1024) {
    cleanCondition.urlFilter = condition.urlFilter;
  }
  if (typeof condition.regexFilter === "string" && condition.regexFilter.length <= 512) {
    cleanCondition.regexFilter = condition.regexFilter;
  }
  if (Array.isArray(condition.requestDomains)) {
    cleanCondition.requestDomains = normalizeHosts(condition.requestDomains).slice(0, 100);
  }
  if (Array.isArray(condition.excludedRequestDomains)) {
    cleanCondition.excludedRequestDomains = normalizeHosts(condition.excludedRequestDomains).slice(0, 100);
  }
  if (Array.isArray(condition.initiatorDomains)) {
    cleanCondition.initiatorDomains = normalizeHosts(condition.initiatorDomains).slice(0, 100);
  }
  if (Array.isArray(condition.resourceTypes)) {
    cleanCondition.resourceTypes = condition.resourceTypes.filter((type) => RESOURCE_TYPES.includes(type));
  }
  if (!cleanCondition.urlFilter && !cleanCondition.regexFilter && !cleanCondition.requestDomains) {
    return null;
  }
  if (!cleanCondition.resourceTypes?.length) {
    cleanCondition.resourceTypes = RESOURCE_TYPES.filter((type) => type !== "main_frame");
  }
  return {
    id,
    priority: Number.isInteger(rule.priority) ? Math.max(1, Math.min(rule.priority, 10000)) : 1,
    action: { type: actionType },
    condition: cleanCondition
  };
}

async function scheduleRemoteUpdates() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  await chrome.alarms.clear("remoteRulesUpdate");
  if (settings.remoteRulesEnabled) {
    chrome.alarms.create("remoteRulesUpdate", {
      periodInMinutes: Math.max(60, Number(settings.remoteUpdateIntervalHours || 24) * 60)
    });
  }
}

async function recordRuleMatch(info) {
  const url = info.request?.initiator || info.request?.documentUrl || info.request?.url || "";
  const host = getHost(url);
  if (!host) {
    return;
  }
  const rulesetId = info.rule?.rulesetId || "_dynamic";
  const category = RULESET_CATEGORIES[rulesetId] || "blocked";
  await addHostEvent(host, {
    category,
    label: `${category} rule`,
    source: getHost(info.request?.url || ""),
    rulesetId,
    ruleId: info.rule?.ruleId || info.rule?.id || 0,
    blocked: true,
    at: Date.now()
  });
}

async function recordContentDetections(url, events) {
  const host = getHost(url);
  if (!host || !Array.isArray(events) || !events.length) {
    return;
  }
  const safeEvents = events.slice(0, 20).map((event) => ({
    category: safeCategory(event.category),
    label: String(event.label || event.category || "tracker").slice(0, 80),
    source: String(event.source || "").slice(0, 120),
    selector: String(event.selector || "").slice(0, 180),
    rulesetId: String(event.rulesetId || "").slice(0, 80),
    ruleId: Number(event.ruleId || 0),
    blocked: Boolean(event.blocked),
    at: Date.now()
  }));
  await addHostEvents(host, safeEvents);
}

async function recordCookieAction(url, status, label) {
  const host = getHost(url);
  if (!host) {
    return;
  }
  await addHostEvent(host, {
    category: "consent",
    label: status === "rejected" ? "Cookie prompt rejected" : "Cookie prompt detected",
    source: String(label || "").slice(0, 120),
    blocked: status === "rejected",
    at: Date.now()
  });
}

async function addHostEvent(host, event) {
  await addHostEvents(host, [event]);
}

async function addHostEvents(host, events) {
  const data = await chrome.storage.local.get([STORAGE_KEYS.stats]);
  const stats = data[STORAGE_KEYS.stats] || {};
  const hostStats = stats[host] || createEmptyHostStats(host);
  for (const event of events) {
    const category = safeCategory(event.category);
    hostStats.total += 1;
    hostStats.categories[category] = (hostStats.categories[category] || 0) + 1;
    hostStats.lastEvents.unshift({
      category,
      label: event.label,
      source: event.source,
      selector: event.selector || "",
      rulesetId: event.rulesetId || "",
      ruleId: event.ruleId || 0,
      blocked: Boolean(event.blocked),
      at: event.at || Date.now()
    });
    await addDebugEvent(host, { ...event, category });
  }
  hostStats.lastEvents = hostStats.lastEvents.slice(0, MAX_EVENTS_PER_HOST);
  hostStats.updatedAt = Date.now();
  stats[host] = hostStats;
  await chrome.storage.local.set({ [STORAGE_KEYS.stats]: stats });
}

function createEmptyHostStats(host) {
  return {
    host,
    total: 0,
    categories: {
      ads: 0,
      privacy: 0,
      analytics: 0,
      fingerprinting: 0,
      social: 0,
      consent: 0,
      annoyance: 0,
      youtube: 0,
      regional: 0,
      url_tracking: 0,
      security: 0,
      dynamic: 0,
      blocked: 0
    },
    lastEvents: [],
    updatedAt: 0
  };
}

async function updateAllBadges() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => updateBadgeForTab(tab.id).catch(() => {})));
}

async function updateBadgeForTab(tabId) {
  if (!tabId) {
    return;
  }
  const tab = await chrome.tabs.get(tabId);
  const host = getHost(tab.url || "");
  const data = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.siteRules, STORAGE_KEYS.stats]);
  const settings = data[STORAGE_KEYS.settings] || DEFAULT_SETTINGS;
  const siteRules = data[STORAGE_KEYS.siteRules] || DEFAULT_SITE_RULES;
  const hostStats = (data[STORAGE_KEYS.stats] || {})[host] || createEmptyHostStats(host);
  const scope = getHostScope(host, siteRules, settings);
  const enabled = scope.networkEnabled || scope.cosmeticEnabled || scope.cookieHelperEnabled;
  await updateBadge(tabId, hostStats, enabled, settings);
}

async function updateBadge(tabId, hostStats, enabled, settings) {
  if (!settings.badgeEnabled) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  await chrome.action.setBadgeBackgroundColor({ tabId, color: enabled ? "#176b5b" : "#69707d" });
  if (!enabled) {
    await chrome.action.setBadgeText({ tabId, text: "off" });
    return;
  }
  const count = Number(hostStats?.total || 0);
  await chrome.action.setBadgeText({ tabId, text: count ? String(Math.min(count, 999)) : "" });
}

function sanitizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    language: settings.language === "en" ? "en" : "de",
    cookieMode: ["rejectPreferred", "aggressive", "detectOnly"].includes(settings.cookieMode)
      ? settings.cookieMode
      : "rejectPreferred",
    networkDefaultEnabled: settings.networkDefaultEnabled !== false,
    cosmeticDefaultEnabled: settings.cosmeticDefaultEnabled !== false,
    cookieHelperDefaultEnabled: settings.cookieHelperDefaultEnabled !== false,
    rulesetDefaults: {
      ...DEFAULT_SETTINGS.rulesetDefaults,
      ...(settings.rulesetDefaults || {})
    },
    remoteUpdateIntervalHours: Math.max(1, Math.min(168, Number(settings.remoteUpdateIntervalHours || 24))),
    remoteRulesUrl: String(settings.remoteRulesUrl || "").trim(),
    protectionEnabled: Boolean(settings.protectionEnabled),
    pageWarnings: Boolean(settings.pageWarnings),
    badgeEnabled: Boolean(settings.badgeEnabled),
    remoteRulesEnabled: Boolean(settings.remoteRulesEnabled)
  };
}

function normalizeSiteRules(siteRules) {
  const scopedHosts = {};
  for (const [host, scope] of Object.entries(siteRules?.scopedHosts || {})) {
    const normalizedHost = normalizeHosts([host])[0];
    if (!normalizedHost) {
      continue;
    }
    scopedHosts[normalizedHost] = {
      networkEnabled: scope.networkEnabled !== false,
      cosmeticEnabled: scope.cosmeticEnabled !== false,
      cookieHelperEnabled: scope.cookieHelperEnabled !== false,
      temporaryUntil: Number(scope.temporaryUntil || 0)
    };
  }
  return {
    disabledHosts: normalizeHosts(siteRules?.disabledHosts || []),
    blockedHosts: normalizeHosts(siteRules?.blockedHosts || []),
    scopedHosts
  };
}

function normalizeHosts(hosts) {
  return [...new Set(
    hosts
      .map((host) => String(host || "").trim().toLowerCase())
      .map((host) => host.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .map((host) => host.replace(/^\*\./, ""))
      .filter((host) => /^[a-z0-9.-]+$/.test(host) && host.includes("."))
  )].sort();
}

function getHostScope(host, siteRules, settings) {
  const normalizedRules = normalizeSiteRules(siteRules || DEFAULT_SITE_RULES);
  const scoped = normalizedRules.scopedHosts?.[host] || {};
  const globallyEnabled = Boolean(settings?.protectionEnabled);
  const legacyDisabled = isHostListed(host, normalizedRules.disabledHosts);
  const temporaryActive = Number(scoped.temporaryUntil || 0) > Date.now();
  const paused = legacyDisabled || temporaryActive;
  return {
    networkEnabled: globallyEnabled && !paused && settings.networkDefaultEnabled !== false && scoped.networkEnabled !== false,
    cosmeticEnabled: globallyEnabled && !paused && settings.cosmeticDefaultEnabled !== false && scoped.cosmeticEnabled !== false,
    cookieHelperEnabled: globallyEnabled && !paused && settings.cookieHelperDefaultEnabled !== false && scoped.cookieHelperEnabled !== false,
    temporaryUntil: Number(scoped.temporaryUntil || 0)
  };
}

function getNetworkPausedHosts(siteRules, settings) {
  const hosts = new Set(siteRules.disabledHosts || []);
  for (const [host, scope] of Object.entries(siteRules.scopedHosts || {})) {
    const hostScope = getHostScope(host, siteRules, settings);
    if (!hostScope.networkEnabled) {
      hosts.add(host);
    }
  }
  return [...hosts].sort();
}

function isHostListed(host, list) {
  if (!host) {
    return false;
  }
  return list.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

async function addDebugEvent(host, event) {
  const data = await chrome.storage.local.get([STORAGE_KEYS.debug]);
  const debug = Array.isArray(data[STORAGE_KEYS.debug]) ? data[STORAGE_KEYS.debug] : [];
  debug.unshift({
    host,
    category: event.category || "blocked",
    label: event.label || "",
    source: event.source || "",
    selector: event.selector || "",
    rulesetId: event.rulesetId || "",
    ruleId: event.ruleId || 0,
    blocked: Boolean(event.blocked),
    at: event.at || Date.now()
  });
  await chrome.storage.local.set({ [STORAGE_KEYS.debug]: debug.slice(0, MAX_DEBUG_EVENTS) });
}

function getDebugForHost(debug, host) {
  return debug.filter((event) => event.host === host || host.endsWith(`.${event.host}`));
}

async function getDebugMatches(tabId, url) {
  const host = getHost(url);
  const data = await chrome.storage.local.get([STORAGE_KEYS.debug]);
  const localDebug = getDebugForHost(data[STORAGE_KEYS.debug] || [], host);
  let matchedRules = [];
  if (tabId && chrome.declarativeNetRequest.getMatchedRules) {
    try {
      const result = await chrome.declarativeNetRequest.getMatchedRules({ tabId });
      matchedRules = result.rulesMatchedInfo || [];
    } catch {
      matchedRules = [];
    }
  }
  return { ok: true, host, localDebug: localDebug.slice(0, 30), matchedRules };
}

async function clearSiteDebug(url) {
  const host = getHost(url);
  const data = await chrome.storage.local.get([STORAGE_KEYS.debug]);
  const debug = Array.isArray(data[STORAGE_KEYS.debug]) ? data[STORAGE_KEYS.debug] : [];
  await chrome.storage.local.set({
    [STORAGE_KEYS.debug]: debug.filter((event) => event.host !== host)
  });
  return { ok: true, host };
}

function getHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function safeCategory(category) {
  const value = String(category || "blocked").toLowerCase();
  return /^[a-z][a-z0-9_-]{1,30}$/.test(value) ? value : "blocked";
}
