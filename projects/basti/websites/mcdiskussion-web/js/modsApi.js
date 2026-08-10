// ---------------------------------------------------------------------------
// modsApi.js — fetch mod metadata from the public Modrinth / GitHub APIs and
// merge it into one normalized record for the `mods` table.
//
// Only the admin editor calls these (manual actions), so unauthenticated API
// rate limits are a non-issue; visitors read the Supabase cache exclusively.
// Both APIs allow CORS from the browser.
// ---------------------------------------------------------------------------

const UA = { 'User-Agent': 'BastiLd-Mod-Hub/1.0 (github.com/BastiLd/MCDiskussionWeb)' };

/** Fetch a Modrinth project by slug (e.g. "restoreinv"). */
export async function fetchModrinth(slug) {
  const res = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}`, {
    headers: UA,
  });
  if (!res.ok) throw new Error(`Modrinth ${res.status} for "${slug}"`);
  const p = await res.json();

  // Latest version name (best effort; ignore failures).
  let latest = null;
  try {
    const vr = await fetch(
      `https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}/version`,
      { headers: UA }
    );
    if (vr.ok) {
      const versions = await vr.json();
      if (Array.isArray(versions) && versions.length) latest = versions[0].version_number;
    }
  } catch {
    /* optional */
  }

  return {
    source: 'modrinth',
    slug: p.slug,
    name: p.title,
    summary: p.description || '',
    icon_url: p.icon_url || null,
    downloads: p.downloads || 0,
    followers: p.followers || 0,
    game_versions: p.game_versions || [],
    latest_version: latest,
    url: `https://modrinth.com/mod/${p.slug}`,
    raw: { title: p.title, license: p.license?.id, categories: p.categories, updated: p.updated },
  };
}

/** Fetch a GitHub repo by "owner/repo". */
export async function fetchGithub(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers: UA });
  if (!res.ok) throw new Error(`GitHub ${res.status} for "${repo}"`);
  const r = await res.json();

  let latestRelease = null;
  try {
    const rr = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=1`, {
      headers: UA,
    });
    if (rr.ok) {
      const rel = await rr.json();
      if (Array.isArray(rel) && rel.length) latestRelease = rel[0].tag_name;
    }
  } catch {
    /* optional */
  }

  return {
    source: 'github',
    slug: (r.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: r.name,
    summary: r.description || '',
    icon_url: null,
    downloads: 0,
    followers: r.stargazers_count || 0,
    game_versions: [],
    latest_version: latestRelease,
    url: r.html_url,
    raw: { stars: r.stargazers_count, language: r.language, pushed: r.pushed_at },
  };
}

/**
 * Fetch from whichever sources are given and merge (Modrinth wins conflicts).
 * Returns a row shaped for the `public.mods` table.
 */
export async function buildModRecord({ modrinthSlug, githubRepo }) {
  if (!modrinthSlug && !githubRepo) throw new Error('No source given');

  let mr = null;
  let gh = null;
  const errors = [];
  if (modrinthSlug) {
    try { mr = await fetchModrinth(modrinthSlug.trim()); } catch (e) { errors.push(e.message); }
  }
  if (githubRepo) {
    try { gh = await fetchGithub(githubRepo.trim()); } catch (e) { errors.push(e.message); }
  }
  if (!mr && !gh) throw new Error(errors.join(' · ') || 'Fetch failed');

  const base = mr || gh;
  return {
    record: {
      slug: base.slug,
      name: base.name,
      summary_en: base.summary.split('\n')[0].slice(0, 300),
      summary_de: '',
      icon_url: mr?.icon_url || null,
      modrinth_slug: modrinthSlug?.trim() || null,
      github_repo: githubRepo?.trim() || null,
      downloads: mr?.downloads || 0,
      followers: mr?.followers ?? gh?.followers ?? 0,
      latest_version: mr?.latest_version || gh?.latest_version || null,
      game_versions: mr?.game_versions || [],
      modrinth_url: mr?.url || null,
      github_url: gh?.url || null,
      data: { modrinth: mr?.raw || null, github: gh?.raw || null },
      fetched_at: new Date().toISOString(),
    },
    warnings: errors,
  };
}
