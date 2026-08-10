(function initPrivacyGuardConstants(globalScope) {
  if (globalScope.PrivacyGuardConstants) {
    return;
  }

  const STORAGE_KEYS = {
    settings: "settings",
    siteRules: "siteRules",
    stats: "stats",
    remote: "remoteRules",
    rulesetMeta: "rulesetMeta",
    debug: "debugEvents"
  };

  const DEFAULT_SETTINGS = {
    language: "de",
    protectionEnabled: true,
    cookieMode: "rejectPreferred",
    pageWarnings: true,
    badgeEnabled: true,
    networkDefaultEnabled: true,
    cosmeticDefaultEnabled: true,
    cookieHelperDefaultEnabled: true,
    rulesetDefaults: {
      ads_static: true,
      privacy_static: true,
      cookies_static: true,
      youtube_static: true,
      annoyances_static: true,
      security_static: true,
      regional_de_static: true,
      url_tracking_static: false,
      security_plus_static: false
    },
    remoteRulesEnabled: false,
    remoteRulesUrl: "",
    remoteUpdateIntervalHours: 24,
    lastRemoteUpdate: 0
  };

  const DEFAULT_SITE_RULES = {
    disabledHosts: [],
    blockedHosts: [],
    scopedHosts: {}
  };

  const RULESET_DEFINITIONS = [
    {
      id: "ads_static",
      name: "Ads Core",
      category: "ads",
      defaultEnabled: true,
      idStart: 1000000,
      source: "EasyList / bundled starter rules"
    },
    {
      id: "privacy_static",
      name: "Privacy Core",
      category: "privacy",
      defaultEnabled: true,
      idStart: 1500000,
      source: "EasyPrivacy / bundled starter rules"
    },
    {
      id: "regional_de_static",
      name: "Regional DE",
      category: "regional",
      defaultEnabled: true,
      idStart: 1400000,
      source: "EasyList Germany / curated starter rules"
    },
    {
      id: "security_static",
      name: "Security Core",
      category: "security",
      defaultEnabled: true,
      idStart: 2000000,
      source: "NoCoin + URLhaus Lite / bundled starter rules"
    },
    {
      id: "url_tracking_static",
      name: "URL Tracking",
      category: "url_tracking",
      defaultEnabled: false,
      idStart: 2500000,
      source: "AdGuard URL Tracking compatible rules"
    },
    {
      id: "cookies_static",
      name: "Cookie Notices",
      category: "consent",
      defaultEnabled: true,
      idStart: 2600000,
      source: "Fanboy Cookie Notices / curated starter rules"
    },
    {
      id: "annoyances_static",
      name: "Annoyances",
      category: "annoyance",
      defaultEnabled: true,
      idStart: 2700000,
      source: "Fanboy Annoyances / curated starter rules"
    },
    {
      id: "youtube_static",
      name: "YouTube",
      category: "youtube",
      defaultEnabled: true,
      idStart: 2800000,
      source: "YouTube network starter rules"
    },
    {
      id: "security_plus_static",
      name: "Security Plus",
      category: "security",
      defaultEnabled: false,
      idStart: 2900000,
      source: "HaGeZi TIF Mini/Medium optional slot"
    }
  ];

  const RESOURCE_TYPES = [
    "main_frame",
    "sub_frame",
    "stylesheet",
    "script",
    "image",
    "font",
    "object",
    "xmlhttprequest",
    "ping",
    "csp_report",
    "media",
    "websocket",
    "webtransport",
    "webbundle",
    "other"
  ];

  const TRACKER_SIGNATURES = [
    {
      category: "ads",
      label: "Ad network",
      domains: [
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "adservice.google.",
        "adsystem.com",
        "adnxs.com",
        "rubiconproject.com",
        "criteo.com",
        "taboola.com",
        "outbrain.com",
        "pubmatic.com",
        "openx.net",
        "yieldmo.com",
        "scorecardresearch.com",
        "moatads.com",
        "imrworldwide.com",
        "quantserve.com",
        "casalemedia.com",
        "smartadserver.com"
      ]
    },
    {
      category: "analytics",
      label: "Analytics",
      domains: [
        "google-analytics.com",
        "googletagmanager.com",
        "analytics.google.com",
        "matomo.cloud",
        "hotjar.com",
        "clarity.ms",
        "fullstory.com",
        "segment.com",
        "mixpanel.com",
        "amplitude.com",
        "plausible.io",
        "newrelic.com",
        "metrika.yandex.",
        "mc.yandex.",
        "hm.baidu.com",
        "statcounter.com"
      ]
    },
    {
      category: "social",
      label: "Social tracker",
      domains: [
        "facebook.net",
        "facebook.com/tr",
        "connect.facebook.net",
        "twitter.com/i/adsct",
        "x.com/i/adsct",
        "linkedin.com/li/",
        "snap.licdn.com",
        "tiktok.com/i18n/pixel",
        "pinterest.com/ct/"
      ]
    },
    {
      category: "fingerprinting",
      label: "Fingerprinting",
      domains: [
        "fingerprint.com",
        "fingerprintjs.com",
        "perimeterx.net",
        "datadome.co",
        "arkoselabs.com",
        "iovation.com",
        "m-pathy.com"
      ]
    },
    {
      category: "consent",
      label: "Consent tracker",
      domains: [
        "cookielaw.org",
        "cookiebot.com",
        "onetrust.com",
        "quantcast.mgr.consensu.org",
        "didomi.io",
        "usercentrics.eu",
        "consensu.org"
      ]
    }
  ];

  const COOKIE_REJECT_TEXT = [
    "alle ablehnen",
    "ablehnen",
    "nicht akzeptieren",
    "nur notwendige",
    "nur erforderliche",
    "essenzielle cookies",
    "reject all",
    "reject",
    "decline",
    "deny",
    "only necessary",
    "necessary only",
    "essential only",
    "use necessary",
    "continue without accepting",
    "refuser",
    "tout refuser",
    "solo necessari",
    "rechazar todo"
  ];

  const COOKIE_ACCEPT_TEXT = [
    "alle akzeptieren",
    "akzeptieren",
    "zustimmen",
    "accept all",
    "allow all",
    "agree",
    "i agree",
    "got it"
  ];

  const I18N = {
    de: {
      enabled: "Schutz aktiv",
      disabled: "Schutz aus",
      trackers: "Tracker",
      ads: "Werbung",
      cookies: "Cookies",
      analytics: "Analytics",
      fingerprinting: "Fingerprinting",
      social: "Social",
      consent: "Consent",
      annoyance: "Nervig",
      security: "Risiko",
      regional: "Regional",
      url_tracking: "URL-Tracking",
      youtube: "YouTube",
      noEvents: "Keine Treffer",
      options: "Optionen",
      updateRules: "Regeln aktualisieren",
      clearStats: "Statistik leeren",
      siteDisabled: "Diese Website ist freigegeben.",
      pageWarningTitle: "Tracking erkannt",
      pageWarningBody: "Diese Seite laedt auffaellige Werbe- oder Tracking-Dienste.",
      dismiss: "Schliessen",
      cookieRejected: "Cookie-Abfrage abgelehnt",
      cookieDetected: "Cookie-Abfrage erkannt",
      remoteUpdateOk: "Remote-Regeln aktualisiert",
      remoteUpdateMissing: "Keine Remote-URL gesetzt",
      remoteUpdateFailed: "Remote-Update fehlgeschlagen",
      network: "Netzwerk",
      cosmetic: "Kosmetik",
      cookieHelper: "Cookie-Helfer",
      diagnostics: "Diagnose",
      ruleSets: "Regellisten",
      quota: "Quote"
    },
    en: {
      enabled: "Protection on",
      disabled: "Protection off",
      trackers: "Trackers",
      ads: "Ads",
      cookies: "Cookies",
      analytics: "Analytics",
      fingerprinting: "Fingerprinting",
      social: "Social",
      consent: "Consent",
      annoyance: "Annoyance",
      security: "Risk",
      regional: "Regional",
      url_tracking: "URL tracking",
      youtube: "YouTube",
      noEvents: "No hits",
      options: "Options",
      updateRules: "Update rules",
      clearStats: "Clear stats",
      siteDisabled: "This website is allowlisted.",
      pageWarningTitle: "Tracking detected",
      pageWarningBody: "This page loads suspicious ad or tracking services.",
      dismiss: "Dismiss",
      cookieRejected: "Cookie prompt rejected",
      cookieDetected: "Cookie prompt detected",
      remoteUpdateOk: "Remote rules updated",
      remoteUpdateMissing: "No remote URL set",
      remoteUpdateFailed: "Remote update failed",
      network: "Network",
      cosmetic: "Cosmetic",
      cookieHelper: "Cookie helper",
      diagnostics: "Diagnostics",
      ruleSets: "Rule lists",
      quota: "Quota"
    }
  };

  globalScope.PrivacyGuardConstants = {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    DEFAULT_SITE_RULES,
    RULESET_DEFINITIONS,
    RESOURCE_TYPES,
    TRACKER_SIGNATURES,
    COOKIE_REJECT_TEXT,
    COOKIE_ACCEPT_TEXT,
    I18N
  };
})(globalThis);
