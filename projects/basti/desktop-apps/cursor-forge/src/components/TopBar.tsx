import { useEffect, useRef } from 'react';
import { MousePointer2, FolderOpen, Trash2, RotateCcw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { useStore } from '../store';
import { matchFileToRole } from '../cursorRoles';
import { FolderFile } from '../types';
import { assignFileToSlot } from '../lib/assignFile';

export default function TopBar() {
  const { schemeName, setSchemeName, clearAll, assignedCount, addToast } = useStore();
  const count = assignedCount();

  async function importFolder() {
    try {
      const folder = await invoke<string | null>('pick_output_folder');
      if (!folder) return;

      const files = await invoke<FolderFile[]>('list_folder_files', { folder });
      if (files.length === 0) {
        addToast('error', 'In diesem Ordner wurden keine Cursor- oder Bilddateien gefunden.');
        return;
      }

      let matched = 0;
      for (const file of files) {
        const role = matchFileToRole(file.filename);
        if (!role) continue;
        if (await assignFileToSlot(role, file.path, { silent: true })) matched++;
      }

      if (matched === 0) {
        addToast(
          'error',
          'Keine passenden Dateien gefunden. Namen sollten den Rollen entsprechen (Arrow.cur, Wait.ani, …).'
        );
      } else {
        addToast('success', `${matched} von ${files.length} Dateien automatisch zugeordnet.`);
      }
    } catch (e) {
      addToast('error', `Ordner-Import fehlgeschlagen: ${String(e)}`);
    }
  }

  async function handleClearAll() {
    if (count === 0) return;
    const ok = await confirm(
      `Alle ${count} Zuweisungen wirklich entfernen?`,
      { title: 'CursorForge', kind: 'warning' }
    ).catch(() => window.confirm('Alle Zuweisungen wirklich entfernen?'));
    if (ok) {
      clearAll();
      addToast('info', 'Alle Zuweisungen entfernt.');
    }
  }

  async function handleRestoreDefaults() {
    const ok = await confirm(
      'Windows-Standardcursor (Aero) wiederherstellen?\nDein aktuelles Cursor-Schema wird ersetzt.',
      { title: 'CursorForge', kind: 'warning' }
    ).catch(() => window.confirm('Windows-Standardcursor wiederherstellen?'));
    if (!ok) return;
    try {
      await invoke('restore_default_cursors');
      addToast('success', 'Windows-Standardcursor wiederhergestellt.');
    } catch (e) {
      addToast('error', `Fehlgeschlagen: ${String(e)}`);
    }
  }

  // Strg+O = Ordner importieren
  const importRef = useRef(importFolder);
  importRef.current = importFolder;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void importRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-950 to-blue-950/20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/30">
          <MousePointer2 size={15} className="text-blue-400" />
        </div>
        <span className="font-bold text-zinc-100 text-sm tracking-tight">CursorForge</span>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Schema-Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
        <label className="text-xs text-zinc-500 shrink-0">Schema:</label>
        <input
          type="text"
          value={schemeName}
          onChange={e => setSchemeName(e.target.value)}
          placeholder="Name des Cursor-Themes"
          maxLength={60}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Fortschritt */}
      <div className="flex items-center gap-2 shrink-0" title={`${count} von 17 Cursorn zugewiesen`}>
        <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
            style={{ width: `${(count / 17) * 100}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">
          <span className={count > 0 ? 'text-green-400 font-semibold' : ''}>{count}</span>
          <span className="text-zinc-700">/17</span>
        </span>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Aktionen */}
      <button
        onClick={importFolder}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-all"
        title="Ordner scannen und Cursor automatisch zuweisen (Strg+O)"
      >
        <FolderOpen size={13} />
        Ordner importieren
      </button>

      <button
        onClick={handleClearAll}
        disabled={count === 0}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 hover:border-red-500/40 border border-zinc-700 rounded-lg px-3 py-1.5 transition-all disabled:opacity-40 disabled:hover:text-zinc-500 disabled:hover:border-zinc-700"
        title="Alle Zuweisungen löschen"
      >
        <Trash2 size={13} />
        Leeren
      </button>

      <button
        onClick={handleRestoreDefaults}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 hover:border-amber-500/40 border border-zinc-700 rounded-lg px-3 py-1.5 transition-all"
        title="Windows-Standardcursor (Aero) wiederherstellen"
      >
        <RotateCcw size={13} />
        Windows-Standard
      </button>

      <div className="ml-auto text-[10px] text-zinc-700 shrink-0">v0.2.0</div>
    </header>
  );
}
