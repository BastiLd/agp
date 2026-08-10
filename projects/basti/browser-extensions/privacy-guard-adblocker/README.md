# Privacy Guard Adblocker

Chrome Manifest V3 extension that combines network blocking, cosmetic cleanup, cookie prompt handling, and tracking visibility.

## What it does

- Blocks common ad, analytics, social tracking, consent tracking, and YouTube ad endpoints with `declarativeNetRequest`.
- Includes bundled rule groups for ads, privacy, cookie notices, annoyances, YouTube, and basic security risk domains.
- Splits protection per domain into network blocking, cosmetic blocking, and cookie helper scopes.
- Shows ruleset status, quota, rule counts, and recent diagnostic hits.
- Hides visible ad slots that are left behind after network blocking.
- Detects clear cookie prompts and clicks reject/necessary-only buttons when the choice is unambiguous.
- Reports suspicious tracking through the badge, popup, local event log, and optional page warning.
- Supports German and English UI.
- Shows a lightweight animated shield mascot in the popup and options page.
- Supports domain allowlist/blocklist and optional remote DNR JSON updates.

## Load in Chrome

1. Run `npm run make-icons` once if the `icons/` folder is missing.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click "Load unpacked".
5. Select this folder: `D:\Meine Projekte\Neuer Ordner (2)`.

## Scripts

- `npm run make-icons` creates PNG extension icons.
- `npm run validate` checks manifest paths, locale files, and static DNR rules.
- `npm run validate` also checks metadata, cosmetic JSON, and expected ruleset ID ranges.
- `npm run test:rules` runs the local converter dry-run.
- `npm run update-rules` downloads EasyList/EasyPrivacy-style lists and converts supported network rules into MV3 JSON.

The converter intentionally skips unsupported Adblock Plus features such as scriptlets, extended CSS, XPath-style selectors, complex redirects, and risky broad selectors. It separates supported network rules, allow exceptions, simple `$removeparam` rules, safe domain-specific cosmetic rules, cosmetic exceptions, and unsupported samples.

Bundled/updater list sources are documented in `rules/filter-sources.json`.

Generated build metadata is stored in:

- `metadata/ruleset-meta.json`
- `metadata/conversion-report.json`
- `metadata/rule-map.jsonl`

Cosmetic rules are stored separately in:

- `cosmetic/cosmetic-index.json`
- `cosmetic/cosmetic-exceptions.json`
- `cosmetic/youtube-safe-rules.json`

## Test fixtures

Local fixture pages live in `test-pages/`:

- `ads.html`
- `tracker.html`
- `cosmetic.html`
- `cookie-onetrust.html`
- `cookie-usercentrics.html`
- `cookie-didomi.html`
- `cookie-cookiebot.html`
- `cookie-quantcast.html`
- `youtube-home.html`
- `youtube-watch.html`
- `security.html`
- `breakage.html`

## Remote rules format

The Options page can load a remote JSON file containing either:

```json
[
  {
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": "||example-ad-network.invalid^",
      "resourceTypes": ["script", "image", "xmlhttprequest"]
    }
  }
]
```

or:

```json
{
  "rules": []
}
```

Remote rules are treated as data only. The service worker accepts only `block` and `upgradeScheme` actions and rewrites IDs into the reserved remote range.

## Limits

Chrome MV3 ad blocking is rule-based and cannot guarantee blocking every ad on every website. YouTube in particular changes frequently, so this project combines DNR rules with conservative player and page cleanup instead of risky broad `googlevideo.com` blocking.
