import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args.dryRun);
const limit = Number(args.limit || 30000);

const sources = [
  source("ads_static", "ads", "rules/ads_static.json", 1000000, args.adsFile, args.adsUrl || "https://easylist.to/easylist/easylist.txt", true),
  source("privacy_static", "privacy", "rules/privacy_static.json", 1500000, args.privacyFile, args.privacyUrl || "https://easylist.to/easylist/easyprivacy.txt", true),
  source("regional_de_static", "regional", "rules/regional_de_static.json", 1400000, args.regionalFile, args.regionalUrl || "https://easylist-downloads.adblockplus.org/easylistgermany.txt", true),
  source("security_static", "security", "rules/security_static.json", 2000000, args.securityFile, args.securityUrl || "https://raw.githubusercontent.com/hoshsadiq/adblock-nocoin-list/master/nocoin.txt", true),
  source("url_tracking_static", "url_tracking", "rules/url_tracking_static.json", 2500000, args.urlTrackingFile, args.urlTrackingUrl || "https://filters.adtidy.org/windows/filters/17.txt", false),
  source("cookies_static", "consent", "rules/cookies_static.json", 2600000, args.cookiesFile, args.cookiesUrl || "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt", true),
  source("annoyances_static", "annoyance", "rules/annoyances_static.json", 2700000, args.annoyancesFile, args.annoyancesUrl || "https://easylist.to/easylist/fanboy-annoyance.txt", true),
  source("youtube_static", "youtube", "rules/youtube_static.json", 2800000, args.youtubeFile, args.youtubeUrl || "", true),
  source("security_plus_static", "security", "rules/security_plus_static.json", 2900000, args.securityPlusFile, args.securityPlusUrl || "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/tif.mini.txt", false)
];

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  limit,
  sources: [],
  totals: {
    network: 0,
    allow: 0,
    removeparam: 0,
    cosmetic: 0,
    cosmeticExceptions: 0,
    unsupported: 0
  }
};
const ruleMap = [];
const cosmeticIndex = {};
const cosmeticExceptions = {};

for (const item of sources) {
  const text = await loadSource(item);
  if (text === null) {
    const preserved = await preserveExistingRuleset(item);
    report.sources.push(preserved.summary);
    addTotals(preserved.summary);
    ruleMap.push(...preserved.ruleMap);
    continue;
  }
  const converted = convertList(text, item, limit);
  report.sources.push(converted.summary);
  addTotals(converted.summary);
  ruleMap.push(...converted.ruleMap);
  mergeCosmetics(cosmeticIndex, converted.cosmetic);
  mergeCosmetics(cosmeticExceptions, converted.cosmeticExceptions);
  if (!dryRun) {
    await writeJson(item.output, converted.rules);
  }
}

const rulesetMeta = Object.fromEntries(report.sources.map((entry) => [
  entry.id,
  {
    name: entry.id,
    category: entry.category,
    source: entry.source,
    defaultEnabled: entry.defaultEnabled,
    ruleCount: entry.rules,
    generatedAt: report.generatedAt,
    sha256: entry.sha256,
    lastError: ""
  }
]));

if (!dryRun) {
  await writeJson("metadata/conversion-report.json", report);
  await writeJson("metadata/ruleset-meta.json", rulesetMeta);
  await writeText("metadata/rule-map.jsonl", `${ruleMap.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  await writeJson("cosmetic/cosmetic-index.json", cosmeticIndex);
  await writeJson("cosmetic/cosmetic-exceptions.json", cosmeticExceptions);
  console.log("Rules updated.");
} else {
  console.log(JSON.stringify(report, null, 2));
}

function source(id, category, output, startId, file, url, defaultEnabled) {
  return { id, category, output, startId, file, url, defaultEnabled };
}

async function loadSource(item) {
  if (item.file) {
    console.log(`Reading ${item.id} from ${item.file}`);
    return readFile(join(root, item.file), "utf8");
  }
  if (!item.url) {
    console.log(`Preserving ${item.id} from ${item.output}`);
    return null;
  }
  console.log(`Downloading ${item.id} from ${item.url}`);
  const response = await fetch(item.url);
  if (!response.ok) {
    throw new Error(`${item.id} download failed: HTTP ${response.status}`);
  }
  return response.text();
}

async function preserveExistingRuleset(item) {
  const rules = JSON.parse(await readFile(join(root, item.output), "utf8"));
  const serializedRules = JSON.stringify(rules);
  return {
    ruleMap: rules.map((rule) => ({
      id: rule.id,
      rulesetId: item.id,
      category: item.category,
      sourceLine: 0,
      sourceText: rule.condition?.urlFilter || rule.condition?.regexFilter || ""
    })),
    summary: {
      id: item.id,
      category: item.category,
      source: item.output,
      defaultEnabled: item.defaultEnabled,
      rules: rules.length,
      allow: rules.filter((rule) => rule.action?.type === "allow").length,
      removeparam: rules.filter((rule) => rule.action?.redirect?.transform?.queryTransform?.removeParams).length,
      cosmetic: 0,
      cosmeticExceptions: 0,
      unsupported: 0,
      unsupportedSamples: [],
      sha256: createHash("sha256").update(serializedRules).digest("hex")
    }
  };
}

function convertList(text, item, maxRules) {
  const rules = [];
  const ruleMapEntries = [];
  const cosmetic = {};
  const cosmeticExceptions = {};
  const unsupported = [];
  let allow = 0;
  let removeparam = 0;
  let nextId = item.startId + 1;
  const seen = new Set();

  for (const [lineIndex, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("!") || line.startsWith("[") || line.includes("badfilter")) {
      continue;
    }
    const cosmeticParsed = parseCosmetic(line);
    if (cosmeticParsed) {
      const target = cosmeticParsed.exception ? cosmeticExceptions : cosmetic;
      addCosmetic(target, cosmeticParsed.domains, cosmeticParsed.selector);
      continue;
    }
    if (line.includes("#$#") || line.includes("##+js") || line.includes("#%#") || line.includes("#?#")) {
      unsupported.push({ line, reason: "scriptlet-or-extended-css" });
      continue;
    }
    const parsed = parseNetworkRule(line);
    if (!parsed) {
      unsupported.push({ line, reason: "unsupported-network-syntax" });
      continue;
    }
    if (parsed.kind === "removeparam") {
      removeparam += 1;
    }
    if (rules.length >= maxRules) {
      unsupported.push({ line, reason: "ruleset-limit" });
      continue;
    }
    const dedupeKey = JSON.stringify(parsed.rule);
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    const id = nextId++;
    const rule = { id, ...parsed.rule };
    rules.push(rule);
    if (parsed.rule.action.type === "allow" || parsed.rule.action.type === "allowAllRequests") {
      allow += 1;
    }
    ruleMapEntries.push({
      id,
      rulesetId: item.id,
      category: item.category,
      sourceLine: lineIndex + 1,
      sourceText: line.slice(0, 300)
    });
  }

  const serializedRules = JSON.stringify(rules);
  return {
    rules,
    ruleMap: ruleMapEntries,
    cosmetic,
    cosmeticExceptions,
    summary: {
      id: item.id,
      category: item.category,
      source: item.file || item.url,
      defaultEnabled: item.defaultEnabled,
      rules: rules.length,
      allow,
      removeparam,
      cosmetic: countCosmetics(cosmetic),
      cosmeticExceptions: countCosmetics(cosmeticExceptions),
      unsupported: unsupported.length,
      unsupportedSamples: unsupported.slice(0, 8),
      sha256: createHash("sha256").update(serializedRules).digest("hex")
    }
  };
}

function parseNetworkRule(line) {
  const exception = line.startsWith("@@");
  const withoutException = exception ? line.slice(2) : line;
  const [patternPart, optionPart = ""] = withoutException.split("$", 2);
  if (patternPart && (looksLikeRegexFilter(patternPart) || patternPart.includes("#"))) {
    return null;
  }
  const options = optionPart.split(",").map((value) => value.trim()).filter(Boolean);
  const unsupported = options.some((option) =>
    /^(redirect|rewrite|csp|permissions|removeheader|replace|cookie|cname|elemhide|generichide|specifichide)/i.test(option)
  );
  if (unsupported) {
    return null;
  }
  const condition = {};
  const removeParams = [];
  for (const option of options) {
    const lower = option.toLowerCase();
    if (lower === "third-party") {
      condition.domainType = "thirdParty";
    } else if (lower === "~third-party") {
      condition.domainType = "firstParty";
    } else if (lower.startsWith("domain=")) {
      const domains = lower.slice(7).split("|").filter((value) => value && !value.startsWith("~"));
      if (domains.length) {
        condition.initiatorDomains = domains.map(cleanDomain).filter(Boolean);
      }
    } else if (lower.startsWith("removeparam=")) {
      const value = option.slice(option.indexOf("=") + 1);
      if (/^[a-z0-9_.-]+$/i.test(value)) {
        removeParams.push(value);
      }
    }
  }
  condition.resourceTypes = mapResourceTypes(options);
  const urlFilter = normalizeUrlFilter(patternPart || "|http");
  if (!urlFilter) {
    return null;
  }
  condition.urlFilter = urlFilter;

  if (removeParams.length && !exception) {
    return {
      kind: "removeparam",
      rule: {
        priority: 2000,
        action: {
          type: "redirect",
          redirect: {
            transform: {
              queryTransform: {
                removeParams
              }
            }
          }
        },
        condition: {
          ...condition,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      }
    };
  }

  return {
    kind: exception ? "allow" : "block",
    rule: {
      priority: exception ? 9000 : 1000,
      action: { type: exception ? "allow" : "block" },
      condition
    }
  };
}

function parseCosmetic(line) {
  const exceptionIndex = line.indexOf("#@#");
  const hideIndex = line.indexOf("##");
  const markerIndex = exceptionIndex >= 0 ? exceptionIndex : hideIndex;
  if (markerIndex < 0) {
    return null;
  }
  const marker = exceptionIndex >= 0 ? "#@#" : "##";
  const domainPart = line.slice(0, markerIndex).trim();
  const selector = line.slice(markerIndex + marker.length).trim();
  if (!domainPart || !isSafeSelector(selector)) {
    return null;
  }
  const domains = domainPart.split(",")
    .map((domain) => cleanDomain(domain))
    .filter(Boolean)
    .filter((domain) => !domain.startsWith("~"));
  if (!domains.length) {
    return null;
  }
  return { exception: marker === "#@#", domains, selector };
}

function isSafeSelector(selector) {
  if (!selector || selector.length > 220 || /:-abp-|:has|:contains|xpath|script|style/i.test(selector)) {
    return false;
  }
  const denied = /^(html|body|main|form|button|input|#app|#root|ytd-app|ytd-page-manager|ytd-rich-grid-renderer)$/i;
  return !denied.test(selector.trim());
}

function normalizeUrlFilter(pattern) {
  let urlFilter = pattern.trim();
  if (!urlFilter || urlFilter === "*" || urlFilter.length > 1024) {
    return "";
  }
  urlFilter = urlFilter.replace(/^\|https?:\/\//, "||");
  if (!urlFilter.startsWith("||") && !urlFilter.startsWith("|") && !urlFilter.includes("/") && !urlFilter.includes("*")) {
    urlFilter = `||${urlFilter}^`;
  }
  return urlFilter;
}

function looksLikeRegexFilter(pattern) {
  return pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2;
}

function mapResourceTypes(options) {
  const selected = new Set();
  const map = {
    script: "script",
    image: "image",
    stylesheet: "stylesheet",
    css: "stylesheet",
    font: "font",
    media: "media",
    object: "object",
    subdocument: "sub_frame",
    frame: "sub_frame",
    document: "main_frame",
    popup: "main_frame",
    xmlhttprequest: "xmlhttprequest",
    xhr: "xmlhttprequest",
    websocket: "websocket",
    ping: "ping"
  };
  for (const option of options.map((value) => value.toLowerCase())) {
    if (!option.startsWith("~") && map[option]) {
      selected.add(map[option]);
    }
  }
  return selected.size ? [...selected] : ["script", "image", "sub_frame", "xmlhttprequest", "ping", "media"];
}

function cleanDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^\|\|/, "")
    .replace(/\^$/, "")
    .replace(/^\*\./, "");
}

function addCosmetic(target, domains, selector) {
  for (const domain of domains) {
    target[domain] ||= [];
    if (!target[domain].includes(selector)) {
      target[domain].push(selector);
    }
  }
}

function mergeCosmetics(target, sourceData) {
  for (const [domain, selectors] of Object.entries(sourceData)) {
    for (const selector of selectors) {
      addCosmetic(target, [domain], selector);
    }
  }
}

function countCosmetics(data) {
  return Object.values(data).reduce((total, selectors) => total + selectors.length, 0);
}

function addTotals(summary) {
  report.totals.network += summary.rules - summary.allow - summary.removeparam;
  report.totals.allow += summary.allow;
  report.totals.removeparam += summary.removeparam;
  report.totals.cosmetic += summary.cosmetic;
  report.totals.cosmeticExceptions += summary.cosmeticExceptions;
  report.totals.unsupported += summary.unsupported;
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = values[index + 1] && !values[index + 1].startsWith("--") ? values[++index] : true;
  }
  return result;
}

async function writeJson(path, value) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(path, value) {
  const fullPath = join(root, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, value, "utf8");
}
