import Link from "next/link";
import { LegalNotice } from "@/components/LegalNotice";

export default function HomePage() {
  return (
    <main>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">MVP für Kärnten</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Schneller zur passenden tierärztlichen Hilfe, wenn jede Minute zählt.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Finde schnell eine passende tierärztliche Anlaufstelle in Kärnten – mit Status, Notfallinformationen und
              direkter Kontaktmöglichkeit.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary text-lg" href="/suche">
                Ich brauche jetzt Hilfe
              </Link>
              <Link className="btn-secondary text-lg" href="/dashboard">
                Praxisstatus verwalten
              </Link>
            </div>
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-900">
              Keine medizinische Beratung. Bei akuten Notfällen bitte sofort telefonisch kontaktieren.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-bold text-slate-950">Warum anders als eine normale Liste?</h2>
            <div className="mt-4 grid gap-3">
              {[
                "Status-Ampel statt unklarer Öffnungszeiten",
                "Grün läuft nach 24 Stunden automatisch ab",
                "Suche nach Tierart, Situation und Bezirk",
                "Sichtbare Hinweise gegen falsche Sicherheit",
              ].map((item) => (
                <div key={item} className="rounded-lg bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <LegalNotice />
      </section>
    </main>
  );
}
