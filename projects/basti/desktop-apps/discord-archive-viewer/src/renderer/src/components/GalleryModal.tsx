import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import type { ChannelModel } from '../../../shared/types';
import { classifyFileName } from '../format';

export function GalleryModal({
  channel, onClose, onLightbox,
}: {
  channel: ChannelModel;
  onClose: () => void;
  onLightbox: (url: string) => void;
}) {
  const [tab, setTab] = useState<'images' | 'videos'>('images');

  const items = useMemo(() => {
    const list: Array<{ url: string; kind: 'image' | 'gif' | 'video' }> = [];
    for (const m of channel.messages) {
      for (const a of m.attachments) {
        if (!a.localPath) continue;
        const k = classifyFileName(a.fileName || a.url);
        const url = `media://localfile/?p=${encodeURIComponent(a.localPath)}`;
        if (tab === 'images' && (k === 'image' || k === 'gif')) list.push({ url, kind: k });
        if (tab === 'videos' && k === 'video') list.push({ url, kind: 'video' });
      }
    }
    return list;
  }, [channel, tab]);

  return (
    <Modal title={`🖼 Galerie · ${channel.displayName}`} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button className={`chip ${tab === 'images' ? 'active' : ''}`} onClick={() => setTab('images')}>Bilder & GIFs</button>
        <button className={`chip ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>Videos</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>{items.length} Treffer</span>
      </div>
      {items.length === 0 && <div className="empty-state">Keine Medien dieses Typs.</div>}
      <div className="gallery-grid">
        {items.map((it, i) => it.kind === 'video' ? (
          <video key={i} src={it.url} controls preload="metadata" />
        ) : (
          <img key={i} src={it.url} alt="" loading="lazy" onClick={() => onLightbox(it.url)} />
        ))}
      </div>
    </Modal>
  );
}
