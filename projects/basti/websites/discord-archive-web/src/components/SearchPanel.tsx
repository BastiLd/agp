import { useState, useMemo } from 'react';
import { Search, Calendar, User, File, Image, Link2, X } from 'lucide-react';
import type { ChannelData, Message } from '../types';

interface SearchResult {
  message: Message;
  channelId: string;
  channelName: string;
  index: number; // message index within the channel
}

interface SearchPanelProps {
  channels: Record<string, ChannelData>;
  currentChannelId: string | null;
  onJumpToMessage: (channelId: string, messageIndex: number) => void;
  onClose: () => void;
}

export function SearchPanel({
  channels,
  currentChannelId,
  onJumpToMessage,
  onClose,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'file' | 'link'>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Extract all unique usernames across channels for filter suggestions
  const allUsers = useMemo(() => {
    const users = new Set<string>();
    Object.values(channels).forEach((chData) => {
      chData.messages.forEach((msg) => {
        users.add(msg.author.nickname || msg.author.name);
      });
    });
    return Array.from(users).sort((a, b) => a.localeCompare(b));
  }, [channels]);

  // Execute advanced search algorithm
  const results = useMemo((): SearchResult[] => {
    if (!query && !selectedUser && selectedType === 'all' && !dateFilter) return [];

    const searchResults: SearchResult[] = [];
    const queryLower = query.toLowerCase().trim();

    // 1. Determine which channels to search
    const channelsToSearch = isGlobal
      ? Object.entries(channels)
      : currentChannelId && channels[currentChannelId]
      ? [[currentChannelId, channels[currentChannelId]] as [string, ChannelData]]
      : [];

    for (const [chId, chData] of channelsToSearch) {
      const messages = chData.messages;
      const chName = chData.channelInfo.name;

      for (let index = 0; index < messages.length; index++) {
        const msg = messages[index];
        
        // A. Filter by User
        if (selectedUser) {
          const authorName = (msg.author.nickname || msg.author.name).toLowerCase();
          if (!authorName.includes(selectedUser.toLowerCase())) continue;
        }

        // B. Filter by Date
        if (dateFilter) {
          const msgDateStr = new Date(msg.timestamp).toISOString().split('T')[0];
          if (msgDateStr !== dateFilter) continue;
        }

        // C. Filter by Media type
        if (selectedType !== 'all') {
          if (selectedType === 'image') {
            const hasImg = msg.attachments.some(att => /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileName));
            if (!hasImg) continue;
          } else if (selectedType === 'video') {
            const hasVid = msg.attachments.some(att => /\.(mp4|webm|mov|ogg)$/i.test(att.fileName));
            if (!hasVid) continue;
          } else if (selectedType === 'file') {
            const hasFile = msg.attachments.length > 0;
            if (!hasFile) continue;
          } else if (selectedType === 'link') {
            const hasLink = /https?:\/\/[^\s]+/i.test(msg.content);
            if (!hasLink) continue;
          }
        }

        // D. Filter by content query
        if (queryLower) {
          const contentMatch = msg.content.toLowerCase().includes(queryLower);
          // Also match in embeds titles or descriptions
          const embedMatch = msg.embeds.some(emb => 
            (emb.title && emb.title.toLowerCase().includes(queryLower)) ||
            (emb.description && emb.description.toLowerCase().includes(queryLower))
          );
          
          if (!contentMatch && !embedMatch) continue;
        }

        // Add matching message
        searchResults.push({
          message: msg,
          channelId: chId,
          channelName: chName,
          index,
        });

        // Cap at 200 results for performance
        if (searchResults.length >= 200) {
          break;
        }
      }
      if (searchResults.length >= 200) {
        break;
      }
    }

    return searchResults;
  }, [query, isGlobal, selectedUser, selectedType, dateFilter, channels, currentChannelId]);

  const clearFilters = () => {
    setQuery('');
    setSelectedUser('');
    setSelectedType('all');
    setDateFilter('');
  };

  const hasAnyFilter = query || selectedUser || selectedType !== 'all' || dateFilter;

  return (
    <div className="discord-search-sidebar">
      {/* Header */}
      <div className="search-sidebar-header">
        <h3>
          <Search size={18} />
          Archiv-Suche
        </h3>
        <button className="search-close-btn" onClick={onClose} title="Suche schließen">
          <X size={18} />
        </button>
      </div>

      {/* Settings Grid */}
      <div className="search-sidebar-controls">
        {/* Toggle Global/Local */}
        <div className="search-scope-toggle">
          <button
            className={`scope-btn ${!isGlobal ? 'active' : ''}`}
            onClick={() => setIsGlobal(false)}
          >
            Aktueller Kanal
          </button>
          <button
            className={`scope-btn ${isGlobal ? 'active' : ''}`}
            onClick={() => setIsGlobal(true)}
          >
            Alle Kanäle (Global)
          </button>
        </div>

        {/* Text Input */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Suchbegriff eingeben..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-field"
          />
          {query && (
            <button className="clear-search-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="search-advanced-filters">
          {/* User filter */}
          <div className="filter-row">
            <User size={14} className="filter-icon" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="filter-select"
            >
              <option value="">Filter nach User...</option>
              {allUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="filter-row">
            <Calendar size={14} className="filter-icon" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-date"
            />
          </div>

          {/* Type Chips */}
          <div className="filter-chips">
            <button
              className={`chip ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              Alles
            </button>
            <button
              className={`chip ${selectedType === 'image' ? 'active' : ''}`}
              onClick={() => setSelectedType('image')}
              title="Nachrichten mit Bildern"
            >
              <Image size={12} />
              Bilder
            </button>
            <button
              className={`chip ${selectedType === 'file' ? 'active' : ''}`}
              onClick={() => setSelectedType('file')}
              title="Nachrichten mit Anhängen"
            >
              <File size={12} />
              Dateien
            </button>
            <button
              className={`chip ${selectedType === 'link' ? 'active' : ''}`}
              onClick={() => setSelectedType('link')}
              title="Nachrichten mit Links"
            >
              <Link2 size={12} />
              Links
            </button>
          </div>
        </div>

        {hasAnyFilter && (
          <button className="discord-btn btn-secondary clear-all-btn" onClick={clearFilters}>
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Results Section */}
      <div className="search-results-list">
        <div className="results-count">
          {results.length === 0 ? (
            hasAnyFilter ? 'Keine Treffer gefunden.' : 'Verwende die Filter oben, um die Suche zu starten.'
          ) : (
            `${results.length} Treffer geladen ${results.length === 200 ? '(Limit erreicht)' : ''}`
          )}
        </div>

        {results.map((res, i) => {
          const date = new Date(res.message.timestamp);
          const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const author = res.message.author.nickname || res.message.author.name;

          return (
            <div
              key={i}
              className="search-result-card"
              onClick={() => onJumpToMessage(res.channelId, res.index)}
            >
              <div className="card-header">
                <span className="card-channel">#{res.channelName}</span>
                <span className="card-date">{dateStr}</span>
              </div>
              <div className="card-author" style={{ color: res.message.author.color || 'inherit' }}>
                {author}
              </div>
              <div className="card-snippet">
                {res.message.content ? (
                  res.message.content
                ) : (
                  <span className="empty-content-label">[Medien/Anhang-Nachricht]</span>
                )}
              </div>
              {res.message.attachments.length > 0 && (
                <div className="card-attachments-count">
                  📎 {res.message.attachments.length} Anhang/Anhänge
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default SearchPanel;
