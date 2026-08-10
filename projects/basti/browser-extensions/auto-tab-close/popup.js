import { findMatchingSiteRule, getHostFromUrl, normalizeHostInput } from "./lib/rules.js";
import { getState, saveGlobalRule, saveSettings, upsertSiteRule } from "./lib/storage.js";
import { getTranslator } from "./lib/translations.js";

const viewButtons = [...document.querySelectorAll(".nav-button")];
const views = [...document.querySelectorAll(".view")];
const startMessage = document.querySelector("#startMessage");
const settingsMessage = document.querySelector("#settingsMessage");
const globalStatusPill = document.querySelector("#globalStatusPill");
const globalHeadline = document.querySelector("#globalHeadline");
const globalDescription = document.querySelector("#globalDescription");
const currentSiteValue = document.querySelector("#currentSiteValue");
const siteStatusLabel = document.querySelector("#siteStatusLabel");
const siteStatusValue = document.querySelector("#siteStatusValue");
const closedTabsValue = document.querySelector("#closedTabsValue");
const closedWindowsValue = document.querySelector("#closedWindowsValue");
const historyValue = document.querySelector("#historyValue");
const siteActionButton = document.querySelector("#siteActionButton");
const globalActionButton = document.querySelector("#globalActionButton");
const sitesList = document.querySelector("#sitesList");
const siteInput = document.querySelector("#siteInput");
const addSiteButton = document.querySelector("#addSiteButton");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const settingsToggles = {
  closeTabs: document.querySelector("#closeTabsToggle"),
  closeWindows: document.querySelector("#closeWindowsToggle"),
  blockSameSiteFamily: document.querySelector("#blockSameSiteFamilyToggle"),
  deleteHistory: document.querySelector("#deleteHistoryToggle")
};

let language = "de";
let translate = getTranslator(language);
let activeTab = null;
let activeHost = "";
let currentSiteRule = null;

init().catch((error) => {
  console.error(error);
});

async function init() {
  bindViewSwitching();
  bindActions();
  restoreInitialView();
  await refreshActiveTab();
  await render();
  chrome.storage.onChanged.addListener(handleStorageChange);
}

function bindViewSwitching() {
  for (const button of viewButtons) {
    button.addEventListener("click", () => {
      const target = button.dataset.viewTarget;
      setActiveView(target);
      window.location.hash = target === "settingsView" ? "settings" : "";
    });
  }
}

function bindActions() {
  siteActionButton.addEventListener("click", handleSiteAction);
  globalActionButton.addEventListener("click", handleGlobalAction);
  addSiteButton.addEventListener("click", handleAddSite);
  siteInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      await handleAddSite();
    }
  });

  for (const [key, toggle] of Object.entries(settingsToggles)) {
    toggle.addEventListener("change", async () => {
      await saveSettings({ [key]: toggle.checked });
      await render();
    });
  }

  for (const button of languageButtons) {
    button.addEventListener("click", async () => {
      await saveSettings({ language: button.dataset.language });
      await render();
    });
  }
}

function restoreInitialView() {
  if (window.location.hash === "#settings") {
    setActiveView("settingsView");
  }
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  activeTab = tab ?? null;
  activeHost = getHostFromUrl(activeTab?.url || "") || normalizeHostInput(activeTab?.pendingUrl || "");
}

async function render() {
  const state = await getState();
  language = state.settings.language;
  translate = getTranslator(language);
  currentSiteRule = findMatchingSiteRule(state.siteRules, activeHost);

  applyTranslations();
  renderStartView(state);
  renderOptionsView(state);
  renderSettingsView(state);
}

function renderStartView(state) {
  const globalEnabled = Boolean(state.globalRule.enabled);
  const siteHasRule = Boolean(currentSiteRule);
  const siteEnabled = Boolean(currentSiteRule?.enabled);

  globalHeadline.textContent = globalEnabled ? translate("globalEnabledTitle") : translate("globalDisabledTitle");
  globalDescription.textContent = globalEnabled ? translate("globalEnabledCopy") : translate("globalDisabledCopy");
  globalStatusPill.textContent = globalEnabled ? translate("enabled") : translate("disabled");
  globalStatusPill.classList.toggle("off", !globalEnabled);

  currentSiteValue.textContent = activeHost || translate("noWebsite");
  siteStatusLabel.textContent = getSiteStatusLabel(siteHasRule, siteEnabled, globalEnabled);
  siteStatusValue.textContent = getSiteStatusBadge(siteHasRule, siteEnabled, globalEnabled);
  siteStatusValue.classList.toggle("inactive", siteHasRule && !siteEnabled);

  closedTabsValue.textContent = String(state.stats.closedTabs);
  closedWindowsValue.textContent = String(state.stats.closedWindows);
  historyValue.textContent = String(state.stats.deletedHistoryEntries);

  const shouldOfferExclusion = siteEnabled || (globalEnabled && !siteHasRule);
  siteActionButton.textContent = shouldOfferExclusion ? translate("deactivateOnSite") : translate("activateOnSite");
  siteActionButton.classList.toggle("danger", shouldOfferExclusion);
  siteActionButton.disabled = !activeHost;

  globalActionButton.textContent = globalEnabled ? translate("deactivateGlobal") : translate("activateGlobal");
  globalActionButton.classList.toggle("danger", globalEnabled);
}

function getSiteStatusLabel(siteHasRule, siteEnabled, globalEnabled) {
  if (!activeHost) {
    return translate("noWebsite");
  }

  if (siteHasRule && siteEnabled) {
    return translate("activeOnSite");
  }

  if (siteHasRule && !siteEnabled) {
    return translate("currentSiteExcluded");
  }

  return globalEnabled ? translate("globalEnabledCopy") : translate("inactiveOnSite");
}

function getSiteStatusBadge(siteHasRule, siteEnabled, globalEnabled) {
  if (siteHasRule && siteEnabled) {
    return translate("statusActive");
  }

  if (siteHasRule && !siteEnabled) {
    return translate("statusInactive");
  }

  return globalEnabled ? translate("statusGlobal") : translate("statusOff");
}

function renderOptionsView(state) {
  for (const [key, toggle] of Object.entries(settingsToggles)) {
    toggle.checked = Boolean(state.settings[key]);
  }
}

function renderSettingsView(state) {
  document.documentElement.lang = language;
  siteInput.placeholder = translate("sitePlaceholder");

  for (const button of languageButtons) {
    button.classList.toggle("active", button.dataset.language === language);
  }

  sitesList.textContent = "";
  if (!state.siteRules.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = translate("noSites");
    sitesList.append(empty);
    return;
  }

  for (const rule of state.siteRules) {
    const row = document.createElement("div");
    row.className = "list-item";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = rule.label;
    const description = document.createElement("span");
    description.textContent = `${rule.enabled ? translate("enabled") : translate("statusInactive")} · ${rule.scopeHost}`;
    copy.append(title, description);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.textContent = translate("editRule");
    button.title = translate("openSiteOptions");
    button.addEventListener("click", async () => {
      const url = chrome.runtime.getURL(`options.html?site=${encodeURIComponent(rule.id)}`);
      await chrome.tabs.create({ url });
    });

    row.append(copy, button);
    sitesList.append(row);
  }
}

function applyTranslations() {
  document.title = translate("appTitle");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = translate(element.dataset.i18n);
  }
}

function setActiveView(targetId) {
  for (const button of viewButtons) {
    button.classList.toggle("active", button.dataset.viewTarget === targetId);
  }

  for (const view of views) {
    view.classList.toggle("active", view.id === targetId);
  }
}

async function handleSiteAction() {
  clearMessages();
  if (!activeHost) {
    startMessage.textContent = translate("noWebsite");
    startMessage.classList.add("error");
    return;
  }

  const state = await getState();
  const shouldCreateExclusion = !currentSiteRule && state.globalRule.enabled;

  if (currentSiteRule?.enabled || shouldCreateExclusion) {
    await upsertSiteRule(activeHost, { enabled: false });
    startMessage.textContent = translate("currentSiteExcluded");
  } else {
    await upsertSiteRule(activeHost, {
      enabled: true,
      closeTabs: state.settings.closeTabs,
      closeWindows: state.settings.closeWindows,
      blockSameSiteFamily: state.settings.blockSameSiteFamily,
      deleteHistory: state.settings.deleteHistory
    });
    startMessage.textContent = translate("createdFromCurrentSite");
  }

  await render();
}

async function handleGlobalAction() {
  clearMessages();
  const state = await getState();
  await saveGlobalRule({ enabled: !state.globalRule.enabled });
  startMessage.textContent = !state.globalRule.enabled ? translate("globalProtectionOn") : translate("globalProtectionOff");
  await render();
}

async function handleAddSite() {
  clearMessages();
  const input = siteInput.value.trim();
  const normalized = normalizeHostInput(input);
  if (!normalized) {
    settingsMessage.textContent = translate("invalidSite");
    settingsMessage.classList.add("error");
    return;
  }

  const state = await getState();
  const result = await upsertSiteRule(normalized, {
    closeTabs: state.settings.closeTabs,
    closeWindows: state.settings.closeWindows,
    blockSameSiteFamily: state.settings.blockSameSiteFamily,
    deleteHistory: state.settings.deleteHistory
  });

  settingsMessage.textContent = result.merged ? translate("duplicateMerged") : translate("saveSuccess");
  siteInput.value = "";
  await render();
}

async function handleStorageChange() {
  await refreshActiveTab();
  await render();
}

function clearMessages() {
  for (const message of [startMessage, settingsMessage]) {
    message.textContent = "";
    message.classList.remove("error");
  }
}
