import { Check, Film, Loader2, Search, Tv, X } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { EpisodeInfo, MetadataDetails, MetadataResult, RenamePreviewItem } from '../shared/types';

export function MetadataSearch({
  source,
  initialQuery,
  initialType,
  structureMode,
  moviesRoot,
  seriesRoot,
  onApply,
  onClose,
  onError
}: {
  source: string;
  initialQuery: string;
  initialType: 'movie' | 'tv' | 'auto';
  structureMode: 'plex' | 'none';
  moviesRoot?: string;
  seriesRoot?: string;
  onApply: (item: RenamePreviewItem) => void;
  onClose: () => void;
  onError: (error: unknown) => void;
}): JSX.Element {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<'movie' | 'tv' | 'auto'>(initialType);
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MetadataResult | null>(null);
  const [details, setDetails] = useState<MetadataDetails | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [episode, setEpisode] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  const runSearch = async (): Promise<void> => {
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setSelected(null);
    setDetails(null);
    try {
      setResults(await api.metadataSearch(query, type));
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (result: MetadataResult): Promise<void> => {
    setSelected(result);
    setDetails(null);
    setSeason(null);
    setEpisodes([]);
    setEpisode(null);
    if (result.mediaType === 'tv') {
      try {
        setDetails(await api.metadataDetails(result.id, 'tv'));
      } catch (error) {
        onError(error);
      }
    }
  };

  const chooseSeason = async (value: number): Promise<void> => {
    setSeason(value);
    setEpisode(null);
    if (!selected) {
      return;
    }
    try {
      setEpisodes(await api.metadataSeason(selected.id, value));
    } catch (error) {
      onError(error);
    }
  };

  const apply = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setApplying(true);
    try {
      const episodeTitle =
        selected.mediaType === 'tv' ? episodes.find((entry) => entry.episode === episode)?.title ?? null : null;
      const item = await api.renameFromMetadata({
        source,
        mediaType: selected.mediaType === 'tv' ? 'series' : 'movie',
        title: selected.title,
        year: selected.year,
        season: selected.mediaType === 'tv' ? season : null,
        episode: selected.mediaType === 'tv' ? episode : null,
        episodeTitle,
        structureMode,
        moviesRoot,
        seriesRoot
      });
      onApply(item);
    } catch (error) {
      onError(error);
    } finally {
      setApplying(false);
    }
  };

  const canApply = selected && (selected.mediaType === 'movie' || (season != null && episode != null));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal metadata-search" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>Online suchen (TMDb)</strong>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="ms-searchbar">
          <select value={type} onChange={(event) => setType(event.target.value as 'movie' | 'tv' | 'auto')}>
            <option value="auto">Auto</option>
            <option value="movie">Film</option>
            <option value="tv">Serie</option>
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && runSearch()}
            placeholder="Titel suchen…"
            autoFocus
          />
          <button className="search-button" type="button" onClick={runSearch} disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : <Search size={16} />} Suchen
          </button>
        </div>

        <div className="ms-results">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.mediaType}-${result.id}`}
              className={`ms-result ${selected?.id === result.id ? 'active' : ''}`}
              onClick={() => pick(result)}
            >
              {result.posterUrl ? (
                <img src={result.posterUrl} alt="" />
              ) : (
                <div className="ms-poster-fallback">{result.mediaType === 'tv' ? <Tv size={20} /> : <Film size={20} />}</div>
              )}
              <div>
                <strong>{result.title}</strong>
                <span>
                  {result.mediaType === 'tv' ? 'Serie' : 'Film'} {result.year ? `· ${result.year}` : ''}
                </span>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && <p className="fine-print">Keine Treffer – Suchbegriff anpassen.</p>}
        </div>

        {selected?.mediaType === 'tv' && (
          <div className="ms-episode-pickers">
            <label className="field">
              <span>Staffel</span>
              <select value={season ?? ''} onChange={(event) => chooseSeason(Number(event.target.value))}>
                <option value="">– wählen –</option>
                {details?.seasons.map((entry) => (
                  <option key={entry.season} value={entry.season}>
                    {entry.name} ({entry.episodeCount} Folgen)
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Episode</span>
              <select value={episode ?? ''} disabled={season == null} onChange={(event) => setEpisode(Number(event.target.value))}>
                <option value="">– wählen –</option>
                {episodes.map((entry) => (
                  <option key={entry.episode} value={entry.episode}>
                    E{String(entry.episode).padStart(2, '0')} – {entry.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="action-bar">
          <span>{selected ? selected.title : 'Treffer wählen'}</span>
          <button className="search-button" type="button" disabled={!canApply || applying} onClick={apply}>
            {applying ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
