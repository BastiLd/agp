import { memo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Lock } from 'lucide-react';
import { getIconOption } from './nodeVisuals';
import type { CanvasNodeIconPlacement, CanvasNodeShape, CanvasNodeShadow } from '../formats/canvasFormat';
import { dispatchCommand } from '../commands/commandDispatcher';
import { useEventStore } from '../commands/eventStore';

interface NodeCardData extends Record<string, unknown> {
  text: string;
  color?: string;
  shape?: CanvasNodeShape;
  cornerRadius?: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: CanvasNodeShadow;
  icon?: string;
  iconPlacement?: CanvasNodeIconPlacement;
  locked?: boolean;
  nodeType?: 'text' | 'file' | 'link' | 'group' | 'icon';
}

const sidePositions = [
  ['top', Position.Top],
  ['right', Position.Right],
  ['bottom', Position.Bottom],
  ['left', Position.Left],
] as const;

export const NodeCard = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as NodeCardData;
  const title = nodeData.text?.trim() || 'Untitled';
  const shape = nodeData.shape ?? 'rounded-rectangle';
  const iconPlacement = nodeData.iconPlacement ?? 'top';
  const iconOption = getIconOption(nodeData.icon);
  const Icon = iconOption?.Icon;
  const isLocked = nodeData.locked ?? false;
  const isIconOnlyNode = nodeData.nodeType === 'icon';

  const mapId = useEventStore((state) => state.currentMapId) ?? 'current-map';

  const onResizeEnd = useCallback((_event: unknown, params: { width: number; height: number }) => {
    const node = useEventStore.getState().canvas.nodes.find((n) => n.id === id);
    if (!node) return;
    dispatchCommand({
      type: 'node.size.update',
      mapId,
      nodeId: id,
      before: { width: node.width, height: node.height },
      after: { width: Math.round(params.width), height: Math.round(params.height) },
    });
  }, [id, mapId]);

  const style = {
    '--node-custom-radius': `${nodeData.cornerRadius ?? 14}px`,
    '--node-custom-fill': nodeData.fillColor,
    '--node-custom-border': nodeData.borderColor ?? nodeData.color,
    '--node-custom-border-width': `${nodeData.borderWidth ?? 1}px`,
  } as CSSProperties;

  /* ── Icon-only node (standalone pictogram) ─────────── */
  if (isIconOnlyNode && Icon) {
    return (
      <div className={`node-shell shape-icon-only ${selected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`} style={style}>
        {!isLocked && (
          <NodeResizer
            isVisible={selected}
            minWidth={32}
            minHeight={32}
            handleStyle={{ width: 8, height: 8, borderRadius: 2, border: '2px solid var(--accent-primary)', background: 'var(--bg-panel)' }}
            lineStyle={{ borderColor: 'var(--accent-primary)', borderWidth: 1 }}
            onResizeEnd={onResizeEnd}
          />
        )}
        {sidePositions.map(([side, position]) => (
          <Handle
            className={`node-handle node-handle-${side}`}
            id={`${side}`}
            key={side}
            position={position}
            type="source"
          />
        ))}
        <div className="icon-only-body">
          <Icon size="100%" strokeWidth={1.5} />
        </div>
        {isLocked && <div className="lock-badge" aria-label="Locked"><Lock size={10} strokeWidth={2.2} /></div>}
      </div>
    );
  }

  /* ── Standard node ─────────────────────────────────── */
  return (
    <div className={`node-shell shape-${shape} ${selected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`} style={style}>
      {!isLocked && (
        <NodeResizer
          isVisible={selected}
          minWidth={80}
          minHeight={48}
          handleStyle={{ width: 8, height: 8, borderRadius: 2, border: '2px solid var(--accent-primary)', background: 'var(--bg-panel)' }}
          lineStyle={{ borderColor: 'var(--accent-primary)', borderWidth: 1 }}
          onResizeEnd={onResizeEnd}
        />
      )}
      {sidePositions.map(([side, position]) => (
        <Handle
          className={`node-handle node-handle-${side}`}
          id={`${side}`}
          key={side}
          position={position}
          type="source"
        />
      ))}
      <div className={`node-card shadow-${nodeData.shadow ?? 'soft'} icon-${iconPlacement}`}>
        {Icon && (
          <div className="node-icon" aria-hidden="true">
            <Icon size={iconPlacement === 'background' ? 74 : 18} strokeWidth={1.85} />
          </div>
        )}
        <div className="node-content">
          <div className="node-kicker">{shapeLabel(shape)}</div>
          <div className="node-title">{title}</div>
        </div>
      </div>
      {isLocked && <div className="lock-badge" aria-label="Locked"><Lock size={10} strokeWidth={2.2} /></div>}
    </div>
  );
});

function shapeLabel(shape: CanvasNodeShape): string {
  return shape
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
