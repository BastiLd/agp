import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PfotenNotruf Kärnten",
  description: "MVP-Plattform für schnelle tierärztliche Hilfe in Kärnten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <header className="border-b border-slate-200 bg-white/95">
          <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link className="text-xl font-black tracking-normal text-emerald-800" href="/">
              PfotenNotruf Kärnten
            </Link>
            <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
              <Link className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800" href="/suche">
                Notfall-Suche
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800" href="/dashboard">
                Praxis-Dashboard
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
            MVP für Jugend Innovativ. Keine medizinische Beratung. Bitte bei akuten Notfällen immer telefonisch
            bestätigen.
          </div>
        </footer>
      </body>
    </html>
  );
}
