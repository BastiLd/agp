import { ChevronDown, ChevronRight, CornerLeftUp, FileVideo, Folder, FolderTree, Loader2, X } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { BrowseEntry, BrowseResult } from '../shared/types';

function leaf(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

function TreeNode({
  entry,
  depth,
  currentPath,
  onNavigate
}: {
  entry: BrowseEntry;
  depth: number;
  currentPath: string;
  onNavigate: (path: string) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<BrowseEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async (): Promise<void> => {
    if (!open && children === null) {
      setLoading(true);
      try {
        const result = await api.browse(entry.path);
        setChildren(result.entries.filter((child) => child.isDirectory));
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen((value) => !value);
  };

  return (
    <div className="tree-node">
      <div className={`tree-row ${currentPath === entry.path ? 'active' : ''}`} style={{ paddingLeft: depth * 14 + 4 }}>
        <button className="tree-twist" type="button" onClick={toggle}>
          {loading ? <Loader2 className="spin" size={13} /> : open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button className="tree-label" type="button" onClick={() => onNavigate(entry.path)} title={entry.path}>
          <Folder size={14} /> {leaf(entry.path)}
        </button>
      </div>
      {open &&
        children?.map((child) => (
          <TreeNode key={child.path} entry={child} depth={depth + 1} currentPath={currentPath} onNavigate={onNavigate} />
        ))}
    </div>
  );
}

export function FileBrowser({
  title,
  onClose,
  onConfirm,
  onError
}: {
  title: string;
  onClose: () => void;
  onConfirm: (paths: string[]) => void;
  onError: (error: unknown) => void;
}): JSX.Element {
  const [roots, setRoots] = useState<BrowseEntry[]>([]);
  const [current, setCurrent] = useState<BrowseResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const navigate = async (path?: string): Promise<void> => {
    try {
      setCurrent(await api.browse(path));
    } catch (error) {
      onError(error);
    }
  };

  useEffect(() => {
    api
      .browse()
      .then((result) => {
        setRoots(result.entries);
        setCurrent(result);
      })
      .catch(onError);
  }, [onError]);

  const toggle = (path: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal file-browser" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{title}</strong>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="fb-body">
          <aside className="fb-tree">
            <div className="fb-tree-title">
              <FolderTree size={14} /> Ordner
            </div>
            {roots.map((root) => (
              <TreeNode key={root.path} entry={root} depth={0} currentPath={current?.path ?? ''} onNavigate={navigate} />
            ))}
          </aside>

          <div className="fb-main">
            <div className="fb-path">
              <button type="button" disabled={!current?.parent} onClick={() => navigate(current?.parent ?? undefined)}>
                <CornerLeftUp size={14} /> Übergeordnet
              </button>
              <span title={current?.path || 'Medien-Roots'}>{current?.path || 'Medien-Roots'}</span>
            </div>

            {current?.error && <p className="login-error">{current.error}</p>}

            <div className="fb-list">
              {current?.entries.map((entry) => (
                <div className={`fb-entry ${selected.has(entry.path) ? 'selected' : ''}`} key={entry.path}>
                  <input type="checkbox" checked={selected.has(entry.path)} onChange={() => toggle(entry.path)} />
                  {entry.isDirectory ? (
                    <button type="button" className="fb-name" onClick={() => navigate(entry.path)}>
                      <Folder size={15} /> {entry.name}
                    </button>
                  ) : (
                    <span className="fb-name file">
                      <FileVideo size={15} /> {entry.name}
                    </span>
                  )}
                </div>
              ))}
              {current && current.entries.length === 0 && <p className="fine-print">Keine Ordner/Videodateien hier.</p>}
            </div>
          </div>
        </div>

        <div className="action-bar">
          <span>{selected.size} ausgewählt</span>
          <div className="fb-actions">
            {current?.path && (
              <button type="button" onClick={() => toggle(current.path)}>
                Ganzen Ordner {selected.has(current.path) ? 'abwählen' : 'wählen'}
              </button>
            )}
            <button className="search-button" type="button" disabled={selected.size === 0} onClick={() => onConfirm([...selected])}>
              Übernehmen ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
