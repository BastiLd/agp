import type { VaultFile } from '../vault/vaultTypes';

interface FileTreeProps {
  files: VaultFile[];
  activeFileId: string | null;
  searchQuery: string;
  onOpenFile: (fileId: string) => void;
  onCreateMarkdown: () => void;
  onCreateCanvas: () => void;
}

export function FileTree({
  files,
  activeFileId,
  searchQuery,
  onOpenFile,
  onCreateMarkdown,
  onCreateCanvas,
}: FileTreeProps) {
  const filteredFiles = searchQuery.trim()
    ? files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <div className="file-tree">
      <div className="sidebar-actions">
        <button className="icon-button" type="button" title="New note" onClick={onCreateMarkdown}>+</button>
        <button className="icon-button" type="button" title="New canvas" onClick={onCreateCanvas}>#</button>
      </div>

      <div className="file-list">
        {filteredFiles.map((file) => (
          <button
            className={`file-row ${file.id === activeFileId ? 'is-active' : ''}`}
            key={file.id}
            type="button"
            onClick={() => onOpenFile(file.id)}
          >
            <span className="file-icon" aria-hidden="true">{file.type === 'canvas' ? '#' : 'M'}</span>
            <span className="file-name">{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
