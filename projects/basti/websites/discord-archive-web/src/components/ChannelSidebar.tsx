import { useRef, useState } from 'react';
import {
  Hash, LogOut, ChevronDown, Plus, Folder, FolderTree, FileJson, Image as ImageIcon,
} from 'lucide-react';
import type { ChannelData, Guild } from '../types';

interface ChannelSidebarProps {
  channels: Record<string, ChannelData>;
  activeChannelId: string | null;
  setActiveChannelId: (id: string) => void;
  onReset: () => void;
  onAddMoreFiles: (files: FileList | File[]) => void;
  addStatus: string | null;
}

const isDirectorySupported =
  typeof HTMLInputElement !== 'undefined' && 'webkitdirectory' in HTMLInputElement.prototype;

export function ChannelSidebar({
  channels,
  activeChannelId,
  setActiveChannelId,
  onReset,
  onAddMoreFiles,
  addStatus,
}: ChannelSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const channelFolderRef = useRef<HTMLInputElement>(null);
  const mainFolderRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const assetsFolderRef = useRef<HTMLInputElement>(null);

  // Guild info
  let guildInfo: Guild | null = null;
  const channelIds = Object.keys(channels);
  if (channelIds.length > 0) {
    guildInfo = channels[channelIds[0]].guildInfo;
  }
  const guildName = guildInfo?.name || 'Discord Archiv';
  const guildIconText = guildName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();

  // Group channels by category
  const categories: Record<string, ChannelData[]> = {};
  const noCategoryChannels: ChannelData[] = [];

  Object.values(channels).forEach((chData) => {
    const cat = chData.channelInfo.category;
    if (cat) {
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(chData);
    } else {
      noCategoryChannels.push(chData);
    }
  });

  Object.keys(categories).forEach((cat) =>
    categories[cat].sort((a, b) => a.channelInfo.name.localeCompare(b.channelInfo.name)),
  );
  noCategoryChannels.sort((a, b) => a.channelInfo.name.localeCompare(b.channelInfo.name));

  // Bottom panel: a "user-like" identity placeholder
  let lastAuthorName = 'Archiv-User';
  let lastAuthorDiscriminator = '0000';
  let lastAuthorAvatar = '';
  if (channelIds.length > 0) {
    const firstChan = channels[channelIds[0]];
    if (firstChan.messages.length > 0) {
      const msg = firstChan.messages[firstChan.messages.length - 1];
      lastAuthorName = msg.author.nickname || msg.author.name;
      lastAuthorDiscriminator = msg.author.discriminator;
      lastAuthorAvatar = msg.author.avatarUrl;
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMoreFiles(e.target.files);
    }
    e.target.value = '';
    setMenuOpen(false);
  };

  return (
    <div className="discord-sidebar">
      {/* Guild Header */}
      <div className="discord-guild-header">
        <div className="guild-info-left">
          {guildInfo?.iconUrl ? (
            <img src={guildInfo.iconUrl} alt={guildName} className="guild-icon-img" />
          ) : (
            <div className="guild-icon-fallback">{guildIconText}</div>
          )}
          <span className="guild-name-label">{guildName}</span>
        </div>
        <ChevronDown size={18} className="guild-header-arrow" />
      </div>

      {/* Add-more section */}
      <div className="sidebar-add-more">
        <button
          type="button"
          className="add-more-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="Weitere Ordner oder JSON-Dateien hinzufügen"
        >
          <Plus size={14} />
          <span>Mehr hinzufügen</span>
        </button>
        {menuOpen && (
          <div className="add-more-menu" role="menu">
            <button
              type="button"
              className="add-more-menu-item"
              onClick={() => channelFolderRef.current?.click()}
              disabled={!isDirectorySupported}
            >
              <Folder size={14} /> Channel-Ordner
            </button>
            <button
              type="button"
              className="add-more-menu-item"
              onClick={() => mainFolderRef.current?.click()}
              disabled={!isDirectorySupported}
            >
              <FolderTree size={14} /> Hauptordner
            </button>
            <button
              type="button"
              className="add-more-menu-item"
              onClick={() => jsonFileRef.current?.click()}
            >
              <FileJson size={14} /> JSON-Datei(en)
            </button>
            <button
              type="button"
              className="add-more-menu-item"
              onClick={() => assetsFolderRef.current?.click()}
              disabled={!isDirectorySupported}
            >
              <ImageIcon size={14} /> Assets/Media-Ordner
            </button>
          </div>
        )}
        {addStatus && <div className="add-status">{addStatus}</div>}
      </div>

      {/* Channels */}
      <div className="discord-channels-list-container">
        {noCategoryChannels.map((chData) => (
          <div
            key={chData.channelInfo.id}
            className={`discord-channel-item ${activeChannelId === chData.channelInfo.id ? 'active' : ''}`}
            onClick={() => setActiveChannelId(chData.channelInfo.id)}
          >
            <Hash size={18} className="channel-icon" />
            <span className="channel-name">{chData.channelInfo.name}</span>
            <span className="channel-msg-count" title={`${chData.messages.length} Nachrichten`}>
              {chData.messages.length}
            </span>
          </div>
        ))}

        {Object.entries(categories).map(([catName, chList]) => (
          <div key={catName} className="discord-category-group">
            <div className="discord-category-header">
              <ChevronDown size={12} className="category-arrow" />
              <span className="category-name">{catName}</span>
            </div>
            <div className="category-channels">
              {chList.map((chData) => (
                <div
                  key={chData.channelInfo.id}
                  className={`discord-channel-item ${activeChannelId === chData.channelInfo.id ? 'active' : ''}`}
                  onClick={() => setActiveChannelId(chData.channelInfo.id)}
                >
                  <Hash size={18} className="channel-icon" />
                  <span className="channel-name">{chData.channelInfo.name}</span>
                  <span className="channel-msg-count" title={`${chData.messages.length} Nachrichten`}>
                    {chData.messages.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panel */}
      <div className="discord-user-panel">
        <div className="user-info">
          {lastAuthorAvatar ? (
            <img
              src={lastAuthorAvatar}
              alt={lastAuthorName}
              className="user-avatar"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const sib = e.currentTarget.nextSibling as HTMLElement;
                if (sib) sib.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="user-avatar-fallback"
            style={{ display: lastAuthorAvatar ? 'none' : 'flex' }}
          >
            {lastAuthorName[0]?.toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{lastAuthorName}</span>
            <span className="user-tag">#{lastAuthorDiscriminator}</span>
          </div>
        </div>

        <button
          className="user-action-btn"
          onClick={onReset}
          title="Archiv schließen und Dateien freigeben"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={channelFolderRef}
        type="file"
        className="hidden-input"
        multiple
        onChange={handleFiles}
        {...{ webkitdirectory: '', directory: '' }}
      />
      <input
        ref={mainFolderRef}
        type="file"
        className="hidden-input"
        multiple
        onChange={handleFiles}
        {...{ webkitdirectory: '', directory: '' }}
      />
      <input
        ref={jsonFileRef}
        type="file"
        className="hidden-input"
        accept=".json,application/json"
        multiple
        onChange={handleFiles}
      />
      <input
        ref={assetsFolderRef}
        type="file"
        className="hidden-input"
        multiple
        onChange={handleFiles}
        {...{ webkitdirectory: '', directory: '' }}
      />
    </div>
  );
}
