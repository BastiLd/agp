import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ImportZone } from './components/ImportZone';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { SearchPanel } from './components/SearchPanel';
import type { ChannelData } from './types';
import type { VirtualListRef } from './components/VirtualList';
import { buildAssetMap, clearObjectURLs } from './utils/fileHelper';
import { parseDiscordJson } from './utils/parser';

export function App() {
  const [channels, setChannels] = useState<Record<string, ChannelData>>({});
  const [assetMap, setAssetMap] = useState<Record<string, File>>({});
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const virtualListRef = useRef<VirtualListRef | null>(null);

  // Cross-channel jump state (after switching channel, scroll to a specific message)
  const [pendingJump, setPendingJump] = useState<{ channelId: string; index: number } | null>(null);

  // Map of channel IDs to channel names for markdown mention replacements
  const channelNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(channels).forEach((chData) => {
      map[chData.channelInfo.id] = chData.channelInfo.name;
    });
    return map;
  }, [channels]);

  const handleImportComplete = (
    parsedChannels: Record<string, ChannelData>,
    assets: Record<string, File>,
  ) => {
    setChannels(parsedChannels);
    setAssetMap(assets);

    const channelIds = Object.keys(parsedChannels);
    if (channelIds.length > 0) {
      const general = channelIds.find((id) => {
        const n = parsedChannels[id].channelInfo.name.toLowerCase();
        return n.includes('general') || n.includes('allgemein');
      });
      setActiveChannelId(general || channelIds[0]);
    }
  };

  // Add more sources to an already opened archive (merging)
  const handleAddMoreFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;

      setIsLoading(true);
      setAddStatus('Neue Dateien werden eingelesen ...');

      try {
        const jsonFiles = arr.filter((f) => f.name.toLowerCase().endsWith('.json'));
        const assetFiles = arr.filter(
          (f) => !f.name.toLowerCase().endsWith('.json') && !f.name.toLowerCase().endsWith('.html'),
        );

        // Merge new assets into existing map (new entries take precedence on collision)
        const newAssets = buildAssetMap(assetFiles);
        const mergedAssets: Record<string, File> = { ...assetMap, ...newAssets };

        const mergedChannels: Record<string, ChannelData> = { ...channels };
        for (let i = 0; i < jsonFiles.length; i++) {
          const f = jsonFiles[i];
          setAddStatus(`Lese Kanal (${i + 1}/${jsonFiles.length}): ${f.name} ...`);
          try {
            const parsed = await parseDiscordJson(f);
            const existing = mergedChannels[parsed.channelInfo.id];
            if (existing) {
              const seen = new Set(existing.messages.map((m) => m.id));
              const merged = [...existing.messages];
              for (const m of parsed.messages) if (!seen.has(m.id)) merged.push(m);
              merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              mergedChannels[parsed.channelInfo.id] = {
                ...existing,
                messages: merged,
              };
            } else {
              mergedChannels[parsed.channelInfo.id] = parsed;
            }
          } catch (err) {
            console.warn('Konnte Datei nicht parsen:', f.name, err);
          }
        }

        setChannels(mergedChannels);
        setAssetMap(mergedAssets);
        setAddStatus(null);
      } catch (err) {
        console.error(err);
        setAddStatus('Fehler beim Hinzufügen.');
      } finally {
        setIsLoading(false);
        setTimeout(() => setAddStatus(null), 1500);
      }
    },
    [assetMap, channels],
  );

  const handleResetArchive = () => {
    if (
      window.confirm(
        'Möchtest du das aktuelle Archiv wirklich schließen? Alle Daten werden aus dem Browserspeicher freigegeben.',
      )
    ) {
      clearObjectURLs();
      setChannels({});
      setAssetMap({});
      setActiveChannelId(null);
      setIsSearchOpen(false);
      setPendingJump(null);
    }
  };

  const triggerJumpToMessage = (channelId: string, messageIndex: number) => {
    if (activeChannelId === channelId) {
      virtualListRef.current?.scrollToIndex(messageIndex);
    } else {
      setPendingJump({ channelId, index: messageIndex });
      setActiveChannelId(channelId);
    }
  };

  useEffect(() => {
    if (pendingJump && activeChannelId === pendingJump.channelId) {
      const timer = setTimeout(() => {
        virtualListRef.current?.scrollToIndex(pendingJump.index);
        setPendingJump(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeChannelId, pendingJump]);

  const hasData = Object.keys(channels).length > 0;
  const activeChannelData = activeChannelId ? channels[activeChannelId] : null;

  return (
    <>
      {!hasData ? (
        <ImportZone
          onImportComplete={handleImportComplete}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <div className="discord-app-layout">
          <ChannelSidebar
            channels={channels}
            activeChannelId={activeChannelId}
            setActiveChannelId={(id) => {
              setActiveChannelId(id);
              setPendingJump(null);
            }}
            onReset={handleResetArchive}
            onAddMoreFiles={handleAddMoreFiles}
            addStatus={addStatus}
          />
          <ChatArea
            channelData={activeChannelData}
            assetMap={assetMap}
            channelNames={channelNamesMap}
            onJumpToMessage={(index) => {
              if (activeChannelId) triggerJumpToMessage(activeChannelId, index);
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            virtualListRef={virtualListRef}
          />
          {isSearchOpen && (
            <SearchPanel
              channels={channels}
              currentChannelId={activeChannelId}
              onJumpToMessage={triggerJumpToMessage}
              onClose={() => setIsSearchOpen(false)}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;
