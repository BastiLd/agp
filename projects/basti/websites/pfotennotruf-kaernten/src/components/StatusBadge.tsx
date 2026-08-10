import { VetStatus } from '../data/mockVets';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: VetStatus;
  showExplanation?: boolean;
}

export default function StatusBadge({ status, showExplanation = false }: StatusBadgeProps) {
  let badgeStyles = '';
  let dotStyles = '';
  let label = '';
  let Icon = CheckCircle;
  let explanation = '';

  switch (status) {
    case 'green':
      badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotStyles = 'bg-emerald-500 animate-status-pulse';
      label = 'Aktiv bestätigt';
      Icon = CheckCircle;
      explanation = 'Heute erreichbar & nimmt Notfälle an.';
      break;
    case 'yellow':
      badgeStyles = 'bg-amber-50 text-amber-800 border-amber-200';
      dotStyles = 'bg-amber-500';
      label = 'Eingeschränkt';
      Icon = AlertTriangle;
      explanation = 'Nur nach vorheriger telefonischer Rücksprache.';
      break;
    case 'red':
      badgeStyles = 'bg-rose-50 text-rose-800 border-rose-200';
      dotStyles = 'bg-rose-500';
      label = 'Nicht verfügbar';
      Icon = XCircle;
      explanation = 'Heute geschlossen / nimmt keine Notfälle an.';
      break;
    case 'grey':
    default:
      badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
      dotStyles = 'bg-slate-400';
      label = 'Unbestätigt';
      Icon = Clock;
      explanation = 'Status nicht aktuell bestätigt. Bitte telefonisch prüfen!';
      break;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyles} w-fit shadow-sm`}>
        <span className={`h-2.5 w-2.5 rounded-full ${dotStyles}`} />
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      {showExplanation && (
        <p className="text-xs text-slate-500 font-medium">
          {explanation}
        </p>
      )}
    </div>
  );
}
