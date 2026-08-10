import React from 'react';
import { Hash, Search, MessageSquare, Compass } from 'lucide-react';
import type { ChannelData, Message } from '../types';
import VirtualList from './VirtualList';
import type { VirtualListRef } from './VirtualList';
import MessageItem from './MessageItem';

interface ChatAreaProps {
  channelData: ChannelData | null;
  assetMap: Record<string, File>;
  channelNames: Record<string, string>;
  onJumpToMessage: (index: number) => void;
  onOpenSearch: () => void;
  virtualListRef: React.RefObject<VirtualListRef | null>;
}

export function ChatArea({
  channelData,
  assetMap,
  channelNames,
  onJumpToMessage,
  onOpenSearch,
  virtualListRef,
}: ChatAreaProps) {
  
  // Find a message in the current channel by its ID, returning its content and array index
  const findMessageById = (id: string): { msg: Message; index: number } | null => {
    if (!channelData) return null;
    const idx = channelData.messages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      return { msg: channelData.messages[idx], index: idx };
    }
    return null;
  };

  if (!channelData) {
    return (
      <div className="discord-chat-area-empty">
        <Compass size={64} className="empty-chat-icon" />
        <h2>Kein Kanal ausgewählt</h2>
        <p>Wähle einen Kanal in der linken Leiste aus, um den Chatverlauf anzuzeigen.</p>
      </div>
    );
  }

  const { channelInfo, messages } = channelData;

  return (
    <div className="discord-chat-container">
      {/* Top Header */}
      <div className="discord-chat-header">
        <div className="header-left">
          <Hash size={24} className="header-channel-icon" />
          <span className="header-channel-name">{channelInfo.name}</span>
          {channelInfo.topic && (
            <>
              <div className="header-divider" />
              <span className="header-channel-topic" title={channelInfo.topic}>
                {channelInfo.topic}
              </span>
            </>
          )}
        </div>

        <div className="header-right">
          {/* Header Search Button */}
          <div className="header-search-bar" onClick={onOpenSearch} title="Suche öffnen">
            <span>Suchen...</span>
            <Search size={16} />
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      {messages.length === 0 ? (
        <div className="discord-chat-area-empty">
          <MessageSquare size={48} className="empty-chat-icon" />
          <h3>Dieser Kanal ist leer</h3>
          <p>Es wurden keine Nachrichten in diesem Kanal exportiert.</p>
        </div>
      ) : (
        <VirtualList
          ref={virtualListRef}
          items={messages}
          channelId={channelInfo.id}
          renderItem={(msg) => (
            <MessageItem
              message={msg as Message}
              channelName={channelInfo.name}
              assetMap={assetMap}
              findMessageById={findMessageById}
              onJumpToMessage={onJumpToMessage}
              channelNames={channelNames}
            />
          )}
        />
      )}
    </div>
  );
}
export default ChatArea;
