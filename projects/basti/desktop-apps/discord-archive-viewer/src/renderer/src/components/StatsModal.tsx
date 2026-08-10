import React, { useMemo } from 'react';
import { Modal } from './Modal';
import type { ChannelModel } from '../../../shared/types';
import { computeStats } from '../stats';
import { formatTimestamp, getInitials } from '../format';

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function StatsModal({ channel, onClose }: { channel: ChannelModel; onClose: () => void }) {
  const stats = useMemo(() => computeStats(channel), [channel]);
  const maxAuthor = stats.topAuthors[0]?.count ?? 1;
  const maxReact = stats.topReactions[0]?.count ?? 1;
  const maxHeat = Math.max(1, ...stats.perHour);

  return (
    <Modal title={`📊 Statistik · ${channel.displayName}`} onClose={onClose} wide>
      <div className="stats-grid">
        <div className="stat-tile"><div className="label">Nachrichten</div><div className="value">{stats.totalMessages}</div></div>
        <div className="stat-tile"><div className="label">Anhänge</div><div className="value">{stats.totalAttachments}</div></div>
        <div className="stat-tile"><div className="label">Reactions</div><div className="value">{stats.totalReactions}</div></div>
        <div className="stat-tile"><div className="label">Embeds</div><div className="value">{stats.totalEmbeds}</div></div>
        <div className="stat-tile"><div className="label">Autoren</div><div className="value">{stats.uniqueAuthors}</div></div>
        <div className="stat-tile"><div className="label">Erste Nachricht</div><div className="value" style={{ fontSize: 13 }}>{formatTimestamp(stats.firstAt)}</div></div>
        <div className="stat-tile"><div className="label">Letzte Nachricht</div><div className="value" style={{ fontSize: 13 }}>{formatTimestamp(stats.lastAt)}</div></div>
      </div>

      <div className="modal-section">
        <h3>Anhänge nach Typ</h3>
        <div className="stats-grid">
          <div className="stat-tile"><div className="label">Bilder</div><div className="value">{stats.attachmentTypes.images}</div></div>
          <div className="stat-tile"><div className="label">GIFs</div><div className="value">{stats.attachmentTypes.gifs}</div></div>
          <div className="stat-tile"><div className="label">Video</div><div className="value">{stats.attachmentTypes.videos}</div></div>
          <div className="stat-tile"><div className="label">Audio</div><div className="value">{stats.attachmentTypes.audio}</div></div>
          <div className="stat-tile"><div className="label">Andere</div><div className="value">{stats.attachmentTypes.other}</div></div>
        </div>
      </div>

      <div className="modal-section">
        <h3>Top-Autoren</h3>
        {stats.topAuthors.map((a) => (
          <div className="bar-row" key={a.name}>
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-elev)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {a.avatarUrl ? <img src={a.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(a.name)}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${(a.count / maxAuthor) * 100}%` }} /></div>
            <div className="count">{a.count}</div>
          </div>
        ))}
      </div>

      {stats.topReactions.length > 0 && (
        <div className="modal-section">
          <h3>Top-Reactions</h3>
          {stats.topReactions.map((r) => (
            <div className="bar-row" key={r.name}>
              <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.imageUrl ? <img src={r.imageUrl} alt="" style={{ width: 18, height: 18 }} /> : <span>{r.name}</span>}
                <span>{r.name}</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${(r.count / maxReact) * 100}%` }} /></div>
              <div className="count">{r.count}</div>
            </div>
          ))}
        </div>
      )}

      <div className="modal-section">
        <h3>Aktivität (Wochentag × Stunde)</h3>
        <div className="heatmap-week">
          <div className="head"></div>
          {Array.from({ length: 24 }).map((_, h) => (
            <div className="head" key={h}>{h}</div>
          ))}
          {DAY_NAMES.map((day, di) => (
            <React.Fragment key={day}>
              <div className="head">{day}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const intensity = stats.perHour[h] / maxHeat;
                const dayBoost = stats.perDayOfWeek[di] / Math.max(1, ...stats.perDayOfWeek);
                const v = intensity * dayBoost;
                return (
                  <div
                    className="heatmap-cell"
                    key={h}
                    title={`${day} ${h}h`}
                    style={{ background: `color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--bg-elev))` }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {stats.topWords.length > 0 && (
        <div className="modal-section">
          <h3>Top-Wörter</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {stats.topWords.map((w) => (
              <span key={w.word} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                padding: '4px 10px', borderRadius: 999,
                fontSize: `${Math.min(20, 11 + (w.count / stats.topWords[0].count) * 8)}px`,
              }}>
                {w.word} <span style={{ color: 'var(--text-muted)' }}>{w.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
