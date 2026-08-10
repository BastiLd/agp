// ---------------------------------------------------------------------------
// modEditor.js — full per-mod card editor (mod-editor.html, admins only).
//
// List of all mods → pick one → edit every content field plus the card
// layout: grid mode (drag/↑↓ block order, per-block alignment + visibility)
// or free mode (drag blocks anywhere on the card, per-block width, card
// height). The live preview uses the exact same renderer as the public page
// (renderModCard), so what you see is what visitors get. The layout is stored
// in mods.data.layout; the auth session is shared with the dashboard.
// ---------------------------------------------------------------------------

import { getSupabase } from './supabaseClient.js';
import { t, setLanguage, getLanguage } from './i18n.js';
import { renderModCard, normalizeLayout, BLOCKS } from './modsRender.js';

const ALIGNS = ['left', 'center', 'right'];

init();

function init() {
  setLanguage(getLanguage()); // localise all [data-i18n] on this page

  const sb = getSupabase();
  const loginView = document.querySelector('[data-editor-login]');
  const listView = document.querySelector('[data-editor-list]');
  const workView = document.querySelector('[data-editor-work]');
  const userEl = document.querySelector('[data-editor-user]');
  if (!sb) {
    loginView.hidden = false;
    return;
  }

  let mods = [];
  let current = null; // the mod being edited
  let layout = null; // working copy of its layout config

  // ---- auth ---------------------------------------------------------------
  const loginForm = document.querySelector('[data-editor-login-form]');
  const loginMsg = document.querySelector('[data-editor-login-msg]');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const { error } = await sb.auth.signInWithPassword({
      email: (fd.get('email') || '').toString().trim(),
      password: (fd.get('password') || '').toString(),
    });
    if (error && loginMsg) {
      loginMsg.textContent = t('adminLoginError');
      loginMsg.className = 'form-msg error';
    }
  });
  sb.auth.onAuthStateChange(() => refreshAuth());
  refreshAuth();

  async function refreshAuth() {
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;
    let isAdmin = false;
    if (user) {
      const { data: row, error } = await sb
        .from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
      isAdmin = !error && !!row;
    }
    if (userEl) userEl.textContent = isAdmin && user ? user.email : '';
    loginView.hidden = isAdmin;
    if (user && !isAdmin && loginMsg) {
      loginMsg.textContent = t('adminNotAuthorized');
      loginMsg.className = 'form-msg error';
    }
    if (isAdmin) {
      await loadMods();
      const slug = decodeURIComponent((location.hash || '').slice(1));
      const target = mods.find((m) => m.slug === slug);
      if (target) openEditor(target);
      else showList();
    } else {
      listView.hidden = true;
      workView.hidden = true;
    }
  }

  // ---- mod list -----------------------------------------------------------
  const modListEl = document.querySelector('[data-editor-mods]');

  async function loadMods() {
    const { data, error } = await sb.from('mods').select('*').order('sort').order('created_at');
    mods = error ? [] : data || [];
  }

  function showList() {
    workView.hidden = true;
    listView.hidden = false;
    location.hash = '';
    modListEl.innerHTML = '';
    if (!mods.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = t('modListEmpty');
      modListEl.appendChild(p);
      return;
    }
    mods.forEach((mod) => {
      const row = document.createElement('div');
      row.className = 'editor-mod-row' + (mod.visible ? '' : ' status-hidden');
      const icon = document.createElement(mod.icon_url ? 'img' : 'span');
      icon.className = 'mod-icon mod-icon-sm';
      if (mod.icon_url) icon.src = mod.icon_url;
      else icon.textContent = '📦';
      const name = document.createElement('strong');
      name.textContent = mod.name;
      const slug = document.createElement('span');
      slug.className = 'muted';
      slug.textContent = mod.slug;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-primary';
      edit.textContent = t('editorEdit');
      edit.addEventListener('click', () => openEditor(mod));
      row.append(icon, name, slug, edit);
      modListEl.appendChild(row);
    });
  }

  // ---- editor -------------------------------------------------------------
  const fieldsForm = document.querySelector('[data-editor-fields]');
  const blocksEl = document.querySelector('[data-editor-blocks]');
  const previewEl = document.querySelector('[data-editor-preview]');
  const modeBtns = document.querySelectorAll('[data-editor-mode]');
  const modeHint = document.querySelector('[data-editor-mode-hint]');
  const heightWrap = document.querySelector('[data-editor-height-wrap]');
  const heightInput = document.getElementById('ed-height');
  const widthsEl = document.querySelector('[data-editor-widths]');
  const dragHint = document.querySelector('[data-editor-drag-hint]');
  const saveMsg = document.querySelector('[data-editor-msg]');

  function openEditor(mod) {
    current = mod;
    layout = normalizeLayout(mod.data && mod.data.layout);
    location.hash = encodeURIComponent(mod.slug);
    listView.hidden = true;
    workView.hidden = false;
    setMsg('');

    fieldsForm.elements.name.value = mod.name || '';
    fieldsForm.elements.summary_en.value = mod.summary_en || '';
    fieldsForm.elements.summary_de.value = mod.summary_de || '';
    fieldsForm.elements.icon_url.value = mod.icon_url || '';
    fieldsForm.elements.sort.value = mod.sort ?? 0;
    fieldsForm.elements.modrinth_url.value = mod.modrinth_url || '';
    fieldsForm.elements.github_url.value = mod.github_url || '';
    fieldsForm.elements.visible.checked = !!mod.visible;
    heightInput.value = layout.height;

    renderModeUI();
    renderBlocks();
    renderPreview();
  }

  function workingMod() {
    return {
      ...current,
      name: fieldsForm.elements.name.value.trim() || current.name,
      summary_en: fieldsForm.elements.summary_en.value.trim(),
      summary_de: fieldsForm.elements.summary_de.value.trim(),
      icon_url: fieldsForm.elements.icon_url.value.trim(),
      modrinth_url: fieldsForm.elements.modrinth_url.value.trim(),
      github_url: fieldsForm.elements.github_url.value.trim(),
      data: { ...(current.data || {}), layout },
    };
  }

  function renderPreview() {
    previewEl.innerHTML = '';
    const card = renderModCard(workingMod(), {});
    previewEl.appendChild(card);
    if (layout.mode === 'free') bindFreeDrag(card);
    renderWidths();
  }

  function setMsg(text, kind) {
    if (!saveMsg) return;
    saveMsg.textContent = text;
    saveMsg.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  fieldsForm.addEventListener('input', () => renderPreview());

  // ---- mode toggle ----
  function renderModeUI() {
    modeBtns.forEach((b) => b.classList.toggle('active', b.dataset.editorMode === layout.mode));
    const free = layout.mode === 'free';
    heightWrap.hidden = !free;
    widthsEl.hidden = !free;
    dragHint.hidden = !free;
    if (modeHint) modeHint.textContent = t(free ? 'editorFreeHint' : 'editorGridHint');
  }
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      layout.mode = btn.dataset.editorMode;
      if (layout.mode === 'free') {
        // seed sensible starting positions from the current order
        let y = 4;
        layout.order.forEach((b) => {
          if (!layout.pos[b]) layout.pos[b] = { x: 4, y, w: 92 };
          y += 24;
        });
      }
      renderModeUI();
      renderBlocks();
      renderPreview();
    });
  });

  heightInput.addEventListener('input', () => {
    layout.height = Math.max(140, Math.min(700, +heightInput.value || 280));
    renderPreview();
  });

  // ---- grid: block list (drag + arrows + visibility + alignment) ----
  function renderBlocks() {
    blocksEl.innerHTML = '';
    layout.order.forEach((key, idx) => {
      const row = document.createElement('div');
      row.className = 'editor-block-row';
      row.draggable = layout.mode === 'grid';
      row.dataset.block = key;

      const grip = document.createElement('span');
      grip.className = 'editor-grip';
      grip.textContent = '⠿';

      const name = document.createElement('span');
      name.className = 'editor-block-name';
      name.textContent = t('block_' + key);

      const up = miniBtn('↑', () => moveBlock(idx, -1));
      const down = miniBtn('↓', () => moveBlock(idx, 1));
      up.disabled = idx === 0;
      down.disabled = idx === layout.order.length - 1;

      const alignSel = document.createElement('select');
      ALIGNS.forEach((a) => {
        const o = document.createElement('option');
        o.value = a;
        o.textContent = t('align_' + a);
        alignSel.appendChild(o);
      });
      alignSel.value = layout.align[key] || 'left';
      alignSel.addEventListener('change', () => {
        layout.align[key] = alignSel.value;
        renderPreview();
      });

      const vis = document.createElement('input');
      vis.type = 'checkbox';
      vis.checked = !layout.hidden.includes(key);
      vis.title = t('editorBlockVisible');
      vis.addEventListener('change', () => {
        layout.hidden = vis.checked
          ? layout.hidden.filter((b) => b !== key)
          : [...layout.hidden, key];
        renderPreview();
      });

      row.append(grip, name, up, down, alignSel, vis);

      // HTML5 drag & drop reordering (grid mode)
      row.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', key);
        row.classList.add('dragging');
      });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', (e) => e.preventDefault());
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text/plain');
        if (!from || from === key) return;
        const order = layout.order.filter((b) => b !== from);
        order.splice(order.indexOf(key), 0, from);
        layout.order = order;
        renderBlocks();
        renderPreview();
      });

      blocksEl.appendChild(row);
    });
  }
  function miniBtn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }
  function moveBlock(idx, delta) {
    const j = idx + delta;
    if (j < 0 || j >= layout.order.length) return;
    const order = [...layout.order];
    [order[idx], order[j]] = [order[j], order[idx]];
    layout.order = order;
    renderBlocks();
    renderPreview();
  }

  // ---- free mode: drag blocks on the preview + width sliders ----
  function bindFreeDrag(card) {
    card.querySelectorAll('.mod-block-free').forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const key = el.dataset.block;
        const cardRect = card.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offX = e.clientX - elRect.left;
        const offY = e.clientY - elRect.top;
        el.setPointerCapture(e.pointerId);

        const onMove = (ev) => {
          const x = ((ev.clientX - offX - cardRect.left) / cardRect.width) * 100;
          const y = ((ev.clientY - offY - cardRect.top) / cardRect.height) * 100;
          const w = (layout.pos[key] && layout.pos[key].w) || 92;
          const snap = (v) => Math.round(v / 2) * 2; // 2% grid snap
          layout.pos[key] = {
            x: Math.max(0, Math.min(100 - w, snap(x))),
            y: Math.max(0, Math.min(96, snap(y))),
            w,
          };
          el.style.left = layout.pos[key].x + '%';
          el.style.top = layout.pos[key].y + '%';
        };
        const onUp = () => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
      });
    });
  }

  function renderWidths() {
    widthsEl.innerHTML = '';
    if (layout.mode !== 'free') return;
    layout.order.forEach((key) => {
      if (layout.hidden.includes(key)) return;
      const row = document.createElement('label');
      row.className = 'editor-width-row';
      const name = document.createElement('span');
      name.textContent = t('block_' + key);
      const range = document.createElement('input');
      range.type = 'range';
      range.min = '20';
      range.max = '100';
      range.value = String((layout.pos[key] && layout.pos[key].w) || 92);
      range.addEventListener('input', () => {
        const pos = layout.pos[key] || { x: 4, y: 4, w: 92 };
        pos.w = +range.value;
        pos.x = Math.min(pos.x, 100 - pos.w);
        layout.pos[key] = pos;
        renderPreview();
      });
      row.append(name, range);
      widthsEl.appendChild(row);
    });
  }

  // ---- toolbar ----
  document.querySelector('[data-editor-back-list]')?.addEventListener('click', async () => {
    await loadMods();
    showList();
  });

  document.querySelector('[data-editor-reset]')?.addEventListener('click', () => {
    layout = normalizeLayout(null);
    heightInput.value = layout.height;
    renderModeUI();
    renderBlocks();
    renderPreview();
  });

  document.querySelector('[data-editor-save]')?.addEventListener('click', async () => {
    if (!current) return;
    const w = workingMod();
    const patch = {
      name: w.name,
      summary_en: w.summary_en,
      summary_de: w.summary_de,
      icon_url: w.icon_url || null,
      modrinth_url: w.modrinth_url || null,
      github_url: w.github_url || null,
      sort: parseInt(fieldsForm.elements.sort.value, 10) || 0,
      visible: fieldsForm.elements.visible.checked,
      data: w.data,
    };
    setMsg(t('adminLoading'));
    const { error } = await sb.from('mods').update(patch).eq('id', current.id);
    if (error) {
      setMsg(`${t('modFetchError')} ${error.message}`, 'error');
      return;
    }
    current = { ...current, ...patch };
    mods = mods.map((m) => (m.id === current.id ? current : m));
    setMsg(t('editorSaved'), 'success');
  });

  document.addEventListener('languagechange', () => {
    if (current) {
      renderModeUI();
      renderBlocks();
      renderPreview();
    } else {
      showList();
    }
  });
}
