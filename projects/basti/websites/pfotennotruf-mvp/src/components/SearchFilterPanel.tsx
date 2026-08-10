"use client";

import {
  animalTypeLabels,
  animalTypeOptions,
  regionOptions,
  serviceLabels,
  serviceOptions,
  type SearchFilters,
} from "@/types/practice";

type SearchFilterPanelProps = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

export function SearchFilterPanel({ filters, onChange }: SearchFilterPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="field-label">
          Tierart
          <select
            className="field-control"
            value={filters.animalType}
            onChange={(event) => onChange({ ...filters, animalType: event.target.value as SearchFilters["animalType"] })}
          >
            <option value="all">Alle Tierarten</option>
            {animalTypeOptions.map((animalType) => (
              <option key={animalType} value={animalType}>
                {animalTypeLabels[animalType]}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Situation
          <select
            className="field-control"
            value={filters.service}
            onChange={(event) => onChange({ ...filters, service: event.target.value as SearchFilters["service"] })}
          >
            <option value="all">Alle Situationen</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {serviceLabels[service]}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Bezirk / Region
          <select
            className="field-control"
            value={filters.region}
            onChange={(event) => onChange({ ...filters, region: event.target.value as SearchFilters["region"] })}
          >
            <option value="all">Alle Regionen</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
          <input
            checked={filters.onlyConfirmed}
            className="h-5 w-5 accent-emerald-700"
            type="checkbox"
            onChange={(event) => onChange({ ...filters, onlyConfirmed: event.target.checked })}
          />
          Nur aktuell bestätigte Praxen anzeigen
        </label>
      </div>
    </section>
  );
}
