import { useRef, useState, useCallback } from 'react';
import {
  Shield, Folder, FileJson, AlertTriangle, Layers, Info,
  FolderTree, Image as ImageIcon, Trash2, Plus, ChevronRight, X, UploadCloud,
} from 'lucide-react';
import { buildAssetMap } from '../utils/fileHelper';
import { parseDiscordJson } from '../utils/parser';
import { extractDroppedSources, isDropSupported } from '../utils/dragdrop';
import type { DroppedSource } from '../utils/dragdrop';
import type { ChannelData } from '../types';

interface ImportZoneProps {
  onImportComplete: (channels: Record<string, ChannelData>, assetMap: Record<string, File>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface StagedSource {
  id: string;
  label: string;          // user-facing name (folder root or filename)
  kind: 'channel-folder' | 'main-folder' | 'json' | 'assets-folder';
  files: File[];          // raw selected files
  jsonCount: number;
  assetCount: number;
  htmlCount: number;
}

// File extension classifiers
const isJson = (f: File) => f.name.toLowerCase().endsWith('.json');
const isHtml = (f: File) => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm');
const isAsset = (f: File) => !isJson(f) && !isHtml(f);

// Browser feature detection
const isDirectorySupported =
  typeof HTMLInputElement !== 'undefined' && 'webkitdirectory' in HTMLInputElement.prototype;

const dropSupported = isDropSupported();

function getRootName(files: File[]): string {
  for (const f of files) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (rel && rel.includes('/')) return rel.split('/')[0];
  }
  return files[0]?.name ?? 'Auswahl';
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function ImportZone({ onImportComplete, isLoading, setIsLoading }: ImportZoneProps) {
  const [staged, setStaged] = useState<StagedSource[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const channelFolderRef = useRef<HTMLInputElement>(null);
  const mainFolderRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const assetsFolderRef = useRef<HTMLInputElement>(null);

  const stageFiles = useCallback((kind: StagedSource['kind'], rawFiles: FileList | File[]) => {
    setError(null);
    setWarning(null);
    const arr = Array.from(rawFiles);
    if (arr.length === 0) return;

    const jsonCount = arr.filter(isJson).length;
    const htmlCount = arr.filter(isHtml).length;
    const assetCount = arr.filter(isAsset).length;

    const label =
      kind === 'json'
        ? arr.length === 1
          ? arr[0].name
          : `${arr.length} JSON-Dateien`
        : getRootName(arr);

    if ((kind === 'channel-folder' || kind === 'main-folder') && jsonCount === 0) {
      setWarning(
        `Im ausgewählten Ordner "${label}" wurde keine .json-Datei gefunden. ` +
        `Du kannst trotzdem fortfahren, aber für den Chat-Verlauf ist mindestens eine JSON-Datei nötig.`
      );
    }
    if (kind === 'assets-folder' && assetCount === 0) {
      setWarning(`Im Medien-Ordner "${label}" wurden keine Asset-Dateien gefunden.`);
    }

    setStaged(prev => [
      ...prev,
      {
        id: makeId(),
        label,
        kind,
        files: arr,
        jsonCount,
        htmlCount,
        assetCount,
      },
    ]);
  }, []);

  const stageDroppedSource = useCallback((src: DroppedSource) => {
    const arr = src.files;
    if (arr.length === 0) return;
    const jsonCount = arr.filter(isJson).length;
    const htmlCount = arr.filter(isHtml).length;
    const assetCount = arr.filter(isAsset).length;
    setStaged(prev => [
      ...prev,
      {
        id: makeId(),
        label: src.label,
        kind: src.kind,
        files: arr,
        jsonCount,
        htmlCount,
        assetCount,
      },
    ]);
  }, []);

  const removeStaged = (id: string) => {
    setStaged(prev => prev.filter(s => s.id !== id));
  };

  const clearAll = () => {
    setStaged([]);
    setError(null);
    setWarning(null);
  };

  // ---- File input handlers ----
  const handleChange =
    (kind: StagedSource['kind']) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        stageFiles(kind, e.target.files);
      }
      e.target.value = '';
    };

  // ---- Drag & Drop handlers ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Nur wirklich verlassen, wenn das Ziel außerhalb des Zone-Containers liegt.
    if (e.currentTarget instanceof Element && e.relatedTarget instanceof Node) {
      if (e.currentTarget.contains(e.relatedTarget)) return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);
      setWarning(null);

      try {
        const sources = await extractDroppedSources(e.dataTransfer);
        if (sources.length === 0) {
          setWarning('Keine verwertbaren Dateien im Drop gefunden.');
          return;
        }
        for (const s of sources) stageDroppedSource(s);
      } catch (err) {
        console.error('Drop-Fehler:', err);
        setError('Fehler beim Einlesen der hineingezogenen Dateien.');
      }
    },
    [stageDroppedSource],
  );

  // ---- Open archive: parse everything that is staged ----
  const openArchive = async () => {
    if (staged.length === 0) return;

    const allFiles: File[] = [];
    for (const src of staged) allFiles.push(...src.files);

    const jsonFiles = allFiles.filter(isJson);
    const assetFiles = allFiles.filter(isAsset);

    if (jsonFiles.length === 0) {
      setError(
        'Es wurde keine .json-Exportdatei gefunden. Bitte wähle mindestens einen Channel-Ordner ' +
        'oder eine JSON-Datei von DiscordChatExporter aus.',
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage(`Verarbeite ${jsonFiles.length} JSON-Datei(en) und ${assetFiles.length} Asset-Datei(en) ...`);

    try {
      const assetMap = buildAssetMap(assetFiles);

      const parsedChannels: Record<string, ChannelData> = {};
      const parseFailures: string[] = [];

      for (let i = 0; i < jsonFiles.length; i++) {
        const f = jsonFiles[i];
        setStatusMessage(`Lese Kanal (${i + 1}/${jsonFiles.length}): ${f.name} ...`);
        try {
          const ch = await parseDiscordJson(f);
          const existing = parsedChannels[ch.channelInfo.id];
          if (existing) {
            const seen = new Set(existing.messages.map(m => m.id));
            for (const m of ch.messages) {
              if (!seen.has(m.id)) existing.messages.push(m);
            }
            existing.messages.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            );
          } else {
            parsedChannels[ch.channelInfo.id] = ch;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unbekannter Fehler';
          console.error('Parser-Fehler', f.name, err);
          parseFailures.push(`${f.name}: ${msg}`);
        }
      }

      const okCount = Object.keys(parsedChannels).length;
      if (okCount === 0) {
        throw new Error(
          'Keine der ausgewählten JSON-Dateien konnte interpretiert werden. ' +
          'Bitte stelle sicher, dass es sich um DiscordChatExporter-JSON-Exporte handelt.\n\n' +
          parseFailures.slice(0, 3).join('\n'),
        );
      }

      if (parseFailures.length > 0) {
        console.warn(`${parseFailures.length} Datei(en) konnten nicht geparst werden.`);
      }

      setStatusMessage(`Fertig — ${okCount} Kanal/Kanäle geladen.`);
      setTimeout(() => {
        onImportComplete(parsedChannels, assetMap);
        setIsLoading(false);
        setStatusMessage(null);
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      console.error(err);
      setError(msg);
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  // ---- UI ----
  const totalJson = staged.reduce((s, x) => s + x.jsonCount, 0);
  const totalAssets = staged.reduce((s, x) => s + x.assetCount, 0);
  const totalHtml = staged.reduce((s, x) => s + x.htmlCount, 0);

  return (
    <div
      className={`discord-import-container ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="discord-import-card">
        <div className="discord-logo-area">
          <div className="discord-logo-icon">💬</div>
          <h1>Discord Archive Viewer</h1>
          <p className="discord-subtitle">
            Browser-Viewer für deine DiscordChatExporter-Exporte. Komplett offline und privat.
          </p>
        </div>

        {!isDirectorySupported && (
          <div className="discord-error-box" role="alert">
            <AlertTriangle size={20} className="error-icon" />
            <div className="error-content">
              <h4>Ordnerauswahl wird von diesem Browser nicht unterstützt</h4>
              <p>
                Dein Browser unterstützt das Auswählen ganzer Ordner nicht (
                <code>webkitdirectory</code>). Bitte nutze einen aktuellen Chromium-basierten Browser
                (Chrome, Edge, Brave, Opera) oder verwende den Button <strong>„JSON-Datei auswählen“</strong>,
                um einzelne Dateien zu laden.
              </p>
            </div>
          </div>
        )}

        {/* Drop-Zone Hinweis */}
        {dropSupported && (
          <div className="dropzone-hint">
            <UploadCloud size={20} />
            <div>
              <strong>Tipp:</strong> Du kannst auch mehrere Ordner und Dateien gleichzeitig
              direkt in dieses Fenster ziehen.
            </div>
          </div>
        )}

        {/* Vier Auswahl-Buttons */}
        <div className="import-actions-grid">
          <button
            type="button"
            className="import-action-card"
            onClick={() => channelFolderRef.current?.click()}
            disabled={!isDirectorySupported || isLoading}
          >
            <Folder size={28} />
            <div className="action-text">
              <span className="action-title">Channel-Ordner auswählen</span>
              <span className="action-sub">Ein einzelner Channel mit JSON + Medien</span>
            </div>
          </button>

          <button
            type="button"
            className="import-action-card"
            onClick={() => mainFolderRef.current?.click()}
            disabled={!isDirectorySupported || isLoading}
          >
            <FolderTree size={28} />
            <div className="action-text">
              <span className="action-title">Hauptordner auswählen</span>
              <span className="action-sub">Mehrere Channel-Ordner auf einmal</span>
            </div>
          </button>

          <button
            type="button"
            className="import-action-card"
            onClick={() => jsonFileRef.current?.click()}
            disabled={isLoading}
          >
            <FileJson size={28} />
            <div className="action-text">
              <span className="action-title">JSON-Datei auswählen</span>
              <span className="action-sub">Eine oder mehrere .json-Dateien</span>
            </div>
          </button>

          <button
            type="button"
            className="import-action-card"
            onClick={() => assetsFolderRef.current?.click()}
            disabled={!isDirectorySupported || isLoading}
          >
            <ImageIcon size={28} />
            <div className="action-text">
              <span className="action-title">Assets/Media-Ordner auswählen</span>
              <span className="action-sub">Bilder, Videos, Audios, Anhänge</span>
            </div>
          </button>
        </div>

        <div className="hint-bar">
          <Plus size={14} />
          Klicke die Buttons mehrfach oder ziehe Ordner und Dateien hinein, um beliebig viele
          Quellen zu sammeln. Sie werden zu einem Archiv zusammengeführt.
        </div>

        {/* Geladene Quellen */}
        {staged.length > 0 && (
          <div className="staging-panel">
            <div className="staging-panel-header">
              <span>Vorbereitete Auswahl</span>
              <button type="button" className="link-btn" onClick={clearAll} disabled={isLoading}>
                Alles entfernen
              </button>
            </div>
            <ul className="staging-list">
              {staged.map(s => (
                <li key={s.id} className="staging-item">
                  <div className="staging-item-icon">
                    {s.kind === 'json' ? (
                      <FileJson size={18} />
                    ) : s.kind === 'assets-folder' ? (
                      <ImageIcon size={18} />
                    ) : s.kind === 'main-folder' ? (
                      <FolderTree size={18} />
                    ) : (
                      <Folder size={18} />
                    )}
                  </div>
                  <div className="staging-item-text">
                    <span className="staging-item-label" title={s.label}>{s.label}</span>
                    <span className="staging-item-meta">
                      {s.jsonCount > 0 && <>JSON: {s.jsonCount} </>}
                      {s.htmlCount > 0 && <>· HTML: {s.htmlCount} </>}
                      {s.assetCount > 0 && <>· Assets: {s.assetCount}</>}
                      {s.jsonCount === 0 && s.assetCount === 0 && s.htmlCount === 0 && (
                        <em>keine bekannten Dateien</em>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="staging-item-remove"
                    onClick={() => removeStaged(s.id)}
                    disabled={isLoading}
                    title="Aus Auswahl entfernen"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="staging-summary">
              Insgesamt: <strong>{totalJson}</strong> JSON · <strong>{totalAssets}</strong> Assets
              {totalHtml > 0 && <> · {totalHtml} HTML</>}
            </div>
            <button
              type="button"
              className="discord-btn btn-primary open-archive-btn"
              onClick={openArchive}
              disabled={isLoading || totalJson === 0}
            >
              {isLoading ? (
                <>Verarbeite ...</>
              ) : (
                <>
                  Archiv öffnen
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="discord-spinner-container inline-spinner">
            <div className="discord-spinner" />
            <p className="status-msg">{statusMessage}</p>
          </div>
        )}

        {error && (
          <div className="discord-error-box" role="alert">
            <AlertTriangle size={20} className="error-icon" />
            <div className="error-content">
              <h4>Import fehlgeschlagen</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
              <button type="button" className="link-btn" onClick={() => setError(null)}>
                <X size={12} /> Ausblenden
              </button>
            </div>
          </div>
        )}

        {warning && !error && (
          <div className="discord-warn-box" role="status">
            <Info size={18} />
            <span>{warning}</span>
            <button type="button" className="link-btn" onClick={() => setWarning(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        <div className="discord-security-promise">
          <div className="promise-header">
            <Shield size={18} className="shield-icon" />
            <h3>Alles bleibt lokal im Browser. Es wird nichts hochgeladen.</h3>
          </div>
          <p>
            Diese App ist eine reine Frontend-Anwendung. Es gibt kein Backend, keine Cloud, keine
            Datenbank und keine API-Aufrufe an Server außerhalb deines Rechners. Deine Original-Dateien
            werden nicht verändert.
          </p>
        </div>

        <div className="discord-limitations-panel">
          <div className="limitation-item">
            <Info size={16} className="info-icon" />
            <div>
              <strong>Eine Website kann deine Festplatte nicht selbstständig durchsuchen</strong>
              <p>
                Aus Sicherheitsgründen muss der Browser jede Datei oder jeden Ordner explizit von dir
                freigegeben bekommen. Wähle die gewünschten Daten daher manuell über die Buttons aus
                oder ziehe sie ins Fenster.
              </p>
            </div>
          </div>
          <div className="limitation-item">
            <Layers size={16} className="info-icon" />
            <div>
              <strong>Für dauerhaft gespeicherte Archive</strong>
              <p>
                Wenn du dein Archiv permanent verfügbar haben willst, ohne jedes Mal Ordner neu
                auszuwählen, ist eine Docker-Lösung besser geeignet. Für eine native PC-App empfiehlt
                sich Electron.
              </p>
            </div>
          </div>
          <div className="limitation-item">
            <Info size={16} className="info-icon" />
            <div>
              <strong>Reload nötig nach Tab-Schließen</strong>
              <p>
                Solange dieser Tab offen bleibt, hat der Viewer Zugriff auf deine Auswahl. Beim
                Schließen oder Neuladen werden die Datei-Handles freigegeben.
              </p>
            </div>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={channelFolderRef}
          type="file"
          className="hidden-input"
          multiple
          onChange={handleChange('channel-folder')}
          {...{ webkitdirectory: '', directory: '' }}
        />
        <input
          ref={mainFolderRef}
          type="file"
          className="hidden-input"
          multiple
          onChange={handleChange('main-folder')}
          {...{ webkitdirectory: '', directory: '' }}
        />
        <input
          ref={jsonFileRef}
          type="file"
          className="hidden-input"
          accept=".json,application/json"
          multiple
          onChange={handleChange('json')}
        />
        <input
          ref={assetsFolderRef}
          type="file"
          className="hidden-input"
          multiple
          onChange={handleChange('assets-folder')}
          {...{ webkitdirectory: '', directory: '' }}
        />
      </div>

      {/* Drop overlay */}
      {isDragging && (
        <div className="drop-overlay" aria-hidden>
          <UploadCloud size={64} />
          <h2>Loslassen, um hinzuzufügen</h2>
          <p>Mehrere Ordner und Dateien gleichzeitig sind erlaubt.</p>
        </div>
      )}
    </div>
  );
}

export default ImportZone;
