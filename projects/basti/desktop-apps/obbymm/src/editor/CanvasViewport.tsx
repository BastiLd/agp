import type { ReactNode } from 'react';

export function CanvasViewport({ children }: { children: ReactNode }) {
  return <div className="canvas-viewport">{children}</div>;
}
