export interface CursorRoleDef {
  key: string;
  name: string;
  hint: string;
  icon: string;
  defaultHotspot: [number, number]; // [x, y] für 32×32
  isExtended: boolean;
}

export const CURSOR_ROLES: CursorRoleDef[] = [
  // Standard-15 (in Windows-Mauseigenschaften sichtbar)
  { key: 'Arrow',       name: 'Normaler Zeiger',          hint: 'Standardzeiger',             icon: 'MousePointer',  defaultHotspot: [0, 0],   isExtended: false },
  { key: 'Help',        name: 'Hilfe-Zeiger',             hint: 'Zeiger mit Fragezeichen',    icon: 'HelpCircle',    defaultHotspot: [0, 0],   isExtended: false },
  { key: 'AppStarting', name: 'Hintergrundarbeit',        hint: 'Zeiger + Sanduhr',           icon: 'Loader',        defaultHotspot: [0, 0],   isExtended: false },
  { key: 'Wait',        name: 'Warten',                   hint: 'Sanduhr / Ladekreis',        icon: 'Clock',         defaultHotspot: [16, 16], isExtended: false },
  { key: 'Crosshair',   name: 'Präzisionsauswahl',        hint: 'Fadenkreuz',                 icon: 'Crosshair',     defaultHotspot: [16, 16], isExtended: false },
  { key: 'IBeam',       name: 'Texteingabe',              hint: 'I-Balken für Text',          icon: 'TextCursor',    defaultHotspot: [16, 16], isExtended: false },
  { key: 'NWPen',       name: 'Handschrift',              hint: 'Stift-Cursor',               icon: 'PenLine',       defaultHotspot: [0, 0],   isExtended: false },
  { key: 'No',          name: 'Nicht verfügbar',          hint: 'Durchgestrichen / Verboten', icon: 'Ban',           defaultHotspot: [16, 16], isExtended: false },
  { key: 'SizeNS',      name: 'Größe N ↕ S',              hint: 'Vertikale Größenänderung',   icon: 'ArrowUpDown',   defaultHotspot: [16, 16], isExtended: false },
  { key: 'SizeWE',      name: 'Größe W ↔ E',              hint: 'Horizontale Größenänderung', icon: 'ArrowLeftRight',defaultHotspot: [16, 16], isExtended: false },
  { key: 'SizeNWSE',    name: 'Größe NW ↘ SE',            hint: 'Diagonale Größenänderung ↘', icon: 'Expand',        defaultHotspot: [16, 16], isExtended: false },
  { key: 'SizeNESW',    name: 'Größe NE ↙ SW',            hint: 'Diagonale Größenänderung ↙', icon: 'Shrink',        defaultHotspot: [16, 16], isExtended: false },
  { key: 'SizeAll',     name: 'Verschieben',              hint: 'Alles verschieben',          icon: 'Move',          defaultHotspot: [16, 16], isExtended: false },
  { key: 'UpArrow',     name: 'Zeiger oben',              hint: 'Alternativer Zeiger (oben)', icon: 'ArrowUp',       defaultHotspot: [16, 0],  isExtended: false },
  { key: 'Hand',        name: 'Link-Zeiger',              hint: 'Hand für Links / Buttons',   icon: 'Hand',          defaultHotspot: [8, 0],   isExtended: false },
  // Erweitert (nicht in Standard-UI)
  { key: 'Person',      name: 'Person (erweitert)',        hint: 'Kontakt / Person',           icon: 'User',          defaultHotspot: [16, 0],  isExtended: true },
  { key: 'Pin',         name: 'Pin (erweitert)',           hint: 'Ort / Markierung',           icon: 'MapPin',        defaultHotspot: [16, 31], isExtended: true },
];

// Dateiname-Matching für Ordner-Import (Englisch + Deutsch)
const AUTO_MATCH: Record<string, string[]> = {
  Arrow:       ['arrow', 'pointer', 'normal', 'default', 'select', 'cursor', 'zeiger', 'pfeil', 'standard'],
  Help:        ['help', 'helpselect', 'question', 'helpcursor', 'hilfe', 'frage'],
  AppStarting: ['appstarting', 'working', 'progress', 'workingbg', 'wait2', 'hintergrund'],
  Wait:        ['wait', 'busy', 'hourglass', 'loading', 'spinner', 'animated', 'warten', 'sanduhr', 'laden'],
  Crosshair:   ['crosshair', 'cross', 'precision', 'target', 'aim', 'kreuz', 'fadenkreuz', 'ziel'],
  IBeam:       ['ibeam', 'text', 'beam', 'textcursor', 'type', 'schreiben'],
  NWPen:       ['nwpen', 'pen', 'handwriting', 'write', 'pencil', 'stift'],
  No:          ['no', 'unavailable', 'forbidden', 'deny', 'block', 'stop', 'verboten', 'gesperrt'],
  SizeNS:      ['sizens', 'ns', 'row_resize', 'updown', 'resize_v', 'vresize', 'vertikal'],
  SizeWE:      ['sizewe', 'we', 'ew_resize', 'leftright', 'resize_h', 'hresize', 'horizontal'],
  SizeNWSE:    ['sizenw', 'nwse', 'nwse_resize', 'diagonal1'],
  SizeNESW:    ['sizene', 'nesw', 'nesw_resize', 'diagonal2'],
  SizeAll:     ['sizeall', 'move', 'all', 'fleur', 'verschieben'],
  UpArrow:     ['uparrow', 'up', 'alternate', 'top', 'oben'],
  Hand:        ['hand', 'link', 'finger', 'pointing', 'pointer2', 'openhand'],
  Person:      ['person', 'people', 'user', 'contact', 'kontakt'],
  Pin:         ['pin', 'location', 'map', 'place', 'ort', 'karte'],
};

export function matchFileToRole(filename: string): string | null {
  const base = filename.toLowerCase().replace(/\.(cur|ani|png|jpg|jpeg|bmp|gif|ico|webp)$/i, '');
  for (const [role, patterns] of Object.entries(AUTO_MATCH)) {
    const hit = patterns.some(
      p =>
        base === p ||
        base.startsWith(p + '_') ||
        base.startsWith(p + '-') ||
        base.startsWith(p + ' ') ||
        base.endsWith('_' + p) ||
        base.endsWith('-' + p) ||
        base.endsWith(' ' + p) ||
        // "includes" nur bei längeren Mustern, sonst matcht z. B. "no" in "snow"
        (p.length >= 4 && base.includes(p))
    );
    if (hit) return role;
  }
  return null;
}
