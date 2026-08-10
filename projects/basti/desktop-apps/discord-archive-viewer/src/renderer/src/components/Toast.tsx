import React, { useEffect } from 'react';

export type ToastKind = 'info' | 'warning' | 'error';
export interface ToastItem { id: number; kind: ToastKind; message: string; }

let nextId = 1;
type Listener = (items: ToastItem[]) => void;
const listeners = new Set<Listener>();
let store: ToastItem[] = [];

export function pushToast(message: string, kind: ToastKind = 'info', timeoutMs = 4500) {
  const id = nextId++;
  const item: ToastItem = { id, kind, message };
  store = [...store, item];
  listeners.forEach((l) => l(store));
  setTimeout(() => {
    store = store.filter((x) => x.id !== id);
    listeners.forEach((l) => l(store));
  }, timeoutMs);
}

export function ToastContainer() {
  const [items, setItems] = React.useState<ToastItem[]>(store);
  useEffect(() => {
    const l: Listener = (n) => setItems(n);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return (
    <div className="toast-container">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>
      ))}
    </div>
  );
}
