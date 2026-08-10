(function initOptions() {
  const state = {
    language: "de",
    settings: null,
    siteRules: null,
    remote: null,
    filterSources: [],
    rulesetStatus: null
  };

  const labels = {
    de: {
      subtitle: "Optionen",
      protectionTitle: "Schutz",
      protectionEnabled: "Schutz global aktivieren",
      badgeEnabled: "Badge-Zaehler anzeigen",
      pageWarnings: "Seitenwarnung bei starkem Tracking",
      networkDefaultEnabled: "Netzwerkblocking standardmaessig aktiv",
      cosmeticDefaultEnabled: "Kosmetisches Blocking standardmaessig aktiv",
      cookieHelperDefaultEnabled: "Cookie-Helfer standardmaessig aktiv",
      cookiesTitle: "Cookies",
      cookieMode: "Cookie-Modus",
      rejectPreferred: "Ablehnen bevorzugt",
      aggressive: "Maximal aggressiv",
      detectOnly: "Nur markieren",
      remoteTitle: "Remote-Regeln",
      bundledListsTitle: "Gebündelte Listen",
      bundledListsCopy: "Diese Quellen sind als lokale MV3-Regeln vorbereitet oder per Updater konvertierbar.",
      activeRulesets: "Aktive Rulesets",
      remoteEnabled: "Remote-Updates aktivieren",
      remoteUrl: "URL zu vorkompiliertem DNR-JSON",
      remoteInterval: "Update-Intervall in Stunden",
      runUpdate: "Jetzt aktualisieren",
      listsTitle: "Domain-Listen",
      allowlist: "Allowlist, eine Domain pro Zeile",
      blocklist: "Blocklist, eine Domain pro Zeile",
      save: "Speichern",
      saved: "Gespeichert",
      updateOk: "Aktualisiert",
      updateMissing: "Keine Remote-URL",
      updateFailed: "Update fehlgeschlagen",
      never: "Nie"
    },
    en: {
      subtitle: "Options",
      protectionTitle: "Protection",
      protectionEnabled: "Enable protection globally",
      badgeEnabled: "Show badge counter",
      pageWarnings: "Show page warning on heavy tracking",
      networkDefaultEnabled: "Enable network blocking by default",
      cosmeticDefaultEnabled: "Enable cosmetic blocking by default",
      cookieHelperDefaultEnabled: "Enable cookie helper by default",
      cookiesTitle: "Cookies",
      cookieMode: "Cookie mode",
      rejectPreferred: "Prefer reject",
      aggressive: "Maximum aggressive",
      detectOnly: "Detect only",
      remoteTitle: "Remote rules",
      bundledListsTitle: "Bundled lists",
      bundledListsCopy: "These sources are prepared as local MV3 rules or can be converted by the updater.",
      activeRulesets: "Active rulesets",
      remoteEnabled: "Enable remote updates",
      remoteUrl: "URL to precompiled DNR JSON",
      remoteInterval: "Update interval in hours",
      runUpdate: "Update now",
      listsTitle: "Domain lists",
      allowlist: "Allowlist, one domain per line",
      blocklist: "Blocklist, one domain per line",
      save: "Save",
      saved: "Saved",
      updateOk: "Updated",
      updateMissing: "No remote URL",
      updateFailed: "Update failed",
      never: "Never"
    }
  };

  const form = document.querySelector("#optionsForm");
  const fields = {
    subtitle: document.querySelector("#subtitle"),
    protectionEnabled: document.querySelector("#protectionEnabled"),
    badgeEnabled: document.querySelector("#badgeEnabled"),
    pageWarnings: document.querySelector("#pageWarnings"),
    networkDefaultEnabled: document.querySelector("#networkDefaultEnabled"),
    cosmeticDefaultEnabled: document.querySelector("#cosmeticDefaultEnabled"),
    cookieHelperDefaultEnabled: document.querySelector("#cookieHelperDefaultEnabled"),
    cookieMode: document.querySelector("#cookieMode"),
    remoteRulesEnabled: document.querySelector("#remoteRulesEnabled"),
    remoteRulesUrl: document.querySelector("#remoteRulesUrl"),
    remoteUpdateIntervalHours: document.querySelector("#remoteUpdateIntervalHours"),
    disabledHosts: document.querySelector("#disabledHosts"),
    blockedHosts: document.querySelector("#blockedHosts"),
    filterSourceList: document.querySelector("#filterSourceList"),
    rulesetToggleList: document.querySelector("#rulesetToggleList"),
    quotaStatus: document.querySelector("#quotaStatus"),
    remoteStatus: document.querySelector("#remoteStatus"),
    saveStatus: document.querySelector("#saveStatus"),
    mascot: document.querySelector("#optionsMascot"),
    langDe: document.querySelector("#langDe"),
    langEn: document.querySelector("#langEn"),
    runUpdateButton: document.querySelector("#runUpdateButton")
  };

  const tour = globalThis.PrivacyGuardTour.createTour({
    surface: "options",
    mascotSelector: "#optionsMascot",
    language: () => state.language,
    steps: [
      {
        id: "options-intro",
        title: {
          de: "Das sind die Einstellungen.",
          en: "These are the settings."
        },
        body: {
          de: "Hier steuerst du globale Defaults, Listen, Updates und Domain-Ausnahmen.",
          en: "This is where you control global defaults, lists, updates, and domain exceptions."
        },
        detail: {
          de: "Aenderungen werden erst dauerhaft ueber Speichern uebernommen, ausser Ruleset-Schalter und Sprache.",
          en: "Most changes are applied permanently with Save, except ruleset switches and language."
        }
      },
      {
        id: "options-protection",
        target: "#protectionSection",
        title: {
          de: "Globaler Schutz",
          en: "Global protection"
        },
        body: {
          de: "Diese Schalter legen fest, ob Privacy Guard grundsaetzlich aktiv ist und welche Schutzarten standardmaessig laufen.",
          en: "These switches define whether Privacy Guard is generally active and which protection scopes run by default."
        },
        detail: {
          de: "Pro Website kannst du die Bereiche spaeter trotzdem getrennt im Popup anpassen.",
          en: "You can still adjust the scopes per website later in the popup."
        }
      },
      {
        id: "options-cookie",
        target: "#cookieSection",
        title: {
          de: "Cookie-Modus",
          en: "Cookie mode"
        },
        body: {
          de: "Der Cookie-Modus bestimmt, ob Banner nur erkannt oder bei eindeutigem Ablehnen automatisch bedient werden.",
          en: "Cookie mode controls whether banners are only detected or rejected automatically when the reject choice is clear."
        },
        detail: {
          de: "Bei unsicherer Auswahl soll Privacy Guard lieber melden statt falsch zu klicken.",
          en: "When the choice is ambiguous, Privacy Guard should report instead of clicking the wrong button."
        }
      },
      {
        id: "options-remote",
        target: "#remoteSection",
        title: {
          de: "Remote-Regeln",
          en: "Remote rules"
        },
        body: {
          de: "Hier kannst du vorkompilierte DNR-Regeln als Datenupdate einrichten.",
          en: "Here you can configure precompiled DNR rules as a data update."
        },
        detail: {
          de: "Das bleibt Chrome-Store-freundlich: keine Remote-Skripte, nur Regel-JSON.",
          en: "This stays Chrome Store friendly: no remote scripts, only rule JSON."
        }
      },
      {
        id: "options-rulesets",
        target: "#rulesetSection",
        title: {
          de: "Gebundelte Listen",
          en: "Bundled lists"
        },
        body: {
          de: "Diese Bereiche zeigen Quellen, aktive Rulesets und die verfuegbare DNR-Quote.",
          en: "These areas show sources, active rulesets, and available DNR quota."
        },
        detail: {
          de: "Optionale Listen kannst du hier gezielt aktivieren, ohne alle Schutzbereiche zu vermischen.",
          en: "Optional lists can be enabled here without mixing all protection scopes together."
        }
      },
      {
        id: "options-domain-lists",
        target: "#domainListsSection",
        title: {
          de: "Domain-Listen",
          en: "Domain lists"
        },
        body: {
          de: "Allowlist und Blocklist geben dir grobe Kontrolle ueber ganze Domains.",
          en: "Allowlist and blocklist give you coarse control over whole domains."
        },
        detail: {
          de: "Eine Domain pro Zeile reicht. Fuer feinere Pausen nutzt du im Popup die drei Schutzbereiche.",
          en: "Use one domain per line. For finer pauses, use the three protection scopes in the popup."
        }
      },
      {
        id: "options-save",
        target: "#saveSection",
        title: {
          de: "Speichern nicht vergessen",
          en: "Do not forget to save"
        },
        body: {
          de: "Mit Speichern uebernimmst du die geaenderten Einstellungen und Domain-Listen.",
          en: "Save applies changed settings and domain lists."
        },
        detail: {
          de: "Nach dem Speichern aktualisiert die Seite ihren Zustand und zeigt kurz eine Bestaetigung.",
          en: "After saving, the page refreshes its state and briefly shows a confirmation."
        }
      },
      {
        id: "options-done",
        title: {
          de: "Tour beendet.",
          en: "Tour complete."
        },
        body: {
          de: "Du kannst die Tour jederzeit ueber das Mascot neu starten.",
          en: "You can restart the tour anytime from the mascot."
        },
        detail: {
          de: "Die Frage-/Chat-Funktion ist absichtlich nicht enthalten. Diese Version erklaert nur die Oberflaeche.",
          en: "The question/chat feature is intentionally not included. This version only explains the interface."
        },
        final: true
      }
    ]
  });

  document.addEventListener("DOMContentLoaded", boot);
  tour.attachMascotMenu(fields.mascot);
  form.addEventListener("submit", save);
  fields.langDe.addEventListener("click", () => changeLanguage("de"));
  fields.langEn.addEventListener("click", () => changeLanguage("en"));
  fields.runUpdateButton.addEventListener("click", runRemoteUpdate);

  async function boot() {
    const response = await chrome.runtime.sendMessage({ type: "GET_OPTIONS_DATA" });
    if (!response?.ok) {
      return;
    }
    state.settings = response.settings;
    state.siteRules = response.siteRules;
    state.remote = response.remote;
    state.rulesetStatus = response.rulesetStatus;
    state.language = response.settings?.language === "en" ? "en" : "de";
    state.filterSources = await loadFilterSources();
    render();
    await tour.resumeFromStorage();
  }

  function render() {
    const copy = labels[state.language];
    document.documentElement.lang = state.language;
    fields.subtitle.textContent = copy.subtitle;
    for (const node of document.querySelectorAll("[data-label]")) {
      node.textContent = copy[node.dataset.label] || node.textContent;
    }
    fields.langDe.classList.toggle("active", state.language === "de");
    fields.langEn.classList.toggle("active", state.language === "en");

    fields.protectionEnabled.checked = Boolean(state.settings.protectionEnabled);
    fields.badgeEnabled.checked = Boolean(state.settings.badgeEnabled);
    fields.pageWarnings.checked = Boolean(state.settings.pageWarnings);
    fields.networkDefaultEnabled.checked = state.settings.networkDefaultEnabled !== false;
    fields.cosmeticDefaultEnabled.checked = state.settings.cosmeticDefaultEnabled !== false;
    fields.cookieHelperDefaultEnabled.checked = state.settings.cookieHelperDefaultEnabled !== false;
    fields.cookieMode.value = state.settings.cookieMode || "rejectPreferred";
    fields.remoteRulesEnabled.checked = Boolean(state.settings.remoteRulesEnabled);
    fields.remoteRulesUrl.value = state.settings.remoteRulesUrl || "";
    fields.remoteUpdateIntervalHours.value = String(state.settings.remoteUpdateIntervalHours || 24);
    fields.disabledHosts.value = (state.siteRules.disabledHosts || []).join("\n");
    fields.blockedHosts.value = (state.siteRules.blockedHosts || []).join("\n");
    renderFilterSources();
    renderRulesets();
    renderRemoteStatus();
  }

  async function loadFilterSources() {
    try {
      const response = await fetch(chrome.runtime.getURL("rules/filter-sources.json"));
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  function renderFilterSources() {
    fields.filterSourceList.textContent = "";
    for (const source of state.filterSources) {
      const card = document.createElement("div");
      card.className = "source-card";
      const name = document.createElement("strong");
      name.textContent = source.name;
      const kind = document.createElement("span");
      kind.textContent = `${source.kind} - ${source.id}`;
      card.title = source.url;
      card.append(name, kind);
      fields.filterSourceList.append(card);
    }
  }

  function renderRulesets() {
    fields.rulesetToggleList.textContent = "";
    for (const ruleset of state.rulesetStatus?.rulesets || []) {
      const label = document.createElement("label");
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = ruleset.name;
      const meta = document.createElement("small");
      meta.textContent = `${ruleset.category} - ${ruleset.meta?.ruleCount || 0}`;
      text.append(title, meta);
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(ruleset.enabled);
      checkbox.addEventListener("change", async () => {
        await chrome.runtime.sendMessage({
          type: "SET_RULESET_ENABLED",
          rulesetId: ruleset.id,
          enabled: checkbox.checked
        });
        await boot();
      });
      label.append(text, checkbox);
      fields.rulesetToggleList.append(label);
    }
    const available = state.rulesetStatus?.availableStaticRuleCount;
    fields.quotaStatus.textContent = available === null || available === undefined
      ? ""
      : `Available static rule count: ${available}`;
  }

  function renderRemoteStatus() {
    const copy = labels[state.language];
    const remote = state.remote || {};
    if (remote.lastStatus === "ok") {
      fields.remoteStatus.textContent = `${copy.updateOk}: ${remote.ruleCount || 0}`;
    } else if (remote.lastStatus === "failed") {
      fields.remoteStatus.textContent = `${copy.updateFailed}: ${remote.lastError || ""}`;
    } else if (remote.lastStatus === "missing-url") {
      fields.remoteStatus.textContent = copy.updateMissing;
    } else {
      fields.remoteStatus.textContent = copy.never;
    }
  }

  async function changeLanguage(language) {
    state.language = language;
    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      settings: { language }
    });
    await boot();
  }

  async function save(event) {
    event.preventDefault();
    const settings = {
      language: state.language,
      protectionEnabled: fields.protectionEnabled.checked,
      badgeEnabled: fields.badgeEnabled.checked,
      pageWarnings: fields.pageWarnings.checked,
      networkDefaultEnabled: fields.networkDefaultEnabled.checked,
      cosmeticDefaultEnabled: fields.cosmeticDefaultEnabled.checked,
      cookieHelperDefaultEnabled: fields.cookieHelperDefaultEnabled.checked,
      cookieMode: fields.cookieMode.value,
      remoteRulesEnabled: fields.remoteRulesEnabled.checked,
      remoteRulesUrl: fields.remoteRulesUrl.value.trim(),
      remoteUpdateIntervalHours: Number(fields.remoteUpdateIntervalHours.value || 24)
    };
    const siteRules = {
      disabledHosts: toLines(fields.disabledHosts.value),
      blockedHosts: toLines(fields.blockedHosts.value),
      scopedHosts: state.siteRules.scopedHosts || {}
    };
    const settingsResponse = await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings });
    const siteRulesResponse = await chrome.runtime.sendMessage({ type: "SAVE_SITE_RULES", siteRules });
    if (settingsResponse?.ok && siteRulesResponse?.ok) {
      fields.saveStatus.textContent = labels[state.language].saved;
      window.setTimeout(() => {
        fields.saveStatus.textContent = "";
      }, 1500);
      await boot();
    }
  }

  async function runRemoteUpdate() {
    fields.runUpdateButton.disabled = true;
    fields.remoteStatus.textContent = "...";
    const response = await chrome.runtime.sendMessage({ type: "RUN_REMOTE_UPDATE" });
    fields.runUpdateButton.disabled = false;
    if (response?.ok) {
      fields.remoteStatus.textContent = `${labels[state.language].updateOk}: ${response.ruleCount || 0}`;
    } else if (response?.status === "missing-url") {
      fields.remoteStatus.textContent = labels[state.language].updateMissing;
    } else {
      fields.remoteStatus.textContent = `${labels[state.language].updateFailed}: ${response?.error || ""}`;
    }
  }

  function toLines(value) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean);
  }
})();
