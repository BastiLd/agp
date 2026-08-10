import { CornerDownRight, FileText, Download, FileAudio, ShieldAlert } from 'lucide-react';
import type { Message } from '../types';
import { renderMarkdown } from '../utils/markdown';
import { resolveLocalAsset, formatBytes } from '../utils/fileHelper';

interface MessageItemProps {
  message: Message;
  channelName: string;
  assetMap: Record<string, File>;
  findMessageById: (id: string) => { msg: Message; index: number } | null;
  onJumpToMessage: (index: number) => void;
  channelNames: Record<string, string>;
}

export function MessageItem({
  message,
  channelName,
  assetMap,
  findMessageById,
  onJumpToMessage,
  channelNames,
}: MessageItemProps) {
  const { author, timestamp, content, attachments, embeds, reactions, reference } = message;

  // Format Date and Time
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Heute um ${timeStr}`;
    } else if (isYesterday) {
      return `Gestern um ${timeStr}`;
    } else {
      return `${d.toLocaleDateString()} ${timeStr}`;
    }
  };

  // Find Reply Reference
  let replyTarget: { msg: Message; index: number } | null = null;
  if (reference && reference.messageId) {
    replyTarget = findMessageById(reference.messageId);
  }

  // Resolve Author Avatar
  // Avatars might also be stored in the asset folder (from exporters)
  const resolvedAvatar = resolveLocalAsset(
    `avatars/${author.name}.png`,
    author.avatarUrl,
    null,
    assetMap
  ) || author.avatarUrl;

  const authorColor = author.color || 'var(--text-normal)';

  return (
    <div className="discord-message-wrapper">
      {/* Reply indicator header */}
      {replyTarget && (
        <div className="discord-message-reply-preview">
          <CornerDownRight size={14} className="reply-hook-icon" />
          {replyTarget.msg.author.avatarUrl ? (
            <img
              src={replyTarget.msg.author.avatarUrl}
              alt={replyTarget.msg.author.name}
              className="reply-avatar"
            />
          ) : (
            <div className="reply-avatar-fallback">
              {replyTarget.msg.author.name[0]?.toUpperCase()}
            </div>
          )}
          <span 
            className="reply-user" 
            style={{ color: replyTarget.msg.author.color || 'var(--text-muted)' }}
          >
            {replyTarget.msg.author.nickname || replyTarget.msg.author.name}
          </span>
          <span 
            className="reply-content" 
            onClick={() => replyTarget && onJumpToMessage(replyTarget.index)}
            title="Klicke, um zur Original-Nachricht zu springen"
          >
            {replyTarget.msg.content ? replyTarget.msg.content : <em>[Medien/Embed-Nachricht]</em>}
          </span>
        </div>
      )}

      {/* Main message bubble */}
      <div className="discord-message-item">
        {/* User avatar on the left */}
        <div className="discord-message-avatar-container">
          {resolvedAvatar ? (
            <img 
              src={resolvedAvatar} 
              alt={author.name} 
              className="discord-message-avatar" 
              loading="lazy"
              onError={(e) => {
                // If it fails to load online avatar, show letter fallback
                (e.currentTarget as HTMLElement).style.display = 'none';
                const parent = e.currentTarget.parentNode as HTMLElement;
                if (parent) {
                  const fallback = parent.querySelector('.message-avatar-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="message-avatar-fallback" 
            style={{ display: resolvedAvatar ? 'none' : 'flex' }}
          >
            {author.name[0]?.toUpperCase()}
          </div>
        </div>

        {/* Message body */}
        <div className="discord-message-body">
          {/* Header row: username, bots, time */}
          <div className="discord-message-header">
            <span 
              className="discord-username" 
              style={{ color: authorColor }}
            >
              {author.nickname || author.name}
            </span>
            {author.isBot && <span className="discord-bot-badge">BOT</span>}
            <span className="discord-timestamp" title={new Date(timestamp).toLocaleString()}>
              {formatDate(timestamp)}
            </span>
          </div>

          {/* Message content */}
          {content && (
            <div className="discord-message-text">
              {renderMarkdown(content, message.mentions, channelNames)}
            </div>
          )}

          {/* Message attachments */}
          {attachments.length > 0 && (
            <div className="discord-attachments-grid">
              {attachments.map((att) => {
                const localUrl = resolveLocalAsset(att.fileName, att.url, channelName, assetMap);
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileName);
                const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(att.fileName);
                const isAudio = /\.(mp3|wav|ogg|m4a|flac)$/i.test(att.fileName);

                if (isImage) {
                  return (
                    <div key={att.id} className="discord-media-attachment image-attachment">
                      <a href={localUrl || undefined} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={localUrl || undefined} 
                          alt={att.fileName} 
                          className="discord-chat-img"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  );
                }

                if (isVideo) {
                  return (
                    <div key={att.id} className="discord-media-attachment video-attachment">
                      <video src={localUrl || undefined} controls className="discord-chat-video">
                        Dein Browser unterstützt HTML5 Videos nicht.
                      </video>
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div key={att.id} className="discord-audio-attachment">
                      <div className="audio-header">
                        <FileAudio size={18} />
                        <span>{att.fileName}</span>
                      </div>
                      <audio src={localUrl || undefined} controls className="discord-chat-audio" />
                    </div>
                  );
                }

                // Standard File Card attachment
                const isMissing = !localUrl;
                return (
                  <div key={att.id} className={`discord-file-card ${isMissing ? 'missing-file' : ''}`}>
                    <div className="file-card-left">
                      <FileText className="file-icon" size={32} />
                      <div className="file-info">
                        <span className="file-name" title={att.fileName}>{att.fileName}</span>
                        <span className="file-size">{formatBytes(att.fileSize)}</span>
                      </div>
                    </div>
                    {isMissing ? (
                      <div className="file-missing-badge" title="Datei fehlt im Medien-Ordner.">
                        <ShieldAlert size={16} />
                        <span>Fehlt lokal</span>
                      </div>
                    ) : (
                      <a 
                        href={localUrl} 
                        download={att.fileName}
                        className="file-download-btn"
                        title="Datei herunterladen"
                      >
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Message embeds */}
          {embeds.length > 0 && (
            <div className="discord-embeds-container">
              {embeds.map((emb, idx) => {
                const embedColor = emb.color ? emb.color : '#202225';
                
                return (
                  <div 
                    key={idx} 
                    className="discord-embed-card" 
                    style={{ borderColor: embedColor }}
                  >
                    <div className="embed-inner">
                      <div className="embed-content-wrapper">
                        {/* Embed Author */}
                        {emb.author && (
                          <div className="embed-author">
                            {emb.author.iconUrl && (
                              <img 
                                src={emb.author.iconUrl} 
                                alt={emb.author.name} 
                                className="embed-author-icon" 
                              />
                            )}
                            {emb.author.url ? (
                              <a href={emb.author.url} target="_blank" rel="noopener noreferrer" className="embed-author-name">
                                {emb.author.name}
                              </a>
                            ) : (
                              <span className="embed-author-name">{emb.author.name}</span>
                            )}
                          </div>
                        )}

                        {/* Embed Title */}
                        {emb.title && (
                          <h4 className="embed-title">
                            {emb.url ? (
                              <a href={emb.url} target="_blank" rel="noopener noreferrer">
                                {emb.title}
                              </a>
                            ) : (
                              emb.title
                            )}
                          </h4>
                        )}

                        {/* Embed Description */}
                        {emb.description && (
                          <div className="embed-description">
                            {renderMarkdown(emb.description, [], channelNames)}
                          </div>
                        )}

                        {/* Embed Fields */}
                        {emb.fields.length > 0 && (
                          <div className="embed-fields-grid">
                            {emb.fields.map((f, fIdx) => (
                              <div 
                                key={fIdx} 
                                className={`embed-field ${f.isInline ? 'inline' : 'block'}`}
                              >
                                <div className="embed-field-name">{f.name}</div>
                                <div className="embed-field-value">
                                  {renderMarkdown(f.value, [], channelNames)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Embed Thumbnail (small right image) */}
                      {emb.thumbnail && emb.thumbnail.url && (
                        <div className="embed-thumbnail-container">
                          <img 
                            src={emb.thumbnail.url} 
                            alt="thumbnail" 
                            className="embed-thumbnail-img" 
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>

                    {/* Embed Large Image */}
                    {emb.image && emb.image.url && (
                      <div className="embed-large-image-container">
                        <img 
                          src={emb.image.url} 
                          alt="embed-large" 
                          className="embed-large-img" 
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Embed Footer */}
                    {emb.footer && (
                      <div className="embed-footer">
                        {emb.footer.iconUrl && (
                          <img 
                            src={emb.footer.iconUrl} 
                            alt="footer-icon" 
                            className="embed-footer-icon" 
                          />
                        )}
                        <span className="embed-footer-text">{emb.footer.text}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reactions Row */}
          {reactions.length > 0 && (
            <div className="discord-reactions-row">
              {reactions.map((react, idx) => {
                const isCustomEmoji = react.emoji.id;
                const emojiSrc = isCustomEmoji 
                  ? `https://cdn.discordapp.com/emojis/${react.emoji.id}.${react.emoji.isAnimated ? 'gif' : 'png'}?size=32&quality=lossless`
                  : null;

                return (
                  <div key={idx} className="discord-reaction-badge" title={`Emoji: :${react.emoji.name}:`}>
                    {emojiSrc ? (
                      <img src={emojiSrc} alt={react.emoji.name} className="reaction-emoji-img" />
                    ) : (
                      <span className="reaction-emoji-text">{react.emoji.name}</span>
                    )}
                    <span className="reaction-count">{react.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default MessageItem;
