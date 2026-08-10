"use client";

import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { getConfirmationExpiry, getEffectiveStatus, getStatusText } from "@/lib/status";
import { usePractices } from "@/hooks/usePractices";
import {
  animalTypeLabels,
  animalTypeOptions,
  serviceLabels,
  serviceOptions,
  type AnimalType,
  type AvailabilityStatus,
  type Service,
} from "@/types/practice";

const statusOptions: { value: AvailabilityStatus; label: string }[] = [
  { value: "green", label: "Grün: Heute erreichbar / nimmt Notfälle an" },
  { value: "yellow", label: "Gelb: Nur nach telefonischer Rücksprache" },
  { value: "red", label: "Rot: Heute nicht verfügbar" },
];

export function DashboardEditor() {
  const { practices, updatePractice, resetPractices } = usePractices();
  const [selectedId, setSelectedId] = useState(practices[0]?.id ?? "");
  const selectedPractice = useMemo(
    () => practices.find((practice) => practice.id === selectedId) ?? practices[0],
    [practices, selectedId],
  );

  if (!selectedPractice) {
    return null;
  }

  const effectiveStatus = getEffectiveStatus(selectedPractice);
  const expiry = getConfirmationExpiry(selectedPractice.lastConfirmedAt);

  function toggleService(service: Service) {
    if (!selectedPractice) {
      return;
    }

    const services = selectedPractice.services.includes(service)
      ? selectedPractice.services.filter((item) => item !== service)
      : [...selectedPractice.services, service];
    updatePractice(selectedPractice.id, { services });
  }

  function toggleAnimalType(animalType: AnimalType) {
    if (!selectedPractice) {
      return;
    }

    const animalTypes = selectedPractice.animalTypes.includes(animalType)
      ? selectedPractice.animalTypes.filter((item) => item !== animalType)
      : [...selectedPractice.animalTypes, animalType];
    updatePractice(selectedPractice.id, { animalTypes });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="field-label">
          Praxis auswählen
          <select className="field-control" value={selectedPractice.id} onChange={(event) => setSelectedId(event.target.value)}>
            {practices.map((practice) => (
              <option key={practice.id} value={practice.id}>
                {practice.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">{selectedPractice.name}</p>
          <p>
            {selectedPractice.address}, {selectedPractice.postalCode} {selectedPractice.city}
          </p>
          <p>{selectedPractice.phone}</p>
        </div>

        <button className="btn-secondary mt-4 w-full" type="button" onClick={resetPractices}>
          Mock-Daten zurücksetzen
        </button>
      </aside>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Praxis-Dashboard</p>
            <h1 className="text-2xl font-bold text-slate-950">{selectedPractice.name}</h1>
            <p className="mt-1 text-sm text-slate-700">
              Effektiver Status: <strong>{getStatusText(effectiveStatus)}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-700">Ihr Status läuft ab am: {formatDateTime(expiry)}</p>
          </div>
          <button
            className="btn-primary"
            type="button"
            onClick={() =>
              updatePractice(selectedPractice.id, {
                lastConfirmedAt: new Date().toISOString(),
              })
            }
          >
            Status für 24 Stunden bestätigen
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Status ändern</h2>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={selectedPractice.status === option.value ? "btn-primary" : "btn-secondary"}
                  type="button"
                  onClick={() => updatePractice(selectedPractice.id, { status: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field-label">
            Öffnungszeiten bearbeiten
            <textarea
              className="field-control min-h-28"
              value={selectedPractice.openingHours.join("\n")}
              onChange={(event) =>
                updatePractice(selectedPractice.id, {
                  openingHours: event.target.value.split("\n").filter(Boolean),
                })
              }
            />
          </label>

          <label className="field-label">
            Notfallhinweis bearbeiten
            <textarea
              className="field-control min-h-24"
              value={selectedPractice.emergencyInfo}
              onChange={(event) => updatePractice(selectedPractice.id, { emergencyInfo: event.target.value })}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-950">Leistungen</legend>
              <div className="mt-2 grid gap-2">
                {serviceOptions.map((service) => (
                  <label key={service} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      checked={selectedPractice.services.includes(service)}
                      className="h-4 w-4 accent-emerald-700"
                      type="checkbox"
                      onChange={() => toggleService(service)}
                    />
                    {serviceLabels[service]}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-950">Tierarten</legend>
              <div className="mt-2 grid gap-2">
                {animalTypeOptions.map((animalType) => (
                  <label key={animalType} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      checked={selectedPractice.animalTypes.includes(animalType)}
                      className="h-4 w-4 accent-emerald-700"
                      type="checkbox"
                      onChange={() => toggleAnimalType(animalType)}
                    />
                    {animalTypeLabels[animalType]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </section>
    </div>
  );
}
