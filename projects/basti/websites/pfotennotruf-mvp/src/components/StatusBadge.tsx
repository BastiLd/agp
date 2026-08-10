import { formatDateTime } from "@/lib/format";
import { getEffectiveStatus, getStatusHint, getStatusText } from "@/lib/status";
import type { VetPractice } from "@/types/practice";

const statusStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-950",
  red: "border-red-200 bg-red-50 text-red-900",
  gray: "border-slate-200 bg-slate-100 text-slate-800",
};

const dotStyles = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  gray: "bg-slate-400",
};

type StatusBadgeProps = {
  practice: VetPractice;
  now?: Date;
};

export function StatusBadge({ practice, now = new Date() }: StatusBadgeProps) {
  const status = getEffectiveStatus(practice, now);

  return (
    <div className={`rounded-lg border p-3 ${statusStyles[status]}`}>
      <div className="flex items-center gap-2 font-semibold">
        <span className={`h-3 w-3 rounded-full ${dotStyles[status]}`} aria-hidden="true" />
        <span>{getStatusText(status)}</span>
      </div>
      <p className="mt-1 text-sm">{getStatusHint(status)}</p>
      <p className="mt-2 text-xs font-medium">Zuletzt bestätigt: {formatDateTime(practice.lastConfirmedAt)}</p>
    </div>
  );
}
