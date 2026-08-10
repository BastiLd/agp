// ---------------------------------------------------------------------------
// comments.js — Supabase-backed comments with nested replies, realtime
// updates, a honeypot and a client-side rate limit.
//
// Requires the `public.comments` table + RLS policies from the README to exist.
// Realtime appending is best-effort; successful inserts are also rendered
// immediately so the feature works even if realtime isn't enabled.
// ---------------------------------------------------------------------------

import { COMMENT_RATE_LIMIT_MS, MAX_NAME_LEN, MAX_BODY_LEN } from './config.js';
import { t, getLanguage } from './i18n.js';
import { getSupabase } from './supabaseClient.js';

export function initComments() {
  const blocks = document.querySelectorAll('[data-comments]');
  blocks.forEach((block) => new CommentBlock(block));
}

class CommentBlock {
  constructor(root) {
    this.root = root;
    this.projectId = root.dataset.project;
    this.listEl = root.querySelector('[data-comment-list]');
    this.form = root.querySelector('[data-comment-form]');
    this.msgEl = root.querySelector('[data-form-msg]');
    this.replyIndicator = root.querySelector('[data-reply-indicator]');
    this.replyNameEl = root.querySelector('[data-reply-name]');
    this.parentInput = this.form?.querySelector('input[name="parent_id"]');
    this.seen = new Set();
    this.loaded = false;

    this.sectionId = root.closest('section')?.id;

    this.bindForm();
    this.bindReplyControls();

    // Lazy-load when this block's section becomes active (or now, if already).
    if (!this.sectionId || (location.hash || '#home').slice(1) === this.sectionId) {
      this.load();
    }
    document.addEventListener('sectionchange', (e) => {
      if (e.detail.id === this.sectionId) this.load();
    });
  }

  // ----------------------------------------------------------------- load
  async load() {
    if (this.loaded) return;
    this.loaded = true;

    const sb = getSupabase();
    if (!sb) {
      this.setListMessage(t('commentsError'), 'error');
      this.loaded = false; // allow a retry on next activation
      return;
    }

    this.setListMessage(t('commentsLoading'));
    const { data, error } = await sb
      .from('comments')
      .select('*')
      .eq('project_id', this.projectId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[comments] load failed:', error.message);
      this.setListMessage(t('commentsError'), 'error');
      this.loaded = false;
      return;
    }

    this.renderAll(data || []);
    this.subscribe(sb);
  }

  subscribe(sb) {
    try {
      sb.channel(`comments:${this.projectId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments' },
          (payload) => {
            const c = payload.new;
            if (c.project_id === this.projectId && c.status === 'visible') {
              this.appendComment(c);
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[comments] realtime unavailable:', e);
    }
  }

  // --------------------------------------------------------------- render
  renderAll(comments) {
    this.listEl.innerHTML = '';
    this.seen.clear();
    if (!comments.length) {
      this.setListMessage(t('commentsEmpty'));
      return;
    }
    // Render roots first, then children, so parents always exist.
    const byParent = new Map();
    comments.forEach((c) => {
      const key = c.parent_id || 'root';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(c);
    });
    const walk = (parentKey) => {
      (byParent.get(parentKey) || []).forEach((c) => {
        this.appendComment(c);
        walk(c.id);
      });
    };
    walk('root');
  }

  appendComment(c) {
    if (this.seen.has(c.id)) return;
    // Clear any placeholder message.
    const placeholder = this.listEl.querySelector('[data-placeholder]');
    if (placeholder) placeholder.remove();

    this.seen.add(c.id);
    const node = this.buildComment(c);

    if (c.parent_id) {
      const parentEl = this.listEl.querySelector(`[data-id="${cssEscape(c.parent_id)}"]`);
      if (parentEl) {
        let children = parentEl.querySelector('.comment-children');
        if (!children) {
          children = document.createElement('div');
          children.className = 'comment-children';
          parentEl.appendChild(children);
        }
        children.appendChild(node);
        return;
      }
      // Parent not present (yet) — fall through to top level.
    }
    this.listEl.appendChild(node);
  }

  buildComment(c) {
    const el = document.createElement('article');
    el.className = 'comment';
    el.dataset.id = c.id;

    const head = document.createElement('div');
    head.className = 'comment-head';
    const author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = c.author_name;
    const time = document.createElement('time');
    time.className = 'comment-time';
    if (c.created_at) {
      time.dateTime = c.created_at;
      time.textContent = relativeTime(c.created_at);
    }
    head.append(author, time);

    const body = document.createElement('p');
    body.className = 'comment-body';
    body.textContent = c.body;

    const actions = document.createElement('div');
    actions.className = 'comment-actions';
    const replyBtn = document.createElement('button');
    replyBtn.type = 'button';
    replyBtn.className = 'link-btn';
    replyBtn.textContent = t('formReply');
    replyBtn.addEventListener('click', () => this.startReply(c));
    actions.appendChild(replyBtn);

    el.append(head, body, actions);
    return el;
  }

  setListMessage(text, kind) {
    this.listEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'muted' + (kind === 'error' ? ' error' : '');
    p.setAttribute('data-placeholder', '');
    p.textContent = text;
    this.listEl.appendChild(p);
  }

  // ----------------------------------------------------------------- reply
  bindReplyControls() {
    this.root.querySelector('[data-cancel-reply]')?.addEventListener('click', () =>
      this.clearReply()
    );
  }

  startReply(c) {
    if (this.parentInput) this.parentInput.value = c.id;
    if (this.replyNameEl) this.replyNameEl.textContent = c.author_name;
    if (this.replyIndicator) this.replyIndicator.hidden = false;
    this.form?.querySelector('textarea')?.focus();
  }

  clearReply() {
    if (this.parentInput) this.parentInput.value = '';
    if (this.replyIndicator) this.replyIndicator.hidden = true;
  }

  // ------------------------------------------------------------------ form
  bindForm() {
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
  }

  async submit() {
    const fd = new FormData(this.form);
    const honeypot = (fd.get('website') || '').toString().trim();
    if (honeypot) {
      // Likely a bot: pretend success, do nothing.
      this.showMsg(t('commentPosted'), 'success');
      this.form.reset();
      return;
    }

    const name = (fd.get('author_name') || '').toString().trim();
    const body = (fd.get('body') || '').toString().trim();
    const parentId = (fd.get('parent_id') || '').toString().trim() || null;

    if (!name || !body) {
      this.showMsg(t('commentEmptyFields'), 'error');
      return;
    }
    if (name.length > MAX_NAME_LEN || body.length > MAX_BODY_LEN) {
      this.showMsg(t('commentEmptyFields'), 'error');
      return;
    }

    // Rate limit.
    const last = +localStorage.getItem('lastCommentTime') || 0;
    if (Date.now() - last < COMMENT_RATE_LIMIT_MS) {
      this.showMsg(t('rateLimited'), 'error');
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      this.showMsg(t('commentsError'), 'error');
      return;
    }

    const { data, error } = await sb
      .from('comments')
      .insert({
        project_id: this.projectId,
        author_name: name,
        body,
        parent_id: parentId,
        status: 'visible',
      })
      .select()
      .single();

    if (error) {
      console.warn('[comments] insert failed:', error.message);
      this.showMsg(t('commentsError'), 'error');
      return;
    }

    try {
      localStorage.setItem('lastCommentTime', String(Date.now()));
    } catch {
      /* ignore */
    }

    // Render immediately (realtime would also deliver it; appendComment dedupes).
    if (data) this.appendComment(data);
    this.form.reset();
    this.clearReply();
    this.showMsg(t('commentPosted'), 'success');
  }

  showMsg(text, kind) {
    if (!this.msgEl) return;
    this.msgEl.textContent = text;
    this.msgEl.className = 'form-msg' + (kind ? ' ' + kind : '');
    if (kind === 'success') {
      setTimeout(() => {
        if (this.msgEl.textContent === text) {
          this.msgEl.textContent = '';
          this.msgEl.className = 'form-msg';
        }
      }, 4000);
    }
  }
}

// ---------------------------------------------------------------- helpers
function relativeTime(iso) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  const rtf = new Intl.RelativeTimeFormat(getLanguage(), { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(sec) >= secs) {
      return rtf.format(-Math.round(sec / secs), unit);
    }
  }
  return rtf.format(-sec, 'second');
}

// Minimal CSS.escape fallback for attribute selectors (UUIDs are safe anyway).
function cssEscape(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, '\\$&');
}
