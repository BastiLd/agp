import { useEffect, useRef } from 'react';
import {
  FolderOpen, Package, Zap, FileArchive, CheckCircle2, XCircle, Loader,
  Wand2, AlertTriangle, Ruler,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { useStore } from '../store';
import { AVAILABLE_SIZES } from '../types';

export default function ExportPanel() {
  const {
    schemeName,
    outputDir,
    exportFormat,
    sizes,
    slots,
    isBuilding,
    buildMessage,
    buildSuccess,
    setOutputDir,
    setExportFormat,
    toggleSize,
    setIsBuilding,
    setBuildResult,
    clearBuildMessage,
    addToast,
    assignedCount,
  } = useStore();

  const count = assignedCount();
  const arrowMissing = !slots.find(s => s.role === 'Arrow')?.sourcePath;

  async function pickOutputDir() {
    try {
      const dir = await invoke<string | null>('pick_output_folder');
      if (dir) setOutputDir(dir);
    } catch (e) {
      addToast('error', `Ordnerauswahl fehlgeschlagen: ${String(e)}`);
    }
  }

  function makeConfig() {
    return {
      scheme_name: schemeName.trim(),
      output_dir: outputDir,
      format: exportFormat === 'inf' ? 'Inf' : 'Zip',
      sizes,
      slots: slots
        .filter(s => s.sourcePath !== null)
        .map(s => ({
          role: s.role,
          source_path: s.sourcePath!,
          hotspot_x: s.hotspotX,
          hotspot_y: s.hotspotY,
          needs_conversion: s.needsConversion && !s.makeAni,
          is_animation: s.isAnimation,
          make_ani: s.makeAni,
        })),
    };
  }

  async function checkBasics(): Promise<boolean> {
    if (!schemeName.trim()) {
      setBuildResult(false, 'Bitte oben einen Schema-Namen eingeben.');
      return false;
    }
    if (count === 0) {
      setBuildResult(false, 'Bitte mindestens einen Cursor zuweisen.');
      return false;
    }
    if (arrowMissing) {
      const ok = await confirm(
        'Der wichtigste Cursor „Normaler Zeiger (Arrow)" ist nicht zugewiesen.\nTrotzdem fortfahren?',
        { title: 'CursorForge', kind: 'warning' }
      ).catch(() => true);
      if (!ok) return false;
    }
    return true;
  }

  async function buildPackage() {
    if (!(await checkBasics())) return;
    if (!outputDir) {
      setBuildResult(false, 'Bitte zuerst einen Ausgabe-Ordner wählen.');
      return;
    }

    setIsBuilding(true);
    clearBuildMessage();

    try {
      const resultPath = await invoke<string>('build_package', { config: makeConfig() });
      setBuildResult(true, `Paket erstellt:\n${resultPath}`);
      addToast('success', 'Paket erfolgreich erstellt!');
      invoke('show_in_folder', { path: resultPath }).catch(() => {});
    } catch (e: unknown) {
      setBuildResult(false, String(e));
      addToast('error', 'Paketbau fehlgeschlagen — Details im Export-Panel.');
    }
  }

  async function applyNow() {
    if (!(await checkBasics())) return;

    const ok = await confirm(
      `„${schemeName.trim()}" jetzt als aktives Cursor-Schema übernehmen?\n\nDeine Mauszeiger ändern sich sofort. Über „Windows-Standard" oben kommst du jederzeit zurück.`,
      { title: 'CursorForge', kind: 'info' }
    ).catch(() => true);
    if (!ok) return;

    setIsBuilding(true);
    clearBuildMessage();

    try {
      const dir = await invoke<string>('apply_scheme', { config: makeConfig() });
      setBuildResult(
        true,
        `Schema ist jetzt aktiv!\nDateien liegen in:\n${dir}\n\nZurücksetzen: Button „Windows-Standard" oben.`
      );
      addToast('success', 'Cursor-Schema wurde angewendet!');
    } catch (e: unknown) {
      setBuildResult(false, String(e));
      addToast('error', 'Anwenden fehlgeschlagen — Details im Export-Panel.');
    }
  }

  const needsSizes = slots.some(s => s.sourcePath && s.needsConversion);

  // Tastenkürzel: Strg+B = Paket bauen, Strg+Enter = direkt anwenden
  const actionsRef = useRef({ buildPackage, applyNow });
  actionsRef.current = { buildPackage, applyNow };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        void actionsRef.current.buildPackage();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        void actionsRef.current.applyNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside className="w-72 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Anwenden & Export
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-4 py-4">
        {/* Direkt anwenden — Hauptaktion */}
        <div>
          <button
            onClick={applyNow}
            disabled={isBuilding || count === 0}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              isBuilding || count === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/30'
            }`}
            title="Schema sofort aktivieren — ohne INF-Installation"
          >
            {isBuilding ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Wand2 size={15} />
            )}
            Direkt anwenden
          </button>
          <p className="text-[10px] text-zinc-600 text-center mt-1.5 leading-relaxed">
            Setzt die Cursor sofort — kein INF, kein Neustart.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">oder Paket</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Format */}
        <div>
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-2">
            Format
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setExportFormat('inf')}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${
                exportFormat === 'inf'
                  ? 'border-blue-500/50 bg-blue-950/20 text-zinc-100'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              title="Installierbares Paket: Rechtsklick auf install.inf → Installieren"
            >
              <Zap size={14} className={exportFormat === 'inf' ? 'text-blue-400' : 'text-zinc-600'} />
              <span className="text-xs font-medium">INF-Paket</span>
            </button>
            <button
              onClick={() => setExportFormat('zip')}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${
                exportFormat === 'zip'
                  ? 'border-blue-500/50 bg-blue-950/20 text-zinc-100'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              title="Alles als ZIP-Archiv — ideal zum Teilen"
            >
              <FileArchive size={14} className={exportFormat === 'zip' ? 'text-blue-400' : 'text-zinc-600'} />
              <span className="text-xs font-medium">ZIP-Archiv</span>
            </button>
          </div>
        </div>

        {/* Ausgabe-Ordner */}
        <div>
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-2">
            Ausgabe-Ordner
          </label>
          <button
            onClick={pickOutputDir}
            className={`w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
              outputDir
                ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                : 'border-dashed border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400'
            }`}
          >
            <FolderOpen size={13} className="shrink-0" />
            <span className="text-xs truncate min-w-0">
              {outputDir ? outputDir.split(/[/\\]/).pop() : 'Ordner wählen…'}
            </span>
          </button>
          {outputDir && (
            <div className="text-[10px] text-zinc-700 mt-1 truncate px-0.5" title={outputDir}>
              {outputDir}
            </div>
          )}
        </div>

        {/* Paket bauen */}
        <button
          onClick={buildPackage}
          disabled={isBuilding || count === 0 || !outputDir}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border transition-all ${
            isBuilding || count === 0 || !outputDir
              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'border-zinc-600 text-zinc-200 hover:border-blue-500 hover:text-blue-300'
          }`}
        >
          {isBuilding ? (
            <>
              <Loader size={14} className="animate-spin" />
              Arbeite…
            </>
          ) : (
            <>
              <Package size={14} />
              Paket bauen
            </>
          )}
        </button>
        {count > 0 && !outputDir && (
          <p className="text-[10px] text-zinc-700 text-center -mt-2">
            Für den Paketbau: Ausgabe-Ordner wählen
          </p>
        )}

        {/* Cursor-Größen */}
        {needsSizes && (
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ruler size={11} />
              Cursor-Größen (Pixel)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-mono transition-all ${
                    sizes.includes(s)
                      ? 'border-blue-500/60 bg-blue-950/30 text-blue-300'
                      : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 leading-relaxed">
              Konvertierte Bilder erhalten alle gewählten Größen — Windows nimmt automatisch die
              passende.
            </p>
          </div>
        )}

        {/* Zusammenfassung */}
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Zugewiesen</span>
            <span className={count > 0 ? 'text-green-400 font-semibold' : 'text-zinc-600'}>
              {count}/17
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Animiert</span>
            <span className="text-zinc-300 font-mono text-[10px]">
              {slots.filter(s => s.sourcePath && (s.isAnimation || s.makeAni)).length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Schema</span>
            <span className="text-zinc-300 text-[10px] truncate max-w-28" title={schemeName}>
              {schemeName || '–'}
            </span>
          </div>
        </div>

        {/* Arrow-Warnung */}
        {count > 0 && arrowMissing && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 p-2.5 text-[10px] text-amber-300/90 leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>
              „Normaler Zeiger (Arrow)" fehlt noch — der wichtigste Cursor des Schemas.
            </span>
          </div>
        )}

        {/* Ergebnis */}
        {buildMessage && (
          <div
            className={`rounded-lg border p-3 text-[11px] leading-relaxed cursor-pointer ${
              buildSuccess
                ? 'border-green-600/40 bg-green-950/20 text-green-300'
                : 'border-red-600/40 bg-red-950/20 text-red-300'
            }`}
            onClick={clearBuildMessage}
            title="Klicken zum Schließen"
          >
            <div className="flex items-center gap-1.5 mb-1">
              {buildSuccess ? (
                <CheckCircle2 size={12} className="text-green-400 shrink-0" />
              ) : (
                <XCircle size={12} className="text-red-400 shrink-0" />
              )}
              <span className="font-medium">{buildSuccess ? 'Erfolgreich!' : 'Fehler'}</span>
            </div>
            <span className="break-all text-[10px] opacity-80 whitespace-pre-wrap">
              {buildMessage}
            </span>
          </div>
        )}

        {/* INF-Hinweis */}
        {exportFormat === 'inf' && (
          <div className="text-[10px] text-zinc-700 leading-relaxed space-y-0.5">
            <p>
              <strong className="text-zinc-600">INF-Installation:</strong> Rechtsklick auf{' '}
              <code>install.inf</code> → „Installieren", dann Schema in den Mauseinstellungen
              wählen. <code>ANLEITUNG.txt</code> liegt bei.
            </p>
          </div>
        )}
      </div>

      {/* Footer: Tastenkürzel */}
      <div className="px-4 py-2.5 border-t border-zinc-800/60 text-[9px] text-zinc-700 flex gap-3">
        <span>
          <kbd className="text-zinc-600">Strg+B</kbd> Paket
        </span>
        <span>
          <kbd className="text-zinc-600">Strg+Enter</kbd> Anwenden
        </span>
        <span>
          <kbd className="text-zinc-600">Strg+O</kbd> Import
        </span>
      </div>
    </aside>
  );
}
