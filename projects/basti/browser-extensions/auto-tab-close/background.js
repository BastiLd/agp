import { findMatchingSiteRule, getHostFromUrl, shouldDeleteUrlFromHistory } from "./lib/rules.js";
import { defaultGlobalRule, defaultSettings, getState, incrementStats } from "./lib/storage.js";

const NEW_TAB_TTL_MS = 15000;
const NEW_WINDOW_TTL_MS = 5000;

const closingTabs = new Set();
const trackedTabs = new Map();
const freshWindows = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const state = await chrome.storage.local.get({
    settings: defaultSettings,
    globalRule: defaultGlobalRule,
    siteRules: [],
    stats: {
      closedTabs: 0,
      closedWindows: 0,
      deletedHistoryEntries: 0
    }
  });

  await chrome.storage.local.set(state);
});

chrome.windows.onCreated.addListener((window) => {
  if (typeof window?.id === "number") {
    freshWindows.set(window.id, Date.now());
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  freshWindows.delete(windowId);
});

chrome.tabs.onCreated.addListener((tab) => {
  if (typeof tab?.id !== "number") {
    return;
  }

  trackedTabs.set(tab.id, {
    createdAt: Date.now(),
    windowId: tab.windowId
  });

  void evaluateNewTab(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!trackedTabs.has(tabId)) {
    return;
  }

  if (!changeInfo.url && !tab.url && !tab.pendingUrl) {
    return;
  }

  void evaluateNewTab(tab);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  trackedTabs.delete(tabId);
  closingTabs.delete(tabId);
});

async function evaluateNewTab(tab) {
  if (!isTrackedClosableTab(tab)) {
    return;
  }

  const url = tab.pendingUrl || tab.url || "";
  if (!url || isExtensionUrl(url)) {
    return;
  }

  const host = getHostFromUrl(url);
  if (!host) {
    return;
  }

  const state = await getState();
  const siteRule = findMatchingSiteRule(state.siteRules, host);
  const effectiveRule = resolveEffectiveRule(state, siteRule);
  const isNewWindow = isFreshWindow(tab.windowId);

  if (!effectiveRule.enabled || !shouldCloseNewTab(isNewWindow, effectiveRule)) {
    trackedTabs.delete(tab.id);
    return;
  }

  if (isNewWindow) {
    freshWindows.delete(tab.windowId);
  }

  await closeTab(tab, url, effectiveRule.deleteHistory);
}

function isTrackedClosableTab(tab) {
  if (typeof tab?.id !== "number" || closingTabs.has(tab.id)) {
    return false;
  }

  const tracked = trackedTabs.get(tab.id);
  if (!tracked) {
    return false;
  }

  if (Date.now() - tracked.createdAt > NEW_TAB_TTL_MS) {
    trackedTabs.delete(tab.id);
    return false;
  }

  return true;
}

function resolveEffectiveRule(state, siteRule) {
  if (siteRule) {
    if (!siteRule.enabled) {
      return {
        enabled: false,
        closeTabs: false,
        closeWindows: false,
        deleteHistory: false
      };
    }

    return {
      enabled: true,
      closeTabs: Boolean(siteRule.closeTabs),
      closeWindows: Boolean(siteRule.closeWindows),
      deleteHistory: Boolean(siteRule.deleteHistory)
    };
  }

  if (!state.globalRule.enabled) {
    return {
      enabled: false,
      closeTabs: false,
      closeWindows: false,
      deleteHistory: false
    };
  }

  return {
    enabled: true,
    closeTabs: Boolean(state.settings.closeTabs),
    closeWindows: Boolean(state.settings.closeWindows),
    deleteHistory: Boolean(state.settings.deleteHistory)
  };
}

async function closeTab(tab, url, shouldDeleteHistory) {
  closingTabs.add(tab.id);

  let closedWindow = false;
  try {
    closedWindow = await isLastTabInWindow(tab);
    await chrome.tabs.remove(tab.id);

    const statsPatch = {
      closedTabs: 1,
      closedWindows: closedWindow ? 1 : 0,
      deletedHistoryEntries: 0
    };

    if (shouldDeleteHistory && shouldDeleteUrlFromHistory(url)) {
      try {
        await chrome.history.deleteUrl({ url });
        statsPatch.deletedHistoryEntries = 1;
      } catch (error) {
        console.warn("History deletion failed", error);
      }
    }

    await incrementStats(statsPatch);
  } catch (error) {
    console.warn("Tab close failed", error);
  } finally {
    trackedTabs.delete(tab.id);
    closingTabs.delete(tab.id);
  }
}

async function isLastTabInWindow(tab) {
  try {
    const window = await chrome.windows.get(tab.windowId, { populate: true });
    return Boolean(window.tabs && window.tabs.length === 1);
  } catch {
    return false;
  }
}

function isExtensionUrl(url) {
  return typeof url === "string" && url.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function shouldCloseNewTab(isNewWindow, effectiveRule) {
  return isNewWindow ? Boolean(effectiveRule.closeWindows) : Boolean(effectiveRule.closeTabs);
}

function isFreshWindow(windowId) {
  const createdAt = freshWindows.get(windowId);
  if (!createdAt) {
    return false;
  }

  if (Date.now() - createdAt > NEW_WINDOW_TTL_MS) {
    freshWindows.delete(windowId);
    return false;
  }

  return true;
}
