// ---------------------------------------------------------------------------
// admin.js — owner login + private dashboard.
//
// Auth is Supabase email/password. Authorisation is enforced server-side by
// RLS via the public.admins table + is_admin() (see README SQL); the UI checks
// are only for showing/hiding the dashboard. A non-admin who reaches #admin
// just sees a login form and can do nothing useful.
//
// Dashboard shows:
//   • Stats: page views, section views, downloads (by target), game starts,
//     comment counts.
//   • Comment moderation: every comment (any status) with reply / hide / show /
//     delete actions.
// ---------------------------------------------------------------------------

import { getSupabase } from './supabaseClient.js';
import { t } from './i18n.js';
import { setAnalyticsAdmin } from './analytics.js';
import { buildModRecord } from './modsApi.js';
import { MOD_LAYOUTS } from './modsRender.js';

const ADMIN_REPLY_NAME = 'BastiLd (Mod)';

export function initAdmin() {
  const section = document.getElementById('admin');
  if (!section) return;
  const sb = getSupabase();

  const loginView = section.querySelector('[data-admin-login]');
  const dashView = section.querySelector('[data-admin-dashboard]');
  const form = section.querySelector('[data-login-form]');
  const msg = section.querySelector('[data-login-msg]');
  const logoutBtn = section.querySelector('[data-logout]');
  const refreshBtn = section.querySelector('[data-admin-refresh]');
  const statsEl = section.querySelector('[data-admin-stats]');
  const gamesEl = section.querySelector('[data-admin-games]');
  const commentsEl = section.querySelector('[data-admin-comments]');
  const navItem = document.querySelector('[data-admin-nav]');
  const modsEl = section.querySelector('[data-admin-mods]');
  const modForm = section.querySelector('[data-mod-form]');
  const modPreview = section.querySelector('[data-mod-preview]');
  const modMsg = section.querySelector('[data-mod-msg]');

  let currentUser = null;
  let isAdmin = false;

  if (!sb) {
    if (msg) {
      msg.textContent = t('commentsError');
      msg.className = 'form-msg error';
    }
    return;
  }

  // ---- auth wiring --------------------------------------------------------
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = (fd.get('email') || '').toString().trim();
    const password = (fd.get('password') || '').toString();
    setMsg(t('adminSigningIn'));
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(t('adminLoginError'), 'error');
      return;
    }
    setMsg('');
  });

  logoutBtn?.addEventListener('click', async () => {
    await sb.auth.signOut();
  });

  refreshBtn?.addEventListener('click', () => renderDashboard());

  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    refreshAuthUI();
  });
  sb.auth.getSession().then(({ data }) => {
    currentUser = data?.session?.user || null;
    refreshAuthUI();
  });

  // Re-localise dashboard if the language changes while it's open.
  document.addEventListener('languagechange', () => {
    if (isAdmin) renderDashboard();
  });

  function setMsg(text, kind) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  async function checkAdmin() {
    if (!currentUser) return false;
    const { data, error } = await sb
      .from('admins')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    return !error && !!data;
  }

  async function refreshAuthUI() {
    isAdmin = await checkAdmin();
    setAnalyticsAdmin(isAdmin);
    window.__isAdmin = isAdmin;
    if (navItem) navItem.hidden = !isAdmin;

    if (isAdmin) {
      loginView.hidden = true;
      dashView.hidden = false;
      setMsg('');
      renderDashboard();
    } else {
      loginView.hidden = false;
      dashView.hidden = true;
      if (currentUser) setMsg(t('adminNotAuthorized'), 'error');
    }
  }

  // ---- dashboard ----------------------------------------------------------
  async function renderDashboard() {
    await Promise.all([renderStats(), renderComments(), renderMods()]);
  }

  async function renderStats() {
    statsEl.innerHTML = '';
    statsEl.appendChild(makeMuted(t('adminLoading')));

    const [{ data: events, error: evErr }, { data: comments, error: cmErr }] = await Promise.all([
      sb.from('events').select('type,label,created_at'),
      sb.from('comments').select('id,status'),
    ]);

    if (evErr || cmErr) {
      statsEl.innerHTML = '';
      statsEl.appendChild(makeMuted(t('adminLoadError'), 'error'));
      if (gamesEl) gamesEl.innerHTML = '';
      return;
    }

    const evs = events || [];
    const cms = comments || [];
    const ofType = (tp) => evs.filter((e) => e.type === tp);

    const pageviews = ofType('pageview').length;
    const gameStarts = ofType('game_start').length;
    const downloads = ofType('download').length;
    const visible = cms.filter((c) => c.status === 'visible').length;
    const hidden = cms.filter((c) => c.status !== 'visible').length;

    statsEl.innerHTML = '';
    const cards = document.createElement('div');
    cards.className = 'stat-grid';
    cards.append(
      statCard(pageviews, t('statPageviews')),
      statCard(downloads, t('statDownloads')),
      statCard(gameStarts, t('statGameStarts')),
      statCard(cms.length, t('statComments')),
      statCard(visible, t('statVisible')),
      statCard(hidden, t('statHidden'))
    );
    statsEl.appendChild(cards);

    const breakdowns = document.createElement('div');
    breakdowns.className = 'breakdown-grid';
    breakdowns.append(
      breakdown(t('breakdownDownloads'), groupCount(ofType('download'), 'label')),
      breakdown(t('breakdownSections'), groupCount(ofType('section_view'), 'label'))
    );
    statsEl.appendChild(breakdowns);

    renderGames(evs);
  }

  // Games block: opens of the two Paddle Force pages + launch clicks from the
  // homepage cards (events come from game.html / game-classic.html / [data-track]).
  function renderGames(evs) {
    if (!gamesEl) return;
    const ofType = (tp) => evs.filter((e) => e.type === tp);
    const opens = ofType('game_open');
    const launches = ofType('game_launch');
    const starts = ofType('game_start');

    gamesEl.innerHTML = '';
    const cards = document.createElement('div');
    cards.className = 'stat-grid';
    cards.append(statCard(opens.length, t('statGameOpens')), statCard(starts.length, t('statGameStarts')));
    gamesEl.appendChild(cards);

    const breakdowns = document.createElement('div');
    breakdowns.className = 'breakdown-grid';
    breakdowns.append(
      breakdown(t('breakdownGameOpens'), groupCount(opens, 'label')),
      breakdown(t('breakdownGameLaunches'), groupCount(launches, 'label'))
    );
    gamesEl.appendChild(breakdowns);
  }

  async function renderComments() {
    commentsEl.innerHTML = '';
    commentsEl.appendChild(makeMuted(t('adminLoading')));

    const { data, error } = await sb
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      commentsEl.innerHTML = '';
      commentsEl.appendChild(makeMuted(t('adminLoadError'), 'error'));
      return;
    }
    commentsEl.innerHTML = '';
    if (!data || !data.length) {
      commentsEl.appendChild(makeMuted(t('adminNoComments')));
      return;
    }
    data.forEach((c) => commentsEl.appendChild(buildAdminComment(c)));
  }

  // ---- mods manager -------------------------------------------------------
  let fetchedRecord = null;

  function setModMsg(text, kind) {
    if (!modMsg) return;
    modMsg.textContent = text;
    modMsg.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  async function renderMods() {
    if (!modsEl) return;
    modsEl.innerHTML = '';
    modsEl.appendChild(makeMuted(t('adminLoading')));
    const { data, error } = await sb.from('mods').select('*').order('sort').order('created_at');
    modsEl.innerHTML = '';
    if (error) {
      modsEl.appendChild(makeMuted(t('modTableMissing'), 'error'));
      return;
    }
    if (!data || !data.length) {
      modsEl.appendChild(makeMuted(t('modListEmpty')));
      return;
    }
    data.forEach((mod) => modsEl.appendChild(buildModRow(mod)));
  }

  function buildModRow(mod) {
    const row = document.createElement('article');
    row.className = 'admin-comment mod-row' + (mod.visible ? '' : ' status-hidden');

    const head = document.createElement('div');
    head.className = 'admin-comment-head';
    if (mod.icon_url) {
      const img = document.createElement('img');
      img.src = mod.icon_url;
      img.alt = '';
      img.className = 'mod-icon mod-icon-sm';
      head.appendChild(img);
    }
    const name = document.createElement('span');
    name.className = 'comment-author';
    name.textContent = mod.name;
    const meta = document.createElement('span');
    meta.className = 'comment-time';
    meta.textContent = `${mod.slug} · ⬇ ${(mod.downloads || 0).toLocaleString()} · ${
      mod.fetched_at ? formatDate(mod.fetched_at) : '—'
    }`;
    const badge = document.createElement('span');
    badge.className = 'status-badge ' + (mod.visible ? 'visible' : 'hidden');
    badge.textContent = mod.visible ? t('status_visible') : t('status_hidden');
    head.append(name, badge, meta);

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    // Quick layout presets (where downloads/buttons sit on the public card).
    // Custom layouts from the full editor show up as "custom" here.
    const rawLayout = mod.data && mod.data.layout;
    const isCustom = !!rawLayout && typeof rawLayout === 'object';
    const layoutSel = document.createElement('select');
    layoutSel.className = 'mod-layout-select';
    layoutSel.title = t('modLayoutTitle');
    layoutSel.setAttribute('aria-label', t('modLayoutTitle'));
    Object.keys(MOD_LAYOUTS).forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = t('modLayout_' + key);
      layoutSel.appendChild(opt);
    });
    if (isCustom) {
      const opt = document.createElement('option');
      opt.value = '__custom__';
      opt.textContent = t('modLayout_custom');
      layoutSel.appendChild(opt);
      layoutSel.value = '__custom__';
    } else {
      layoutSel.value = typeof rawLayout === 'string' && MOD_LAYOUTS[rawLayout] ? rawLayout : 'standard';
    }
    layoutSel.addEventListener('change', async () => {
      if (layoutSel.value === '__custom__') return;
      const { error } = await sb
        .from('mods')
        .update({ data: { ...(mod.data || {}), layout: layoutSel.value } })
        .eq('id', mod.id);
      if (error) alert(t('adminLoadError'));
      renderMods();
    });
    actions.appendChild(layoutSel);

    // Full editor (texts, links, layout grid/free, …)
    const editLink = document.createElement('a');
    editLink.className = 'btn btn-sm btn-primary';
    editLink.href = 'mod-editor.html#' + encodeURIComponent(mod.slug);
    editLink.textContent = t('editorEdit');
    actions.appendChild(editLink);

    actions.appendChild(btn(t('modRefetch'), () => refetchMod(mod)));
    actions.appendChild(btn(mod.visible ? t('adminHide') : t('adminShow'), async () => {
      const { error } = await sb.from('mods').update({ visible: !mod.visible }).eq('id', mod.id);
      if (error) alert(t('adminLoadError'));
      renderMods();
    }));
    actions.appendChild(btn(t('adminDelete'), async () => {
      if (!confirm(t('modDeleteConfirm').replace('{n}', mod.name))) return;
      const { error } = await sb.from('mods').delete().eq('id', mod.id);
      if (error) alert(t('adminLoadError'));
      renderMods();
    }, 'danger'));

    row.append(head, actions);
    return row;
  }

  async function refetchMod(mod) {
    try {
      const { record } = await buildModRecord({
        modrinthSlug: mod.modrinth_slug,
        githubRepo: mod.github_repo,
      });
      // keep manual fields (incl. the chosen card layout), refresh the fetched ones
      const patch = {
        downloads: record.downloads,
        followers: record.followers,
        latest_version: record.latest_version,
        game_versions: record.game_versions,
        icon_url: record.icon_url || mod.icon_url,
        data: { ...record.data, layout: mod.data?.layout },
        fetched_at: record.fetched_at,
      };
      const { error } = await sb.from('mods').update(patch).eq('id', mod.id);
      if (error) throw new Error(error.message);
      renderMods();
    } catch (e) {
      alert(`${t('modFetchError')} ${e.message}`);
    }
  }

  function bindModForm() {
    if (!modForm) return;
    modForm.querySelector('[data-mod-fetch]')?.addEventListener('click', async () => {
      const fd = new FormData(modForm);
      const modrinthSlug = (fd.get('modrinth_slug') || '').toString().trim();
      const githubRepo = (fd.get('github_repo') || '').toString().trim();
      if (!modrinthSlug && !githubRepo) {
        setModMsg(t('modFetchNoSource'), 'error');
        return;
      }
      setModMsg(t('adminLoading'));
      try {
        const { record, warnings } = await buildModRecord({ modrinthSlug, githubRepo });
        fetchedRecord = record;
        modForm.querySelector('[name="name"]').value = record.name || '';
        modForm.querySelector('[name="summary_en"]').value = record.summary_en || '';
        if (modPreview) modPreview.hidden = false;
        setModMsg(warnings.length ? warnings.join(' · ') : t('modFetchOk'), warnings.length ? 'error' : 'success');
      } catch (e) {
        fetchedRecord = null;
        setModMsg(`${t('modFetchError')} ${e.message}`, 'error');
      }
    });

    modForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fetchedRecord) {
        setModMsg(t('modFetchNoSource'), 'error');
        return;
      }
      const fd = new FormData(modForm);
      const row = {
        ...fetchedRecord,
        name: (fd.get('name') || fetchedRecord.name).toString().trim(),
        summary_en: (fd.get('summary_en') || '').toString().trim(),
        summary_de: (fd.get('summary_de') || '').toString().trim(),
        sort: parseInt(fd.get('sort'), 10) || 0,
        visible: true,
      };
      const { error } = await sb.from('mods').upsert(row, { onConflict: 'slug' });
      if (error) {
        setModMsg(`${t('modFetchError')} ${error.message}`, 'error');
        return;
      }
      fetchedRecord = null;
      modForm.reset();
      if (modPreview) modPreview.hidden = true;
      setModMsg(t('modSaved'), 'success');
      renderMods();
    });
  }
  bindModForm();

  function buildAdminComment(c) {
    const row = document.createElement('article');
    row.className = 'admin-comment status-' + (c.status || 'visible');

    const head = document.createElement('div');
    head.className = 'admin-comment-head';
    const author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = c.author_name;
    const badge = document.createElement('span');
    badge.className = 'status-badge ' + (c.status || 'visible');
    badge.textContent = t('status_' + (c.status || 'visible')) || c.status;
    const proj = document.createElement('span');
    proj.className = 'comment-time';
    proj.textContent = `${c.project_id}${c.parent_id ? ' · ↪' : ''} · ${formatDate(c.created_at)}`;
    head.append(author, badge, proj);

    const body = document.createElement('p');
    body.className = 'comment-body';
    body.textContent = c.body;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const replyBtn = btn(t('adminReply'), () => toggleReply(row, c));
    actions.appendChild(replyBtn);

    if (c.status === 'visible') {
      actions.appendChild(btn(t('adminHide'), () => moderate(c.id, { status: 'hidden' })));
    } else {
      actions.appendChild(btn(t('adminShow'), () => moderate(c.id, { status: 'visible' })));
    }
    const del = btn(t('adminDelete'), () => removeComment(c.id), 'danger');
    actions.appendChild(del);

    row.append(head, body, actions);
    return row;
  }

  function toggleReply(row, c) {
    let box = row.querySelector('[data-reply-box]');
    if (box) {
      box.remove();
      return;
    }
    box = document.createElement('div');
    box.className = 'admin-reply';
    box.setAttribute('data-reply-box', '');
    const ta = document.createElement('textarea');
    ta.rows = 2;
    ta.maxLength = 1000;
    ta.placeholder = t('adminReplyPh');
    const send = btn(t('adminReplySend'), async () => {
      const text = ta.value.trim();
      if (!text) return;
      const { error } = await sb.from('comments').insert({
        project_id: c.project_id,
        author_name: ADMIN_REPLY_NAME,
        body: text,
        parent_id: c.id,
        status: 'visible',
      });
      if (error) {
        alert(t('adminLoadError'));
        return;
      }
      box.remove();
      renderComments();
    }, 'primary');
    box.append(ta, send);
    row.appendChild(box);
    ta.focus();
  }

  async function moderate(id, patch) {
    const { error } = await sb.from('comments').update(patch).eq('id', id);
    if (error) {
      alert(t('adminLoadError'));
      return;
    }
    renderDashboard();
  }

  async function removeComment(id) {
    if (!confirm(t('adminDeleteConfirm'))) return;
    const { error } = await sb.from('comments').delete().eq('id', id);
    if (error) {
      alert(t('adminLoadError'));
      return;
    }
    renderDashboard();
  }
}

// ----------------------------------------------------------------- helpers
function statCard(value, label) {
  const card = document.createElement('div');
  card.className = 'stat-card beam';
  const v = document.createElement('span');
  v.className = 'stat-value';
  v.textContent = String(value);
  const l = document.createElement('span');
  l.className = 'stat-label';
  l.textContent = label;
  card.append(v, l);
  return card;
}

function breakdown(title, counts) {
  const wrap = document.createElement('div');
  wrap.className = 'breakdown';
  const h = document.createElement('h4');
  h.textContent = title;
  wrap.appendChild(h);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    wrap.appendChild(makeMuted('—'));
    return wrap;
  }
  const ul = document.createElement('ul');
  ul.className = 'breakdown-list';
  entries.forEach(([k, n]) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = k || '(none)';
    const val = document.createElement('strong');
    val.textContent = String(n);
    li.append(name, val);
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

function groupCount(rows, key) {
  const out = {};
  rows.forEach((r) => {
    const k = r[key] || '(none)';
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

function btn(label, onClick, kind) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-sm' + (kind === 'primary' ? ' btn-primary' : kind === 'danger' ? ' btn-danger' : ' btn-ghost');
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function makeMuted(text, kind) {
  const p = document.createElement('p');
  p.className = 'muted' + (kind === 'error' ? ' error' : '');
  p.textContent = text;
  return p;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
