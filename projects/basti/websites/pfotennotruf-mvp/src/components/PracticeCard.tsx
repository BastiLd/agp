import Link from "next/link";
import { formatPhoneHref, getRouteUrl } from "@/lib/format";
import { animalTypeLabels, serviceLabels, type VetPractice } from "@/types/practice";
import { StatusBadge } from "@/components/StatusBadge";

type PracticeCardProps = {
  practice: VetPractice;
};

export function PracticeCard({ practice }: PracticeCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-medium text-emerald-800">{practice.region}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{practice.name}</h2>
          <p className="mt-2 text-slate-700">
            {practice.address}, {practice.postalCode} {practice.city}
          </p>
          <p className="mt-1 font-semibold text-slate-900">{practice.phone}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Öffnungszeiten</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {practice.openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Notfallinfo</h3>
              <p className="mt-1 text-sm text-slate-700">{practice.emergencyInfo}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {practice.animalTypes.map((animalType) => (
              <span key={animalType} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {animalTypeLabels[animalType]}
              </span>
            ))}
            {practice.services.map((service) => (
              <span key={service} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                {serviceLabels[service]}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <StatusBadge practice={practice} />
          <div className="grid gap-2">
            <a className="btn-primary text-center" href={formatPhoneHref(practice.phone)}>
              Jetzt anrufen
            </a>
            <a
              className="btn-secondary text-center"
              href={getRouteUrl(practice.address, practice.postalCode, practice.city)}
              rel="noreferrer"
              target="_blank"
            >
              Route öffnen
            </a>
            <Link className="btn-secondary text-center" href={`/praxis/${practice.id}#anfrage`}>
              Anfrage senden
            </Link>
            <Link className="text-center text-sm font-semibold text-emerald-800 underline" href={`/praxis/${practice.id}`}>
              Details ansehen
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
