import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import type { MessageModel, AttachmentModel } from '../../../shared/types';
import { classifyFileName, getInitials, humanFileSize } from '../format';

interface Props {
  message: MessageModel;
  channelId: string;
  highlight: boolean;
  grouped: boolean;
  searchHighlight: string;
  showAuthorColor: boolean;
  timeFormat: '24h' | '12h';
  onMessageRef?: (id: string, el: HTMLDivElement | null) => void;
  onLightbox: (url: string) => void;
  onContext: (e: React.MouseEvent, message: MessageModel, attachment?: AttachmentModel) => void;
}

function formatTimestamp(iso: string | null, fmt: '24h' | '12h'): string {
  if (!iso) return 'Unbekannter Zeitpunkt';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: fmt === '12h',
  });
}

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

function highlightHtml(html: string, query: string): string {
  if (!query) return html;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safe})`, 'gi');
  return html.replace(/(<[^>]+>)|([^<]+)/g, (_, tag, text) => {
    if (tag) return tag;
    return (text as string).replace(re, '<mark class="search">$1</mark>');
  });
}

function MarkdownContent({ text, highlight }: { text: string; highlight: string }) {
  if (!text) return null;
  let html = '';
  try { html = marked.parse(text, { breaks: true, gfm: true, async: false }) as string; }
  catch { html = text; }
  const finalHtml = highlight ? highlightHtml(html, highlight) : html;
  return <div className="message-content" dangerouslySetInnerHTML={{ __html: finalHtml }} />;
}

function AttachmentView({
  att, channelId, onLightbox, onContext,
}: {
  att: AttachmentModel;
  channelId: string;
  onLightbox: (url: string) => void;
  onContext: (e: React.MouseEvent, att: AttachmentModel) => void;
}) {
  const [resolved, setResolved] = useState<{ exists: boolean; fileUrl?: string; absolutePath?: string } | null>(() => {
    if (att.localPath) return { exists: true, fileUrl: `media://localfile/?p=${encodeURIComponent(att.localPath)}`, absolutePath: att.localPath };
    return null;
  });

  useEffect(() => {
    let mounted = true;
    if (att.localPath) {
      const fileUrl = `media://localfile/?p=${encodeURIComponent(att.localPath)}`;
      if (mounted) setResolved({ exists: true, fileUrl, absolutePath: att.localPath });
      return () => { mounted = false; };
    }
    // Direkte Web-/CDN-Links (z. B. aus Discords offiziellem Datenexport) sofort verwenden,
    // ohne den Umweg über die lokale Datei-Auflösung (die Datei liegt hier nie lokal vor).
    if (/^https?:\/\//i.test(att.url)) {
      if (mounted) setResolved({ exists: true, fileUrl: att.url });
      return () => { mounted = false; };
    }
    window.api.resolveMedia(channelId, att.url || att.fileName).then((r) => {
      if (mounted) setResolved({ exists: r.exists, fileUrl: r.fileUrl, absolutePath: r.absolutePath ?? undefined });
    });
    return () => { mounted = false; };
  }, [att.localPath, att.url, att.fileName, channelId]);

  const kind = classifyFileName(att.fileName || att.url);
  const exists = resolved?.exists ?? false;
  const fileUrl = resolved?.fileUrl;
  const absolutePath = resolved?.absolutePath;

  if (!exists || !fileUrl) {
    return (
      <div className="attachment-card missing" onContextMenu={(e) => onContext(e, att)}>
        <div className="attachment-icon">⚠</div>
        <div className="attachment-info">
          <div className="attachment-name">{att.fileName || att.url || 'unbenannt'}</div>
          <div className="attachment-meta">Datei fehlt im Archiv</div>
        </div>
      </div>
    );
  }

  if (kind === 'image' || kind === 'gif') {
    return (
      <img
        className={kind === 'gif' ? 'attachment-gif' : 'attachment-image'}
        src={fileUrl}
        alt={att.fileName}
        loading="lazy"
        onClick={() => onLightbox(fileUrl)}
        onContextMenu={(e) => onContext(e, att)}
      />
    );
  }
  if (kind === 'video') return <video className="attachment-video" src={fileUrl} controls preload="metadata" onContextMenu={(e) => onContext(e, att)} />;
  if (kind === 'audio') return <audio className="attachment-audio" src={fileUrl} controls preload="metadata" onContextMenu={(e) => onContext(e, att)} />;

  return (
    <div className="attachment-card" onContextMenu={(e) => onContext(e, att)}>
      <div className="attachment-icon">📄</div>
      <div className="attachment-info">
        <div className="attachment-name" title={att.fileName}>{att.fileName || 'Datei'}</div>
        <div className="attachment-meta">{humanFileSize(att.fileSizeBytes)}</div>
      </div>
      <div className="attachment-actions">
        <button className="btn tiny" onClick={async () => {
          if (!absolutePath) return;
          const r = await window.api.openFile(absolutePath);
          if (!r.ok) alert(r.error ?? 'Konnte Datei nicht öffnen.');
        }}>Öffnen</button>
        <button className="btn tiny secondary" onClick={async () => {
          if (!absolutePath) return;
          const r = await window.api.showFileInExplorer(absolutePath);
          if (!r.ok) alert(r.error ?? 'Konnte Explorer nicht öffnen.');
        }}>Im Explorer</button>
      </div>
    </div>
  );
}

export function MessageView({
  message, channelId, highlight, grouped, searchHighlight, showAuthorColor, timeFormat,
  onMessageRef, onLightbox, onContext,
}: Props) {
  const authorColor = showAuthorColor ? colorFromName(message.authorName || '') : undefined;
  return (
    <div
      className={`message ${highlight ? 'highlight' : ''} ${grouped ? 'grouped' : ''}`}
      ref={(el) => onMessageRef?.(message.id, el)}
      data-message-id={message.id}
      onContextMenu={(e) => onContext(e, message, undefined)}
    >
      <div className="message-avatar">
        {message.authorAvatar ? (
          <img src={message.authorAvatar} alt={message.authorName} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        ) : (
          <div className="avatar-placeholder">{getInitials(message.authorName)}</div>
        )}
      </div>
      <div>
        {message.replyTo && (
          <div className="message-reply">
            <span>↩</span>
            <span className="message-reply-author">{message.replyTo.authorName || 'Unbekannt'}</span>
            <span className="message-reply-content">
              {message.replyTo.contentExcerpt || <span className="message-reply-missing">Ursprüngliche Nachricht nicht verfügbar</span>}
            </span>
          </div>
        )}
        <div className="message-header">
          <span className="message-author" style={authorColor ? { color: authorColor } : undefined}>
            {message.authorName || 'Unbekannter Autor'}
          </span>
          <span className="message-timestamp">{formatTimestamp(message.timestamp, timeFormat)}</span>
          {message.editedTimestamp && (
            <span className="message-edited">(bearbeitet {formatTimestamp(message.editedTimestamp, timeFormat)})</span>
          )}
        </div>
        <MarkdownContent text={message.content} highlight={searchHighlight} />

        {message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((att) => (
              <AttachmentView key={att.id} att={att} channelId={channelId} onLightbox={onLightbox}
                onContext={(e, a) => onContext(e, message, a)} />
            ))}
          </div>
        )}

        {message.embeds.length > 0 && (
          <div className="message-embeds">
            {message.embeds.map((emb, i) => (
              <div className="embed-card" key={i}>
                {emb.authorName && (
                  <div className="embed-author">
                    {emb.authorIconUrl && <img src={emb.authorIconUrl} alt="" />}
                    <span>{emb.authorName}</span>
                  </div>
                )}
                {emb.title && <div className="embed-title">{emb.url ? <a href={emb.url} target="_blank" rel="noreferrer">{emb.title}</a> : emb.title}</div>}
                {emb.description && <div className="embed-description">{emb.description}</div>}
                {emb.fields.length > 0 && (
                  <div className="embed-fields">
                    {emb.fields.map((f, fi) => (
                      <div key={fi}>
                        <div className="embed-field-name">{f.name}</div>
                        <div className="embed-field-value">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {emb.imageUrl && <img className="embed-image" src={emb.imageUrl} alt="" onClick={() => onLightbox(emb.imageUrl)} />}
                {emb.footerText && (
                  <div className="embed-footer">
                    {emb.footerIconUrl && <img src={emb.footerIconUrl} alt="" />}
                    <span>{emb.footerText}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className="reactions">
            {message.reactions.map((r, i) => (
              <span className="reaction" key={i}>
                {r.emojiImageUrl ? <img src={r.emojiImageUrl} alt={r.emojiName} /> : <span>{r.emojiName}</span>}
                <span>{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
