import { CheckCircle2, Edit3, FolderInput, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { LibraryEntry } from '../shared/types';

type LibraryFilter = 'all' | 'unrecognized' | 'movie' | 'series';

const filterLabels: Record<LibraryFilter, string> = {
  all: 'Alle',
  unrecognized: 'Nicht erkannt',
  movie: 'Filme',
  series: 'Serien'
};

export function Library({
  onError,
  onToRename,
  onToMove
}: {
  onError: (error: unknown) => void;
  onToRename: (paths: string[]) => void;
  onToMove: (paths: string[]) => void;
}): JSX.Element {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.listItems(filter === 'all' ? undefined : filter));
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }, [filter, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter(
      (item) => item.name.toLowerCase().includes(needle) || item.title.toLowerCase().includes(needle)
    );
  }, [items, search]);

  const recognizedCount = useMemo(() => filtered.filter((item) => item.recognition.recognized).length, [filtered]);

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

  const selectAllVisible = (): void => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = filtered.every((item) => next.has(item.path));
      for (const item of filtered) {
        if (allSelected) {
          next.delete(item.path);
        } else {
          next.add(item.path);
        }
      }
      return next;
    });
  };

  return (
    <section className="library-view">
      <div className="library-toolbar">
        <div className="filter-pills">
          {(Object.keys(filterLabels) as LibraryFilter[]).map((value) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
              {filterLabels[value]}
            </button>
          ))}
        </div>
        <div className="library-search">
          <Search size={15} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name filtern…" />
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} title="Neu laden">
          {loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="library-stats">
        <span>{filtered.length} Dateien</span>
        <span className="good">{recognizedCount} erkannt</span>
        <span className="bad">{filtered.length - recognizedCount} nicht erkannt</span>
        {selected.size > 0 && <span className="info">{selected.size} ausgewählt</span>}
      </div>

      {selected.size > 0 && (
        <div className="library-actions">
          <button type="button" onClick={() => onToRename([...selected])}>
            <Edit3 size={15} /> Umbenennen ({selected.size})
          </button>
          <button type="button" onClick={() => onToMove([...selected])}>
            <FolderInput size={15} /> Verschieben ({selected.size})
          </button>
          <button type="button" onClick={() => setSelected(new Set())}>
            Auswahl leeren
          </button>
        </div>
      )}

      <table className="library-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((item) => selected.has(item.path))}
                onChange={selectAllVisible}
                title="Alle sichtbaren wählen"
              />
            </th>
            <th>Name</th>
            <th>Typ</th>
            <th>Plex / Jellyfin</th>
            <th>Staffel/Episode</th>
            <th>Quelle</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 500).map((item) => (
            <tr key={item.path} className={item.recognition.recognized ? '' : 'weak-hit'}>
              <td>
                <input type="checkbox" checked={selected.has(item.path)} onChange={() => toggle(item.path)} />
              </td>
              <td>
                <div className="match-name-cell">
                  <strong title={item.path}>{item.name}</strong>
                  <span>{item.itemType === 'folder' ? 'Ordner' : item.extension?.replace('.', '').toUpperCase() || 'Datei'}</span>
                </div>
              </td>
              <td>{item.recognition.mediaType === 'series' ? 'Serie' : 'Film'}</td>
              <td>
                {item.recognition.recognized ? (
                  <span className="recog ok" title={item.recognition.reason}>
                    <CheckCircle2 size={15} /> erkannt
                  </span>
                ) : (
                  <span className="recog bad" title={item.recognition.reason}>
                    <XCircle size={15} /> {item.recognition.reason}
                  </span>
                )}
              </td>
              <td>
                {item.recognition.season != null
                  ? `S${String(item.recognition.season).padStart(2, '0')}${
                      item.recognition.episode != null ? `E${String(item.recognition.episode).padStart(2, '0')}` : ''
                    }`
                  : item.recognition.year ?? '-'}
              </td>
              <td>{item.sourceKind === 'plex' ? 'Plex' : item.sourceKind === 'usb' ? 'USB' : item.sourceKind === 'pc' ? 'PC/NAS' : 'Sonstiges'}</td>
            </tr>
          ))}
          {filtered.length > 500 && (
            <tr className="more-row">
              <td colSpan={6}>+ {filtered.length - 500} weitere ausgeblendet – nutze den Filter.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
