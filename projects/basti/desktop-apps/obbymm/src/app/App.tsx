import { useEffect, useMemo, useRef } from 'react';
import './App.css';
import MindmapEditor from '../editor/MindmapEditor';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { parseCanvas } from '../formats/canvasFormat';
import { buildSearchResults } from '../search/searchIndex';
import { FileTree } from '../ui/FileTree';
import { ReplayPanel } from '../ui/ReplayPanel';
import { RightSidebar } from '../ui/RightSidebar';
import { StartView } from '../ui/StartView';
import { useTheme } from '../ui/themeContext';
import { getActiveFile, useVaultStore } from '../vault/VaultProvider';
import { useEventStore } from '../commands/eventStore';

function App() {
  const files = useVaultStore((state) => state.files);
  const activeFileId = useVaultStore((state) => state.activeFileId);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const saveStatus = useVaultStore((state) => state.saveStatus);
  const openFile = useVaultStore((state) => state.openFile);
  const createMarkdown = useVaultStore((state) => state.createMarkdown);
  const createCanvas = useVaultStore((state) => state.createCanvas);
  const updateMarkdownContent = useVaultStore((state) => state.updateMarkdownContent);
  const saveCanvasSnapshot = useVaultStore((state) => state.saveCanvasSnapshot);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);

  const canvas = useEventStore((state) => state.canvas);
  const events = useEventStore((state) => state.events);
  const nodeNotes = useEventStore((state) => state.nodeNotes);
  const loadMap = useEventStore((state) => state.loadMap);

  const { theme, setTheme } = useTheme();
  const loadedCanvasFileId = useRef<string | null>(null);
  const activeFile = getActiveFile(files, activeFileId);
  const activeCanvasFileId = activeFile?.type === 'canvas' ? activeFile.id : null;
  const searchResults = useMemo(() => buildSearchResults(files, searchQuery), [files, searchQuery]);

  useEffect(() => {
    if (!activeFile || activeFile.type !== 'canvas') return;
    if (loadedCanvasFileId.current === activeFile.id) return;

    try {
      loadMap(activeFile.path, parseCanvas(activeFile.content), activeFile.events ?? [], activeFile.nodeNotes ?? {});
      loadedCanvasFileId.current = activeFile.id;
    } catch {
      loadMap(activeFile.path, { nodes: [], edges: [] }, [], {});
      loadedCanvasFileId.current = activeFile.id;
    }
  }, [activeFile, loadMap]);

  useEffect(() => {
    if (!activeCanvasFileId || loadedCanvasFileId.current !== activeCanvasFileId) return;
    saveCanvasSnapshot(activeCanvasFileId, canvas, events, nodeNotes);
  }, [activeCanvasFileId, canvas, events, nodeNotes, saveCanvasSnapshot]);

  const createNote = () => {
    const file = createMarkdown();
    loadedCanvasFileId.current = file.type === 'canvas' ? file.id : null;
  };

  const createMap = () => {
    const file = createCanvas();
    loadedCanvasFileId.current = null;
    openFile(file.id);
  };

  const openVaultFile = (fileId: string) => {
    if (fileId !== activeFileId) {
      loadedCanvasFileId.current = null;
    }
    openFile(fileId);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark">O</span>
          <h1>ObbyMM</h1>
        </div>

        <div className="search-box">
          <input
            aria-label="Search vault"
            placeholder="Search vault or type a command"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-popover">
              {searchResults.slice(0, 6).map((result) => (
                <button key={result.id} type="button" onClick={() => openVaultFile(result.fileId)}>
                  <strong>{result.label}</strong>
                  <span>{result.preview}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="top-bar-actions">
          <span className="save-status">{saveStatus}</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>

      <div className="main-layout">
        <aside className="left-sidebar">
          <div className="panel-header">Vault</div>
          <FileTree
            files={files}
            activeFileId={activeFileId}
            searchQuery={searchQuery}
            onOpenFile={openVaultFile}
            onCreateMarkdown={createNote}
            onCreateCanvas={createMap}
          />
        </aside>

        <main className="editor-area">
          {!activeFile && (
            <StartView files={files} onCreateMarkdown={createNote} onCreateCanvas={createMap} onOpenFile={openVaultFile} />
          )}
          {activeFile?.type === 'markdown' && (
            <MarkdownEditor file={activeFile} onChange={(content) => updateMarkdownContent(activeFile.id, content)} />
          )}
          {activeFile?.type === 'canvas' && (
            <MindmapEditor mapId={activeFile.path} />
          )}
        </main>

        <div className="right-column">
          <RightSidebar activeFile={activeFile} files={files} />
          <section className="sidebar-section replay-section">
            <div className="panel-header">History</div>
            <div className="panel-content">
              <ReplayPanel />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
