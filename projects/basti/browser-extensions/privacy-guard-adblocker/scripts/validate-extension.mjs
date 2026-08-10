import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = await readJson("manifest.json");
const errors = [];

await checkPath("manifest.json");
await checkPath(manifest.background?.service_worker);
await checkPath(manifest.action?.default_popup);
await checkPath(manifest.options_ui?.page);

for (const [size, path] of Object.entries(manifest.icons || {})) {
  if (!/^\d+$/.test(size)) {
    errors.push(`Invalid icon size key: ${size}`);
  }
  await checkPath(path);
}

for (const script of manifest.content_scripts || []) {
  for (const path of script.js || []) {
    await checkPath(path);
  }
  for (const path of script.css || []) {
    await checkPath(path);
  }
}

for (const ruleset of manifest.declarative_net_request?.rule_resources || []) {
  await validateRuleset(ruleset.path, ruleset.id);
}

await validateMetadata();
await validateCosmeticJson();
await validateLocales();

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Extension validation passed.");

async function validateRuleset(path, rulesetId) {
  const rules = await readJson(path);
  if (!Array.isArray(rules)) {
    errors.push(`${path} must contain a JSON array.`);
    return;
  }
  const ids = new Set();
  for (const [index, rule] of rules.entries()) {
    const label = `${path}[${index}]`;
    if (!Number.isInteger(rule.id) || rule.id <= 0) {
      errors.push(`${label} has invalid id.`);
    }
    const expectedStart = expectedIdStart(rulesetId);
    if (expectedStart && (rule.id < expectedStart || rule.id >= expectedStart + 500000)) {
      errors.push(`${label} id ${rule.id} is outside expected range ${expectedStart}-${expectedStart + 499999}.`);
    }
    if (ids.has(rule.id)) {
      errors.push(`${label} duplicates id ${rule.id}.`);
    }
    ids.add(rule.id);
    if (!rule.action?.type) {
      errors.push(`${label} is missing action.type.`);
    }
    if (!rule.condition || typeof rule.condition !== "object") {
      errors.push(`${label} is missing condition.`);
    }
    if (rule.condition?.resourceTypes && !Array.isArray(rule.condition.resourceTypes)) {
      errors.push(`${label} resourceTypes must be an array.`);
    }
    if (!rule.condition?.urlFilter && !rule.condition?.regexFilter && !rule.condition?.requestDomains) {
      errors.push(`${label} needs urlFilter, regexFilter, or requestDomains.`);
    }
  }
  if (!rules.length) {
    errors.push(`${rulesetId} has no rules.`);
  }
}

async function validateMetadata() {
  const meta = await readJson("metadata/ruleset-meta.json");
  const report = await readJson("metadata/conversion-report.json");
  if (!meta || !report) {
    return;
  }
  for (const ruleset of manifest.declarative_net_request?.rule_resources || []) {
    if (!meta[ruleset.id]) {
      errors.push(`metadata/ruleset-meta.json is missing ${ruleset.id}.`);
    }
  }
  await checkPath("metadata/rule-map.jsonl");
}

async function validateCosmeticJson() {
  const index = await readJson("cosmetic/cosmetic-index.json");
  const exceptions = await readJson("cosmetic/cosmetic-exceptions.json");
  if (!index || !exceptions) {
    return;
  }
  for (const [path, value] of [["cosmetic-index", index], ["cosmetic-exceptions", exceptions]]) {
    for (const [domain, selectors] of Object.entries(value)) {
      if (!Array.isArray(selectors)) {
        errors.push(`${path}: ${domain} must contain an array of selectors.`);
      }
    }
  }
}

function expectedIdStart(rulesetId) {
  return {
    ads_static: 1000000,
    regional_de_static: 1400000,
    privacy_static: 1500000,
    security_static: 2000000,
    url_tracking_static: 2500000,
    cookies_static: 2600000,
    annoyances_static: 2700000,
    youtube_static: 2800000,
    security_plus_static: 2900000
  }[rulesetId] || 0;
}

async function validateLocales() {
  const localeNames = Object.keys(manifest.default_locale ? { [manifest.default_locale]: true, de: true } : {});
  for (const locale of localeNames) {
    const messages = await readJson(`_locales/${locale}/messages.json`);
    if (!messages.extensionName?.message || !messages.extensionDescription?.message) {
      errors.push(`Locale ${locale} must define extensionName and extensionDescription.`);
    }
  }
}

async function checkPath(path) {
  if (!path) {
    errors.push("Missing path in manifest.");
    return;
  }
  try {
    await access(join(root, path));
  } catch {
    errors.push(`Missing file: ${path}`);
  }
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(join(root, path), "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${path}: ${error.message}`);
    return null;
  }
}
