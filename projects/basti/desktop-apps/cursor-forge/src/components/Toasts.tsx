import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../store';

const STYLES = {
  success: 'border-green-600/50 bg-green-950/90 text-green-200',
  error: 'border-red-600/50 bg-red-950/90 text-red-200',
  info: 'border-blue-600/50 bg-blue-950/90 text-blue-200',
} as const;

export default function Toasts() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-in flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-xl backdrop-blur text-xs leading-relaxed ${STYLES[t.type]}`}
        >
          <span className="shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 size={14} />}
            {t.type === 'error' && <XCircle size={14} />}
            {t.type === 'info' && <Info size={14} />}
          </span>
          <span className="break-words min-w-0">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            title="Schließen"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
