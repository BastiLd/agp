import { buildRuleLabel, normalizeHostInput } from "./rules.js";

export const defaultSettings = {
  language: "de",
  closeTabs: true,
  closeWindows: true,
  blockSameSiteFamily: true,
  deleteHistory: true
};

export const defaultGlobalRule = {
  enabled: false
};

export const defaultStats = {
  closedTabs: 0,
  closedWindows: 0,
  deletedHistoryEntries: 0
};

export async function getState() {
  const result = await chrome.storage.local.get({
    settings: defaultSettings,
    globalRule: defaultGlobalRule,
    siteRules: [],
    stats: defaultStats
  });

  return {
    settings: { ...defaultSettings, ...(result.settings ?? {}) },
    globalRule: { ...defaultGlobalRule, ...(result.globalRule ?? {}) },
    siteRules: Array.isArray(result.siteRules) ? result.siteRules : [],
    stats: { ...defaultStats, ...(result.stats ?? {}) }
  };
}

export async function saveSettings(patch) {
  const { settings } = await getState();
  const nextSettings = { ...settings, ...patch };
  await chrome.storage.local.set({ settings: nextSettings });
  return nextSettings;
}

export async function saveGlobalRule(patch) {
  const { globalRule } = await getState();
  const nextRule = { ...globalRule, ...patch };
  await chrome.storage.local.set({ globalRule: nextRule });
  return nextRule;
}

export async function saveSiteRules(siteRules) {
  await chrome.storage.local.set({ siteRules });
  return siteRules;
}

export async function incrementStats(patch) {
  const { stats } = await getState();
  const nextStats = {
    closedTabs: stats.closedTabs + (patch.closedTabs ?? 0),
    closedWindows: stats.closedWindows + (patch.closedWindows ?? 0),
    deletedHistoryEntries: stats.deletedHistoryEntries + (patch.deletedHistoryEntries ?? 0)
  };
  await chrome.storage.local.set({ stats: nextStats });
  return nextStats;
}

export function createSiteRule(host, overrides = {}) {
  const scopeHost = normalizeHostInput(host);
  if (!scopeHost) {
    throw new Error("Invalid host");
  }

  return {
    id: createRuleId(scopeHost),
    label: buildRuleLabel(scopeHost),
    scopeHost,
    enabled: true,
    closeTabs: true,
    closeWindows: true,
    blockSameSiteFamily: true,
    deleteHistory: true,
    ...overrides
  };
}

export async function upsertSiteRule(hostOrRule, overrides = {}) {
  const { siteRules } = await getState();
  const incomingRule = typeof hostOrRule === "string" ? createSiteRule(hostOrRule, overrides) : sanitizeSiteRule(hostOrRule);
  const existingIndex = siteRules.findIndex((rule) => rule.scopeHost === incomingRule.scopeHost);

  if (existingIndex >= 0) {
    const mergedRule = {
      ...siteRules[existingIndex],
      ...incomingRule,
      id: siteRules[existingIndex].id
    };
    const nextRules = [...siteRules];
    nextRules[existingIndex] = mergedRule;
    await saveSiteRules(nextRules);
    return { rule: mergedRule, merged: true };
  }

  const nextRules = [...siteRules, incomingRule].sort((left, right) => left.scopeHost.localeCompare(right.scopeHost));
  await saveSiteRules(nextRules);
  return { rule: incomingRule, merged: false };
}

export async function saveSiteRule(ruleId, patch) {
  const { siteRules } = await getState();
  const nextRules = siteRules.map((rule) => {
    if (rule.id !== ruleId) {
      return rule;
    }

    const nextRule = sanitizeSiteRule({
      ...rule,
      ...patch
    });
    return { ...nextRule, id: rule.id };
  });

  await saveSiteRules(nextRules);
  return nextRules.find((rule) => rule.id === ruleId) ?? null;
}

function sanitizeSiteRule(rule) {
  return {
    id: rule.id || createRuleId(rule.scopeHost),
    label: rule.label || buildRuleLabel(rule.scopeHost),
    scopeHost: normalizeHostInput(rule.scopeHost),
    enabled: Boolean(rule.enabled),
    closeTabs: Boolean(rule.closeTabs),
    closeWindows: Boolean(rule.closeWindows),
    blockSameSiteFamily: Boolean(rule.blockSameSiteFamily),
    deleteHistory: Boolean(rule.deleteHistory)
  };
}

function createRuleId(scopeHost) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${scopeHost.replace(/[^a-z0-9]+/g, "-")}-${suffix}`;
}
