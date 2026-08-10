import React from 'react';
import type { SearchHit } from '../../../shared/types';

interface Props {
  hits: SearchHit[];
  active: boolean;
  truncated: boolean;
  scope: 'current' | 'global';
  onSelect: (hit: SearchHit) => void;
  onClose: () => void;
}

export function SearchResults({ hits, active, truncated, scope, onSelect, onClose }: Props) {
  if (!active) return null;
  return (
    <div className="search-results">
      <div className="search-results-header">
        <span>{hits.length} Treffer · {scope === 'current' ? 'Aktueller Channel' : 'Global'}</span>
        {truncated && <span style={{ color: 'var(--warning)' }}>(begrenzt auf 500)</span>}
        <button className="btn tiny secondary" style={{ marginLeft: 'auto' }} onClick={onClose}>Schließen</button>
      </div>
      {hits.length === 0 && (
        <div className="search-result-empty">Keine Treffer.</div>
      )}
      {hits.map((h, i) => (
        <div key={i} className="search-result" onClick={() => onSelect(h)}>
          <div className="search-result-channel">{h.channelDisplayName} · {h.timestamp ?? ''}</div>
          <div className="search-result-line">
            <span className="search-result-author">{h.authorName}: </span>
            {h.contentExcerpt}
          </div>
        </div>
      ))}
    </div>
  );
}
