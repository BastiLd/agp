export const WEB_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeHostInput(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  try {
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (!url.hostname) {
      return "";
    }
    return stripCommonPrefix(url.hostname);
  } catch {
    return "";
  }
}

export function getHostFromUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (!WEB_PROTOCOLS.has(parsed.protocol)) {
      return "";
    }
    return stripCommonPrefix(parsed.hostname);
  } catch {
    return "";
  }
}

export function shouldDeleteUrlFromHistory(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return WEB_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function hostMatchesScope(host, scopeHost, includeFamily = true) {
  if (!host || !scopeHost) {
    return false;
  }

  if (host === scopeHost) {
    return true;
  }

  return includeFamily ? host.endsWith(`.${scopeHost}`) : false;
}

export function findMatchingSiteRule(siteRules, host) {
  if (!host || !Array.isArray(siteRules)) {
    return null;
  }

  let bestMatch = null;
  for (const rule of siteRules) {
    if (!rule?.scopeHost) {
      continue;
    }

    if (!hostMatchesScope(host, rule.scopeHost, Boolean(rule.blockSameSiteFamily))) {
      continue;
    }

    if (!bestMatch || rule.scopeHost.length > bestMatch.scopeHost.length) {
      bestMatch = rule;
    }
  }

  return bestMatch;
}

export function buildRuleLabel(host) {
  return host;
}

function stripCommonPrefix(hostname) {
  return hostname.replace(/^www\./, "");
}
