import { useMemo, useState } from 'react';
import { ChevronDown, Image, Search, Shapes, X } from 'lucide-react';
import { createId } from '../formats/canvasFormat';
import type { CanvasNodeShape } from '../formats/canvasFormat';
import { dispatchCommand } from '../commands/commandDispatcher';
import { ICON_CATEGORIES, ICON_OPTIONS, SHAPE_GROUPS, SHAPE_OPTIONS, getShapeOption } from './nodeVisuals';
import type { IconOption } from './nodeVisuals';

interface EditorToolbarProps {
  mapId: string;
  nodeCount: number;
}

export function EditorToolbar({ mapId, nodeCount }: EditorToolbarProps) {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [iconArchiveOpen, setIconArchiveOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<string>('Alle');

  const filteredIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    return ICON_OPTIONS.filter((option) => {
      const matchesCategory = activeIconCategory === 'Alle' || option.category === activeIconCategory;
      const matchesSearch = !query || `${option.label} ${option.id} ${option.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeIconCategory, iconQuery]);

  const addShapeNode = (shape: CanvasNodeShape, icon?: string) => {
    const shapeOption = getShapeOption(shape);
    const size = defaultSizeForShape(shape);

    dispatchCommand({
      type: 'node.create',
      mapId,
      node: {
        id: createId('node'),
        type: 'text',
        text: icon ? getIconLabel(icon) : shapeOption?.label ?? 'New Shape',
        x: 112 + nodeCount * 30,
        y: 118 + nodeCount * 24,
        width: size.width,
        height: size.height,
        shape,
        cornerRadius: defaultRadiusForShape(shape),
        borderWidth: 1,
        shadow: 'soft',
        icon,
        iconPlacement: icon ? 'top' : undefined,
      },
    });

    setShapeMenuOpen(false);
    setIconArchiveOpen(false);
  };

  const addIconNode = (option: IconOption) => {
    addShapeNode('rounded-rectangle', option.id);
  };

  return (
    <>
      <div className="editor-toolbar">
        <div className="toolbar-command-group">
          <button
            className={`toolbar-command ${shapeMenuOpen ? 'is-active' : ''}`}
            type="button"
            onClick={() => setShapeMenuOpen((open) => !open)}
          >
            <Shapes size={18} strokeWidth={1.85} />
            <span>Formen</span>
            <ChevronDown size={14} />
          </button>
          {shapeMenuOpen && (
            <div className="shape-library-popover">
              {SHAPE_GROUPS.map((group) => (
                <section className="shape-library-group" key={group.id}>
                  <div className="shape-library-title">{group.label}</div>
                  <div className="shape-library-grid">
                    {group.options.map((shape) => (
                      <button
                        className="shape-library-cell"
                        key={`${group.id}:${shape.id}`}
                        title={shape.label}
                        type="button"
                        onClick={() => addShapeNode(shape.id)}
                      >
                        <span className={`shape-preview shape-${shape.id}`} />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <button className="toolbar-command" type="button" onClick={() => setIconArchiveOpen(true)}>
          <Image size={18} strokeWidth={1.85} />
          <span>Piktogramme</span>
        </button>

        <div className="toolbar-inline-tools" aria-label="Quick shapes">
          {SHAPE_OPTIONS.slice(0, 8).map((shape) => (
            <button
              className="shape-tool"
              key={shape.id}
              title={`Insert ${shape.label}`}
              type="button"
              onClick={() => addShapeNode(shape.id)}
            >
              <span className={`shape-preview shape-${shape.id}`} />
            </button>
          ))}
        </div>

        <div className="toolbar-inline-tools" aria-label="Quick pictograms">
          {ICON_OPTIONS.slice(0, 10).map(({ id, label, Icon }) => (
            <button
              className="icon-tool"
              key={id}
              title={`Insert ${label}`}
              type="button"
              onClick={() => addShapeNode('rounded-rectangle', id)}
            >
              <Icon size={15} strokeWidth={1.9} />
            </button>
          ))}
        </div>
      </div>

      {iconArchiveOpen && (
        <div className="icon-archive-backdrop" role="presentation" onMouseDown={() => setIconArchiveOpen(false)}>
          <div className="icon-archive-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header className="icon-archive-header">
              <div>
                <h2>Archivbilder</h2>
                <div className="archive-tabs">
                  <button type="button">Bilder</button>
                  <button className="is-active" type="button">Piktogramme</button>
                  <button type="button">Sticker</button>
                  <button type="button">Illustrationen</button>
                </div>
              </div>
              <button className="icon-button" type="button" title="Close" aria-label="Close archive" onClick={() => setIconArchiveOpen(false)}>
                <X size={16} strokeWidth={1.9} />
              </button>
            </header>

            <label className="archive-search">
              <Search size={16} />
              <input
                autoFocus
                placeholder="Symbole suchen"
                value={iconQuery}
                onChange={(event) => setIconQuery(event.currentTarget.value)}
              />
            </label>

            <div className="archive-category-row">
              {['Alle', ...ICON_CATEGORIES].map((category) => (
                <button
                  className={activeIconCategory === category ? 'is-active' : ''}
                  key={category}
                  type="button"
                  onClick={() => setActiveIconCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="archive-icon-grid">
              {filteredIcons.map((option) => (
                <button
                  className="archive-icon-cell"
                  key={option.id}
                  title={option.label}
                  type="button"
                  onClick={() => addIconNode(option)}
                >
                  <option.Icon size={36} strokeWidth={1.55} />
                </button>
              ))}
            </div>

            <footer className="icon-archive-footer">
              <span>{filteredIcons.length} Symbole</span>
              <button className="btn" type="button" onClick={() => setIconArchiveOpen(false)}>Abbrechen</button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function defaultSizeForShape(shape: CanvasNodeShape): { width: number; height: number } {
  if (shape === 'line' || shape === 'elbow-connector' || shape === 'curved-connector') {
    return { width: 260, height: 60 };
  }

  if (
    shape === 'square' ||
    shape === 'circle' ||
    shape === 'triangle' ||
    shape === 'right-triangle' ||
    shape === 'diamond' ||
    shape === 'pentagon' ||
    shape === 'hexagon' ||
    shape === 'octagon' ||
    shape === 'star' ||
    shape === 'burst' ||
    shape === 'plus' ||
    shape === 'multiply'
  ) {
    return { width: 148, height: 148 };
  }

  if (shape === 'pill' || shape.startsWith('arrow-') || shape === 'flow-terminator') {
    return { width: 232, height: 96 };
  }

  return { width: 292, height: 118 };
}

function defaultRadiusForShape(shape: CanvasNodeShape): number {
  if (shape === 'rectangle' || shape === 'square' || shape === 'line') return 2;
  if (shape === 'pill' || shape === 'flow-terminator') return 999;
  return 14;
}

function getIconLabel(iconId: string): string {
  return ICON_OPTIONS.find((option) => option.id === iconId)?.label ?? 'Pictogram';
}
