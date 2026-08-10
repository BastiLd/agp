"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InquiryForm } from "@/components/InquiryForm";
import { LegalNotice } from "@/components/LegalNotice";
import { StatusBadge } from "@/components/StatusBadge";
import { usePractices } from "@/hooks/usePractices";
import { formatPhoneHref, getRouteUrl } from "@/lib/format";
import { animalTypeLabels, serviceLabels } from "@/types/practice";

export default function PracticeDetailPage() {
  const params = useParams<{ id: string }>();
  const { practices } = usePractices();
  const practice = practices.find((item) => item.id === params.id);

  if (!practice) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-950">Praxis nicht gefunden</h1>
          <p className="mt-2 text-slate-700">Diese Beispielpraxis existiert im aktuellen MVP-Datensatz nicht.</p>
          <Link className="btn-primary mt-4" href="/suche">
            Zur Suche
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5">
        <Link className="text-sm font-semibold text-emerald-800 underline" href="/suche">
          Zurück zur Suche
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800">{practice.region}</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{practice.name}</h1>
          <p className="mt-3 text-slate-700">
            {practice.address}, {practice.postalCode} {practice.city}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-950">{practice.phone}</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a className="btn-primary" href={formatPhoneHref(practice.phone)}>
              Jetzt anrufen
            </a>
            <a
              className="btn-secondary"
              href={getRouteUrl(practice.address, practice.postalCode, practice.city)}
              rel="noreferrer"
              target="_blank"
            >
              Route öffnen
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Öffnungszeiten</h2>
              <ul className="mt-2 space-y-1 text-slate-700">
                {practice.openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Notfallinfo</h2>
              <p className="mt-2 text-slate-700">{practice.emergencyInfo}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Tierarten</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {practice.animalTypes.map((animalType) => (
                  <span key={animalType} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {animalTypeLabels[animalType]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Leistungen</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {practice.services.map((service) => (
                  <span key={service} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                    {serviceLabels[service]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          <StatusBadge practice={practice} />
          <LegalNotice compact />
        </aside>
      </div>

      <section className="mt-6">
        <InquiryForm practice={practice} />
      </section>
    </main>
  );
}
