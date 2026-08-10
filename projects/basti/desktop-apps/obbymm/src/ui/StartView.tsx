import type { VaultFile } from '../vault/vaultTypes';

interface StartViewProps {
  files: VaultFile[];
  onCreateMarkdown: () => void;
  onCreateCanvas: () => void;
  onOpenFile: (fileId: string) => void;
}

export function StartView({ files, onCreateMarkdown, onCreateCanvas, onOpenFile }: StartViewProps) {
  const recentFiles = [...files].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  return (
    <section className="start-view">
      <div>
        <h2>ObbyMM Vault</h2>
        <p>Create a note or canvas to start a local-first thinking slice.</p>
      </div>

      <div className="start-actions">
        <button className="btn btn-primary" type="button" onClick={onCreateCanvas}>New Canvas</button>
        <button className="btn" type="button" onClick={onCreateMarkdown}>New Note</button>
      </div>

      <div className="recent-list">
        <h3>Recent</h3>
        {recentFiles.map((file) => (
          <button className="recent-row" key={file.id} type="button" onClick={() => onOpenFile(file.id)}>
            <span>{file.name}</span>
            <small>{new Date(file.updatedAt).toLocaleString()}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
