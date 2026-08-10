import React from 'react';

interface Mention {
  id: string;
  name: string;
}

/**
 * Parses Discord content and returns styled React elements.
 * Handles:
 * - Bold (**bold**)
 * - Italics (*italics* or _italics_)
 * - Underline (__underline__)
 * - Strikethrough (~~strikethrough~~)
 * - Code blocks (```code block```)
 * - Inline code (`code`)
 * - User mentions (<@id> or <@!id>)
 * - Channel mentions (<#id>)
 * - Role mentions (<@&id>)
 * - Custom Discord Emojis (<:name:id> or <a:name:id>)
 * - Standard HTTP/S Links
 */
export function renderMarkdown(
  content: string,
  mentions: Mention[] = [],
  channelNames: Record<string, string> = {}
): React.ReactNode {
  if (!content) return null;

  // Let's create an array of tokens
  // We'll process block elements first (like code blocks) and then inline elements.
  
  // 1. Process Code Blocks
  const codeBlockRegex = /```(?:([a-zA-Z0-9+#-]+)\n)?([\s\S]*?)```/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(...renderInlineMarkdown(textBefore, mentions, channelNames));
    }

    const language = match[1] || '';
    const codeText = match[2] || '';

    parts.push(
      <pre key={`codeblock-${match.index}`} className="discord-codeblock">
        {language && <span className="discord-codeblock-lang">{language}</span>}
        <code>{codeText.trim()}</code>
      </pre>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const textRemaining = content.substring(lastIndex);
  if (textRemaining) {
    parts.push(...renderInlineMarkdown(textRemaining, mentions, channelNames));
  }

  return <>{parts}</>;
}

function renderInlineMarkdown(
  text: string,
  mentions: Mention[] = [],
  channelNames: Record<string, string> = {}
): React.ReactNode[] {
  // We will do recursive regex replacements for inline styles.
  // Instead of complex parser, we'll map tokens using key matches.
  // Standard token boundaries:
  // - Links: (https?:\/\/[^\s]+)
  // - Custom Emojis: <(a?):([a-zA-Z0-9_]+):([0-9]+)>
  // - User Mentions: <@!?([0-9]+)>
  // - Channel Mentions: <#([0-9]+)>
  // - Role Mentions: <@&([0-9]+)>
  // - Bold-Italic: \*\*\*([^*]+)\*\*\*
  // - Bold: \*\*([^*]+)\*\*
  // - Italics: \*([^*]+)\* or _([^_]+)_
  // - Underline: __([^_]+)__
  // - Strikethrough: ~~([^~]+)~~
  // - Inline Code: `([^`]+)`

  interface InlineToken {
    type: 'text' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'mention-user' | 'mention-channel' | 'emoji';
    text: string;
    extra?: string; // id, url, etc.
    animated?: boolean;
  }

  let tokens: InlineToken[] = [{ type: 'text', text }];

  // Helper to split existing text tokens by a regex
  function splitTokens(
    regex: RegExp,
    mapper: (match: RegExpExecArray) => InlineToken
  ) {
    const nextTokens: InlineToken[] = [];

    for (const token of tokens) {
      if (token.type !== 'text') {
        nextTokens.push(token);
        continue;
      }

      let lastIdx = 0;
      let m;
      // Reset regex index for safety
      regex.lastIndex = 0;

      while ((m = regex.exec(token.text)) !== null) {
        const before = token.text.substring(lastIdx, m.index);
        if (before) {
          nextTokens.push({ type: 'text', text: before });
        }

        nextTokens.push(mapper(m));
        lastIdx = regex.lastIndex;
      }

      const remaining = token.text.substring(lastIdx);
      if (remaining) {
        nextTokens.push({ type: 'text', text: remaining });
      }
    }

    tokens = nextTokens;
  }

  // 1. Split Custom Emojis: <(a?):(emoji_name):(emoji_id)>
  splitTokens(/<a?:([a-zA-Z0-9_]+):([0-9]+)>/g, (m) => {
    const isAnimated = m[0].startsWith('<a:');
    return {
      type: 'emoji',
      text: m[1],
      extra: m[2],
      animated: isAnimated,
    };
  });

  // 2. Split User Mentions: <@!?([0-9]+)>
  splitTokens(/<@!?([0-9]+)>/g, (m) => {
    const id = m[1];
    const userMention = mentions.find(men => men.id === id);
    const displayName = userMention ? `@${userMention.name}` : `@user-${id}`;
    return {
      type: 'mention-user',
      text: displayName,
      extra: id,
    };
  });

  // 3. Split Channel Mentions: <#([0-9]+)>
  splitTokens(/<#([0-9]+)>/g, (m) => {
    const id = m[1];
    const name = channelNames[id] ? `#${channelNames[id]}` : `#deleted-channel`;
    return {
      type: 'mention-channel',
      text: name,
      extra: id,
    };
  });

  // 4. Split Links
  splitTokens(/(https?:\/\/[^\s]+)/g, (m) => ({
    type: 'link',
    text: m[1],
    extra: m[1],
  }));

  // 5. Inline formatting: Inline code `code`
  splitTokens(/`([^`]+)`/g, (m) => ({
    type: 'code',
    text: m[1],
  }));

  // 6. Underline: __under__
  splitTokens(/__([^_]+)__/g, (m) => ({
    type: 'underline',
    text: m[1],
  }));

  // 7. Bold: **bold**
  splitTokens(/\*\*([^*]+)\*\*/g, (m) => ({
    type: 'bold',
    text: m[1],
  }));

  // 8. Strikethrough: ~~strike~~
  splitTokens(/~~([^~]+)~~/g, (m) => ({
    type: 'strikethrough',
    text: m[1],
  }));

  // 9. Italics: *italic*
  splitTokens(/\*([^*]+)\*/g, (m) => ({
    type: 'italic',
    text: m[1],
  }));

  // 10. Italics: _italic_
  splitTokens(/_([^_]+)_/g, (m) => ({
    type: 'italic',
    text: m[1],
  }));

  // Convert tokens to React nodes
  return tokens.map((token, i) => {
    const key = `inline-${token.type}-${i}`;

    switch (token.type) {
      case 'bold':
        return <strong key={key}>{token.text}</strong>;
      case 'italic':
        return <em key={key}>{token.text}</em>;
      case 'underline':
        return <u key={key}>{token.text}</u>;
      case 'strikethrough':
        return <del key={key}>{token.text}</del>;
      case 'code':
        return <code key={key} className="discord-inline-code">{token.text}</code>;
      case 'link':
        return (
          <a
            key={key}
            href={token.extra}
            target="_blank"
            rel="noopener noreferrer"
            className="discord-link"
          >
            {token.text}
          </a>
        );
      case 'mention-user':
        return (
          <span key={key} className="discord-mention" title={`User ID: ${token.extra}`}>
            {token.text}
          </span>
        );
      case 'mention-channel':
        return (
          <span key={key} className="discord-mention" title={`Channel ID: ${token.extra}`}>
            {token.text}
          </span>
        );
      case 'emoji': {
        const emojiUrl = `https://cdn.discordapp.com/emojis/${token.extra}.${token.animated ? 'gif' : 'png'}?size=48&quality=lossless`;
        return (
          <img
            key={key}
            src={emojiUrl}
            alt={`:${token.text}:`}
            title={`:${token.text}:`}
            className="discord-custom-emoji"
            loading="lazy"
            onError={(e) => {
              // Fallback to emoji text name if image fails to load
              (e.currentTarget as HTMLElement).style.display = 'none';
              const span = document.createElement('span');
              span.innerText = `:${token.text}:`;
              span.className = 'discord-custom-emoji-fallback';
              e.currentTarget.parentNode?.insertBefore(span, e.currentTarget);
            }}
          />
        );
      }
      case 'text':
      default:
        return <React.Fragment key={key}>{token.text}</React.Fragment>;
    }
  });
}
