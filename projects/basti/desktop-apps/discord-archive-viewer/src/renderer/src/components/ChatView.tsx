import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AttachmentModel, ChannelModel, MessageModel } from '../../../shared/types';
import { MessageView } from './Message';
import { dayKey, formatDayLabel, classifyFileName } from '../format';

export type AttachmentFilter = 'all' | 'images' | 'videos' | 'audio' | 'files';

export interface SavedScroll {
  anchorMessageId: string | null;  // ID der mittigen sichtbaren Nachricht
  anchorOffset: number;             // Pixel-Offset relativ zum Anker
  atBottom: boolean;
}

interface Props {
  channel: ChannelModel | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  highlightMessageId: string | null;
  searchHighlight: string;
  attachmentFilter: AttachmentFilter;
  onAttachmentFilter: (f: AttachmentFilter) => void;
  jumpToDate: string;
  onJumpToDate: (s: string) => void;
  hideBots: boolean;
  groupConsecutive: boolean;
  showAuthorColors: boolean;
  showProgress: boolean;
  timeFormat: '24h' | '12h';
  restoreScrollPosition: boolean;
  onOpenHtml: () => void;
  onOpenWebsite: () => void;
  onOpenChannelFolder: () => void;
  onOpenStats: () => void;
  onOpenGallery: () => void;
  onExportMarkdown: () => void;
  onLightbox: (url: string) => void;
  onMessageContext: (e: React.MouseEvent, message: MessageModel, attachment?: AttachmentModel) => void;
  getSavedScroll: (channelId: string) => SavedScroll | null;
  saveScroll: (channelId: string, scroll: SavedScroll) => void;
}

export function ChatView({
  channel, loading, error, warnings, highlightMessageId, searchHighlight,
  attachmentFilter, onAttachmentFilter, jumpToDate, onJumpToDate,
  hideBots, groupConsecutive, showAuthorColors, showProgress, timeFormat,
  restoreScrollPosition,
  onOpenHtml, onOpenWebsite, onOpenChannelFolder, onOpenStats, onOpenGallery, onExportMarkdown,
  onLightbox, onMessageContext, getSavedScroll, saveScroll,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // stickToBottom = true → bei Layout-Änderungen ans Ende
  const stickToBottomRef = useRef(true);
  // anchor → wir wollen zu einer Nachricht scrollen, hält den Stick aus
  const anchorTargetRef = useRef<{ id: string; offset: number; expiresAt: number } | null>(null);
  // Während wir restoren, nicht überschreiben
  const suppressSaveRef = useRef(false);
  const [progress, setProgress] = useState(0);

  const filtered = useMemo(() => {
    if (!channel) return [];
    let list = channel.messages;
    if (hideBots) list = list.filter((m) => !/bot$/i.test(m.authorName) && !m.authorName.toLowerCase().includes(' bot'));
    if (attachmentFilter !== 'all') {
      list = list.filter((m) => m.attachments.some((a) => {
        const k = classifyFileName(a.fileName || a.url);
        if (attachmentFilter === 'images') return k === 'image' || k === 'gif';
        if (attachmentFilter === 'videos') return k === 'video';
        if (attachmentFilter === 'audio') return k === 'audio';
        if (attachmentFilter === 'files') return k === 'file';
        return true;
      }));
    }
    return list;
  }, [channel, attachmentFilter, hideBots]);

  const items = useMemo(() => {
    type Item = { kind: 'div'; key: string; label: string }
              | { kind: 'msg'; msg: MessageModel; grouped: boolean };
    const list: Item[] = [];
    let lastKey = '';
    let lastAuthor = '';
    let lastTs = 0;
    for (const m of filtered) {
      const k = dayKey(m.timestamp);
      if (k !== lastKey) {
        list.push({ kind: 'div', key: k, label: formatDayLabel(m.timestamp) });
        lastKey = k;
        lastAuthor = '';
      }
      const t = m.timestamp ? Date.parse(m.timestamp) : 0;
      const grouped = groupConsecutive && lastAuthor === m.authorName && t - lastTs < 7 * 60_000 && !m.replyTo;
      list.push({ kind: 'msg', msg: m, grouped });
      lastAuthor = m.authorName;
      lastTs = t;
    }
    return list;
  }, [filtered, groupConsecutive]);

  // Findet die ID der sichtbaren Anker-Nachricht (mittig)
  const computeAnchor = (): { id: string; offset: number; atBottom: boolean } | null => {
    const el = scrollRef.current;
    if (!el || !channel) return null;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    const middleY = el.scrollTop + el.clientHeight / 2;
    let bestId: string | null = null;
    let bestDist = Infinity;
    let bestOffset = 0;
    for (const [id, mEl] of messageRefs.current.entries()) {
      const top = mEl.offsetTop;
      const dist = Math.abs(top - middleY);
      if (dist < bestDist) { bestDist = dist; bestId = id; bestOffset = top - el.scrollTop; }
    }
    if (!bestId) return null;
    return { id: bestId, offset: bestOffset, atBottom };
  };

  const restoreToAnchor = (anchor: SavedScroll) => {
    const el = scrollRef.current;
    if (!el) return;
    suppressSaveRef.current = true;
    if (anchor.atBottom) {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
    } else if (anchor.anchorMessageId) {
      const mEl = messageRefs.current.get(anchor.anchorMessageId);
      if (mEl) {
        el.scrollTop = mEl.offsetTop - anchor.anchorOffset;
        stickToBottomRef.current = false;
        anchorTargetRef.current = {
          id: anchor.anchorMessageId,
          offset: anchor.anchorOffset,
          expiresAt: Date.now() + 4000,
        };
      } else {
        el.scrollTop = el.scrollHeight;
        stickToBottomRef.current = true;
      }
    } else {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
    }
    // Save-Suppression bald wieder freigeben (nach allen pending Scroll-Events)
    setTimeout(() => { suppressSaveRef.current = false; }, 200);
  };

  // Channel-Wechsel: Anker wiederherstellen oder ans Ende
  useLayoutEffect(() => {
    if (!channel) return;
    const el = scrollRef.current;
    if (!el) return;
    const saved = restoreScrollPosition ? getSavedScroll(channel.id) : null;
    if (saved) {
      restoreToAnchor(saved);
    } else {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
      anchorTargetRef.current = null;
    }
  }, [channel?.id, getSavedScroll, restoreScrollPosition]);

  // ResizeObserver: solange ein Anker aktiv ist, halte die Position auf dem Anker.
  // Solange sticky aktiv, halte am Ende.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reapply = () => {
      const a = anchorTargetRef.current;
      if (a && Date.now() < a.expiresAt) {
        const mEl = messageRefs.current.get(a.id);
        if (mEl) el.scrollTop = mEl.offsetTop - a.offset;
        return;
      }
      anchorTargetRef.current = null;
      if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    };
    const ro = new ResizeObserver(reapply);
    ro.observe(el);
    // Auch beim Image-Load (deren Größe ändert sich)
    const onLoad = () => reapply();
    el.addEventListener('load', onLoad, true);
    return () => { ro.disconnect(); el.removeEventListener('load', onLoad, true); };
  }, [channel?.id]);

  // User-Scroll → Anker speichern. Wir speichern bei JEDEM Scroll-Event
  // (außer der Scroll wurde durch unseren eigenen Restore ausgelöst,
  // erkennbar am suppressSaveRef Flag oder einem aktiven anchorTarget).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !channel) return;

    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      stickToBottomRef.current = atBottom;

      if (showProgress) {
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
      }

      // Während wir aktiv zu einem Anker scrollen, NICHT überschreiben
      if (suppressSaveRef.current) return;
      if (anchorTargetRef.current && Date.now() < anchorTargetRef.current.expiresAt) return;

      const a = computeAnchor();
      if (a) {
        saveScroll(channel.id, {
          anchorMessageId: a.id,
          anchorOffset: a.offset,
          atBottom: a.atBottom,
        });
      }
    };

    // Wenn der User selbst scrollt, lösche den Anker, damit er nicht zurückspringt
    const onUserInteract = () => {
      anchorTargetRef.current = null;
    };

    el.addEventListener('wheel', onUserInteract, { passive: true });
    el.addEventListener('keydown', onUserInteract);
    el.addEventListener('mousedown', onUserInteract);
    el.addEventListener('touchstart', onUserInteract, { passive: true });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('wheel', onUserInteract);
      el.removeEventListener('keydown', onUserInteract);
      el.removeEventListener('mousedown', onUserInteract);
      el.removeEventListener('touchstart', onUserInteract);
      el.removeEventListener('scroll', onScroll);
    };
  }, [channel?.id, saveScroll, showProgress]);

  useEffect(() => {
    if (!highlightMessageId || !channel) return;
    const el = messageRefs.current.get(highlightMessageId);
    if (el && scrollRef.current) {
      stickToBottomRef.current = false;
      // Anker auf die hervorgehobene Nachricht setzen, damit Re-Layouts uns nicht wegschieben.
      anchorTargetRef.current = {
        id: highlightMessageId,
        offset: scrollRef.current.clientHeight / 2,
        expiresAt: Date.now() + 3000,
      };
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightMessageId, channel]);

  useEffect(() => {
    if (!jumpToDate || !channel) return;
    const target = new Date(jumpToDate + 'T00:00:00').getTime();
    let bestEl: HTMLDivElement | null = null;
    let bestDelta = Infinity;
    let bestId = '';
    for (const m of channel.messages) {
      if (!m.timestamp) continue;
      const t = Date.parse(m.timestamp);
      if (Number.isNaN(t)) continue;
      const d = Math.abs(t - target);
      if (d < bestDelta) {
        const el = messageRefs.current.get(m.id);
        if (el) { bestDelta = d; bestEl = el; bestId = m.id; }
      }
    }
    if (bestEl && scrollRef.current) {
      stickToBottomRef.current = false;
      anchorTargetRef.current = {
        id: bestId,
        offset: scrollRef.current.clientHeight / 2,
        expiresAt: Date.now() + 3000,
      };
      bestEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [jumpToDate, channel]);

  const setMessageRef = (id: string, el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el);
    else messageRefs.current.delete(id);
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      stickToBottomRef.current = false;
      anchorTargetRef.current = null;
      scrollRef.current.scrollTop = 0;
    }
  };
  const scrollToBottom = () => {
    if (scrollRef.current) {
      stickToBottomRef.current = true;
      anchorTargetRef.current = null;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <section className="main">
      <header className="main-header">
        <div className="main-header-title">
          <span className="hash" />
          {channel ? channel.channelName : 'Kein Channel'}
        </div>
        {channel && <div className="main-header-sub">{channel.guildName || ''} · {channel.messageCount} Nachrichten</div>}
        <div className="main-header-actions">
          <button className="btn secondary" onClick={onOpenStats} disabled={!channel} title="Statistik (Strg+I)">📊 Statistik</button>
          <button className="btn secondary" onClick={onOpenGallery} disabled={!channel} title="Galerie (Strg+G)">🖼 Galerie</button>
          <button className="btn secondary" onClick={onOpenChannelFolder} disabled={!channel} title="Ordner im Explorer">📁 Ordner</button>
          <button className="btn secondary" onClick={onExportMarkdown} disabled={!channel} title="Als Markdown exportieren">📝 MD</button>
          <button className="btn secondary" onClick={scrollToTop} disabled={!channel}>↑ Anfang</button>
          <button className="btn secondary" onClick={scrollToBottom} disabled={!channel}>↓ Ende</button>
          <button className="btn" onClick={onOpenHtml} disabled={!channel} title="HTML im Browser öffnen (Strg+B)">🌐 HTML</button>
          <button className="btn" onClick={onOpenWebsite} disabled={!channel} title="Eigene Website mit allen Funktionen (Strg+W)">✨ Website</button>
        </div>
      </header>

      {channel && (
        <div className="filter-bar">
          <span className="label">Anhänge:</span>
          {(['all', 'images', 'videos', 'audio', 'files'] as const).map((f) => (
            <button
              key={f}
              className={`chip ${attachmentFilter === f ? 'active' : ''}`}
              onClick={() => onAttachmentFilter(f)}
            >
              {f === 'all' ? 'Alle' : f === 'images' ? '🖼 Bilder/GIF' : f === 'videos' ? '🎬 Video' : f === 'audio' ? '🎵 Audio' : '📄 Dateien'}
            </button>
          ))}
          <span className="label" style={{ marginLeft: 12 }}>Springe zu:</span>
          <input
            type="date"
            value={jumpToDate}
            onChange={(e) => onJumpToDate(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
          />
        </div>
      )}

      {warnings.length > 0 && <div className="banner">⚠ {warnings.join(' · ')}</div>}
      {error && <div className="banner error">Fehler: {error}</div>}

      <div className="message-area" ref={scrollRef}>
        {showProgress && progress > 0 && (
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        )}
        {!channel && !loading && (
          <div className="empty-state">
            <div className="big">💬</div>
            <div>Wähle links einen Channel aus.</div>
            <div style={{ fontSize: 12 }}>
              <span className="kbd">Strg</span>+<span className="kbd">F</span> Suche · <span className="kbd">Strg</span>+<span className="kbd">,</span> Einstellungen · <span className="kbd">Strg</span>+<span className="kbd">W</span> Website
            </div>
          </div>
        )}
        {channel && filtered.length === 0 && attachmentFilter !== 'all' && (
          <div className="empty-state">Keine Nachrichten mit Anhängen dieses Typs.</div>
        )}
        {channel && channel.messages.length === 0 && (
          <div className="empty-state">Dieser Channel enthält keine Nachrichten.</div>
        )}
        {items.map((it, idx) => it.kind === 'div' ? (
          <div className="day-divider" key={`div-${it.key}-${idx}`}>
            <div className="line" />
            <span>{it.label}</span>
            <div className="line" />
          </div>
        ) : (
          <MessageView
            key={it.msg.id}
            message={it.msg}
            channelId={channel!.id}
            highlight={highlightMessageId === it.msg.id}
            searchHighlight={searchHighlight}
            grouped={it.grouped}
            showAuthorColor={showAuthorColors}
            timeFormat={timeFormat}
            onMessageRef={setMessageRef}
            onLightbox={onLightbox}
            onContext={onMessageContext}
          />
        ))}
      </div>

      {channel && (
        <div className="scroll-buttons">
          <button className="scroll-btn" onClick={scrollToTop} title="Zum Anfang">↑</button>
          <button className="scroll-btn" onClick={scrollToBottom} title="Nach unten">↓</button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="spinner" />
              <div>Lade Channel…</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
