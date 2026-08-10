/**
 * Drag & Drop Helper für mehrere Ordner und Dateien gleichzeitig.
 *
 * Browser unterstützen unterschiedliche APIs:
 *  - `DataTransferItem.getAsFileSystemHandle()` (modern, Chromium)
 *  - `DataTransferItem.webkitGetAsEntry()` (älter, Chromium/WebKit/Firefox)
 *
 * Diese Funktion verwendet die alte, breit unterstützte FileSystemEntry-API,
 * weil sie unter Drag-and-Drop am zuverlässigsten Ordner rekursiv durchläuft.
 *
 * Ergebnis: ein Array von Files mit korrekt gesetztem `webkitRelativePath`,
 * sodass die bestehende Asset-Map-Logik direkt damit weiterarbeiten kann.
 */

// FileSystemEntry / Directory / FileEntry Typen sind im DOM-Lib teilweise vorhanden,
// aber ihre Methoden mit Callbacks werden gern als "any" benötigt.
type AnyEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (cb: (file: File) => void, errCb?: (err: unknown) => void) => void;
  createReader?: () => {
    readEntries: (cb: (entries: AnyEntry[]) => void, errCb?: (err: unknown) => void) => void;
  };
};

interface DroppedRoot {
  rootName: string;
  files: File[];
  hasJson: boolean;
  hasAssets: boolean;
}

export interface DroppedSource {
  /** Eindeutige Stamm-Bezeichnung (Ordnername oder „<n> Datei(en)“). */
  label: string;
  /** Heuristisch erkannte Art der Quelle. */
  kind: 'channel-folder' | 'main-folder' | 'json' | 'assets-folder';
  files: File[];
}

/** Hängt einen virtuellen `webkitRelativePath` an eine File. */
function attachRelativePath(file: File, relativePath: string): File {
  // File ist nicht beschreibbar, daher kopieren wir
  // (alle modernen Browser unterstützen den Konstruktor inkl. lastModified).
  const copy = new File([file], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
  Object.defineProperty(copy, 'webkitRelativePath', {
    value: relativePath,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  return copy;
}

function readEntriesAll(reader: {
  readEntries: (cb: (entries: AnyEntry[]) => void, errCb?: (err: unknown) => void) => void;
}): Promise<AnyEntry[]> {
  // readEntries liefert die Einträge in Batches von max. 100. Wir lesen, bis leer.
  return new Promise((resolve, reject) => {
    const all: AnyEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(all);
          } else {
            all.push(...entries);
            readBatch();
          }
        },
        (err) => reject(err),
      );
    };
    readBatch();
  });
}

function entryToFile(entry: AnyEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!entry.file) return reject(new Error('FileEntry hat keine file()-Methode.'));
    entry.file(
      (file) => resolve(file),
      (err) => reject(err),
    );
  });
}

async function walkEntry(entry: AnyEntry, basePath: string, out: File[]): Promise<void> {
  // Wir limitieren die Rekursionstiefe nicht, aber wir prüfen zyklische Symlinks nicht --
  // im Browser-Kontext via DnD ist das praktisch nicht möglich.
  if (entry.isFile) {
    try {
      const f = await entryToFile(entry);
      const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      out.push(attachRelativePath(f, relPath));
    } catch (err) {
      console.warn('Konnte Datei nicht lesen:', entry.fullPath, err);
    }
    return;
  }

  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const children = await readEntriesAll(reader);
    const childBase = basePath ? `${basePath}/${entry.name}` : entry.name;
    for (const child of children) {
      await walkEntry(child, childBase, out);
    }
  }
}

/**
 * Liest alle Dateien aus einem DataTransfer-Objekt (Drop-Event) aus.
 * Unterstützt einzelne Dateien UND mehrere Ordner gleichzeitig.
 */
export async function extractDroppedSources(
  dataTransfer: DataTransfer,
): Promise<DroppedSource[]> {
  const items = dataTransfer.items;
  const result: DroppedSource[] = [];

  // Fallback: keine items-API → nur flache Files
  if (!items || items.length === 0) {
    const flat: File[] = [];
    for (let i = 0; i < dataTransfer.files.length; i++) flat.push(dataTransfer.files[i]);
    if (flat.length > 0) {
      result.push(classifyFlatFiles(flat));
    }
    return result;
  }

  // Wir lesen pro Item den Root-Entry und sammeln die Dateien.
  // Wichtig: getAsEntry / webkitGetAsEntry darf NICHT asynchron aufgerufen werden,
  // sonst sind die DataTransferItems nicht mehr gültig. Daher zuerst alle Entries holen.
  const rootEntries: AnyEntry[] = [];
  const looseFiles: File[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind !== 'file') continue;

    // @ts-expect-error: webkitGetAsEntry ist auf DataTransferItem nicht offiziell typisiert
    const getEntry = it.webkitGetAsEntry || it.getAsEntry;
    let entry: AnyEntry | null = null;
    if (typeof getEntry === 'function') {
      entry = getEntry.call(it) as AnyEntry | null;
    }

    if (entry) {
      rootEntries.push(entry);
    } else {
      // Fallback auf reine File (z. B. wenn FileSystemEntry-API fehlt)
      const f = it.getAsFile();
      if (f) looseFiles.push(f);
    }
  }

  // Verarbeite jeden Root-Entry separat
  for (const root of rootEntries) {
    const files: File[] = [];
    if (root.isFile) {
      try {
        const f = await entryToFile(root);
        files.push(attachRelativePath(f, root.name));
      } catch (err) {
        console.warn('Konnte Drop-File nicht lesen:', root.name, err);
      }
    } else if (root.isDirectory) {
      await walkEntry(root, '', files);
    }

    if (files.length === 0) continue;

    result.push(classifyRoot({ rootName: root.name, files, hasJson: false, hasAssets: false }));
  }

  // Lose Dateien (ohne Entry-Support) bündeln
  if (looseFiles.length > 0) {
    result.push(classifyFlatFiles(looseFiles));
  }

  return result;
}

function classifyRoot(root: DroppedRoot): DroppedSource {
  const jsonFiles = root.files.filter((f) => f.name.toLowerCase().endsWith('.json'));
  const otherFiles = root.files.filter((f) => !f.name.toLowerCase().endsWith('.json'));

  let kind: DroppedSource['kind'];

  if (jsonFiles.length === 0 && otherFiles.length > 0) {
    kind = 'assets-folder';
  } else if (jsonFiles.length > 1) {
    // Mehrere JSON-Files → wahrscheinlich Hauptordner mit mehreren Channels
    kind = 'main-folder';
  } else {
    kind = 'channel-folder';
  }

  return {
    label: root.rootName,
    kind,
    files: root.files,
  };
}

function classifyFlatFiles(files: File[]): DroppedSource {
  const jsonOnly = files.every((f) => f.name.toLowerCase().endsWith('.json'));
  if (jsonOnly) {
    return {
      label: files.length === 1 ? files[0].name : `${files.length} JSON-Dateien`,
      kind: 'json',
      files,
    };
  }
  return {
    label: `${files.length} Datei(en)`,
    kind: 'assets-folder',
    files,
  };
}

/** Browser-Feature-Detection: DataTransferItem mit Entry-API? */
export function isDropSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof DataTransferItem === 'undefined') return false;
  return (
    'webkitGetAsEntry' in DataTransferItem.prototype ||
    'getAsEntry' in DataTransferItem.prototype
  );
}
