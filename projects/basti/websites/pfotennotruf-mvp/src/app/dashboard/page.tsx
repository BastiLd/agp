import { DashboardEditor } from "@/components/DashboardEditor";
import { LegalNotice } from "@/components/LegalNotice";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Praxisbereich</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Status und Praxisdaten verwalten</h1>
        <p className="mt-2 max-w-3xl text-slate-700">
          Dieses MVP speichert Änderungen lokal im Browser. Später kann dieselbe Struktur mit Login und Datenbank
          verbunden werden.
        </p>
      </div>

      <div className="grid gap-5">
        <LegalNotice compact />
        <DashboardEditor />
      </div>
    </main>
  );
}
