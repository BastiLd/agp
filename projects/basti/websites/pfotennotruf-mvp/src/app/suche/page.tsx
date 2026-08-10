"use client";

import { useMemo, useState } from "react";
import { LegalNotice } from "@/components/LegalNotice";
import { PracticeCard } from "@/components/PracticeCard";
import { SearchFilterPanel } from "@/components/SearchFilterPanel";
import { usePractices } from "@/hooks/usePractices";
import { defaultSearchFilters, filterPractices } from "@/lib/search";

export default function SearchPage() {
  const { practices } = usePractices();
  const [filters, setFilters] = useState(defaultSearchFilters);
  const results = useMemo(() => filterPractices(practices, filters), [practices, filters]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Notfall-Suche</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Passende Praxen in Kärnten finden</h1>
        <p className="mt-2 max-w-3xl text-slate-700">
          Filtere nach Tierart, Situation, Region und aktiv bestätigtem Status. Ein grauer Status bedeutet immer:
          telefonisch prüfen.
        </p>
      </div>

      <div className="grid gap-5">
        <LegalNotice compact />
        <SearchFilterPanel filters={filters} onChange={setFilters} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-800">
            {results.length} {results.length === 1 ? "Praxis gefunden" : "Praxen gefunden"}
          </p>
          <p className="text-sm text-slate-600">Nur Grün gilt als aktuell bestätigte Erreichbarkeit.</p>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((practice) => (
              <PracticeCard key={practice.id} practice={practice} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
            <h2 className="text-xl font-bold text-slate-950">Keine passende Praxis gefunden</h2>
            <p className="mt-2">
              Bitte ändere die Filter oder rufe bei akuten Notfällen sofort eine geeignete tierärztliche Anlaufstelle an.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
