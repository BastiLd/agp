import { useMemo } from 'react';
import { Lock, Unlock, Image } from 'lucide-react';
import { dispatchCommand } from '../commands/commandDispatcher';
import { useEventStore } from '../commands/eventStore';
import { getBacklinksForFile } from '../backlinks/backlinkIndex';
import type {
  CanvasNode,
  CanvasNodeIconPatch,
  CanvasNodeShape,
  CanvasNodeSize,
  CanvasNodeStylePatch,
} from '../formats/canvasFormat';
import { createId } from '../formats/canvasFormat';
import { ICON_CATEGORIES, ICON_OPTIONS, SHAPE_GROUPS } from '../editor/nodeVisuals';
import type { VaultFile } from '../vault/vaultTypes';

interface RightSidebarProps {
  activeFile: VaultFile | null;
  files: VaultFile[];
}

const fillSwatches = ['#fffefa', '#f9f1d5', '#e8f2ff', '#e8f7ef', '#f4e8ff', '#ffe8e3', '#2f2a24', '#242424'];
const borderSwatches = ['#d8d3c8', '#b9a77a', '#7fa4d8', '#7bb58c', '#aa8fd2', '#d87f73', '#7d766c', '#4f4f4f'];

export function RightSidebar({ activeFile, files }: RightSidebarProps) {
  const canvas = useEventStore((state) => state.canvas);
  const nodeNotes = useEventStore((state) => state.nodeNotes);
  const selectedNodeId = useEventStore((state) => state.selectedNodeId);
  const selectedNode = canvas.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const backlinks = useMemo(() => (
    activeFile ? getBacklinksForFile(files, activeFile.name) : []
  ), [activeFile, files]);

  const mapId = activeFile?.path ?? 'current-map';

  const commitTitle = (after: string) => {
    if (!selectedNode || after === selectedNode.text) return;
    dispatchCommand({
      type: 'node.text.update',
      mapId,
      nodeId: selectedNode.id,
      before: selectedNode.text,
      after,
    });
  };

  const commitNote = (after: string) => {
    if (!selectedNode) return;
    const before = nodeNotes[selectedNode.id] ?? '';
    if (before === after) return;
    dispatchCommand({
      type: 'node.note.update',
      mapId,
      nodeId: selectedNode.id,
      before,
      after,
    });
  };

  const commitShape = (after: CanvasNodeShape) => {
    if (!selectedNode || selectedNode.shape === after) return;
    dispatchCommand({
      type: 'node.shape.update',
      mapId,
      nodeId: selectedNode.id,
      before: selectedNode.shape,
      after,
    });
  };

  const commitStyle = (after: Partial<CanvasNodeStylePatch>) => {
    if (!selectedNode) return;
    const before = pickStyle(selectedNode, Object.keys(after) as Array<keyof CanvasNodeStylePatch>);
    dispatchCommand({
      type: 'node.style.update',
      mapId,
      nodeId: selectedNode.id,
      before,
      after,
    });
  };

  const commitIcon = (after: Partial<CanvasNodeIconPatch>) => {
    if (!selectedNode) return;
    const before = pickIcon(selectedNode, Object.keys(after) as Array<keyof CanvasNodeIconPatch>);
    dispatchCommand({
      type: 'node.icon.update',
      mapId,
      nodeId: selectedNode.id,
      before,
      after,
    });
  };

  const commitSize = (after: CanvasNodeSize) => {
    if (!selectedNode) return;
    dispatchCommand({
      type: 'node.size.update',
      mapId,
      nodeId: selectedNode.id,
      before: { width: selectedNode.width, height: selectedNode.height },
      after,
    });
  };

  const toggleLock = () => {
    if (!selectedNode) return;
    dispatchCommand({
      type: 'node.lock.update',
      mapId,
      nodeId: selectedNode.id,
      before: selectedNode.locked ?? false,
      after: !(selectedNode.locked ?? false),
    });
  };

  const addFreeIcon = (iconId: string) => {
    const nodeCount = canvas.nodes.length;
    dispatchCommand({
      type: 'node.create',
      mapId,
      node: {
        id: createId('icon'),
        type: 'icon',
        text: ICON_OPTIONS.find((o) => o.id === iconId)?.label ?? 'Pictogram',
        x: 200 + nodeCount * 30,
        y: 200 + nodeCount * 24,
        width: 64,
        height: 64,
        shape: 'rounded-rectangle',
        cornerRadius: 8,
        borderWidth: 0,
        shadow: 'none',
        icon: iconId,
        iconPlacement: 'background',
      },
    });
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    dispatchCommand({ type: 'node.delete', mapId, nodeId: selectedNode.id });
  };

  return (
    <aside className="right-sidebar">
      <section className="sidebar-section">
        <div className="panel-header">Details</div>
        {selectedNode ? (
          <div className="panel-content detail-form">
            <label>
              Title
              <input
                key={`${selectedNode.id}:title:${selectedNode.text}`}
                defaultValue={selectedNode.text}
                onBlur={(event) => commitTitle(event.currentTarget.value)}
              />
            </label>
            <label>
              Node note
              <textarea
                key={`${selectedNode.id}:note:${nodeNotes[selectedNode.id] ?? ''}`}
                className="markdown-textarea small"
                defaultValue={nodeNotes[selectedNode.id] ?? ''}
                onBlur={(event) => commitNote(event.currentTarget.value)}
              />
            </label>

            {/* Lock toggle */}
            <div className="lock-toggle-row">
              <button
                className={`btn ${selectedNode.locked ? 'btn-locked' : ''}`}
                type="button"
                onClick={toggleLock}
                title={selectedNode.locked ? 'Unlock element' : 'Lock element in place'}
              >
                {selectedNode.locked ? <Lock size={14} strokeWidth={2} /> : <Unlock size={14} strokeWidth={2} />}
                {selectedNode.locked ? 'Fixiert' : 'Fixieren'}
              </button>
            </div>

            <div className="style-panel">
              <div className="style-panel-title">Forms</div>
              <div className="sidebar-shape-library">
                {SHAPE_GROUPS.map((group) => (
                  <div className="icon-category" key={group.id}>
                    <div className="icon-category-title">{group.label}</div>
                    <div className="sidebar-shape-grid">
                      {group.options.map((shape) => (
                        <button
                          className={`shape-choice ${selectedNode.shape === shape.id ? 'is-active' : ''}`}
                          key={`${group.id}:${shape.id}`}
                          title={shape.label}
                          type="button"
                          onClick={() => commitShape(shape.id)}
                        >
                          <span className={`shape-preview shape-${shape.id}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="style-panel">
              <div className="style-panel-title">Shape Style</div>
              <label>
                Corner radius
                <div className="slider-with-value">
                  <input
                    key={`${selectedNode.id}:radius:${selectedNode.cornerRadius ?? 14}`}
                    max={48}
                    min={0}
                    type="range"
                    defaultValue={selectedNode.cornerRadius ?? 14}
                    onChange={(event) => commitStyle({ cornerRadius: Number(event.currentTarget.value) })}
                  />
                  <span className="slider-value">{selectedNode.cornerRadius ?? 14}px</span>
                </div>
              </label>
              <label>
                Border width
                <div className="slider-with-value">
                  <input
                    key={`${selectedNode.id}:border:${selectedNode.borderWidth ?? 1}`}
                    max={5}
                    min={0}
                    type="range"
                    defaultValue={selectedNode.borderWidth ?? 1}
                    onChange={(event) => commitStyle({ borderWidth: Number(event.currentTarget.value) })}
                  />
                  <span className="slider-value">{selectedNode.borderWidth ?? 1}px</span>
                </div>
              </label>
              <div className="swatch-row" aria-label="Fill colors">
                {fillSwatches.map((color) => (
                  <button
                    className="swatch"
                    key={color}
                    style={{ backgroundColor: color }}
                    title={`Fill ${color}`}
                    type="button"
                    onClick={() => commitStyle({ fillColor: color })}
                  />
                ))}
              </div>
              <div className="swatch-row" aria-label="Border colors">
                {borderSwatches.map((color) => (
                  <button
                    className="swatch border-swatch"
                    key={color}
                    style={{ backgroundColor: color }}
                    title={`Border ${color}`}
                    type="button"
                    onClick={() => commitStyle({ borderColor: color })}
                  />
                ))}
              </div>
              <div className="segmented">
                {(['none', 'soft', 'raised'] as const).map((shadow) => (
                  <button
                    className={selectedNode.shadow === shadow ? 'is-active' : ''}
                    key={shadow}
                    type="button"
                    onClick={() => commitStyle({ shadow })}
                  >
                    {shadow}
                  </button>
                ))}
              </div>
              <div className="size-row">
                <label>
                  W
                  <input
                    key={`${selectedNode.id}:w:${selectedNode.width}`}
                    min={80}
                    type="number"
                    defaultValue={selectedNode.width}
                    onBlur={(event) => commitSize({ width: Number(event.currentTarget.value), height: selectedNode.height })}
                  />
                </label>
                <label>
                  H
                  <input
                    key={`${selectedNode.id}:h:${selectedNode.height}`}
                    min={56}
                    type="number"
                    defaultValue={selectedNode.height}
                    onBlur={(event) => commitSize({ width: selectedNode.width, height: Number(event.currentTarget.value) })}
                  />
                </label>
              </div>
            </div>

            <div className="style-panel">
              <div className="style-panel-title">Pictograms</div>

              {/* Add free-standing pictogram */}
              <div className="free-pictogram-row">
                <button className="btn btn-add-pictogram" type="button" onClick={() => addFreeIcon(selectedNode.icon || 'sparkles')}>
                  <Image size={14} strokeWidth={1.85} />
                  Freies Piktogramm hinzufügen
                </button>
              </div>

              <div className="icon-placement-row">
                {(['top', 'left', 'right', 'background'] as const).map((placement) => (
                  <button
                    className={selectedNode.iconPlacement === placement ? 'is-active' : ''}
                    key={placement}
                    type="button"
                    onClick={() => commitIcon({ iconPlacement: placement })}
                  >
                    {placement}
                  </button>
                ))}
              </div>
              <div className="icon-library">
                <button className="icon-choice" type="button" onClick={() => commitIcon({ icon: '' })}>
                  None
                </button>
                {ICON_CATEGORIES.map((category) => (
                  <div className="icon-category" key={category}>
                    <div className="icon-category-title">{category}</div>
                    <div className="icon-grid">
                      {ICON_OPTIONS.filter((option) => option.category === category).map(({ id, label, Icon }) => (
                        <button
                          className={`icon-choice ${selectedNode.icon === id ? 'is-active' : ''}`}
                          key={id}
                          title={label}
                          type="button"
                          onClick={() => commitIcon({ icon: id })}
                        >
                          <Icon size={17} strokeWidth={1.9} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn danger" type="button" onClick={deleteSelectedNode}>Delete Node</button>
          </div>
        ) : (
          <div className="panel-content muted">Select a node to edit shape, style, icon, details, and notes.</div>
        )}
      </section>

      <section className="sidebar-section">
        <div className="panel-header">Backlinks</div>
        <div className="panel-content">
          {backlinks.length === 0 && <div className="muted">No backlinks yet.</div>}
          {backlinks.map((backlink) => (
            <div className="backlink-row" key={`${backlink.sourceFileId}:${backlink.target}`}>
              {backlink.sourceFileName}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function pickStyle(node: CanvasNode, keys: Array<keyof CanvasNodeStylePatch>): Partial<CanvasNodeStylePatch> {
  return keys.reduce<Partial<CanvasNodeStylePatch>>((style, key) => ({
    ...style,
    [key]: node[key],
  }), {});
}

function pickIcon(node: CanvasNode, keys: Array<keyof CanvasNodeIconPatch>): Partial<CanvasNodeIconPatch> {
  return keys.reduce<Partial<CanvasNodeIconPatch>>((icon, key) => ({
    ...icon,
    [key]: node[key],
  }), {});
}
