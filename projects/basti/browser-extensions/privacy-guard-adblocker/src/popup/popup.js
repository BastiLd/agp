(function initPopup() {
  const { I18N } = globalThis.PrivacyGuardConstants;
  const state = {
    tab: null,
    data: null,
    language: "de"
  };

  const elements = {
    hostLabel: document.querySelector("#hostLabel"),
    siteToggle: document.querySelector("#siteToggle"),
    status: document.querySelector("#status"),
    networkToggle: document.querySelector("#networkToggle"),
    cosmeticToggle: document.querySelector("#cosmeticToggle"),
    cookieToggle: document.querySelector("#cookieToggle"),
    totalValue: document.querySelector("#totalValue"),
    adsValue: document.querySelector("#adsValue"),
    cookieValue: document.querySelector("#cookieValue"),
    eventList: document.querySelector("#eventList"),
    clearStatsButton: document.querySelector("#clearStatsButton"),
    clearDebugButton: document.querySelector("#clearDebugButton"),
    debugList: document.querySelector("#debugList"),
    rulesetList: document.querySelector("#rulesetList"),
    quotaLabel: document.querySelector("#quotaLabel"),
    updateButton: document.querySelector("#updateButton"),
    tourButton: document.querySelector("#tourButton"),
    optionsButton: document.querySelector("#optionsButton"),
    mascot: document.querySelector("#popupMascot"),
    langDe: document.querySelector("#langDe"),
    langEn: document.querySelector("#langEn")
  };

  const tour = globalThis.PrivacyGuardTour.createTour({
    surface: "popup",
    mascotSelector: "#popupMascot",
    language: () => state.language,
    onOpenOptions: () => chrome.runtime.openOptionsPage(),
    steps: [
      {
        id: "popup-intro",
        title: {
          de: "Lass uns die Tour starten.",
          en: "Let's start the tour."
        },
        body: {
          de: "Ich zeige dir kurz, was Privacy Guard im Popup kann. Du kannst jederzeit ueberspringen.",
          en: "I will quickly show you what Privacy Guard can do in this popup. You can skip anytime."
        },
        detail: {
          de: "Die Tour bleibt komplett lokal in der Extension. Es wird keine KI und kein externer Dienst gestartet.",
          en: "The tour stays fully local in the extension. It does not start AI or any external service."
        }
      },
      {
        id: "site-toggle",
        target: ".switch",
        title: {
          de: "Website-Schutz",
          en: "Website protection"
        },
        body: {
          de: "Dieser Schalter pausiert oder aktiviert den Schutz fuer die aktuelle Website.",
          en: "This switch pauses or enables protection for the current website."
        },
        detail: {
          de: "Wenn eine Seite kaputt wirkt, kannst du zuerst nur diese Domain freigeben, statt den ganzen Schutz auszuschalten.",
          en: "If a page seems broken, allow only this domain first instead of turning off the whole protection."
        },
        mascotSide: "right"
      },
      {
        id: "scope-panel",
        target: ".scope-panel",
        title: {
          de: "Drei Schutzbereiche",
          en: "Three protection scopes"
        },
        body: {
          de: "Netzwerk, Kosmetik und Cookie-Helfer lassen sich pro Website getrennt steuern.",
          en: "Network, cosmetic cleanup, and cookie helper can be controlled separately per website."
        },
        detail: {
          de: "Das ist der False-Positive-Schutz: Wenn nur sichtbare Elemente falsch verschwinden, pausierst du nur Kosmetik.",
          en: "This is false-positive protection: if only visible elements disappear incorrectly, pause only cosmetic cleanup."
        }
      },
      {
        id: "status",
        target: "#status",
        title: {
          de: "Aktueller Status",
          en: "Current status"
        },
        body: {
          de: "Hier siehst du sofort, ob Privacy Guard auf dieser Website aktiv ist.",
          en: "This shows whether Privacy Guard is active on this website."
        },
        detail: {
          de: "Rot bedeutet freigegeben oder pausiert, gruen bedeutet aktiver Schutz.",
          en: "Red means allowlisted or paused, green means protection is active."
        }
      },
      {
        id: "stats",
        target: ".stats-grid",
        title: {
          de: "Zaehler",
          en: "Counters"
        },
        body: {
          de: "Die Kacheln zeigen erkannte Tracker, Werbung und Cookie-Ereignisse fuer die aktuelle Domain.",
          en: "These cards show detected trackers, ads, and cookie events for the current domain."
        },
        detail: {
          de: "Die Werte helfen dir zu sehen, ob eine Seite viel Tracking oder Werbung laedt.",
          en: "The values help you see whether a site loads a lot of tracking or advertising."
        }
      },
      {
        id: "recent-hits",
        target: "#recentPanel",
        title: {
          de: "Letzte Treffer",
          en: "Recent hits"
        },
        body: {
          de: "Diese Liste zeigt die letzten erkannten Werbe- oder Tracking-Ereignisse.",
          en: "This list shows the latest detected ad or tracking events."
        },
        detail: {
          de: "Mit Leeren setzt du die Statistik zurueck, ohne deine Schutzregeln zu veraendern.",
          en: "Clear resets the statistics without changing your protection rules."
        }
      },
      {
        id: "diagnostics",
        target: "#debugPanel",
        title: {
          de: "Diagnose",
          en: "Diagnostics"
        },
        body: {
          de: "Die Diagnose zeigt technische Treffer wie Regel, Ruleset oder kosmetischen Selector.",
          en: "Diagnostics shows technical hits such as rule, ruleset, or cosmetic selector."
        },
        detail: {
          de: "Das ist wichtig, wenn du spaeter nachvollziehen willst, warum etwas blockiert oder versteckt wurde.",
          en: "This matters when you want to understand why something was blocked or hidden."
        }
      },
      {
        id: "rulesets",
        target: "#rulesetPanel",
        title: {
          de: "Regellisten",
          en: "Rule lists"
        },
        body: {
          de: "Hier siehst du aktive Listen und die verfuegbare statische DNR-Quote.",
          en: "This shows active lists and the available static DNR quota."
        },
        detail: {
          de: "Die vollstaendige Verwaltung der Listen ist in den Optionen.",
          en: "Full rule list management lives in the options page."
        }
      },
      {
        id: "language",
        target: ".segmented",
        title: {
          de: "Sprache",
          en: "Language"
        },
        body: {
          de: "Mit DE und EN wechselst du die Oberflaeche zwischen Deutsch und Englisch.",
          en: "Use DE and EN to switch the interface between German and English."
        },
        detail: {
          de: "Die Tour nutzt dieselbe Spracheinstellung wie Popup und Optionen.",
          en: "The tour uses the same language setting as popup and options."
        }
      },
      {
        id: "update-rules",
        target: "#updateButton",
        title: {
          de: "Regeln aktualisieren",
          en: "Update rules"
        },
        body: {
          de: "Dieser Button startet ein Datenupdate fuer vorkompilierte Remote-Regeln, falls du eine URL gesetzt hast.",
          en: "This starts a data update for precompiled remote rules if you configured a URL."
        },
        detail: {
          de: "Es wird kein Remote-Code ausgefuehrt, nur Regel-Daten werden geladen.",
          en: "No remote code is executed, only rule data is loaded."
        }
      },
      {
        id: "options-transition",
        target: "#optionsButton",
        title: {
          de: "Einstellungen auch durchgehen?",
          en: "Walk through settings too?"
        },
        body: {
          de: "Wenn du moechtest, oeffne ich jetzt die Einstellungen und fuehre die Tour dort weiter.",
          en: "If you want, I can open the options page now and continue the tour there."
        },
        detail: {
          de: "Die Optionsseite oeffnet in einem Tab. Das Popup schliesst dabei normal automatisch.",
          en: "The options page opens in a tab. The popup normally closes automatically."
        },
        openOptions: true
      }
    ]
  });

  document.addEventListener("DOMContentLoaded", boot);
  tour.attachMascotMenu(elements.mascot);
  elements.tourButton.addEventListener("click", () => tour.start());
  elements.siteToggle.addEventListener("change", onToggleSite);
  elements.networkToggle.addEventListener("change", saveScope);
  elements.cosmeticToggle.addEventListener("change", saveScope);
  elements.cookieToggle.addEventListener("change", saveScope);
  elements.optionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
  elements.clearStatsButton.addEventListener("click", clearStats);
  elements.clearDebugButton.addEventListener("click", clearDebug);
  elements.updateButton.addEventListener("click", updateRules);
  elements.langDe.addEventListener("click", () => setLanguage("de"));
  elements.langEn.addEventListener("click", () => setLanguage("en"));

  async function boot() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    state.tab = tabs[0] || null;
    await loadData();
    await tour.resumeFromStorage();
  }

  async function loadData() {
    if (!state.tab) {
      return;
    }
    const response = await chrome.runtime.sendMessage({
      type: "GET_POPUP_DATA",
      tabId: state.tab.id,
      url: state.tab.url
    });
    if (!response?.ok) {
      return;
    }
    state.data = response;
    state.language = response.settings?.language === "en" ? "en" : "de";
    render();
  }

  function render() {
    const copy = I18N[state.language];
    const stats = state.data.stats || {};
    const categories = stats.categories || {};
    document.documentElement.lang = state.language;
    elements.hostLabel.textContent = state.data.host || "chrome://";
    elements.siteToggle.checked = Boolean(state.data.enabled);
    elements.networkToggle.checked = Boolean(state.data.scope?.networkEnabled);
    elements.cosmeticToggle.checked = Boolean(state.data.scope?.cosmeticEnabled);
    elements.cookieToggle.checked = Boolean(state.data.scope?.cookieHelperEnabled);
    elements.status.textContent = state.data.enabled ? copy.enabled : copy.siteDisabled;
    elements.status.className = `status ${state.data.enabled ? "enabled" : "disabled"}`;
    elements.totalValue.textContent = String(stats.total || 0);
    elements.adsValue.textContent = String((categories.ads || 0) + (categories.youtube || 0));
    elements.cookieValue.textContent = String(categories.consent || 0);

    for (const node of document.querySelectorAll("[data-i18n]")) {
      const key = node.dataset.i18n;
      node.textContent = copy[key] || node.textContent;
    }
    document.querySelector("[data-ui='recentTitle']").textContent = state.language === "en" ? "Recent hits" : "Letzte Treffer";
    elements.clearStatsButton.textContent = state.language === "en" ? "Clear" : "Leeren";
    elements.tourButton.textContent = "Tour";
    elements.langDe.classList.toggle("active", state.language === "de");
    elements.langEn.classList.toggle("active", state.language === "en");

    renderEvents(stats.lastEvents || [], copy);
    renderDebug(state.data.debug || [], copy);
    renderRulesets(state.data.rulesetStatus);
  }

  function renderEvents(events, copy) {
    elements.eventList.textContent = "";
    if (!events.length) {
      const item = document.createElement("li");
      item.innerHTML = `<span class="tag">-</span><span class="event-text"><strong>${escapeHtml(copy.noEvents)}</strong><small></small></span>`;
      elements.eventList.append(item);
      return;
    }
    for (const event of events.slice(0, 8)) {
      const item = document.createElement("li");
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = labelForCategory(event.category, copy);
      const text = document.createElement("span");
      text.className = "event-text";
      const title = document.createElement("strong");
      title.textContent = event.label || event.category;
      const source = document.createElement("small");
      source.textContent = event.source || "";
      text.append(title, source);
      item.append(tag, text);
      elements.eventList.append(item);
    }
  }

  function renderDebug(events, copy) {
    elements.debugList.textContent = "";
    if (!events.length) {
      const item = document.createElement("li");
      item.innerHTML = `<span class="tag">-</span><span class="event-text"><strong>${escapeHtml(copy.noEvents)}</strong><small></small></span>`;
      elements.debugList.append(item);
      return;
    }
    for (const event of events.slice(0, 6)) {
      const item = document.createElement("li");
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = event.rulesetId || event.category || "debug";
      const text = document.createElement("span");
      text.className = "event-text";
      const title = document.createElement("strong");
      title.textContent = event.selector || event.label || "match";
      const source = document.createElement("small");
      source.textContent = event.source || (event.ruleId ? `rule ${event.ruleId}` : "");
      text.append(title, source);
      item.append(tag, text);
      elements.debugList.append(item);
    }
  }

  function renderRulesets(status) {
    elements.rulesetList.textContent = "";
    const available = status?.availableStaticRuleCount;
    elements.quotaLabel.textContent = available === null || available === undefined ? "" : `${available}`;
    for (const ruleset of (status?.rulesets || []).slice(0, 8)) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = ruleset.name;
      const meta = document.createElement("small");
      meta.textContent = `${ruleset.enabled ? "on" : "off"} - ${ruleset.meta?.ruleCount || 0}`;
      item.append(name, meta);
      elements.rulesetList.append(item);
    }
  }

  async function onToggleSite() {
    const response = await chrome.runtime.sendMessage({
      type: "SET_SITE_ENABLED",
      url: state.tab.url,
      enabled: elements.siteToggle.checked
    });
    if (response?.ok) {
      await loadData();
    }
  }

  async function saveScope() {
    const response = await chrome.runtime.sendMessage({
      type: "SET_SITE_PROTECTION_SCOPE",
      url: state.tab.url,
      scope: {
        networkEnabled: elements.networkToggle.checked,
        cosmeticEnabled: elements.cosmeticToggle.checked,
        cookieHelperEnabled: elements.cookieToggle.checked
      }
    });
    if (response?.ok) {
      await loadData();
    }
  }

  async function setLanguage(language) {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      settings: { language }
    });
    if (response?.ok) {
      await loadData();
    }
  }

  async function clearStats() {
    await chrome.runtime.sendMessage({ type: "CLEAR_STATS" });
    await loadData();
  }

  async function clearDebug() {
    await chrome.runtime.sendMessage({ type: "CLEAR_SITE_DEBUG", url: state.tab.url });
    await loadData();
  }

  async function updateRules() {
    const copy = I18N[state.language];
    elements.updateButton.disabled = true;
    elements.updateButton.textContent = "...";
    const response = await chrome.runtime.sendMessage({ type: "RUN_REMOTE_UPDATE" });
    elements.updateButton.disabled = false;
    if (response?.ok) {
      elements.updateButton.textContent = copy.remoteUpdateOk;
    } else if (response?.status === "missing-url") {
      elements.updateButton.textContent = copy.remoteUpdateMissing;
    } else {
      elements.updateButton.textContent = copy.remoteUpdateFailed;
    }
    window.setTimeout(render, 1600);
  }

  function labelForCategory(category, copy) {
    const key = category === "privacy" ? "trackers" : category;
    return copy[key] || category;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
