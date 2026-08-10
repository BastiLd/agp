type LegalNoticeProps = {
  compact?: boolean;
};

export function LegalNotice({ compact = false }: LegalNoticeProps) {
  const items = [
    "Diese Plattform ersetzt keine medizinische Beratung.",
    "Angaben ohne Gewähr.",
    "Bitte bei Notfällen immer telefonisch bestätigen.",
    "Nur aktiv bestätigte Praxen werden als aktuell erreichbar markiert.",
    "Bei lebensbedrohlichen Notfällen sofort anrufen.",
  ];

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <h2 className="font-semibold">Wichtige Hinweise</h2>
      <ul className={compact ? "mt-2 space-y-1" : "mt-3 grid gap-2 sm:grid-cols-2"}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
