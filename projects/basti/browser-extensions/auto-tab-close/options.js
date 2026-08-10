import { getState, saveSiteRule } from "./lib/storage.js";
import { getTranslator } from "./lib/translations.js";

const backButton = document.querySelector("#backButton");
const detailLabel = document.querySelector("#detailLabel");
const detailHost = document.querySelector("#detailHost");
const detailCard = document.querySelector("#detailCard");
const detailMessage = document.querySelector("#detailMessage");
const toggles = {
  enabled: document.querySelector("#enabledToggle"),
  closeTabs: document.querySelector("#closeTabsToggle"),
  closeWindows: document.querySelector("#closeWindowsToggle"),
  blockSameSiteFamily: document.querySelector("#blockSameSiteFamilyToggle"),
  deleteHistory: document.querySelector("#deleteHistoryToggle")
};

let language = "de";
let translate = getTranslator(language);
let siteRuleId = "";
let currentRule = null;

init().catch((error) => {
  console.error(error);
});

async function init() {
  siteRuleId = new URLSearchParams(window.location.search).get("site") || "";
  backButton.addEventListener("click", handleBack);

  for (const [key, toggle] of Object.entries(toggles)) {
    toggle.addEventListener("change", async () => {
      if (!currentRule) {
        return;
      }

      await saveSiteRule(siteRuleId, { [key]: toggle.checked });
      detailMessage.textContent = translate("saveSuccess");
      await render();
    });
  }

  chrome.storage.onChanged.addListener(handleStorageChange);
  await render();
}

async function render() {
  const state = await getState();
  language = state.settings.language;
  translate = getTranslator(language);
  currentRule = state.siteRules.find((rule) => rule.id === siteRuleId) ?? null;

  applyTranslations();

  if (!currentRule) {
    detailLabel.textContent = translate("noDetailSite");
    detailHost.textContent = "";
    detailCard.hidden = true;
    return;
  }

  detailCard.hidden = false;
  detailLabel.textContent = currentRule.label;
  detailHost.textContent = currentRule.scopeHost;

  for (const [key, toggle] of Object.entries(toggles)) {
    toggle.checked = Boolean(currentRule[key]);
  }
}

function applyTranslations() {
  document.documentElement.lang = language;
  document.title = translate("detailTitle");
  backButton.setAttribute("aria-label", translate("back"));
  backButton.textContent = translate("back");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = translate(element.dataset.i18n);
  }
}

async function handleStorageChange() {
  await render();
}

function handleBack() {
  const popupUrl = chrome.runtime.getURL("popup.html#settings");
  window.location.href = popupUrl;
}
